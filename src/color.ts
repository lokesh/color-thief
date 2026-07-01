import type { RGB, HSL, OKLCH, Color, ContrastInfo, CssColorFormat, Gamut } from './types.js';
import { rgbToOklch, p3ToSrgb, srgbToP3, relativeLuminance } from './color-space.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function rgbToHsl(r: number, g: number, b: number): HSL {
    const r1 = r / 255;
    const g1 = g / 255;
    const b1 = b / 255;
    const max = Math.max(r1, g1, b1);
    const min = Math.min(r1, g1, b1);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        if (max === r1) {
            h = ((g1 - b1) / d + (g1 < b1 ? 6 : 0)) / 6;
        } else if (max === g1) {
            h = ((b1 - r1) / d + 2) / 6;
        } else {
            h = ((r1 - g1) / d + 4) / 6;
        }
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
    };
}

/** WCAG contrast ratio between two luminances (always ≥ 1). */
function contrastRatio(l1: number, l2: number): number {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// ColorImpl
// ---------------------------------------------------------------------------

class ColorImpl implements Color {
    // Channels are stored in the color's native gamut (_gamut).
    private readonly _r: number;
    private readonly _g: number;
    private readonly _b: number;
    readonly gamut: Gamut;
    readonly population: number;
    readonly proportion: number;

    private _srgb: [number, number, number] | undefined;
    private _hsl: HSL | undefined;
    private _oklch: OKLCH | undefined;
    private _luminance: number | undefined;
    private _contrast: ContrastInfo | undefined;

    constructor(
        r: number,
        g: number,
        b: number,
        population: number,
        proportion: number,
        gamut: Gamut = 'srgb',
    ) {
        this._r = r;
        this._g = g;
        this._b = b;
        this.gamut = gamut;
        this.population = population;
        this.proportion = proportion;
    }

    /** Channels gamut-mapped to sRGB (identity when already sRGB). */
    private get srgb(): [number, number, number] {
        if (!this._srgb) {
            this._srgb =
                this.gamut === 'display-p3'
                    ? p3ToSrgb(this._r, this._g, this._b)
                    : [this._r, this._g, this._b];
        }
        return this._srgb;
    }

    rgb(gamut: Gamut = 'srgb'): RGB {
        if (gamut === this.gamut) {
            return { r: this._r, g: this._g, b: this._b };
        }
        // gamut differs from native: convert.
        const [r, g, b] =
            gamut === 'display-p3'
                ? srgbToP3(this._r, this._g, this._b) // native is sRGB
                : this.srgb; // native is P3
        return { r, g, b };
    }

    hex(): string {
        const [r, g, b] = this.srgb;
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    hsl(): HSL {
        if (!this._hsl) {
            const [r, g, b] = this.srgb;
            this._hsl = rgbToHsl(r, g, b);
        }
        return this._hsl;
    }

    oklch(): OKLCH {
        if (!this._oklch) {
            this._oklch = rgbToOklch(this._r, this._g, this._b, this.gamut);
        }
        return this._oklch;
    }

    css(format?: CssColorFormat): string {
        // Default format preserves the color's native gamut.
        if (format === undefined) {
            if (this.gamut === 'display-p3') {
                const f = (n: number) => +(n / 255).toFixed(4);
                return `color(display-p3 ${f(this._r)} ${f(this._g)} ${f(this._b)})`;
            }
            format = 'rgb';
        }
        switch (format) {
            case 'hsl': {
                const { h, s, l } = this.hsl();
                return `hsl(${h}, ${s}%, ${l}%)`;
            }
            case 'oklch': {
                const { l, c, h } = this.oklch();
                return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
            }
            case 'rgb':
            default: {
                const [r, g, b] = this.srgb;
                return `rgb(${r}, ${g}, ${b})`;
            }
        }
    }

    array(): [number, number, number] {
        return [...this.srgb];
    }

    toString(): string {
        return this.hex();
    }

    get textColor(): string {
        return this.isDark ? '#ffffff' : '#000000';
    }

    private get luminance(): number {
        if (this._luminance === undefined) {
            this._luminance = relativeLuminance(this._r, this._g, this._b, this.gamut);
        }
        return this._luminance;
    }

    get isDark(): boolean {
        return this.luminance <= 0.179;
    }

    get isLight(): boolean {
        return !this.isDark;
    }

    get contrast(): ContrastInfo {
        if (!this._contrast) {
            const lum = this.luminance;
            const white = contrastRatio(lum, 1); // white luminance = 1
            const black = contrastRatio(lum, 0); // black luminance = 0
            const foreground = this.isDark
                ? createColor(255, 255, 255, 0, 0)
                : createColor(0, 0, 0, 0, 0);
            this._contrast = {
                white: Math.round(white * 100) / 100,
                black: Math.round(black * 100) / 100,
                foreground,
            };
        }
        return this._contrast;
    }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a Color object from RGB components, population count, and proportion.
 * Components are interpreted in `gamut` (default `'srgb'`).
 */
export function createColor(
    r: number,
    g: number,
    b: number,
    population: number,
    proportion: number = 0,
    gamut: Gamut = 'srgb',
): Color {
    return new ColorImpl(r, g, b, population, proportion, gamut);
}
