
# Color Thief

A script for grabbing the color palette from an image. Works in browser and in Node.

[See a Demo](http://lokeshdhakar.com/projects/color-thief) | [Read more on my blog](http://lokeshdhakar.com/color-thief)


## How to use Color Thief in Node

### Install and import
_Important: The name of the package is `colorthief`, not `color-thief`._
```
npm i --save colorthief
```
```
const ColorThief = require('colorthief');
```

### Get colors
Both `getColor` and `getPalette` return a `Promise` when used in Node.

```
const img = resolve(process.cwd(), 'rainbow.png');

ColorThief.getColor(img)
    .then(color => { console.log(color) })
    .catch(err => { console.log(err) })

ColorThief.getPalette(img, 5)
    .then(palette => { console.log(palette) })
    .catch(err => { console.log(err) })
 ```

## How to use Color Thief in the Browser


### Install

_Important: The name of the package is `colorthief`, not `color-thief`._
```
npm i --save colorthief
```

### Import and use as a global variable

```
<script src="node_modules/colorthief/dist/color-thief.umd.js"></script>
<script>
    const colorThief = new ColorThief();
    const color = colorThief.getColor(document.querySelector('img'));
</script>
```

### Import and use as an ES6 module
_index.html_
```
<script type="module" src="app.js"></script>
```
_app.js_
```
import ColorThief from './node_modules/colorthief/dist/color-thief.mjs'

const colorThief = new ColorThief();
const result = colorThief.getColor(document.querySelector('img'));
```

### Import and use with RequireJS

The `/dist/color-thief.umd.js` file uses the UMD (Universal Module Definition) format. This includes RequireJS AMD support.

## API

_Note: Both `getColor` and `getPalette` return a `Promise` when used in Node._

| Method | Return | Description |
| --- | --- | --- |
| `getColor(image [, quality])` | `[Number, Number, Number]` | Gets the dominant color from the image. Color is returned as an array of three integers representing red, green, and blue values. |
| `getPalette(image [, colorCount, quality]` | `[[Number, Number, Number], ...]` | Gets a palette from the image by clustering similar colors. The palette is returned as an array containing colors, each color itself an array of three integers. |
