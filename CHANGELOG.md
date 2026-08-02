# Changelog

All notable changes to Color Thief are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Dates are npm publish dates. Each heading links to the full GitHub release notes.

## [3.5.0] — 2026-08-02

### Added

- **Region extraction** ([#176](https://github.com/lokesh/color-thief/issues/176)) — sample colors from a sub-rectangle via `region: { x, y, width, height }` in normalized 0–1 coordinates, so the same values work on a thumbnail and the full-size original. Works with `getColor`, `getPalette`, `getSwatches`, `getPaletteProgressive`, the `*Sync` functions, `observe()`, and the CLI, in both browser and Node. Cropping is applied to the decoded pixel buffer before sampling, so custom loaders and quantizers supplied via `configure()` get it without changes.
- `--region x,y,width,height` flag on the CLI.

### Deprecated

- **The `worker` option is now a no-op** and logs a one-time warning. The `isWorkerSupported`, `extractInWorker`, and `terminateWorker` exports from `colorthief/internals` are no-op shims. All of it is removed in v4; nothing breaks in v3.

  Offloading cost more than it saved — only quantization ran off-thread, while decoding, pixel sampling, and the structured clone of the pixel array stayed on the main thread, and serializing `Array<[r, g, b]>` ran several times longer than the quantization it avoided (at 2 MP / quality 10, ~20 ms of cloning to skip ~2.5 ms of quantizing, widening with image size). It also carried a hand-inlined copy of MMCQ that quantized in RGB while the main path defaults to OKLCH and skipped the few-color short-circuit and filter relaxation, so `worker: true` returned different colors than the default.

  To move extraction off the main thread, run Color Thief inside your own worker with an `ImageBitmap` or `OffscreenCanvas` source — the whole pipeline goes off-thread and the bitmap transfers without copying. See [Web Workers](https://github.com/lokesh/color-thief#web-workers).

### Changed

- `worker: true` now returns the *same* palette as the default path instead of a different one.
- Removing the inlined quantizer shrank the bundles: `index.js` 55.6 kB → 46.2 kB, `internals.js` 45.0 kB → 39.4 kB, `umd/color-thief.global.js` 30.0 kB → 22.3 kB.

## [3.4.1] — 2026-08-02

### Fixed

- `WasmQuantizer` no longer falls back to importing `../../dist/wasm/color_thief_wasm.js`, a file never included in the published package. Bundlers resolving `colorthief/internals` reported it as unresolvable; builds worked (the dead code was tree-shaken) but printed a warning ([#283](https://github.com/lokesh/color-thief/issues/283)). The wasm-bindgen glue module is now supplied by the caller, and `init()` with no module throws a message pointing at the `wasm-pack` build step. Thanks [@magic-akari](https://github.com/magic-akari).

## [3.4.0] — 2026-07-01

### Added

- **Wide-gamut (Display P3) support** ([#266](https://github.com/lokesh/color-thief/issues/266)) — new `gamut` option accepting `'srgb'` (default), `'display-p3'`, or `'auto'`, which upgrades to P3 only when the image actually uses out-of-sRGB colors. Browser loaders read through a P3 canvas with feature detection and sRGB fallback, quantization is gamut-aware, and `Color` objects carry `.gamut` with `.css()` emitting `color(display-p3 …)`. `.rgb()`/`.array()`/`.hex()` stay sRGB so existing consumers keep working. Thanks [@LeaVerou](https://github.com/LeaVerou).
- Performance and accuracy improvements for images with few distinct colors ([#281](https://github.com/lokesh/color-thief/pull/281)). Thanks [@ksubileau](https://github.com/ksubileau). *(Tagged as `v3.3.2` on GitHub but never published to npm; it reached users in this release.)*

### Notes

- Node output remains sRGB; P3 there is tracked as a follow-up in the [roadmap](https://github.com/lokesh/color-thief/blob/master/ROADMAP.md).

## [3.3.1] — 2026-03-06

### Fixed

- Add a `colorthief/cli` export (`./cli`) for programmatic access to the CLI entry.
- Normalize the `bin` path and repository URL via `npm pkg fix` for a clean publish.
- Update README CLI references to `colorthief-cli`.

## [3.3.0] — 2026-03-04

### Added

- **CLI** with `color`, `palette`, and `swatches` subcommands. Supports `--json`, `--css`, and ANSI output formats, stdin piping, multi-file input, and a friendly error when `sharp` is not installed.

## [3.2.0] — 2026-03-04

### Fixed

- **Browser bundlers no longer warn about `sharp`** ([#279](https://github.com/lokesh/color-thief/issues/279)) — webpack (Angular), Vite, and Rollup previously emitted "Can't resolve 'sharp'" in browser-only projects. The library now ships separate browser builds with no references to `sharp` or Node-specific code, selected automatically via the `browser` condition in `package.json` exports. No changes needed; the API is identical.

## [3.1.0] — 2026-03-04

### Changed

- Palette functions default to **OKLCH** quantization (previously RGB).

## [3.0.0] — 2026-03-02

Full TypeScript rewrite with a unified browser + Node.js API.

### Added

- Rich `Color` objects with `.hex()`, `.rgb()`, `.hsl()`, `.oklch()`, `.css()`.
- OKLCH perceptually uniform quantization.
- Semantic swatches: Vibrant, Muted, DarkVibrant, DarkMuted, LightVibrant, LightMuted.
- Live extraction with `observe()` for video, canvas, and img elements.
- Web Worker offloading. *(Deprecated in 3.5.0 — see above.)*
- Progressive 3-pass extraction.
- WCAG contrast ratios and text color recommendations.
- `AbortSignal` support.
- Zero runtime dependencies.

## [2.7.0] — 2026-02-28

### Added

- **Configurable pixel filtering** — `ignoreWhite`, `whiteThreshold`, `alphaThreshold`, and `minSaturation` control which pixels are included.
- **Options object API** — `getColor` and `getPalette` accept an options object alongside the existing positional arguments.
- **New browser input types** — `HTMLCanvasElement`, `ImageData`, and `ImageBitmap` in addition to `HTMLImageElement`.
- **TypeScript definitions** for both browser and Node entry points.

### Fixed

- `computeFallbackColor()` averages all pixels when the quantizer can't produce a palette (solid-color or all-white images), preventing `null` returns.

## [2.6.0] — 2024-10-09

### Changed

- Switch `get-pixels` for `ndarray-pixels` ([#263](https://github.com/lokesh/color-thief/pull/263)). Original PR by [@briandonahue](https://github.com/briandonahue).
- Refactor `color-thief-node.js` ([#209](https://github.com/lokesh/color-thief/pull/209)). Thanks [@VoltrexKeyva](https://github.com/VoltrexKeyva).
- Pass mimetype when input is a Buffer ([#236](https://github.com/lokesh/color-thief/pull/236)); upgrade `quantize` to 1.4.0 ([#262](https://github.com/lokesh/color-thief/pull/262)); remove unused `node-minify` deps ([#235](https://github.com/lokesh/color-thief/pull/235)). *(Tagged as `v2.5.0` on GitHub but never published to npm; these reached users in this release.)*

## [2.4.0] — 2023-02-28

### Fixed

- Resolve `quantize` dependency issue; upgrade Cypress ([#233](https://github.com/lokesh/color-thief/pull/233)).

## [2.3.2] — 2020-07-06

### Fixed

- Use image `naturalWidth`/`naturalHeight` ([#182](https://github.com/lokesh/color-thief/issues/182)). Thanks [@wangcheng](https://github.com/wangcheng).

## Earlier releases

Releases before 2.3.2 (back to 1.0 in 2012) predate this changelog. See the [GitHub releases](https://github.com/lokesh/color-thief/releases) and the [commit history](https://github.com/lokesh/color-thief/commits/master) for details.

[3.5.0]: https://github.com/lokesh/color-thief/releases/tag/v3.5.0
[3.4.1]: https://github.com/lokesh/color-thief/releases/tag/v3.4.1
[3.4.0]: https://github.com/lokesh/color-thief/releases/tag/v3.4.0
[3.3.1]: https://github.com/lokesh/color-thief/releases/tag/v3.3.1
[3.3.0]: https://github.com/lokesh/color-thief/releases/tag/v3.3.0
[3.2.0]: https://github.com/lokesh/color-thief/releases/tag/v3.2.0
[3.1.0]: https://github.com/lokesh/color-thief/releases/tag/v3.1.0
[3.0.0]: https://github.com/lokesh/color-thief/releases/tag/v3.0.0
[2.7.0]: https://github.com/lokesh/color-thief/releases/tag/v2.7.0
[2.6.0]: https://github.com/lokesh/color-thief/releases/tag/v2.6.0
[2.4.0]: https://github.com/lokesh/color-thief/releases/tag/v2.4.0
[2.3.2]: https://github.com/lokesh/color-thief/releases/tag/v2.3.2
