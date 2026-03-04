import type { ImageSource, PixelLoader } from './types.js';

/**
 * Resolve the default pixel loader — browser-only version.
 * This module is substituted for resolve-loader.ts in browser builds
 * so that bundlers never see the sharp dependency.
 */
export async function resolveDefaultLoader(): Promise<PixelLoader<ImageSource>> {
    const { BrowserPixelLoader } = await import('./loaders/browser.js');
    return new BrowserPixelLoader() as PixelLoader<ImageSource>;
}
