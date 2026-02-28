import type { BrowserSource, PixelData, PixelLoader } from '../types.js';

/**
 * Browser pixel loader. Extracts RGBA pixel data from DOM image sources
 * using an off-screen canvas.
 */
export class BrowserPixelLoader implements PixelLoader<BrowserSource> {
    async load(source: BrowserSource): Promise<PixelData> {
        if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement) {
            return this.loadFromImage(source);
        }
        if (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement) {
            return this.loadFromCanvas(source);
        }
        if (typeof ImageData !== 'undefined' && source instanceof ImageData) {
            return {
                data: source.data,
                width: source.width,
                height: source.height,
            };
        }
        if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) {
            return this.loadFromImageBitmap(source);
        }
        throw new Error(
            'Unsupported source type. Expected HTMLImageElement, HTMLCanvasElement, ImageData, or ImageBitmap.',
        );
    }

    private loadFromImage(img: HTMLImageElement): PixelData {
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

    private loadFromCanvas(canvas: HTMLCanvasElement): PixelData {
        const ctx = canvas.getContext('2d')!;
        const { width, height } = canvas;
        const imageData = ctx.getImageData(0, 0, width, height);
        return { data: imageData.data, width, height };
    }

    private loadFromImageBitmap(bitmap: ImageBitmap): PixelData {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        ctx.drawImage(bitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
        return { data: imageData.data, width: bitmap.width, height: bitmap.height };
    }
}
