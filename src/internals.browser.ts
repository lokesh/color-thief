// ---------------------------------------------------------------------------
// colorthief/internals (browser build)
//
// Same as internals.ts but without Node-specific exports (NodePixelLoader,
// createNodeLoader, NodeImageDecoder) so browser bundlers never see sharp.
// ---------------------------------------------------------------------------

// Quantizers
export { MmcqQuantizer } from './quantizers/mmcq.js';
export { WasmQuantizer } from './quantizers/wasm.js';

// Loaders
export { BrowserPixelLoader } from './loaders/browser.js';

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

// Worker manager — deprecated no-op shims, removed in v4. See worker/manager.ts.
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

// Region cropping
export {
    validateRegion,
    regionToPixelRect,
    cropPixelData,
} from './region.js';
export type { PixelRect } from './region.js';

// Types not needed by most consumers
export type {
    PixelBuffer,
    PixelData,
    PixelLoader,
    Quantizer,
} from './types.js';
