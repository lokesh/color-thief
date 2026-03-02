/**
 * UMD entry point — exposes ColorThief as a global with function-based API.
 *
 * Usage in a <script> tag:
 *   const color = ColorThief.getColorSync(imgElement);
 *   // or async:
 *   const color = await ColorThief.getColor(imgElement);
 *
 * This entry point imports directly from source modules to avoid pulling
 * in Node.js-only code (sharp, loaders/node) that would fail in IIFE builds.
 */
export {
    getColor,
    getPalette,
    getSwatches,
    getPaletteProgressive,
    configure,
} from './api.js';

export {
    getColorSync,
    getPaletteSync,
    getSwatchesSync,
} from './sync.js';

export { observe } from './observe.js';

export { createColor } from './color.js';
