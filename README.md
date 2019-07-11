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


## Masking and Filtering

### Mask part of the input image

In this example, we build an 8 color palette from only the left half of the image, masking the other half.

```js
function filterFunction(x, y, r, g, b, a, imageData) {
	return x < imageData.width / 2;
}

var colorThief = new ColorThief();
var quality = 10; // default quality
colorThief.getPalette(sourceImage, 8, quality, filterFunction);
```

### Exclude colors from being considered

In this example, we build an 8 color palette from pixels of the image that are not green.

```js
function filterFunction(x, y, r, g, b, a, imageData) {
	if (g > 200 && r < 50 && b < 50) {
		return false;
	} else {
		return true;
	}	
}

var colorThief = new ColorThief();
var quality = 10; // default quality
colorThief.getPalette(sourceImage, 8, quality, filterFunction);
```
