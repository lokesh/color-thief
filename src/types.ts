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
    /** Color space for quantization. @default 'rgb' */
    colorSpace?: ColorSpace;
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
    /** RGB components. */
    rgb(): RGB;
    /** Hex string e.g. '#ff0000'. */
    hex(): string;
    /** HSL components. */
    hsl(): HSL;
    /** OKLCH components. */
    oklch(): OKLCH;
    /** CSS color string. @default 'rgb' */
    css(format?: CssColorFormat): string;
    /** RGB tuple [r, g, b]. */
    array(): [number, number, number];
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
    /** Load and decode the source into raw pixel data. */
    load(source: TSource, signal?: AbortSignal): Promise<PixelData>;
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
