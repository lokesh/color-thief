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
