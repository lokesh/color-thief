# ROADMAP.md

Forward-looking work for Color Thief. Everything from the original v2 improvement plan and the v3 rewrite has shipped (see the git history and `CLAUDE.md` for the delivered feature set). What remains below is not yet built.

## Intentionally left out

Features we've deliberately decided not to build, so we don't keep revisiting them:

- **Transparency detection** (2026-07) — low demand, outside the core palette job, and easily done outside the library against the canvas alpha channel ([#213](https://github.com/lokesh/color-thief/issues/213)).

## Feature: region / area extraction

Let callers extract colors from a sub-rectangle of the image rather than the whole thing (crop a rect before extraction). This is the most-requested evergreen feature — issue #176, plus earlier attempts in closed PRs #44 and #90 — and it's self-contained: clip the source to the given bounds before the pixel array is built, leaving the rest of the pipeline untouched.

## Feature: Node wide-gamut (display-P3) output

Browser wide-gamut support shipped in the `gamut` option work ([#266](https://github.com/lokesh/color-thief/issues/266)): the browser loader reads through a P3 canvas, quantization runs in gamut-aware OKLCH, and `Color` objects carry `.gamut` with P3-faithful `.css()`/`.oklch()` while `.rgb()`/`.array()`/`.hex()` stay sRGB. Node still returns sRGB only.

What remains is P3 output on the Node path. `sharp` can already surface the embedded ICC tag via `metadata()`, so detection is easy; the work is driving its libvips color-transform pipeline to emit P3-encoded pixels (tagged `display-p3`) so `getColor`/`getPalette` reach parity with the browser. Possible later refinement: per-color rather than per-extraction gamut tagging, if a use case needs a mixed-gamut palette.

## Big bet: accessible scheme generation

Move Color Thief from a raw extractor toward a theming toolkit by generating a balanced, accessible N-role color scheme from an image — the space Material Color Utilities (HCT) targets. This is the largest differentiator and the direction the market is heading (dynamic/adaptive theming). We're already partway there: OKLCH quantization, semantic swatches, WCAG contrast, and `textColor` are all in place. The new work is scheme *synthesis* — deriving a harmonious, contrast-safe set of roles rather than just reporting the colors that are present. Hard; scope before committing.

### Progress — `feat/accessible-scheme` branch (2026-07)

A first working cut lives on the `feat/accessible-scheme` branch (not merged to `master` — parked for a future revisit). What's built so far:

- **`src/scheme.ts`** — self-contained scheme synthesizer built natively on OKLCH, with **no** dependency on Material Color Utilities / HCT. Core idea is a *tone ladder*: freeze a color's hue and chroma, slide only lightness (tone 0–100), and assign roles to rungs. Role→tone recipes are adapted from Material 3's baseline; the mechanism is our own.
- **Public API:** `getScheme(source, options)` (extract a seed from an image, then synthesize), `synthesizeScheme(seed, options)` (pure/sync from a known seed color), and `pickSeed(palette)` (most-dominant sufficiently-colorful entry, grayscale fallback). Wired into `src/index.ts` and `src/umd.ts`.
- **Roles:** 17 Material-style roles (primary / secondary / surface / error families + `outline`), each emitted for both `light` and `dark` modes. `Scheme.toCss(mode)` produces drop-in CSS custom properties.
- **Contrast guarantee:** every on-*/background pair is measured with real WCAG math and the foreground tone is nudged toward black/white until it provably passes (`AA` 4.5 / `AAA` 7.0 for text, 3:1 for the outline/surface UI pair) — the ladder is only the starting guess.
- **Options:** `contrast` (`AA`|`AAA`), `fidelity` (`faithful`|`balanced`|`expressive`, controlling secondary-hue rotation and chroma), and `gamut` (with in-gamut realization via chroma-reduction binary search).
- **Fixed error palette:** an accessible red (OKLCH hue ~29°), not drawn from the image.
- **`examples/scheme.html`** — demo page.

### Still open before this could ship

- **Tests** — no node/browser test coverage yet for the scheme module.
- **Tone recipes** are a direct Material 3 port; they haven't been validated against a spread of real images for harmony/legibility.
- **Tertiary role / expanded role set** and fixed/`*-fixed` variants not implemented.
- **Node parity** — `getScheme` rides on `getPalette`, so it works in Node, but the P3 output gap noted above still applies.
- **Docs / README** — feature is undocumented in the public docs.
- **Naming/API review** — decide whether we adopt Material's role vocabulary wholesale or define our own before locking the surface.

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
