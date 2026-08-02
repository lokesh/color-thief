import type { Quantizer } from '../types.js';

/**
 * The wasm-bindgen glue module produced by `wasm-pack build --target web`.
 * `default` is the init function that instantiates the `.wasm` binary.
 */
export interface WasmModule {
    default?: (init?: { module_or_path: string | URL }) => Promise<unknown>;
    quantize: (pixels: Uint8Array, maxColors: number) => Uint8Array;
}

/**
 * WASM-based MMCQ quantizer.
 *
 * The WASM binary is **not** shipped with the npm package — the Rust source
 * lives in `src/wasm/` and must be compiled, then handed to this class:
 *
 * ```sh
 * npx wasm-pack build src/wasm --target web
 * ```
 *
 * ```ts
 * import { configure } from 'colorthief';
 * import { WasmQuantizer } from 'colorthief/internals';
 * import * as wasm from './path/to/src/wasm/pkg/color_thief_wasm.js';
 *
 * const q = new WasmQuantizer(wasm);
 * await q.init();
 * configure({ quantizer: q });
 * ```
 */
export class WasmQuantizer implements Quantizer {
    private wasmQuantize: ((pixels: Uint8Array, maxColors: number) => Uint8Array) | null = null;
    private module: WasmModule | undefined;
    private wasmUrl: string | URL | undefined;

    /**
     * @param module - The wasm-bindgen glue module (see class docs). Required
     *                 before `init()` can succeed.
     * @param wasmUrl - Optional explicit location of the `.wasm` binary,
     *                  forwarded to the module's init function. Useful when the
     *                  binary is served from a path the glue can't infer.
     */
    constructor(module?: WasmModule, wasmUrl?: string | URL) {
        this.module = module;
        this.wasmUrl = wasmUrl;
    }

    async init(): Promise<void> {
        if (this.wasmQuantize) return;

        if (!this.module) {
            throw new Error(
                'WasmQuantizer requires the wasm-bindgen module built from src/wasm. ' +
                'Build it with `npx wasm-pack build src/wasm --target web`, then pass the ' +
                'generated glue module: `new WasmQuantizer(await import("./pkg/color_thief_wasm.js"))`.',
            );
        }

        try {
            if (typeof this.module.default === 'function') {
                await this.module.default(
                    this.wasmUrl ? { module_or_path: this.wasmUrl } : undefined,
                );
            }
            if (typeof this.module.quantize !== 'function') {
                throw new Error('module does not export a `quantize` function');
            }
            this.wasmQuantize = this.module.quantize;
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
