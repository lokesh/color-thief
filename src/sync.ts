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
    Quantizer,
    SwatchMap,
} from './types.js';
import { BrowserPixelLoader } from './loaders/browser.js';
import { MmcqQuantizer } from './quantizers/mmcq.js';
import { validateOptions, extractPalette } from './pipeline.js';
import { classifySwatches } from './swatches.js';

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
    /** Override the quantizer for this call. Must already be init()'d. */
    quantizer?: Quantizer;
}

// ---------------------------------------------------------------------------
// Shared singletons
// ---------------------------------------------------------------------------

const loader = new BrowserPixelLoader();
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

    // BrowserPixelLoader.load is async in signature but synchronous in practice
    // for HTMLImageElement/Canvas/ImageData/ImageBitmap. We call the internal
    // methods directly to avoid the Promise wrapper.
    const pixels = loadPixelsSync(source);

    return extractPalette(
        pixels.data,
        pixels.width,
        pixels.height,
        opts,
        quantizer,
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

function loadPixelsSync(source: BrowserSource) {
    if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement) {
        return loadFromImage(source);
    }
    if (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement) {
        return loadFromCanvas(source);
    }
    if (typeof ImageData !== 'undefined' && source instanceof ImageData) {
        return { data: source.data, width: source.width, height: source.height };
    }
    if (typeof HTMLVideoElement !== 'undefined' && source instanceof HTMLVideoElement) {
        return loadFromVideo(source);
    }
    if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) {
        return loadFromImageBitmap(source);
    }
    if (typeof OffscreenCanvas !== 'undefined' && source instanceof OffscreenCanvas) {
        return loadFromOffscreenCanvas(source);
    }
    throw new Error(
        'Unsupported source type. Expected HTMLImageElement, HTMLCanvasElement, HTMLVideoElement, ImageData, ImageBitmap, or OffscreenCanvas.',
    );
}

function loadFromImage(img: HTMLImageElement) {
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
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const width = (canvas.width = img.naturalWidth);
    const height = (canvas.height = img.naturalHeight);
    ctx.drawImage(img, 0, 0, width, height);
    try {
        const imageData = ctx.getImageData(0, 0, width, height);
        return { data: imageData.data, width, height };
    } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'SecurityError') {
            const err = new Error(
                'Image is tainted by cross-origin data. Add crossorigin="anonymous" to the <img> tag and ensure the server sends appropriate CORS headers.',
            );
            err.cause = e;
            throw err;
        }
        throw e;
    }
}

function loadFromCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!;
    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    return { data: imageData.data, width, height };
}

function loadFromVideo(video: HTMLVideoElement) {
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
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    return { data: imageData.data, width, height };
}

function loadFromOffscreenCanvas(canvas: OffscreenCanvas) {
    const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    if (!ctx) {
        throw new Error(
            'Could not get 2D context from OffscreenCanvas.',
        );
    }
    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    return { data: imageData.data, width, height };
}

function loadFromImageBitmap(bitmap: ImageBitmap) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    return { data: imageData.data, width: bitmap.width, height: bitmap.height };
}
