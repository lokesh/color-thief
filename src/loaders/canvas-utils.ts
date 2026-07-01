import type { Gamut, PixelData } from '../types.js';

/**
 * Shared canvas pixel-reading helpers used by both the async and sync browser
 * loaders. Centralizes color-space handling so the two entry points stay in
 * sync and P3 support lives in one place.
 */

let p3Support: boolean | undefined;

/** Whether this environment can back a 2D canvas with the Display-P3 gamut. */
export function supportsP3Canvas(): boolean {
    if (p3Support !== undefined) return p3Support;
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', {
            colorSpace: 'display-p3',
        }) as CanvasRenderingContext2D | null;
        p3Support = !!ctx && ctx.getContextAttributes?.().colorSpace === 'display-p3';
    } catch {
        p3Support = false;
    }
    return p3Support;
}

function wantsWide(gamut: Gamut | 'auto'): boolean {
    return gamut === 'display-p3' || gamut === 'auto';
}

/** Resolve the gamut we can actually read in, given support + the request. */
function effectiveColorSpace(gamut: Gamut | 'auto'): Gamut {
    return wantsWide(gamut) && supportsP3Canvas() ? 'display-p3' : 'srgb';
}

function getImageDataChecked(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number,
    colorSpace: Gamut,
): ImageData {
    try {
        // Only pass the settings arg for P3 so the sRGB path stays identical to
        // the long-standing behavior (and avoids old-engine settings quirks).
        return colorSpace === 'display-p3'
            ? ctx.getImageData(0, 0, width, height, { colorSpace: 'display-p3' })
            : ctx.getImageData(0, 0, width, height);
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

/**
 * Draw a source into a fresh off-screen canvas and read its pixels in the
 * requested gamut, returning the data tagged with the gamut actually used.
 */
export function readViaCanvas(
    width: number,
    height: number,
    gamut: Gamut | 'auto',
    draw: (ctx: CanvasRenderingContext2D) => void,
): PixelData {
    const colorSpace = effectiveColorSpace(gamut);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = (
        colorSpace === 'display-p3'
            ? canvas.getContext('2d', { colorSpace: 'display-p3' })
            : canvas.getContext('2d')
    ) as CanvasRenderingContext2D;
    draw(ctx);
    const imageData = getImageDataChecked(ctx, width, height, colorSpace);
    return { data: imageData.data, width, height, colorSpace };
}

/**
 * Read pixels from an existing 2D context (a user-supplied canvas). Uses the
 * getImageData settings arg to obtain P3 output when requested/supported.
 */
export function readFromContext(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number,
    gamut: Gamut | 'auto',
): PixelData {
    const colorSpace = effectiveColorSpace(gamut);
    const imageData = getImageDataChecked(ctx, width, height, colorSpace);
    return { data: imageData.data, width, height, colorSpace };
}
