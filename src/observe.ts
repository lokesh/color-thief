/**
 * Live extraction mode — observe() with reactive updates.
 *
 * Watches a source element (video, canvas, or img) and emits palette
 * updates via an onChange callback. Uses requestAnimationFrame with
 * throttle for video/canvas, and MutationObserver for img src changes.
 *
 * Browser-only — relies on DOM APIs.
 */
import type { Color, ColorSpace, FilterOptions } from './types.js';
import { getPaletteSync } from './sync.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Element types that can be observed for live palette updates. */
export type ObservableSource =
    | HTMLVideoElement
    | HTMLCanvasElement
    | HTMLImageElement;

/** Options for observe(). */
export interface ObserveOptions extends FilterOptions {
    /** Minimum milliseconds between palette updates. @default 200 */
    throttle?: number;
    /** Number of colors in the palette (2–20). @default 5 */
    colorCount?: number;
    /** Sampling quality (1 = highest). @default 10 */
    quality?: number;
    /** Color space for quantization. @default 'oklch' */
    colorSpace?: ColorSpace;
    /** Called whenever a new palette is extracted. */
    onChange: (palette: Color[]) => void;
}

/** Controller returned by observe() to stop watching. */
export interface ObserveController {
    /** Stop observing and clean up all listeners/timers. */
    stop(): void;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Watch a source element and reactively extract palettes as it changes.
 *
 * - **HTMLVideoElement** — extracts from the current frame on each animation
 *   frame (throttled). Only runs while the video is playing.
 * - **HTMLCanvasElement** — polls on each animation frame (throttled).
 * - **HTMLImageElement** — extracts immediately, then watches for `src`/`srcset`
 *   attribute changes via MutationObserver.
 *
 * ```ts
 * const controller = observe(videoElement, {
 *     throttle: 200,
 *     colorCount: 5,
 *     onChange(palette) {
 *         updateAmbientBackground(palette);
 *     },
 * });
 *
 * // Later
 * controller.stop();
 * ```
 */
export function observe(
    source: ObservableSource,
    options: ObserveOptions,
): ObserveController {
    const {
        throttle = 200,
        onChange,
        ...extractionOptions
    } = options;

    let stopped = false;
    let rafId: number | null = null;
    let mutationObserver: MutationObserver | null = null;
    let lastExtractTime = 0;

    // Cleanup handles for event listeners
    const cleanups: Array<() => void> = [];

    function extract(): void {
        try {
            const palette = getPaletteSync(source, extractionOptions);
            if (palette && palette.length > 0) {
                onChange(palette);
            }
        } catch {
            // Skip this frame on error (CORS, not loaded, etc.)
        }
    }

    function tick(): void {
        if (stopped) return;

        const now = performance.now();
        if (now - lastExtractTime >= throttle) {
            if (source instanceof HTMLVideoElement) {
                // Only extract when the video has data and is playing
                if (source.readyState >= 2 && !source.paused && !source.ended) {
                    extract();
                    lastExtractTime = now;
                }
            } else {
                // Canvas — always extract
                extract();
                lastExtractTime = now;
            }
        }

        rafId = requestAnimationFrame(tick);
    }

    // ----- HTMLImageElement: MutationObserver-based -----
    if (source instanceof HTMLImageElement) {
        // Extract immediately if already loaded
        if (source.complete && source.naturalWidth) {
            extract();
        } else {
            const onLoad = (): void => {
                extract();
                source.removeEventListener('load', onLoad);
            };
            source.addEventListener('load', onLoad);
            cleanups.push(() => source.removeEventListener('load', onLoad));
        }

        // Watch for src / srcset attribute changes
        mutationObserver = new MutationObserver(() => {
            if (source.complete && source.naturalWidth) {
                extract();
            } else {
                const onLoad = (): void => {
                    extract();
                    source.removeEventListener('load', onLoad);
                };
                source.addEventListener('load', onLoad);
            }
        });
        mutationObserver.observe(source, {
            attributes: true,
            attributeFilter: ['src', 'srcset'],
        });

    // ----- HTMLVideoElement: rAF + play/pause awareness -----
    } else if (source instanceof HTMLVideoElement) {
        // Start the rAF loop — it checks readyState/paused internally
        rafId = requestAnimationFrame(tick);

        // Also extract on seeked so scrubbing works
        const onSeeked = (): void => {
            if (!stopped) extract();
        };
        source.addEventListener('seeked', onSeeked);
        cleanups.push(() => source.removeEventListener('seeked', onSeeked));

    // ----- HTMLCanvasElement: rAF polling -----
    } else {
        rafId = requestAnimationFrame(tick);
    }

    return {
        stop(): void {
            stopped = true;
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            if (mutationObserver) {
                mutationObserver.disconnect();
                mutationObserver = null;
            }
            for (const fn of cleanups) fn();
            cleanups.length = 0;
        },
    };
}
