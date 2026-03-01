# Color Thief

> Extract dominant colors and palettes from images in the browser and Node.js.

[![npm version](https://img.shields.io/npm/v/colorthief)](https://www.npmjs.com/package/colorthief)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/colorthief)](https://bundlephobia.com/package/colorthief)
[![types](https://img.shields.io/npm/types/colorthief)](https://www.npmjs.com/package/colorthief)

## Install

```bash
npm install colorthief
```

Or load directly from a CDN:

```html
<script src="https://unpkg.com/colorthief@3/dist/umd/color-thief.global.js"></script>
```

## Quick Start

```js
import { getColorSync, getPaletteSync, getSwatches } from 'colorthief';

// Dominant color
const color = getColorSync(img);
color.hex();      // '#e84393'
color.css();      // 'rgb(232, 67, 147)'
color.isDark;     // false
color.textColor;  // '#000000'

// Palette
const palette = getPaletteSync(img, { colorCount: 6 });
palette.forEach(c => console.log(c.hex()));

// Semantic swatches (Vibrant, Muted, DarkVibrant, etc.)
const swatches = await getSwatches(img);
swatches.Vibrant?.color.hex();
```

## Features

- **TypeScript** — full type definitions included
- **Browser + Node.js** — same API, both platforms
- **Sync & async** — synchronous browser API, async for Node.js and Web Workers
- **Live extraction** — `observe()` watches video, canvas, or img elements and emits palette updates reactively
- **Web Workers** — offload quantization off the main thread with `worker: true`
- **Progressive extraction** — 3-pass refinement for instant rough results
- **OKLCH quantization** — perceptually uniform palettes via `colorSpace: 'oklch'`
- **Semantic swatches** — Vibrant, Muted, DarkVibrant, DarkMuted, LightVibrant, LightMuted
- **Rich Color objects** — `.hex()`, `.rgb()`, `.hsl()`, `.oklch()`, `.css()`, contrast ratios, text color recommendations
- **WCAG contrast** — `color.contrast.white`, `color.contrast.black`, `color.contrast.foreground`
- **AbortSignal** — cancel in-flight extractions
- **Zero runtime dependencies**

## API at a Glance

| Function | Description |
|---|---|
| `getColorSync(source, options?)` | Dominant color (sync, browser only) |
| `getPaletteSync(source, options?)` | Color palette (sync, browser only) |
| `getSwatchesSync(source, options?)` | Semantic swatches (sync, browser only) |
| `getColor(source, options?)` | Dominant color (async, browser + Node.js) |
| `getPalette(source, options?)` | Color palette (async, browser + Node.js) |
| `getSwatches(source, options?)` | Semantic swatches (async, browser + Node.js) |
| `getPaletteProgressive(source, options?)` | 3-pass progressive palette (async generator) |
| `observe(source, options)` | Watch a source and emit palette updates (browser only) |
| `createColor(r, g, b, population)` | Build a Color object from RGB values |

### Options

| Option | Default | Description |
|---|---|---|
| `colorCount` | `10` | Number of palette colors (2–20) |
| `quality` | `10` | Sampling rate (1 = every pixel, 10 = every 10th) |
| `colorSpace` | `'rgb'` | Quantization space: `'rgb'` or `'oklch'` |
| `worker` | `false` | Offload to Web Worker (browser only) |
| `signal` | — | `AbortSignal` to cancel extraction |
| `ignoreWhite` | `true` | Skip white pixels |

### Color Object

| Property / Method | Returns |
|---|---|
| `.rgb()` | `{ r, g, b }` |
| `.hex()` | `'#ff8000'` |
| `.hsl()` | `{ h, s, l }` |
| `.oklch()` | `{ l, c, h }` |
| `.css(format?)` | `'rgb(255, 128, 0)'`, `'hsl(…)'`, or `'oklch(…)'` |
| `.array()` | `[r, g, b]` |
| `.toString()` | Hex string (works in template literals) |
| `.textColor` | `'#ffffff'` or `'#000000'` |
| `.isDark` / `.isLight` | Boolean |
| `.contrast` | `{ white, black, foreground }` — WCAG ratios |
| `.population` | Raw pixel count |
| `.proportion` | 0–1 share of total |

## Browser

```js
import { getColorSync, getPaletteSync } from 'colorthief';

const img = document.querySelector('img');
const color = getColorSync(img);
console.log(color.hex());

const palette = getPaletteSync(img, { colorCount: 5 });
```

Accepts `HTMLImageElement`, `HTMLCanvasElement`, `HTMLVideoElement`, `ImageData`, `ImageBitmap`, and `OffscreenCanvas`.

### Live extraction with observe()

```js
import { observe } from 'colorthief';

// Watch a video and update ambient lighting as it plays
const controller = observe(videoElement, {
    throttle: 200,    // ms between updates
    colorCount: 5,
    onChange(palette) {
        updateAmbientBackground(palette);
    },
});

// Stop when done
controller.stop();
```

Works with `<video>`, `<canvas>`, and `<img>` elements. For images, it uses a MutationObserver to detect `src` changes. For video and canvas, it polls using requestAnimationFrame with throttle.

## Node.js

```js
import { getColor, getPalette } from 'colorthief';

const color = await getColor('/path/to/image.jpg');
console.log(color.hex());

const palette = await getPalette(Buffer.from(data), { colorCount: 5 });
```

Accepts file paths and Buffers. Uses [sharp](https://sharp.pixelplumbing.com/) for image decoding.

## Links

- [Demo page & live examples](https://lokeshdhakar.com/projects/color-thief/)
- [GitHub](https://github.com/lokesh/color-thief)
- [npm](https://www.npmjs.com/package/colorthief)

## Contributing

```bash
npm run build          # Build all dist formats
npm run test           # Run all tests (Mocha + Cypress)
npm run test:node      # Node tests only
npm run test:browser   # Browser tests (requires npm run dev)
npm run dev            # Start local server on port 8080
```

## License

[MIT](LICENSE) - Lokesh Dhakar
