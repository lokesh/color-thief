#Color Thief

A script for grabbing the dominant color or color palette from an image. Uses javascript and canvas.

[See a Demo](http://lokeshdhakar.com/projects/color-thief) | [Read more on my blog](http://lokeshdhakar.com/color-thief)

##Usage

###Get Dominant Color
```js
getDominantColor(sourceImage)
```
  
```js
returns [num, num, num]
```

Uses the median cut algorithm provided by quantize.js to cluster similar
colors and return the base color from the largest cluster.

###Create Palette
```js
createPalette(sourceImage, colorCount)
```

```js
returns [ [num, num, num], [num, num, num], ... ]
```

Use the median cut algorithm provided by quantize.js to cluster similar
colors.

##License
by Lokesh Dhakar | [lokeshdhakar.com](http://www.lokeshdhakar.com)  | [twitter.com/lokeshdhakar](http://twitter.com/lokeshdhakar)  

Thanks to [jfsiii](https://github.com/jfsiii) for a large number of code improvements and others for submitting issues and fixes.

Licensed under the [Creative Commons Attribution 2.5 License](http://creativecommons.org/licenses/by/2.5/)

* Free for use in both personal and commercial projects.
* Attribution requires leaving author name, author homepage link, and the license info intact.