import quantize from '../node_modules/@lokesh.dhakar/quantize/dist/index.mjs';
import core from './core.js';

/*
 * Color Thief v2.4.0
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

const CanvasImage = function (image: HTMLImageElement) {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.width = this.canvas.width = image.naturalWidth;
    this.height = this.canvas.height = image.naturalHeight;
    this.context.drawImage(image, 0, 0, this.width, this.height);
};

CanvasImage.prototype.getImageData = function () {
    return this.context.getImageData(0, 0, this.width, this.height);
};

interface ColorThiefResult {
    r: number;
    g: number;
    b: number;
}

class ColorThief {
    /**
     * Use the median cut algorithm provided by quantize.js to cluster similar
     * colors and return the base color from the largest cluster.
     * @param {HTMLImageElement} sourceImage:HTMLImageElement
     * @param {number} quality Quality is an optional argument. It needs to be an integer. 1 is the highest quality settings.
     * 10 is the default. There is a trade-off between quality and speed. The bigger the number, the
     * faster a color will be returned but the greater the likelihood that it will not be the visually
     * most dominant color.
     * @returns {ColorThiefResult} returns {r: num, g: num, b: num}
     */
    getColor(
        sourceImage: HTMLImageElement,
        quality: number = 10,
    ): ColorThiefResult {
        const palette = this.getPalette(sourceImage, 5, quality);
        return palette[0];
    }

    /**
     * Use the median cut algorithm provided by quantize.js to cluster similar colors.
     * @param {HTMLImageElement} sourceImage The image you want to have processed, as an HTMLImageElement
     * @param {number?} colorCount colorCount determines the size of the palette; the number of colors returned. If not set, it
     * defaults to 10.
     * @param {number?} quality quality is an optional argument. It needs to be an integer. 1 is the highest quality settings.
     * 10 is the default. There is a trade-off between quality and speed. The bigger the number, the
     * faster the palette generation but the greater the likelihood that colors will be missed.
     * @returns {ColorThiefResult[]} returns array[ {r: num, g: num, b: num}, {r: num, g: num, b: num}, ...]
     */
    getPalette(
        sourceImage: HTMLImageElement,
        colorCount?: number,
        quality: number = 10,
    ): ColorThiefResult[] {
        const options = core.validateOptions({
            colorCount,
            quality,
        });

        // Create custom CanvasImage object
        const image = new CanvasImage(sourceImage);
        const imageData = image.getImageData();
        const pixelCount = image.width * image.height;

        const pixelArray = core.createPixelArray(
            imageData.data,
            pixelCount,
            options.quality,
        );

        // Send array to quantize function which clusters values
        // using median cut algorithm
        const cmap = quantize(pixelArray, options.colorCount);
        const palette = cmap ? cmap.palette() : null;

        return palette;
    }

    /**
     * Description
     * @param {any} imageUrl
     * @param {any} callback
     * @param {any} quality
     * @returns {any}
     */
    getColorFromUrl(imageUrl, callback, quality) {
        const sourceImage = document.createElement('img');

        sourceImage.addEventListener('load', () => {
            const palette = this.getPalette(sourceImage, 5, quality);
            const dominantColor = palette[0];
            callback(dominantColor, imageUrl);
        });
        sourceImage.src = imageUrl;
    }

    /**
     * Description
     * @param {string} imageUrl
     * @param {string} callback
     * @returns {void}
     */
    getImageData(imageUrl: string, callback) {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', imageUrl, true);
        xhr.responseType = 'arraybuffer';

        fetch(imageUrl).then((res) => {
            if (res.status === 200) {
                res.arrayBuffer().then((response) => {
                    const uInt8Array = new Uint8Array(response);
                    let binaryString = new Array(uInt8Array.length);
                    for (let i = 0; i < uInt8Array.length; i++) {
                        binaryString[i] = String.fromCharCode(uInt8Array[i]);
                    }
                    let data = binaryString.join('');
                    let base64 = window.btoa(data);
                });
            }
        });

        xhr.onload = function () {
            if (this.status == 200) {
                let uInt8Array = new Uint8Array(this.response);

                callback('data:image/png;base64,' + base64);
            }
        };
        xhr.send();
    }

    /**
     * Description
     * @param {any} imageUrl
     * @param {any} callback
     * @param {any} quality
     * @returns {any}
     */
    getColorAsync = function (imageUrl, callback, quality) {
        const thief = this;
        this.getImageData(imageUrl, function (imageData) {
            const sourceImage = document.createElement('img');
            sourceImage.addEventListener('load', function () {
                const palette = thief.getPalette(sourceImage, 5, quality);
                const dominantColor = palette[0];
                callback(dominantColor, this);
            });
            sourceImage.src = imageData;
        });
    };
}

export default ColorThief;
