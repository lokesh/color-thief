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
    SwatchRole,
    Swatch,
    SwatchMap,
    BrowserSource,
    NodeSource,
    ImageSource,
    ProgressiveResult,
} from './types.js';

export type { SyncExtractionOptions } from './sync.js';
