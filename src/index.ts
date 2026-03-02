// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export {
    getColor,
    getPalette,
    getSwatches,
    getPaletteProgressive,
    configure,
} from './api.js';

// ---------------------------------------------------------------------------
// Sync browser API
// ---------------------------------------------------------------------------
export {
    getColorSync,
    getPaletteSync,
    getSwatchesSync,
} from './sync.js';

// ---------------------------------------------------------------------------
// Live extraction (browser only)
// ---------------------------------------------------------------------------
export { observe } from './observe.js';
export type { ObservableSource, ObserveOptions, ObserveController } from './observe.js';

// ---------------------------------------------------------------------------
// Color factory
// ---------------------------------------------------------------------------
export { createColor } from './color.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type {
    RGB,
    HSL,
    OKLCH,
    FilterOptions,
    ColorSpace,
    ExtractionOptions,
    ContrastInfo,
    Color,
    CssColorFormat,
    SwatchRole,
    Swatch,
    SwatchMap,
    BrowserSource,
    NodeSource,
    ImageSource,
    ProgressiveResult,
} from './types.js';

export type { SyncExtractionOptions } from './sync.js';
