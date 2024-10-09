import quantize from '../node_modules/@lokesh.dhakar/quantize/dist/index.mjs';
import core from './core.js';

/*
 * Color Thief v2.6.0
 * by Lokesh Dhakar - http://www.lokeshdhakar.com
 *
 * Thanks
 * ------
 * Nick Rabinowitz - For creating quantize.js.
 * John Schulz - For clean up and optimization. @JFSIII
 * Nathan Spady - For adding drag and drop support to the demo page.
 *
 * License
 * -------
 * Copyright Lokesh Dhakar
 * Released under the MIT license
 * https://raw.githubusercontent.com/lokesh/color-thief/master/LICENSE
 *
 * @license
 */


/*
  CanvasImage Class
  Class that wraps the html image element and canvas.
  It also simplifies some of the canvas context manipulation
  with a set of helper functions.
*/

const CanvasImage = function (image) {
    this.canvas  = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.width  = this.canvas.width  = image.naturalWidth;
    this.height = this.canvas.height = image.naturalHeight;
    this.context.drawImage(image, 0, 0, this.width, this.height);
};

CanvasImage.prototype.getImageData = function () {
    return this.context.getImageData(0, 0, this.width, this.height);
};

var ColorThief = function () {};

/*
 * getColor(sourceImage[, quality])
 * returns {r: num, g: num, b: num}
 *
 * Use the median cut algorithm provided by quantize.js to cluster similar
 * colors and return the base color from the largest cluster.
 *
 * Quality is an optional argument. It needs to be an integer. 1 is the highest quality settings.
 * 10 is the default. There is a trade-off between quality and speed. The bigger the number, the
 * faster a color will be returned but the greater the likelihood that it will not be the visually
 * most dominant color.
 *
 * */
ColorThief.prototype.getColor = function(sourceImage, quality = 10) {
    const palette       = this.getPalette(sourceImage, 5, quality);
    const dominantColor = palette[0];
    return dominantColor;
};


/*
 * getPalette(sourceImage[, colorCount, quality])
 * returns array[ {r: num, g: num, b: num}, {r: num, g: num, b: num}, ...]
 *
 * Use the median cut algorithm provided by quantize.js to cluster similar colors.
 *
 * colorCount determines the size of the palette; the number of colors returned. If not set, it
 * defaults to 10.
 *
 * quality is an optional argument. It needs to be an integer. 1 is the highest quality settings.
 * 10 is the default. There is a trade-off between quality and speed. The bigger the number, the
 * faster the palette generation but the greater the likelihood that colors will be missed.
 *
 *
 */
ColorThief.prototype.getPalette = function(sourceImage, colorCount, quality) {
    const options = core.validateOptions({
        colorCount,
        quality
    });

    // Create custom CanvasImage object
    const image      = new CanvasImage(sourceImage);
    const imageData  = image.getImageData();
    const pixelCount = image.width * image.height;

    const pixelArray = core.createPixelArray(imageData.data, pixelCount, options.quality);

    // Send array to quantize function which clusters values
    // using median cut algorithm
    const cmap    = quantize(pixelArray, options.colorCount);
    const palette = cmap? cmap.palette() : null;

    return palette;
};

ColorThief.prototype.getColorFromUrl = function(imageUrl, callback, quality) {
    const sourceImage = document.createElement("img");

    sourceImage.addEventListener('load' , () => {
        const palette = this.getPalette(sourceImage, 5, quality);
        const dominantColor = palette[0];
        callback(dominantColor, imageUrl);
    });
    sourceImage.src = imageUrl
};


ColorThief.prototype.getImageData = function(imageUrl, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', imageUrl, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
        if (this.status == 200) {
            let uInt8Array = new Uint8Array(this.response);
            i = uInt8Array.length;
            let binaryString = new Array(i);
            for (let i = 0; i < uInt8Array.length; i++){
                binaryString[i] = String.fromCharCode(uInt8Array[i]);
            }
            let data = binaryString.join('');
            let base64 = window.btoa(data);
            callback ('data:image/png;base64,' + base64);
        }
    }
    xhr.send();
};

ColorThief.prototype.getColorAsync = function(imageUrl, callback, quality) {
    const thief = this;
    this.getImageData(imageUrl, function(imageData){
        const sourceImage = document.createElement("img");
        sourceImage.addEventListener('load' , function(){
            const palette = thief.getPalette(sourceImage, 5, quality);
            const dominantColor = palette[0];
            callback(dominantColor, this);
        });
        sourceImage.src = imageData;
    });
};


export default ColorThief;
