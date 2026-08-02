import type {
    Color,
    ExtractionOptions,
    ImageSource,
    PixelData,
    PixelLoader,
    ProgressiveResult,
    Quantizer,
    Region,
    SwatchMap,
} from './types.js';
import { validateOptions, extractPalette } from './pipeline.js';
import { cropPixelData } from './region.js';
import { extractProgressive } from './progressive.js';
import { classifySwatches } from './swatches.js';
import { MmcqQuantizer } from './quantizers/mmcq.js';
import { resolveDefaultLoader } from './resolve-loader.js';
import { deprecate } from './deprecate.js';

// ---------------------------------------------------------------------------
// Global configuration
// ---------------------------------------------------------------------------

let globalLoader: PixelLoader<ImageSource> | null = null;
let globalQuantizer: Quantizer | null = null;

/**
 * Override the default pixel loader and/or quantizer.
 *
 * ```ts
 * import { configure } from 'colorthief';
 * import { WasmQuantizer } from 'colorthief/internals';
 * import * as wasm from './src/wasm/pkg/color_thief_wasm.js'; // built with wasm-pack
 * const q = new WasmQuantizer(wasm);
 * await q.init();
 * configure({ quantizer: q });
 * ```
 */
export function configure(opts: {
    loader?: PixelLoader<ImageSource>;
    quantizer?: Quantizer;
}): void {
    if (opts.loader) globalLoader = opts.loader;
    if (opts.quantizer) globalQuantizer = opts.quantizer;
}

// ---------------------------------------------------------------------------
// Lazy environment detection
// ---------------------------------------------------------------------------

async function getLoader(perCall?: PixelLoader<ImageSource>): Promise<PixelLoader<ImageSource>> {
    if (perCall) return perCall;
    if (globalLoader) return globalLoader;
    globalLoader = await resolveDefaultLoader();
    return globalLoader;
}

async function getQuantizer(perCall?: Quantizer): Promise<Quantizer> {
    if (perCall) {
        await perCall.init();
        return perCall;
    }
    if (globalQuantizer) return globalQuantizer;
    const q = new MmcqQuantizer();
    await q.init();
    globalQuantizer = q;
    return q;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function checkAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
        throw signal.reason ?? new DOMException('Aborted', 'AbortError');
    }
}

/**
 * `worker: true` is accepted but ignored. Offloading only ever moved
 * quantization off-thread while leaving decode, pixel sampling, and the
 * structured clone of the pixel array on it — and the clone cost several times
 * more than the quantization it saved. Ignoring the flag also means these calls
 * now go through the same OKLCH pipeline as everything else, so `worker: true`
 * and `worker: false` finally agree on the palette.
 */
function warnWorkerDeprecated(): void {
    deprecate(
        'the `worker` option is ignored as of v3 and will be removed in v4. ' +
            'Offloading cost more than it saved and returned different colors than the ' +
            'default path. To move work off the main thread, run Color Thief inside your ' +
            'own worker — see the README.',
    );
}

/**
 * Load pixels and, when a region is given, crop to it before anything else
 * touches the buffer — so every downstream path (progressive, custom
 * quantizers) sees only the requested sub-rectangle.
 */
async function loadPixels(
    source: ImageSource,
    options?: ExtractionOptions,
    region?: Region,
): Promise<PixelData> {
    checkAborted(options?.signal);
    const loader = await getLoader(options?.loader);
    const pixels = await loader.load(source, options?.signal, options?.gamut ?? 'srgb');
    return cropPixelData(pixels, region);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the single dominant color from an image.
 *
 * ```ts
 * const color = await getColor(imgElement);
 * console.log(color.hex()); // '#e84393'
 * ```
 */
export async function getColor(
    source: ImageSource,
    options?: ExtractionOptions,
): Promise<Color | null> {
    const palette = await getPalette(source, {
        colorCount: 5,
        ...options,
    });
    return palette ? palette[0] : null;
}

/**
 * Get a color palette from an image.
 *
 * ```ts
 * const palette = await getPalette(imgElement, { colorCount: 5 });
 * palette.forEach(c => console.log(c.hex()));
 * ```
 */
export async function getPalette(
    source: ImageSource,
    options?: ExtractionOptions,
): Promise<Color[] | null> {
    const opts = validateOptions(options ?? {});

    checkAborted(options?.signal);

    if (options?.worker) warnWorkerDeprecated();

    const [pixels, quantizer] = await Promise.all([
        loadPixels(source, options, opts.region),
        getQuantizer(options?.quantizer),
    ]);

    checkAborted(options?.signal);

    return extractPalette(
        pixels.data,
        pixels.width,
        pixels.height,
        opts,
        quantizer,
        pixels.colorSpace ?? 'srgb',
    );
}

/**
 * Get semantic swatches (Vibrant, Muted, etc.) from an image.
 *
 * ```ts
 * const swatches = await getSwatches(imgElement);
 * console.log(swatches.Vibrant?.color.hex());
 * ```
 */
export async function getSwatches(
    source: ImageSource,
    options?: ExtractionOptions,
): Promise<SwatchMap> {
    const palette = await getPalette(source, {
        colorCount: 16,
        ...options,
    });
    return classifySwatches(palette ?? []);
}

/**
 * Progressively extract a palette with increasing quality.
 * Yields intermediate results so the UI can update incrementally.
 *
 * ```ts
 * for await (const { palette, progress, done } of getPaletteProgressive(img)) {
 *   updateUI(palette, progress);
 * }
 * ```
 */
export async function* getPaletteProgressive(
    source: ImageSource,
    options?: ExtractionOptions,
): AsyncGenerator<ProgressiveResult> {
    const opts = validateOptions(options ?? {});

    if (options?.worker) warnWorkerDeprecated();

    const [pixels, quantizer] = await Promise.all([
        loadPixels(source, options, opts.region),
        getQuantizer(options?.quantizer),
    ]);

    yield* extractProgressive(
        pixels.data,
        pixels.width,
        pixels.height,
        opts,
        quantizer,
        options?.signal,
        pixels.colorSpace ?? 'srgb',
    );
}
