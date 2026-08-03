# ROADMAP.md

Forward-looking work for Color Thief. Everything from the original v2 improvement plan and the v3 rewrite has shipped (see the git history and `CLAUDE.md` for the delivered feature set). What remains below is not yet built.

## Intentionally left out

Features we've deliberately decided not to build, so we don't keep revisiting them:

- **Transparency detection** (2026-07) — low demand, outside the core palette job, and easily done outside the library against the canvas alpha channel ([#213](https://github.com/lokesh/color-thief/issues/213)).

## Feature: Node wide-gamut (display-P3) output

Browser wide-gamut support shipped in the `gamut` option work ([#266](https://github.com/lokesh/color-thief/issues/266)): the browser loader reads through a P3 canvas, quantization runs in gamut-aware OKLCH, and `Color` objects carry `.gamut` with P3-faithful `.css()`/`.oklch()` while `.rgb()`/`.array()`/`.hex()` stay sRGB. Node still returns sRGB only.

What remains is P3 output on the Node path. `sharp` can already surface the embedded ICC tag via `metadata()`, so detection is easy; the work is driving its libvips color-transform pipeline to emit P3-encoded pixels (tagged `display-p3`) so `getColor`/`getPalette` reach parity with the browser. Possible later refinement: per-color rather than per-extraction gamut tagging, if a use case needs a mixed-gamut palette.

## Optimization: loader-level region cropping

Region extraction ([#176](https://github.com/lokesh/color-thief/issues/176)) crops the decoded pixel buffer right after loading, so every loader, quantizer, and progressive path works unchanged — including custom loaders supplied via `configure()`. Cropping earlier, inside the loaders (a `drawImage` source rect in the browser, `sharp.extract()` in Node), would skip decoding the parts of the image that get thrown away. Worth measuring first: it forks the crop logic across two loaders, and a custom loader can't be trusted to honor a region, so the central crop has to stay as the fallback either way.

## v4 breaking change: delete the Web Worker shims

The `worker` option became a no-op in v3.5 and the `isWorkerSupported` / `extractInWorker` / `terminateWorker` exports in `colorthief/internals` became deprecated shims. All of it comes out in v4.

Why it went: the worker only ever offloaded quantization, while decode, pixel sampling, and the structured clone of the pixel array stayed on the main thread — and serializing `Array<[r, g, b]>` cost several times more than the quantization it saved (at 2 MP / quality 10, ~20 ms of clone to avoid ~2.5 ms of quantize; the gap widens with image size). It also carried a hand-inlined copy of MMCQ that drifted from the real one: it quantized in RGB while the main path defaults to OKLCH, and skipped the few-color short-circuit and filter relaxation, so `worker: true` returned different colors than the default. The supported answer is to run Color Thief inside your own worker with an `ImageBitmap` source, which moves the whole pipeline off-thread and transfers pixels without copying.

## v4 breaking change: raise the `sharp` and Node floors

`peerDependencies` currently accepts `sharp: ">=0.33.0"`, but every sharp below 0.35.0 inherits four libvips CVEs ([GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj): CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591). Anyone auditing a project that installs Color Thief's Node path can satisfy our range with a vulnerable sharp.

The fix is `sharp: ">=0.35.0"`, and it can't ship in a 3.x minor: sharp 0.35 requires `node >=20.9.0`, so raising the sharp floor drops Node 18. That's a breaking change twice over — for anyone pinned to sharp 0.34 and for anyone still on Node 18.

Bundled into v4:
- `peerDependencies.sharp` → `">=0.35.0"`.
- Add the `engines` field the package has never declared: `node >=20.9.0`. Today npm gives consumers no signal at all about supported Node.
- Move the CI matrix off 18 (EOL April 2025) to 20/22/24, and update `.nvmrc`.
- Bump the `sharp` devDependency in lockstep so CI stops testing against the vulnerable line.

Until then 3.x keeps the wider range: sharp is an *optional* peer, browser users never install it, and Node users can and should choose 0.35+ themselves.

## Big bet: accessible scheme generation

Move Color Thief from a raw extractor toward a theming toolkit by generating a balanced, accessible N-role color scheme from an image — the space Material Color Utilities (HCT) targets. This is the largest differentiator and the direction the market is heading (dynamic/adaptive theming). We're already partway there: OKLCH quantization, semantic swatches, WCAG contrast, and `textColor` are all in place. The new work is scheme *synthesis* — deriving a harmonious, contrast-safe set of roles rather than just reporting the colors that are present. Hard; scope before committing.

## Productize the WASM quantizer

A Rust implementation of the full MMCQ algorithm lives in `src/wasm/`, and the `WasmQuantizer` TypeScript adapter (`src/quantizers/wasm.ts`) is in place. What's missing is a plug-and-play distribution: today the module is **source only** and must be compiled by hand.

**Current state (power-user only):**
1. Install the Rust toolchain and `wasm-pack`.
2. Run `wasm-pack build --target web` in `src/wasm/`.
3. Pass the generated glue module to `WasmQuantizer` — `new WasmQuantizer(await import('./pkg/color_thief_wasm.js'))`.

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
