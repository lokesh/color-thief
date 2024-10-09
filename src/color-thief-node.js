const { getPixels } = require('ndarray-pixels');
const sharp = require('sharp');
const quantize = require('@lokesh.dhakar/quantize');
const FileType = require('file-type');

function createPixelArray(pixels, pixelCount, quality) {
    const pixelArray = [];

    for (let i = 0, offset, r, g, b, a; i < pixelCount; i += quality) {
        offset = i * 4;
        r = pixels[offset];
        g = pixels[offset + 1];
        b = pixels[offset + 2];
        a = pixels[offset + 3];

        // If pixel is mostly opaque and not white
        if ((typeof a === 'undefined' || a >= 125) && !(r > 250 && g > 250 && b > 250))
            pixelArray.push([r, g, b]);
    }

    return pixelArray;
}

function validateOptions(options) {
    let { colorCount, quality } = options;

    if (typeof colorCount === 'undefined' || !Number.isInteger(colorCount)) {
        colorCount = 10;
    } else if (colorCount === 1) {
        throw new Error('`colorCount` should be between 2 and 20. To get one color, call `getColor()` instead of `getPalette()`');
    } else {
        colorCount = Math.max(colorCount, 2);
        colorCount = Math.min(colorCount, 20);
    }

    if (typeof quality === 'undefined' || !Number.isInteger(quality) || quality < 1) quality = 10;

    return { colorCount, quality };
}

const loadImg = (img) => {
    const type = Buffer.isBuffer(img) ? FileType.fromBuffer(img).mime : null
    return new Promise((resolve, reject) => {
        sharp(img)
        .toBuffer()
        .then(buffer => sharp(buffer).metadata()
            .then(metadata => ({ buffer, format: metadata.format })))
        .then(({ buffer, format }) => getPixels(buffer, format))
        .then(resolve)
        .catch(reject);
    })
}

function getColor(img, quality) {
    return getPalette(img, 5, quality)
        .then(palette => palette[0]);
}

function getPalette(img, colorCount = 10, quality = 10) {
    const options = validateOptions({ colorCount, quality });

    return loadImg(img)
        .then(imgData => {
            const pixelCount = imgData.shape[0] * imgData.shape[1];
            const pixelArray = createPixelArray(imgData.data, pixelCount, options.quality);

            const cmap = quantize(pixelArray, options.colorCount);
            const palette = cmap ? cmap.palette() : null;

            return palette;
        });
}

module.exports = { getColor, getPalette };
