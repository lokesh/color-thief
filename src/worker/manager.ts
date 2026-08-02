/**
 * Deprecated Web Worker shims.
 *
 * Color Thief used to offload quantization to a Blob-URL worker carrying its
 * own inlined copy of MMCQ. That path cost more than it saved — the pixel
 * array (`Array<[r, g, b]>`, one small array per sampled pixel) had to be
 * structured-cloned to reach the worker, and serializing it on the main thread
 * took several times longer than simply quantizing there. It also drifted from
 * the real pipeline: it quantized in RGB while the main path defaults to
 * OKLCH, and it skipped the few-color short-circuit, filter relaxation, and any
 * quantizer set via `configure()` — so `worker: true` returned different colors
 * than the default.
 *
 * These exports remain as no-ops through v3 and will be removed in v4. To get
 * extraction off the main thread, run Color Thief itself inside your own
 * worker: `ImageBitmap` and `OffscreenCanvas` are supported sources, so decode,
 * pixel sampling, and quantization all move off-thread, and an `ImageBitmap`
 * transfers without copying.
 */

import type { Color, Gamut } from '../types.js';
import { createColor } from '../color.js';
import { p3ToSrgb } from '../color-space.js';
import { MmcqQuantizer } from '../quantizers/mmcq.js';
import { deprecate } from '../deprecate.js';

const REMOVED =
    'the Web Worker path was removed in v3 and these shims will be deleted in v4. ' +
    'Run Color Thief inside your own worker instead — see the README.';

/**
 * @deprecated Always returns `false`. Worker offloading was removed; callers
 * that branch on this will fall through to their main-thread path, which is
 * what the worker path now does anyway.
 */
export function isWorkerSupported(): boolean {
    deprecate(`isWorkerSupported() always returns false — ${REMOVED}`);
    return false;
}

/**
 * @deprecated Runs on the main thread. Kept only so existing callers keep
 * working through v3; it quantizes with MMCQ in RGB, matching what the worker
 * used to return.
 *
 * @param pixels - Sampled pixel array (RGB triplets).
 * @param maxColors - Maximum palette size.
 * @param signal - Optional AbortSignal.
 */
export function extractInWorker(
    pixels: Array<[number, number, number]>,
    maxColors: number,
    signal?: AbortSignal,
    nativeGamut: Gamut = 'srgb',
    outputGamut: Gamut = 'srgb',
): Promise<Color[]> {
    deprecate(`extractInWorker() now runs on the main thread — ${REMOVED}`);

    return new Promise<Color[]>((resolve, reject) => {
        if (signal?.aborted) {
            reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
            return;
        }

        try {
            const raw = new MmcqQuantizer().quantize(pixels, maxColors);
            const totalPopulation = raw.reduce((sum, q) => sum + q.population, 0);
            resolve(
                raw.map(({ color, population }) => {
                    const [r, g, b] =
                        nativeGamut === outputGamut
                            ? color
                            : p3ToSrgb(color[0], color[1], color[2]);
                    return createColor(
                        r,
                        g,
                        b,
                        population,
                        totalPopulation > 0 ? population / totalPopulation : 0,
                        outputGamut,
                    );
                }),
            );
        } catch (err) {
            reject(err);
        }
    });
}

/** @deprecated No-op. There is no worker to terminate. */
export function terminateWorker(): void {
    deprecate(`terminateWorker() is a no-op — ${REMOVED}`);
}
