import type { Quantizer } from '../types.js';
import quantize from '@lokesh.dhakar/quantize';

type QuantizeFn = (
    pixels: Array<[number, number, number]>,
    maxColors: number,
) => { palette: () => Array<[number, number, number]> } | null;

const _quantize = quantize as unknown as QuantizeFn;

/**
 * MMCQ (Modified Median Cut Quantization) adapter.
 * Wraps @lokesh.dhakar/quantize behind the Quantizer interface.
 */
export class MmcqQuantizer implements Quantizer {
    async init(): Promise<void> {
        // No-op — quantize is statically imported and ready to use.
    }

    quantize(
        pixels: Array<[number, number, number]>,
        maxColors: number,
    ): Array<{ color: [number, number, number]; population: number }> {
        const cmap = _quantize(pixels, maxColors);
        if (!cmap) return [];
        const palette = cmap.palette();
        return palette.map((color) => ({ color, population: 1 }));
    }
}
