/**
 * Self-contained worker script that receives pixel data, runs quantization,
 * and returns the serialized palette.
 *
 * Message protocol:
 *   Request:  { id: number, pixels: number[][], maxColors: number }
 *   Response: { id: number, palette: Array<{ color: [r,g,b], population: number }> }
 *   Error:    { id: number, error: string }
 */

// This entire function body is stringified and turned into a Blob URL
// by the worker manager. It must be fully self-contained.
export const WORKER_SOURCE = /* js */ `
'use strict';

let quantizeFn = null;

async function ensureQuantize() {
    if (quantizeFn) return;
    // The quantize module is bundled inline or imported via importScripts
    // For safety, we'll receive it as a data payload from the main thread
}

self.onmessage = function (e) {
    const { id, pixels, maxColors, quantizeSource } = e.data;

    try {
        // Inline a simple median-cut stub isn't practical here.
        // Instead we receive the quantize function source or use the bundled one.
        if (!quantizeFn && quantizeSource) {
            // Create a function from the source
            const blob = new Blob([quantizeSource], { type: 'application/javascript' });
            importScripts(URL.createObjectURL(blob));
            quantizeFn = self.quantize || null;
        }

        if (!quantizeFn) {
            self.postMessage({ id, error: 'Quantize function not available in worker' });
            return;
        }

        const cmap = quantizeFn(pixels, maxColors);
        const palette = cmap ? cmap.palette().map(function(c) {
            return { color: c, population: 1 };
        }) : [];

        self.postMessage({ id, palette });
    } catch (err) {
        self.postMessage({ id, error: err.message || 'Unknown worker error' });
    }
};
`;
