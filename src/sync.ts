/**
 * Synchronous browser-only API.
 *
 * These functions accept only BrowserSource (HTMLImageElement, HTMLCanvasElement,
 * ImageData, ImageBitmap) and run entirely on the main thread with no async overhead.
 *
 * For Node.js sources (file paths, Buffers) or features like Web Workers and
 * AbortSignal, use the async API (getColor, getPalette, getSwatches).
 */
import type {
    BrowserSource,
    Color,
    FilterOptions,
    ColorSpace,
    Gamut,
    PixelData,
    Quantizer,
    SwatchMap,
} from './types.js';
import { MmcqQuantizer } from './quantizers/mmcq.js';
import { validateOptions, extractPalette } from './pipeline.js';
import { classifySwatches } from './swatches.js';
import { readViaCanvas, readFromContext } from './loaders/canvas-utils.js';

// ---------------------------------------------------------------------------
// Sync-specific options (subset — no worker, no signal, no loader)
// ---------------------------------------------------------------------------

export interface SyncExtractionOptions extends FilterOptions {
    /** Number of colors in the palette (2–20). @default 10 */
    colorCount?: number;
    /** Sampling quality (1 = highest). @default 10 */
    quality?: number;
    /** Color space for quantization. @default 'rgb' */
    colorSpace?: ColorSpace;
    /**
     * Output color gamut: `'srgb'` (default), `'display-p3'`, or `'auto'`.
     * Falls back to sRGB where P3 canvas support is unavailable.
     */
    gamut?: Gamut | 'auto';
    /** Override the quantizer for this call. Must already be init()'d. */
    quantizer?: Quantizer;
}

// ---------------------------------------------------------------------------
// Shared singletons
// ---------------------------------------------------------------------------

const defaultQuantizer = new MmcqQuantizer();

// ---------------------------------------------------------------------------
// Public sync API
// ---------------------------------------------------------------------------

/**
 * Synchronously get the dominant color from a browser image source.
 *
 * ```ts
 * const color = getColorSync(imgElement);
 * console.log(color.hex()); // '#e84393'
 * ```
 */
export function getColorSync(
    source: BrowserSource,
    options?: SyncExtractionOptions,
): Color | null {
    const palette = getPaletteSync(source, { colorCount: 5, ...options });
    return palette ? palette[0] : null;
}

/**
 * Synchronously get a color palette from a browser image source.
 *
 * ```ts
 * const palette = getPaletteSync(imgElement, { colorCount: 5 });
 * palette.forEach(c => console.log(c.hex()));
 * ```
 */
export function getPaletteSync(
    source: BrowserSource,
    options?: SyncExtractionOptions,
): Color[] | null {
    const opts = validateOptions(options ?? {});
    const quantizer = options?.quantizer ?? defaultQuantizer;

    // Reads pixels synchronously (no Promise wrapper) via the shared canvas
    // helpers, so gamut handling matches the async BrowserPixelLoader.
    const pixels = loadPixelsSync(source, opts.gamut);

    return extractPalette(
        pixels.data,
        pixels.width,
        pixels.height,
        opts,
        quantizer,
        pixels.colorSpace ?? 'srgb',
    );
}

/**
 * Synchronously get semantic swatches from a browser image source.
 *
 * ```ts
 * const swatches = getSwatchesSync(imgElement);
 * console.log(swatches.Vibrant?.color.hex());
 * ```
 */
export function getSwatchesSync(
    source: BrowserSource,
    options?: SyncExtractionOptions,
): SwatchMap {
    const palette = getPaletteSync(source, { colorCount: 16, ...options });
    return classifySwatches(palette ?? []);
}

// ---------------------------------------------------------------------------
// Internal sync pixel loading
// ---------------------------------------------------------------------------

function loadPixelsSync(source: BrowserSource, gamut: Gamut | 'auto'): PixelData {
    if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement) {
        return loadFromImage(source, gamut);
    }
    if (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement) {
        return readFromContext(source.getContext('2d')!, source.width, source.height, gamut);
    }
    if (typeof ImageData !== 'undefined' && source instanceof ImageData) {
        return {
            data: source.data,
            width: source.width,
            height: source.height,
            colorSpace: (source.colorSpace as Gamut) ?? 'srgb',
        };
    }
    if (typeof HTMLVideoElement !== 'undefined' && source instanceof HTMLVideoElement) {
        return loadFromVideo(source, gamut);
    }
    if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) {
        return readViaCanvas(source.width, source.height, gamut, (ctx) =>
            ctx.drawImage(source, 0, 0),
        );
    }
    if (typeof OffscreenCanvas !== 'undefined' && source instanceof OffscreenCanvas) {
        const ctx = source.getContext('2d') as OffscreenCanvasRenderingContext2D;
        if (!ctx) {
            throw new Error('Could not get 2D context from OffscreenCanvas.');
        }
        return readFromContext(ctx, source.width, source.height, gamut);
    }
    throw new Error(
        'Unsupported source type. Expected HTMLImageElement, HTMLCanvasElement, HTMLVideoElement, ImageData, ImageBitmap, or OffscreenCanvas.',
    );
}

function loadFromImage(img: HTMLImageElement, gamut: Gamut | 'auto'): PixelData {
    if (!img.complete) {
        throw new Error(
            'Image has not finished loading. Wait for the "load" event before calling getColorSync/getPaletteSync.',
        );
    }
    if (!img.naturalWidth) {
        throw new Error(
            'Image has no dimensions. It may not have loaded successfully.',
        );
    }
    return readViaCanvas(img.naturalWidth, img.naturalHeight, gamut, (ctx) =>
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight),
    );
}

function loadFromVideo(video: HTMLVideoElement, gamut: Gamut | 'auto'): PixelData {
    if (video.readyState < 2) {
        throw new Error(
            'Video is not ready. Wait for the "loadeddata" or "canplay" event before calling getColorSync/getPaletteSync.',
        );
    }
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
        throw new Error(
            'Video has no dimensions. It may not have loaded successfully.',
        );
    }
    return readViaCanvas(width, height, gamut, (ctx) =>
        ctx.drawImage(video, 0, 0, width, height),
    );
}
