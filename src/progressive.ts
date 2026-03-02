import type {
    Color,
    PixelBuffer,
    ProgressiveResult,
    Quantizer,
} from './types.js';
import { extractPalette, type ValidatedOptions } from './pipeline.js';

/** Quality divisors for the 3 progressive passes. */
const PASSES = [
    { divisor: 16, progress: 0.06 },
    { divisor: 4, progress: 0.25 },
    { divisor: 1, progress: 1.0 },
];

/** Yield between passes so the UI can repaint. */
function yieldToMain(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Progressive palette extraction. Runs 3 passes with increasing quality
 * (16x skip → 4x skip → full quality), yielding intermediate results.
 */
export async function* extractProgressive(
    data: PixelBuffer,
    width: number,
    height: number,
    opts: ValidatedOptions,
    quantizer: Quantizer,
    signal?: AbortSignal,
): AsyncGenerator<ProgressiveResult> {
    for (let i = 0; i < PASSES.length; i++) {
        if (signal?.aborted) {
            throw signal.reason ?? new DOMException('Aborted', 'AbortError');
        }

        const pass = PASSES[i];
        const passOpts: ValidatedOptions = {
            ...opts,
            quality: opts.quality * pass.divisor,
        };

        const palette = extractPalette(data, width, height, passOpts, quantizer);
        const done = i === PASSES.length - 1;

        yield {
            palette: palette ?? [],
            progress: pass.progress,
            done,
        };

        if (!done) {
            await yieldToMain();
        }
    }
}
