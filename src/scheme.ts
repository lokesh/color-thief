// ---------------------------------------------------------------------------
// Accessible scheme generation
// ---------------------------------------------------------------------------
//
// Turns an image (or a single seed color) into a complete, contrast-safe set of
// UI theme roles — the "scheme synthesis" step that goes beyond raw extraction.
//
// The whole system rests on one idea: a *tone ladder*. Freeze a color's hue and
// chroma and slide only its lightness ("tone", 0–100) from black to white. A
// scheme is then just an assignment of roles to rungs on that ladder. Because
// lightness maps predictably to luminance, pairing a light rung with a dark rung
// yields a knowable contrast — and we then *measure* every pair with real WCAG
// math and nudge until it provably passes.
//
// Implemented natively on OKLCH (the library's color space) rather than taking a
// dependency on Material Color Utilities / HCT. The role→tone recipes below are
// adapted from Material 3's published baseline; the mechanism is our own.

import type { Color, Gamut, ImageSource, ExtractionOptions } from './types.js';
import { createColor } from './color.js';
import { oklchToRgb, relativeLuminance } from './color-space.js';
import { getPalette } from './api.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SchemeRole =
    | 'primary'    | 'onPrimary'    | 'primaryContainer'   | 'onPrimaryContainer'
    | 'secondary'  | 'onSecondary'  | 'secondaryContainer' | 'onSecondaryContainer'
    | 'surface'    | 'onSurface'    | 'surfaceVariant'      | 'onSurfaceVariant'
    | 'outline'
    | 'error'      | 'onError'      | 'errorContainer'      | 'onErrorContainer';

export type SchemeMode = 'light' | 'dark';

/** Target minimum contrast for text/background pairs. */
export type ContrastLevel = 'AA' | 'AAA';

/**
 * How faithful the derived roles stay to the source color.
 * - `faithful`   — minimal hue rotation, keep the image's chroma
 * - `balanced`   — Material-like defaults (recommended)
 * - `expressive` — rotate the secondary hue and boost chroma for more contrast
 */
export type SchemeFidelity = 'faithful' | 'balanced' | 'expressive';

export interface SchemeOptions {
    /** Minimum contrast enforced on every on-* / background pair. @default 'AA' */
    contrast?: ContrastLevel;
    /** Source-fidelity vs. idealization tradeoff. @default 'balanced' */
    fidelity?: SchemeFidelity;
    /** Output gamut for the scheme colors. @default 'srgb' */
    gamut?: Gamut;
}

export interface Scheme {
    /** Light-mode role → color. */
    light: Record<SchemeRole, Color>;
    /** Dark-mode role → color. */
    dark: Record<SchemeRole, Color>;
    /** Ready-to-drop CSS custom properties for one mode. */
    toCss(mode?: SchemeMode): string;
}

// ---------------------------------------------------------------------------
// Tonal palettes: (hue, chroma) frozen, tone is the free axis
// ---------------------------------------------------------------------------

interface TonalPalette {
    hue: number;
    chroma: number;
}

/** Which palette a role draws from. */
type PaletteKey = 'primary' | 'secondary' | 'neutral' | 'neutralVariant' | 'error';

/** A role spec: the palette it reads from and the tone (0–100) per mode. */
interface RoleSpec {
    palette: PaletteKey;
    light: number;
    dark: number;
}

// Role → tone recipe. Tones adapted from the Material 3 baseline scheme.
const ROLES: Record<SchemeRole, RoleSpec> = {
    primary:              { palette: 'primary',        light: 40,  dark: 80 },
    onPrimary:            { palette: 'primary',        light: 100, dark: 20 },
    primaryContainer:     { palette: 'primary',        light: 90,  dark: 30 },
    onPrimaryContainer:   { palette: 'primary',        light: 10,  dark: 90 },

    secondary:            { palette: 'secondary',      light: 40,  dark: 80 },
    onSecondary:          { palette: 'secondary',      light: 100, dark: 20 },
    secondaryContainer:   { palette: 'secondary',      light: 90,  dark: 30 },
    onSecondaryContainer: { palette: 'secondary',      light: 10,  dark: 90 },

    surface:              { palette: 'neutral',        light: 98,  dark: 6  },
    onSurface:            { palette: 'neutral',        light: 10,  dark: 90 },
    surfaceVariant:       { palette: 'neutralVariant', light: 90,  dark: 30 },
    onSurfaceVariant:     { palette: 'neutralVariant', light: 30,  dark: 80 },

    outline:              { palette: 'neutralVariant', light: 50,  dark: 60 },

    error:                { palette: 'error',          light: 40,  dark: 80 },
    onError:              { palette: 'error',          light: 100, dark: 20 },
    errorContainer:       { palette: 'error',          light: 90,  dark: 30 },
    onErrorContainer:     { palette: 'error',          light: 10,  dark: 90 },
};

// Foreground → background pairs whose contrast we guarantee. Text pairs use the
// requested AA/AAA level; the outline/surface pair only needs the 3:1 UI level.
const TEXT_PAIRS: Array<[on: SchemeRole, bg: SchemeRole]> = [
    ['onPrimary', 'primary'],
    ['onPrimaryContainer', 'primaryContainer'],
    ['onSecondary', 'secondary'],
    ['onSecondaryContainer', 'secondaryContainer'],
    ['onSurface', 'surface'],
    ['onSurfaceVariant', 'surfaceVariant'],
    ['onError', 'error'],
    ['onErrorContainer', 'errorContainer'],
];
const UI_PAIRS: Array<[on: SchemeRole, bg: SchemeRole]> = [
    ['outline', 'surface'],
];

const CONTRAST_TARGET: Record<ContrastLevel, number> = { AA: 4.5, AAA: 7.0 };
const UI_CONTRAST_TARGET = 3.0;

// ---------------------------------------------------------------------------
// Tone → color realization (with gamut mapping by chroma reduction)
// ---------------------------------------------------------------------------

/** A channel is displayable if it lands within 0–255 (small epsilon for rounding). */
function inRange(v: number): boolean {
    return v >= -0.5 && v <= 255.5;
}

/**
 * Realize a (palette, tone) pair as a concrete Color.
 *
 * Tone (0–100) maps to OKLCH lightness (0–1). If the requested chroma is outside
 * the target gamut at that lightness, chroma is reduced until the color fits —
 * this preserves hue and tone (the things contrast depends on) while giving up
 * only saturation, which is exactly the right thing to sacrifice.
 */
function realize(palette: TonalPalette, tone: number, gamut: Gamut): Color {
    const l = clamp(tone, 0, 100) / 100;
    let c = palette.chroma;
    let [r, g, b] = oklchToRgb(l, c, palette.hue, gamut);

    // Binary-search chroma down until the color is in gamut.
    if (!(inRange(r) && inRange(g) && inRange(b))) {
        let lo = 0;
        let hi = c;
        for (let i = 0; i < 20; i++) {
            const mid = (lo + hi) / 2;
            const [rr, gg, bb] = oklchToRgb(l, mid, palette.hue, gamut);
            if (inRange(rr) && inRange(gg) && inRange(bb)) {
                lo = mid;
            } else {
                hi = mid;
            }
        }
        c = lo;
        [r, g, b] = oklchToRgb(l, c, palette.hue, gamut);
    }

    return createColor(round255(r), round255(g), round255(b), 0, 0, gamut);
}

function round255(v: number): number {
    return Math.max(0, Math.min(255, Math.round(v)));
}

function clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
}

// ---------------------------------------------------------------------------
// WCAG contrast
// ---------------------------------------------------------------------------

function wcagContrast(a: Color, b: Color, gamut: Gamut): number {
    const ca = a.rgb();
    const cb = b.rgb();
    const la = relativeLuminance(ca.r, ca.g, ca.b, gamut);
    const lb = relativeLuminance(cb.r, cb.g, cb.b, gamut);
    const lighter = Math.max(la, lb);
    const darker = Math.min(la, lb);
    return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// Palette derivation
// ---------------------------------------------------------------------------

const NEUTRAL_CHROMA = 0.006;
const NEUTRAL_VARIANT_CHROMA = 0.02;
// A fixed, accessible error red (OKLCH hue ~29°). Not drawn from the image.
const ERROR_PALETTE: TonalPalette = { hue: 29, chroma: 0.16 };

function derivePalettes(seed: Color, fidelity: SchemeFidelity): Record<PaletteKey, TonalPalette> {
    const { h: hue, c: chroma } = seed.oklch();

    // Primary keeps the seed hue; chroma is floored so a washed-out seed still
    // reads as "a color," and capped so it stays realizable across the ladder.
    const primaryChromaFloor = fidelity === 'expressive' ? 0.12 : 0.08;
    const primaryChroma = clamp(chroma, primaryChromaFloor, 0.22);

    // Secondary is a muted companion. `expressive` rotates its hue for contrast;
    // `faithful` keeps it on-hue.
    const secondaryRotation = fidelity === 'expressive' ? 40 : fidelity === 'faithful' ? 0 : 20;
    const secondaryHue = (hue + secondaryRotation) % 360;
    const secondaryChroma = fidelity === 'expressive' ? 0.08 : 0.05;

    return {
        primary:        { hue, chroma: primaryChroma },
        secondary:      { hue: secondaryHue, chroma: secondaryChroma },
        neutral:        { hue, chroma: NEUTRAL_CHROMA },
        neutralVariant: { hue, chroma: NEUTRAL_VARIANT_CHROMA },
        error:          ERROR_PALETTE,
    };
}

// ---------------------------------------------------------------------------
// Scheme assembly + contrast enforcement
// ---------------------------------------------------------------------------

function buildMode(
    palettes: Record<PaletteKey, TonalPalette>,
    mode: SchemeMode,
    target: number,
    gamut: Gamut,
): Record<SchemeRole, Color> {
    // 1. Realize every role at its recipe tone.
    const tones = {} as Record<SchemeRole, number>;
    const colors = {} as Record<SchemeRole, Color>;
    for (const role of Object.keys(ROLES) as SchemeRole[]) {
        const spec = ROLES[role];
        const tone = mode === 'light' ? spec.light : spec.dark;
        tones[role] = tone;
        colors[role] = realize(palettes[spec.palette], tone, gamut);
    }

    // 2. Verify & nudge: push each foreground's tone toward whichever extreme
    //    increases contrast until the pair provably passes (or the tone bottoms
    //    out at 0 / 100). We measure with real WCAG math — the ladder is a
    //    starting guess, this is the guarantee.
    const enforce = (on: SchemeRole, bg: SchemeRole, want: number) => {
        const bgColor = colors[bg];
        const bgLum = relativeLuminance(bgColor.rgb().r, bgColor.rgb().g, bgColor.rgb().b, gamut);
        // Lighten the foreground if the background is dark, else darken it.
        const dir = bgLum < 0.5 ? +1 : -1;
        let tone = tones[on];
        for (let i = 0; i < 100; i++) {
            if (wcagContrast(colors[on], bgColor, gamut) >= want) return;
            const next = tone + dir;
            if (next < 0 || next > 100) break;
            tone = next;
            colors[on] = realize(palettes[ROLES[on].palette], tone, gamut);
        }
        tones[on] = tone;
    };

    for (const [on, bg] of TEXT_PAIRS) enforce(on, bg, target);
    for (const [on, bg] of UI_PAIRS) enforce(on, bg, UI_CONTRAST_TARGET);

    return colors;
}

function kebab(role: string): string {
    return role.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function makeScheme(
    light: Record<SchemeRole, Color>,
    dark: Record<SchemeRole, Color>,
): Scheme {
    return {
        light,
        dark,
        toCss(mode: SchemeMode = 'light'): string {
            const set = mode === 'light' ? light : dark;
            return (Object.keys(set) as SchemeRole[])
                .map((role) => `--${kebab(role)}: ${set[role].hex()};`)
                .join('\n');
        },
    };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Synthesize a complete, contrast-safe scheme from a single seed color.
 * Pure and synchronous — the core of {@link getScheme}, also useful directly
 * when you already have a brand/anchor color.
 */
export function synthesizeScheme(seed: Color, options: SchemeOptions = {}): Scheme {
    const fidelity = options.fidelity ?? 'balanced';
    const gamut = options.gamut ?? 'srgb';
    const target = CONTRAST_TARGET[options.contrast ?? 'AA'];

    const palettes = derivePalettes(seed, fidelity);
    const light = buildMode(palettes, 'light', target, gamut);
    const dark = buildMode(palettes, 'dark', target, gamut);
    return makeScheme(light, dark);
}

/**
 * Extract a seed color from an image and synthesize a full accessible scheme.
 *
 * Picks the most dominant sufficiently-colorful palette entry as the anchor,
 * then derives and contrast-checks all roles. Returns `null` if no colors could
 * be extracted from the source.
 */
export async function getScheme(
    source: ImageSource,
    options: SchemeOptions & ExtractionOptions = {},
): Promise<Scheme | null> {
    const palette = await getPalette(source, options);
    if (!palette || palette.length === 0) return null;
    return synthesizeScheme(pickSeed(palette), options);
}

/**
 * Choose the scheme anchor: the most dominant palette color that still has
 * enough chroma to read as a hue. Falls back to the most dominant color if the
 * image is essentially grayscale.
 */
export function pickSeed(palette: Color[]): Color {
    const MIN_CHROMA = 0.04;
    const colorful = palette.filter((c) => c.oklch().c >= MIN_CHROMA);
    const pool = colorful.length > 0 ? colorful : palette;
    return pool.reduce((best, c) => (c.population > best.population ? c : best), pool[0]);
}
