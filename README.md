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


## Changelog

### v2.0.1 - 2015-10-05

- [Fix] Remove left-over references to Creative Commons License. MIT all-around.
- [Fix] MMCQ lib issues [#16](https://github.com/lokesh/color-thief/pull/16) by @nobodypb
- [Fix] Incorrect bower.json main property path. [#37](https://github.com/lokesh/color-thief/pull/37) by @chellem, @joscha, @dkushner
- [Fix] Quality less than 1 causes infinite loop [#33](https://github.com/lokesh/color-thief/pull/33) by @nteike
- [Fix] MMCQ.quantize(...) can return false or undefined thus breaking the application (#55)[https://github.com/lokesh/color-thief/pull/55] by @mhahmadi
- [Remove] Drop version number from bower.json [#70](https://github.com/lokesh/color-thief/pull/70) by @kkirsche

### v2.0.0 - 2013-06-23

- Embed quantize into color thief file
- Strip out jQuery requirement
- Credit those who helped with edits - Nathan Spady for drag and drop support.
