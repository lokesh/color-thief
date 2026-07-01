// ---------------------------------------------------------------------------
// Color spaces
// ---------------------------------------------------------------------------

/** Red, Green, Blue — each channel 0–255. */
export interface RGB {
    r: number;
    g: number;
    b: number;
}

/** Hue (0–360), Saturation (0–100), Lightness (0–100). */
export interface HSL {
    h: number;
    s: number;
    l: number;
}

/** OKLCH perceptual color space — Lightness (0–1), Chroma (0–0.4), Hue (0–360). */
export interface OKLCH {
    l: number;
    c: number;
    h: number;
}

/**
 * Output color gamut. `'srgb'` is the classic 8-bit sRGB range; `'display-p3'`
 * is the wider gamut used by modern displays and P3-tagged images.
 */
export type Gamut = 'srgb' | 'display-p3';

// ---------------------------------------------------------------------------
// Pixel data
// ---------------------------------------------------------------------------

/** Raw RGBA pixel buffer (Uint8Array or Uint8ClampedArray). */
export type PixelBuffer = Uint8Array | Uint8ClampedArray;

/** Decoded pixel data with dimensions. */
export interface PixelData {
    data: PixelBuffer;
    width: number;
    height: number;
    /**
     * Color space the pixel values are encoded in. When omitted, `'srgb'` is
     * assumed. `'display-p3'` means the RGB values cover the wider P3 gamut.
     */
    colorSpace?: Gamut;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/** Filter options controlling which pixels are sampled. */
export interface FilterOptions {
    /** Skip white pixels. @default true */
    ignoreWhite?: boolean;
    /** RGB threshold above which a pixel is "white" (0–255). @default 250 */
    whiteThreshold?: number;
    /** Alpha threshold below which a pixel is transparent (0–255). @default 125 */
    alphaThreshold?: number;
    /** Minimum HSV saturation (0–1). @default 0 */
    minSaturation?: number;
}

/** Color space used for quantization. */
export type ColorSpace = 'rgb' | 'oklch';

/** Full extraction options. */
export interface ExtractionOptions extends FilterOptions {
    /** Number of colors in the palette (2–20). @default 10 */
    colorCount?: number;
    /** Sampling quality (1 = highest). @default 10 */
    quality?: number;
    /** Color space for quantization. @default 'oklch' */
    colorSpace?: ColorSpace;
    /**
     * Output color gamut for the returned colors (browser only).
     * - `'srgb'` — classic sRGB output (default, fully backward compatible).
     * - `'display-p3'` — read the source through a P3 canvas and report P3 colors.
     * - `'auto'` — read wide, but only report `'display-p3'` if the image
     *   actually contains colors outside the sRGB gamut; otherwise `'srgb'`.
     *
     * Falls back to `'srgb'` when the environment lacks P3 canvas support.
     * @default 'srgb'
     */
    gamut?: Gamut | 'auto';
    /** AbortSignal to cancel extraction. */
    signal?: AbortSignal;
    /** Offload quantization to a Web Worker (browser only). @default false */
    worker?: boolean;
    /** Override the quantizer for this call only. Takes priority over configure(). */
    quantizer?: Quantizer;
    /** Override the pixel loader for this call only. Takes priority over configure(). */
    loader?: PixelLoader<ImageSource>;
}

// ---------------------------------------------------------------------------
// Color object
// ---------------------------------------------------------------------------

/** WCAG contrast information. */
export interface ContrastInfo {
    /** Contrast ratio against white (1–21). */
    white: number;
    /** Contrast ratio against black (1–21). */
    black: number;
    /** Suggested foreground color for readability. */
    foreground: Color;
}

/** Supported CSS color formats. */
export type CssColorFormat = 'rgb' | 'hsl' | 'oklch';

/** A rich color extracted from an image. */
export interface Color {
    /**
     * RGB components. Defaults to sRGB (gamut-mapped when the color is P3), so
     * hand-built `rgb(...)` strings are always safe. Pass `'display-p3'` to get
     * the raw wide-gamut components instead.
     */
    rgb(gamut?: Gamut): RGB;
    /** Hex string e.g. '#ff0000'. Always sRGB (gamut-mapped for P3 colors). */
    hex(): string;
    /** HSL components. */
    hsl(): HSL;
    /** OKLCH components. */
    oklch(): OKLCH;
    /**
     * CSS color string. For a `'display-p3'` color the default format emits
     * `color(display-p3 r g b)`, preserving the wide gamut. @default 'rgb'
     */
    css(format?: CssColorFormat): string;
    /** RGB tuple [r, g, b]. Always sRGB (gamut-mapped for P3 colors). */
    array(): [number, number, number];
    /** Gamut the color was extracted in — `'srgb'` or `'display-p3'`. */
    readonly gamut: Gamut;
    /** Hex string. Allows Color to be used directly in template literals and string contexts. */
    toString(): string;
    /** '#ffffff' or '#000000' — the readable text color for this background. */
    readonly textColor: string;
    /** True if the color is perceptually dark (relative luminance ≤ 0.179). */
    readonly isDark: boolean;
    /** True if the color is perceptually light. */
    readonly isLight: boolean;
    /** WCAG contrast ratios and suggested foreground. */
    readonly contrast: ContrastInfo;
    /** Relative population count from the quantizer. */
    readonly population: number;
    /** Proportion of total pixels represented by this color (0–1). */
    readonly proportion: number;
}

// ---------------------------------------------------------------------------
// Swatches
// ---------------------------------------------------------------------------

export type SwatchRole =
    | 'Vibrant'
    | 'Muted'
    | 'DarkVibrant'
    | 'DarkMuted'
    | 'LightVibrant'
    | 'LightMuted';

/** A semantic swatch with accessibility text colors. */
export interface Swatch {
    color: Color;
    role: SwatchRole;
    titleTextColor: Color;
    bodyTextColor: Color;
}

/** Map of swatch roles to their matched swatch (may be null if no good match). */
export type SwatchMap = Record<SwatchRole, Swatch | null>;

// ---------------------------------------------------------------------------
// Platform adapters
// ---------------------------------------------------------------------------

/** Contract for loading pixel data from a platform-specific source. */
export interface PixelLoader<TSource> {
    /**
     * Load and decode the source into raw pixel data. `gamut` requests the
     * color space to read in; implementations may ignore it and return sRGB.
     */
    load(source: TSource, signal?: AbortSignal, gamut?: Gamut | 'auto'): Promise<PixelData>;
}

/** Pluggable quantization algorithm. */
export interface Quantizer {
    /** One-time async initialization (e.g. loading WASM). */
    init(): Promise<void>;
    /** Quantize pixel array into up to maxColors clusters. */
    quantize(
        pixels: Array<[number, number, number]>,
        maxColors: number,
    ): Array<{ color: [number, number, number]; population: number }>;
}

// ---------------------------------------------------------------------------
// Source types
// ---------------------------------------------------------------------------

/** Browser image source types. */
export type BrowserSource =
    | HTMLImageElement
    | HTMLCanvasElement
    | HTMLVideoElement
    | ImageData
    | ImageBitmap
    | OffscreenCanvas;

/** Node.js image source types. */
export type NodeSource = string | Buffer;

/** Union of all supported source types. */
export type ImageSource = BrowserSource | NodeSource;

// ---------------------------------------------------------------------------
// Progressive extraction
// ---------------------------------------------------------------------------

/** Yielded by the progressive extraction async generator. */
export interface ProgressiveResult {
    palette: Color[];
    /** Progress fraction (0–1). */
    progress: number;
    /** True when this is the final, full-quality pass. */
    done: boolean;
}
