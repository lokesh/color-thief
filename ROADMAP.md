# ROADMAP.md

Forward-looking work for Color Thief. Everything from the original v2 improvement plan and the v3 rewrite has shipped (see the git history and `CLAUDE.md` for the delivered feature set). What remains below is not yet fully productized.

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
