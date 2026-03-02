import type { RGB, HSL, OKLCH, Color, ContrastInfo, CssColorFormat } from './types.js';
import { rgbToOklch } from './color-space.js';

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

/** WCAG relative luminance from sRGB 0–255. */
function relativeLuminance(r: number, g: number, b: number): number {
    const toLinear = (c: number) => {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
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
    private readonly _r: number;
    private readonly _g: number;
    private readonly _b: number;
    readonly population: number;
    readonly proportion: number;

    private _hsl: HSL | undefined;
    private _oklch: OKLCH | undefined;
    private _luminance: number | undefined;
    private _contrast: ContrastInfo | undefined;

    constructor(r: number, g: number, b: number, population: number, proportion: number) {
        this._r = r;
        this._g = g;
        this._b = b;
        this.population = population;
        this.proportion = proportion;
    }

    rgb(): RGB {
        return { r: this._r, g: this._g, b: this._b };
    }

    hex(): string {
        const toHex = (n: number) => n.toString(16).padStart(2, '0');
        return `#${toHex(this._r)}${toHex(this._g)}${toHex(this._b)}`;
    }

    hsl(): HSL {
        if (!this._hsl) {
            this._hsl = rgbToHsl(this._r, this._g, this._b);
        }
        return this._hsl;
    }

    oklch(): OKLCH {
        if (!this._oklch) {
            this._oklch = rgbToOklch(this._r, this._g, this._b);
        }
        return this._oklch;
    }

    css(format: CssColorFormat = 'rgb'): string {
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
            default:
                return `rgb(${this._r}, ${this._g}, ${this._b})`;
        }
    }

    array(): [number, number, number] {
        return [this._r, this._g, this._b];
    }

    toString(): string {
        return this.hex();
    }

    get textColor(): string {
        return this.isDark ? '#ffffff' : '#000000';
    }

    private get luminance(): number {
        if (this._luminance === undefined) {
            this._luminance = relativeLuminance(this._r, this._g, this._b);
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

/** Create a Color object from RGB components, population count, and proportion. */
export function createColor(
    r: number,
    g: number,
    b: number,
    population: number,
    proportion: number = 0,
): Color {
    return new ColorImpl(r, g, b, population, proportion);
}
