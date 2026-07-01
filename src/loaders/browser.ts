import type { BrowserSource, Gamut, PixelData, PixelLoader } from '../types.js';
import { readViaCanvas, readFromContext } from './canvas-utils.js';

/**
 * Browser pixel loader. Extracts RGBA pixel data from DOM image sources
 * using an off-screen canvas.
 *
 * The optional `gamut` argument controls the color space pixels are read in:
 * `'srgb'` (default), `'display-p3'`, or `'auto'`. It falls back to sRGB when
 * the environment lacks P3 canvas support.
 */
export class BrowserPixelLoader implements PixelLoader<BrowserSource> {
    async load(source: BrowserSource, _signal?: AbortSignal, gamut: Gamut | 'auto' = 'srgb'): Promise<PixelData> {
        if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement) {
            return this.loadFromImage(source, gamut);
        }
        if (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement) {
            return this.loadFromCanvas(source, gamut);
        }
        if (typeof ImageData !== 'undefined' && source instanceof ImageData) {
            return {
                data: source.data,
                width: source.width,
                height: source.height,
                // ImageData carries its own color space — honor it.
                colorSpace: (source.colorSpace as Gamut) ?? 'srgb',
            };
        }
        if (typeof HTMLVideoElement !== 'undefined' && source instanceof HTMLVideoElement) {
            return this.loadFromVideo(source, gamut);
        }
        if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) {
            return this.loadFromImageBitmap(source, gamut);
        }
        if (typeof OffscreenCanvas !== 'undefined' && source instanceof OffscreenCanvas) {
            return this.loadFromOffscreenCanvas(source, gamut);
        }
        throw new Error(
            'Unsupported source type. Expected HTMLImageElement, HTMLCanvasElement, HTMLVideoElement, ImageData, ImageBitmap, or OffscreenCanvas.',
        );
    }

    private loadFromImage(img: HTMLImageElement, gamut: Gamut | 'auto'): PixelData {
        if (!img.complete) {
            throw new Error(
                'Image has not finished loading. Wait for the "load" event before calling getColor/getPalette.',
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

    private loadFromCanvas(canvas: HTMLCanvasElement, gamut: Gamut | 'auto'): PixelData {
        const ctx = canvas.getContext('2d')!;
        return readFromContext(ctx, canvas.width, canvas.height, gamut);
    }

    private loadFromVideo(video: HTMLVideoElement, gamut: Gamut | 'auto'): PixelData {
        if (video.readyState < 2) {
            throw new Error(
                'Video is not ready. Wait for the "loadeddata" or "canplay" event before calling getColor/getPalette.',
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

    private loadFromOffscreenCanvas(canvas: OffscreenCanvas, gamut: Gamut | 'auto'): PixelData {
        const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
        if (!ctx) {
            throw new Error(
                'Could not get 2D context from OffscreenCanvas.',
            );
        }
        return readFromContext(ctx, canvas.width, canvas.height, gamut);
    }

    private loadFromImageBitmap(bitmap: ImageBitmap, gamut: Gamut | 'auto'): PixelData {
        return readViaCanvas(bitmap.width, bitmap.height, gamut, (ctx) =>
            ctx.drawImage(bitmap, 0, 0),
        );
    }
}
