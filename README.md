# Color Thief

A script for grabbing the color palette from an image. Uses Javascript and the canvas tag to make it happen.

[See a Demo](http://lokeshdhakar.com/projects/color-thief) | [Read more on my blog](http://lokeshdhakar.com/color-thief)

## How to use

### Import

- `/dist/color-thief.js`: CommonJS module for use in Node.
- `/dist/color-thief.mjs`: ES6 module for use in Browser. For modern browsers as well as Webpack and Rollup.
- `/dist/color-thief.umd.js`: UMD module for use in Browser. For simple script tag loading that exposes a global variable or for RequireJS AMD support. _color-thief.min.js_ is a duplicate of this file, kept around to maintain backwards compatibility.

### Get the dominant color from an image

```js
const colorThief = new ColorThief();
colorThief.getColor(sourceImage);
```

### Build a color palette from an image

In this example, we build an 8 color palette.

```js
const colorThief = new ColorThief();
colorThief.getPalette(sourceImage, 8);
```

### API


| Method | Return | Description |
| --- | --- | --- |
| `getColor(image [, quality])` | `[Number, Number, Number]` | WIP |
| `getPalette(image [, colorCount, quality]` | `[[Number, Number, Number], ...]` | WIP |
