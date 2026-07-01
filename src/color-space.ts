import type { Gamut, OKLCH } from './types.js';

// ---------------------------------------------------------------------------
// sRGB ↔ Linear
// ---------------------------------------------------------------------------

// Display P3 shares the sRGB transfer function (only its primaries differ), so
// srgbToLinear/linearToSrgb are reused for P3 encode/decode.

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
// 3×3 matrix helpers + gamut conversion matrices
// ---------------------------------------------------------------------------

type Mat3 = [
    [number, number, number],
    [number, number, number],
    [number, number, number],
];

function mat3Mul(a: Mat3, b: Mat3): Mat3 {
    const out: Mat3 = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            out[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j];
        }
    }
    return out;
}

function mat3Inv(m: Mat3): Mat3 {
    const [a, b, c] = m[0];
    const [d, e, f] = m[1];
    const [g, h, i] = m[2];
    const A = e * i - f * h;
    const B = -(d * i - f * g);
    const C = d * h - e * g;
    const det = a * A + b * B + c * C;
    const invDet = 1 / det;
    return [
        [A * invDet, (c * h - b * i) * invDet, (b * f - c * e) * invDet],
        [B * invDet, (a * i - c * g) * invDet, (c * d - a * f) * invDet],
        [C * invDet, (b * g - a * h) * invDet, (a * e - b * d) * invDet],
    ];
}

function mat3Apply(m: Mat3, x: number, y: number, z: number): [number, number, number] {
    return [
        m[0][0] * x + m[0][1] * y + m[0][2] * z,
        m[1][0] * x + m[1][1] * y + m[1][2] * z,
        m[2][0] * x + m[2][1] * y + m[2][2] * z,
    ];
}

// XYZ (D65) → LMS (Oklab M1 matrix).
const XYZ_TO_LMS: Mat3 = [
    [0.8189330101, 0.3618667424, -0.1288597137],
    [0.0329845436, 0.9293118715, 0.0361456387],
    [0.0482003018, 0.2643662691, 0.6338517070],
];

// linear Display-P3 → XYZ (D65).
const LINEAR_P3_TO_XYZ: Mat3 = [
    [0.4865709486, 0.2656676932, 0.1982172852],
    [0.2289745641, 0.6917385218, 0.0792869141],
    [0.0000000000, 0.0451133819, 1.0439443689],
];

// linear sRGB → XYZ (D65).
const LINEAR_SRGB_TO_XYZ: Mat3 = [
    [0.4123907993, 0.3575843394, 0.1804807884],
    [0.2126390059, 0.7151686788, 0.0721923154],
    [0.0193308187, 0.1191947798, 0.9505321522],
];

// Composed matrices (derived once so we never hand-transcribe products).
const LINEAR_P3_TO_LMS = mat3Mul(XYZ_TO_LMS, LINEAR_P3_TO_XYZ);
const LMS_TO_LINEAR_P3 = mat3Inv(LINEAR_P3_TO_LMS);
const XYZ_TO_LINEAR_SRGB = mat3Inv(LINEAR_SRGB_TO_XYZ);
const LINEAR_P3_TO_LINEAR_SRGB = mat3Mul(XYZ_TO_LINEAR_SRGB, LINEAR_P3_TO_XYZ);
const LINEAR_SRGB_TO_LINEAR_P3 = mat3Inv(LINEAR_P3_TO_LINEAR_SRGB);

// WCAG-rounded sRGB luminance coefficients (kept exact for backward compat).
const SRGB_LUMA: [number, number, number] = [0.2126, 0.7152, 0.0722];

// ---------------------------------------------------------------------------
// RGB → OKLab → OKLCH
// ---------------------------------------------------------------------------

/** Convert LMS cone response (post cube-root) to OKLCH. Gamut-independent. */
function lmsToOklch(l3: number, m3: number, s3: number): OKLCH {
    const L = 0.2104542553 * l3 + 0.7936177850 * m3 - 0.0040720468 * s3;
    const a = 1.9779984951 * l3 - 2.4285922050 * m3 + 0.4505937099 * s3;
    const bLab = 0.0259040371 * l3 + 0.7827717662 * m3 - 0.8086757660 * s3;

    const C = Math.sqrt(a * a + bLab * bLab);
    let H = Math.atan2(bLab, a) * (180 / Math.PI);
    if (H < 0) H += 360;

    return { l: L, c: C, h: H };
}

/** Convert Display-P3 (0–255 each) to OKLCH. */
function p3ToOklch(r: number, g: number, b: number): OKLCH {
    const [l_, m_, s_] = mat3Apply(
        LINEAR_P3_TO_LMS,
        srgbToLinear(r),
        srgbToLinear(g),
        srgbToLinear(b),
    );
    return lmsToOklch(Math.cbrt(l_), Math.cbrt(m_), Math.cbrt(s_));
}

/** Convert RGB (0–255 each) in the given gamut to OKLCH. @default 'srgb' */
export function rgbToOklch(r: number, g: number, b: number, gamut: Gamut = 'srgb'): OKLCH {
    if (gamut === 'display-p3') return p3ToOklch(r, g, b);
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

/** Convert OKLCH to LMS cone response (pre-cube). Gamut-independent. */
function oklchToLms(l: number, c: number, h: number): [number, number, number] {
    const hRad = h * (Math.PI / 180);
    const a = c * Math.cos(hRad);
    const bLab = c * Math.sin(hRad);

    const l3 = l + 0.3963377774 * a + 0.2158037573 * bLab;
    const m3 = l - 0.1055613458 * a - 0.0638541728 * bLab;
    const s3 = l - 0.0894841775 * a - 1.2914855480 * bLab;

    return [l3 * l3 * l3, m3 * m3 * m3, s3 * s3 * s3];
}

/** Convert OKLCH to Display-P3 (0–255 each). Clamps out-of-gamut values. */
function oklchToP3(l: number, c: number, h: number): [number, number, number] {
    const [l_, m_, s_] = oklchToLms(l, c, h);
    const [lr, lg, lb] = mat3Apply(LMS_TO_LINEAR_P3, l_, m_, s_);
    return [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb)];
}

/** Convert OKLCH to RGB (0–255 each) in the given gamut. Clamps out of gamut. */
export function oklchToRgb(
    l: number,
    c: number,
    h: number,
    gamut: Gamut = 'srgb',
): [number, number, number] {
    if (gamut === 'display-p3') return oklchToP3(l, c, h);
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
    gamut: Gamut = 'srgb',
): Array<[number, number, number]> {
    const out: Array<[number, number, number]> = new Array(pixels.length);
    for (let i = 0; i < pixels.length; i++) {
        const [r, g, b] = pixels[i];
        const { l, c, h } = rgbToOklch(r, g, b, gamut);
        out[i] = [
            Math.round(l * 255),
            Math.round((c / 0.4) * 255),
            Math.round((h / 360) * 255),
        ];
    }
    return out;
}

/**
 * Convert scaled OKLCH palette entries back to RGB in the given gamut.
 */
export function paletteOklchScaledToRgb(
    colors: Array<{ color: [number, number, number]; population: number }>,
    gamut: Gamut = 'srgb',
): Array<{ color: [number, number, number]; population: number }> {
    return colors.map(({ color: [ls, cs, hs], population }) => {
        const l = ls / 255;
        const c = (cs / 255) * 0.4;
        const h = (hs / 255) * 360;
        return { color: oklchToRgb(l, c, h, gamut), population };
    });
}

// ---------------------------------------------------------------------------
// Gamut mapping + detection
// ---------------------------------------------------------------------------

/** Convert a Display-P3 pixel (0–255) to sRGB (0–255), clipping out of gamut. */
export function p3ToSrgb(r: number, g: number, b: number): [number, number, number] {
    const [lr, lg, lb] = mat3Apply(
        LINEAR_P3_TO_LINEAR_SRGB,
        srgbToLinear(r),
        srgbToLinear(g),
        srgbToLinear(b),
    );
    return [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb)];
}

/** Convert an sRGB pixel (0–255) to Display-P3 (0–255). */
export function srgbToP3(r: number, g: number, b: number): [number, number, number] {
    const [lr, lg, lb] = mat3Apply(
        LINEAR_SRGB_TO_LINEAR_P3,
        srgbToLinear(r),
        srgbToLinear(g),
        srgbToLinear(b),
    );
    return [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb)];
}

// Tolerance (in linear light) before a P3 pixel counts as outside sRGB.
const GAMUT_EPS = 0.001;

/** True if a Display-P3 pixel (0–255) falls outside the sRGB gamut. */
export function isOutOfSrgbGamut(r: number, g: number, b: number): boolean {
    const [lr, lg, lb] = mat3Apply(
        LINEAR_P3_TO_LINEAR_SRGB,
        srgbToLinear(r),
        srgbToLinear(g),
        srgbToLinear(b),
    );
    return (
        lr < -GAMUT_EPS || lr > 1 + GAMUT_EPS ||
        lg < -GAMUT_EPS || lg > 1 + GAMUT_EPS ||
        lb < -GAMUT_EPS || lb > 1 + GAMUT_EPS
    );
}

/** WCAG relative luminance from RGB (0–255) in the given gamut. */
export function relativeLuminance(r: number, g: number, b: number, gamut: Gamut = 'srgb'): number {
    const lr = srgbToLinear(r);
    const lg = srgbToLinear(g);
    const lb = srgbToLinear(b);
    const [wr, wg, wb] = gamut === 'display-p3' ? LINEAR_P3_TO_XYZ[1] : SRGB_LUMA;
    return wr * lr + wg * lg + wb * lb;
}
