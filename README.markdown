# Color Thief
by Lokesh Dhakar - [Blog](http://lokeshdhakar.com) - [Twitter](http://twitter.com/lokeshdhakar)

A script for grabbing the dominant color or a representative color palette from an image. Uses javascript and canvas.

### [Demo](http://lokeshdhakar.com/projects/color-thief)

###Requirements
* jQuery
* quantize.js

###Usage

```js
getDominantColor(sourceImage)
returns {r: num, g: num, b: num}
```

Use the median cut algorithm provided by quantize.js to cluster similar
colors and return the base color from the largest cluster.

```js
createPalette(sourceImage, colorCount)
returns array[ {r: num, g: num, b: num}, {r: num, g: num, b: num}, ...]
```

Use the median cut algorithm provided by quantize.js to cluster similar
colors.

BUGGY: Function does not always return the requested amount of colors. It can be +/- 2.

Licensed under the [Creative Commons Attribution 2.5 License](http://creativecommons.org/licenses/by/2.5/)