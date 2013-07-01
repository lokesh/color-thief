#Color Thief

A script for grabbing the color palette from an image. Uses Javascript and the canvas tag to make it happen.

[See a Demo](http://lokeshdhakar.com/projects/color-thief) | [Read more on my blog](http://lokeshdhakar.com/color-thief)

##How to use

###Get the dominant color from an image
```js
var colorThief = new ColorThief();
colorThief.getColor(sourceImage);
```

```js
getColor(sourceImage[, quality])
returns {r: num, g: num, b: num}
```

###Build a color palette from an image

In this example, we build an 8 color palette.

```js
var colorThief = new ColorThief();
colorThief.getPalette(sourceImage, 8);
```

```js
getPalette(sourceImage[, colorCount, quality])
returns [ [num, num, num], [num, num, num], ... ]
```

##Credits and license

###Author
by Lokesh Dhakar  
[lokeshdhakar.com](http://www.lokeshdhakar.com)  
[twitter.com/lokesh](http://twitter.com/lokesh)

###Thanks
* Nick Rabinowitz - For creating quantize.js.
* John Schulz - For clean up and optimization. @JFSIII
* Nathan Spady - For adding drag and drop support to the demo page.

###License
Licensed under the [Creative Commons Attribution 2.5 License](http://creativecommons.org/licenses/by/2.5/)

* Free for use in both personal and commercial projects.
* Attribution requires leaving author name, author homepage link, and the license info intact.