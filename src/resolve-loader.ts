import type { ImageSource, PixelLoader } from './types.js';

/**
 * Resolve the default pixel loader based on the current environment.
 * This universal version supports both browser and Node.js.
 *
 * The browser build swaps this module for resolve-loader.browser.ts
 * which only includes the browser loader (no sharp dependency).
 */
export async function resolveDefaultLoader(): Promise<PixelLoader<ImageSource>> {
    const isBrowser =
        typeof window !== 'undefined' && typeof document !== 'undefined';

    if (isBrowser) {
        const { BrowserPixelLoader } = await import('./loaders/browser.js');
        return new BrowserPixelLoader() as PixelLoader<ImageSource>;
    } else {
        const { NodePixelLoader } = await import('./loaders/node.js');
        return new NodePixelLoader() as PixelLoader<ImageSource>;
    }
}
