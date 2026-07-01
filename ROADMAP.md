# ROADMAP.md

Forward-looking work for Color Thief. Everything from the original v2 improvement plan and the v3 rewrite has shipped (see the git history and `CLAUDE.md` for the delivered feature set). What remains below is not yet built.

## Intentionally left out

Features we've deliberately decided not to build, so we don't keep revisiting them:

- **Transparency detection** (2026-07) — low demand, outside the core palette job, and easily done outside the library against the canvas alpha channel ([#213](https://github.com/lokesh/color-thief/issues/213)).

## Feature: region / area extraction

Let callers extract colors from a sub-rectangle of the image rather than the whole thing (crop a rect before extraction). This is the most-requested evergreen feature — issue #176, plus earlier attempts in closed PRs #44 and #90 — and it's self-contained: clip the source to the given bounds before the pixel array is built, leaving the rest of the pipeline untouched.

## Fix: wide-gamut / display-P3 handling

Extraction of wide-gamut (display-P3) images can produce out-of-range output like `rgb(256, 4, 4)` — a real correctness bug (issue #266) that grows more relevant as P3 content becomes common. Approach: detect tagged wide-gamut images and/or expose a `colorSpace` passthrough to the canvas 2D context so pixels are read in a defined space, then clamp/convert results back to valid sRGB. Medium-to-hard; also future-proofs the pipeline.

## Big bet: accessible scheme generation

Move Color Thief from a raw extractor toward a theming toolkit by generating a balanced, accessible N-role color scheme from an image — the space Material Color Utilities (HCT) targets. This is the largest differentiator and the direction the market is heading (dynamic/adaptive theming). We're already partway there: OKLCH quantization, semantic swatches, WCAG contrast, and `textColor` are all in place. The new work is scheme *synthesis* — deriving a harmonious, contrast-safe set of roles rather than just reporting the colors that are present. Hard; scope before committing.

## Productize the WASM quantizer

A Rust implementation of the full MMCQ algorithm lives in `src/wasm/`, and the `WasmQuantizer` TypeScript adapter (`src/quantizers/wasm.ts`) is in place. What's missing is a plug-and-play distribution: today the module is **source only** and must be compiled by hand.

**Current state (power-user only):**
1. Install the Rust toolchain and `wasm-pack`.
2. Run `wasm-pack build --target web` in `src/wasm/`.
3. Point `WasmQuantizer` at the generated `.wasm` file.

**Goal — drop-in replacement, no build step:**
- Pre-compile the `.wasm` and ship it as a published artifact (e.g. a `@colorthief/wasm` package, or a bundled binary loaded on demand) so consumers get it without a Rust toolchain.
- Keep the main `colorthief` package pure JS with zero native dependencies — WASM stays opt-in via `configure({ quantizer })` or per-call `{ quantizer }`.
- Same `Quantizer` contract as the default MMCQ, so it's a true drop-in.
- Target the ~2–5x (up to ~6x on large palettes) speedup for the compute-heavy pixel-clustering step.

**What's already built (for reference):**
- 5-bit quantized 3D color histogram (32,768 bins)
- VBox data structure with count/volume tracking
- Median-cut splitting along the widest dimension
- Two-phase iteration (75% by population, remainder by population × volume)
- Adapter that flattens pixels to `Uint8Array`, calls into WASM, and parses the 7-byte-per-color result (3 bytes RGB + 4 bytes little-endian population)
