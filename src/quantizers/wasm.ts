import type { Quantizer } from '../types.js';

/**
 * WASM-based MMCQ quantizer. Loads the WASM module built from Rust.
 *
 * Build the WASM module first:
 *   cd src/wasm && wasm-pack build --target web --out-dir ../../dist/wasm
 *
 * Usage:
 * ```ts
 * import { configure, WasmQuantizer } from 'colorthief';
 * const q = new WasmQuantizer();
 * await q.init();
 * configure({ quantizer: q });
 * ```
 */
export class WasmQuantizer implements Quantizer {
    private wasmQuantize: ((pixels: Uint8Array, maxColors: number) => Uint8Array) | null = null;
    private wasmUrl: string | URL | undefined;

    /**
     * @param wasmUrl - Optional URL to the .wasm file. If not provided,
     *                  attempts to load from the default dist location.
     */
    constructor(wasmUrl?: string | URL) {
        this.wasmUrl = wasmUrl;
    }

    async init(): Promise<void> {
        if (this.wasmQuantize) return;

        // Try to dynamically import the wasm-bindgen generated JS glue
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let wasm: any;
            if (this.wasmUrl) {
                // For environments where the wasm file needs explicit loading
                const response = await fetch(this.wasmUrl);
                const bytes = await response.arrayBuffer();
                const module = await WebAssembly.compile(bytes);
                const instance = await WebAssembly.instantiate(module);
                wasm = instance.exports;
            } else {
                // Default: try importing the wasm-pack output
                wasm = await import('../../dist/wasm/color_thief_wasm.js' as string);
                if (wasm.default && typeof wasm.default === 'function') {
                    await wasm.default();
                }
            }
            this.wasmQuantize = wasm.quantize;
        } catch (e) {
            throw new Error(
                `Failed to initialize WASM quantizer: ${e instanceof Error ? e.message : String(e)}`,
            );
        }
    }

    quantize(
        pixels: Array<[number, number, number]>,
        maxColors: number,
    ): Array<{ color: [number, number, number]; population: number }> {
        if (!this.wasmQuantize) {
            throw new Error('WasmQuantizer.init() must be called before quantize()');
        }

        // Flatten pixels into a flat Uint8Array [r,g,b,r,g,b,...]
        const flat = new Uint8Array(pixels.length * 3);
        for (let i = 0; i < pixels.length; i++) {
            flat[i * 3] = pixels[i][0];
            flat[i * 3 + 1] = pixels[i][1];
            flat[i * 3 + 2] = pixels[i][2];
        }

        const resultBytes = this.wasmQuantize(flat, maxColors);

        // Parse result: 7 bytes per color (r, g, b, pop_le[4])
        const results: Array<{ color: [number, number, number]; population: number }> = [];
        const view = new DataView(resultBytes.buffer, resultBytes.byteOffset, resultBytes.byteLength);

        for (let offset = 0; offset + 6 < resultBytes.length; offset += 7) {
            const r = resultBytes[offset];
            const g = resultBytes[offset + 1];
            const b = resultBytes[offset + 2];
            const population = view.getUint32(offset + 3, true); // little-endian
            results.push({ color: [r, g, b], population });
        }

        return results;
    }
}
