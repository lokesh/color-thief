# Color Thief

A script for grabbing the color palette from an image. Uses Javascript and the canvas tag to make it happen.

[See a Demo](http://lokeshdhakar.com/projects/color-thief) | [Read more on my blog](http://lokeshdhakar.com/color-thief)


## How to use

### Get the dominant color from an image
```js
var colorThief = new ColorThief();
colorThief.getColor(sourceImage);
```

```js
getColor(sourceImage[, quality])
returns [num, num, num]
```

### Build a color palette from an image

In this example, we build an 8 color palette.

```js
var colorThief = new ColorThief();
colorThief.getPalette(sourceImage, 8);
```

```js
getPalette(sourceImage[, colorCount, quality])
returns [ [num, num, num], [num, num, num], ... ]
```
