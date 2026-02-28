// ---------------------------------------------------------------------------
// colorthief/internals
//
// Power-user exports: loaders, quantizers, color-space math, worker manager.
// Most consumers should use the main 'colorthief' entry point instead.
// ---------------------------------------------------------------------------

// Quantizers
export { MmcqQuantizer } from './quantizers/mmcq.js';
export { WasmQuantizer } from './quantizers/wasm.js';

// Loaders
export { BrowserPixelLoader } from './loaders/browser.js';
export { NodePixelLoader, createNodeLoader } from './loaders/node.js';
export type { NodeImageDecoder } from './loaders/node.js';

// Swatches (standalone classifier)
export { classifySwatches } from './swatches.js';

// Color space conversions
export {
    rgbToOklch,
    oklchToRgb,
    srgbToLinear,
    linearToSrgb,
    pixelsRgbToOklchScaled,
    paletteOklchScaledToRgb,
} from './color-space.js';

// Worker manager
export {
    isWorkerSupported,
    extractInWorker,
    terminateWorker,
} from './worker/manager.js';

// Low-level pipeline
export {
    validateOptions,
    createPixelArray,
    computeFallbackColor,
    extractPalette,
} from './pipeline.js';

// Types not needed by most consumers
export type {
    PixelBuffer,
    PixelData,
    PixelLoader,
    Quantizer,
} from './types.js';
