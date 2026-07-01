import type { Color, Gamut } from '../types.js';
import { createColor } from '../color.js';
import { p3ToSrgb } from '../color-space.js';
import { WORKER_SOURCE } from './worker-script.js';

let worker: Worker | null = null;
let blobUrl: string | null = null;
let nextId = 0;
const pending = new Map<
    number,
    {
        resolve: (value: Color[]) => void;
        reject: (reason: unknown) => void;
        nativeGamut: Gamut;
        outputGamut: Gamut;
    }
>();

/** Check whether the current environment supports Web Workers. */
export function isWorkerSupported(): boolean {
    return typeof Worker !== 'undefined';
}

function getOrCreateWorker(): Worker {
    if (worker) return worker;
    if (!isWorkerSupported()) {
        throw new Error('Web Workers are not supported in this environment.');
    }
    blobUrl = URL.createObjectURL(
        new Blob([WORKER_SOURCE], { type: 'application/javascript' }),
    );
    worker = new Worker(blobUrl);
    worker.onmessage = (e: MessageEvent) => {
        const { id, palette, error } = e.data;
        const entry = pending.get(id);
        if (!entry) return;
        pending.delete(id);
        if (error) {
            entry.reject(new Error(error));
        } else {
            const raw = palette as Array<{ color: [number, number, number]; population: number }>;
            const { nativeGamut, outputGamut } = entry;
            const totalPopulation = raw.reduce((sum: number, q: { population: number }) => sum + q.population, 0);
            const colors = raw.map(({ color, population }) => {
                const [r, g, b] =
                    nativeGamut === outputGamut ? color : p3ToSrgb(color[0], color[1], color[2]);
                return createColor(
                    r,
                    g,
                    b,
                    population,
                    totalPopulation > 0 ? population / totalPopulation : 0,
                    outputGamut,
                );
            });
            entry.resolve(colors);
        }
    };
    worker.onerror = (e) => {
        // Reject all pending
        for (const [, entry] of pending) {
            entry.reject(new Error(e.message));
        }
        pending.clear();
    };
    return worker;
}

/**
 * Run quantization in a Web Worker.
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
    return new Promise<Color[]>((resolve, reject) => {
        if (signal?.aborted) {
            reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
            return;
        }

        const id = nextId++;
        pending.set(id, { resolve, reject, nativeGamut, outputGamut });

        const onAbort = () => {
            pending.delete(id);
            reject(signal!.reason ?? new DOMException('Aborted', 'AbortError'));
        };

        signal?.addEventListener('abort', onAbort, { once: true });

        try {
            const w = getOrCreateWorker();
            w.postMessage({ id, pixels, maxColors });
        } catch (err) {
            pending.delete(id);
            signal?.removeEventListener('abort', onAbort);
            reject(err);
        }
    });
}

/** Terminate the worker and release the Blob URL. */
export function terminateWorker(): void {
    if (worker) {
        worker.terminate();
        worker = null;
    }
    if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        blobUrl = null;
    }
    // Reject any outstanding requests
    for (const [, entry] of pending) {
        entry.reject(new Error('Worker terminated'));
    }
    pending.clear();
}
