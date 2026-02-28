import type { OKLCH } from './types.js';

// ---------------------------------------------------------------------------
// sRGB ↔ Linear
// ---------------------------------------------------------------------------

/** Convert a single sRGB channel (0–255) to linear (0–1). */
export function srgbToLinear(c: number): number {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** Convert a linear channel (0–1) back to sRGB (0–255). */
export function linearToSrgb(c: number): number {
    const s = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(Math.max(0, Math.min(255, s * 255)));
}

// ---------------------------------------------------------------------------
// RGB → OKLab → OKLCH
// ---------------------------------------------------------------------------

/** Convert sRGB (0–255 each) to OKLCH. */
export function rgbToOklch(r: number, g: number, b: number): OKLCH {
    // sRGB → linear
    const lr = srgbToLinear(r);
    const lg = srgbToLinear(g);
    const lb = srgbToLinear(b);

    // Linear sRGB → LMS (using Oklab M1 matrix)
    const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
    const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
    const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

    // Cube root (LMS → Lab cone response)
    const l3 = Math.cbrt(l_);
    const m3 = Math.cbrt(m_);
    const s3 = Math.cbrt(s_);

    // LMS cone response → OKLab
    const L = 0.2104542553 * l3 + 0.7936177850 * m3 - 0.0040720468 * s3;
    const a = 1.9779984951 * l3 - 2.4285922050 * m3 + 0.4505937099 * s3;
    const bLab = 0.0259040371 * l3 + 0.7827717662 * m3 - 0.8086757660 * s3;

    // OKLab → OKLCH
    const C = Math.sqrt(a * a + bLab * bLab);
    let H = Math.atan2(bLab, a) * (180 / Math.PI);
    if (H < 0) H += 360;

    return { l: L, c: C, h: H };
}

// ---------------------------------------------------------------------------
// OKLCH → OKLab → RGB
// ---------------------------------------------------------------------------

/** Convert OKLCH back to sRGB (0–255 each). Clamps out-of-gamut values. */
export function oklchToRgb(l: number, c: number, h: number): [number, number, number] {
    // OKLCH → OKLab
    const hRad = h * (Math.PI / 180);
    const a = c * Math.cos(hRad);
    const bLab = c * Math.sin(hRad);

    // OKLab → LMS cone response
    const l3 = l + 0.3963377774 * a + 0.2158037573 * bLab;
    const m3 = l - 0.1055613458 * a - 0.0638541728 * bLab;
    const s3 = l - 0.0894841775 * a - 1.2914855480 * bLab;

    // Cube (cone response → LMS)
    const l_ = l3 * l3 * l3;
    const m_ = m3 * m3 * m3;
    const s_ = s3 * s3 * s3;

    // LMS → linear sRGB (inverse of M1)
    const lr = +4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
    const lg = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
    const lb = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;

    return [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb)];
}

// ---------------------------------------------------------------------------
// Batch conversion helpers for OKLCH quantization pipeline
// ---------------------------------------------------------------------------

/**
 * Convert an array of RGB pixel triplets to OKLCH, scaled to 0–255 for
 * compatibility with the MMCQ quantizer (which expects integer ranges).
 *
 * Scaling: L (0–1) → 0–255, C (0–0.4) → 0–255, H (0–360) → 0–255
 */
export function pixelsRgbToOklchScaled(
    pixels: Array<[number, number, number]>,
): Array<[number, number, number]> {
    const out: Array<[number, number, number]> = new Array(pixels.length);
    for (let i = 0; i < pixels.length; i++) {
        const [r, g, b] = pixels[i];
        const { l, c, h } = rgbToOklch(r, g, b);
        out[i] = [
            Math.round(l * 255),
            Math.round((c / 0.4) * 255),
            Math.round((h / 360) * 255),
        ];
    }
    return out;
}

/**
 * Convert scaled OKLCH palette entries back to RGB.
 */
export function paletteOklchScaledToRgb(
    colors: Array<{ color: [number, number, number]; population: number }>,
): Array<{ color: [number, number, number]; population: number }> {
    return colors.map(({ color: [ls, cs, hs], population }) => {
        const l = ls / 255;
        const c = (cs / 255) * 0.4;
        const h = (hs / 255) * 360;
        return { color: oklchToRgb(l, c, h), population };
    });
}
