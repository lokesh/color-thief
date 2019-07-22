const getPixels = require('get-pixels');
const quantize = require('quantize');

const ColorThief = function () {};

function readImg(img) {
    return new Promise((resolve, reject) => {
        getPixels(img, function(err, data) {
            if(err) {
                reject(err)
            } else {
                resolve(data);
            }
        })
    });
}

function createPixelArray(imgData, quality) {
    const pixels = imgData.data;
    const pixelCount = imgData.shape[0] * imgData.shape[1];
    const pixelArray = [];

    for (let i = 0, offset, r, g, b, a; i < pixelCount; i = i + quality) {
        offset = i * 4;
        r = pixels[offset + 0];
        g = pixels[offset + 1];
        b = pixels[offset + 2];
        a = pixels[offset + 3];
        pixelArray.push([r, g, b]);
    }
    return pixelArray;
}

function getColor(img, quality) {
    return new Promise((resolve, reject) => {
        getPalette(img, 5, quality)
            .then(palette => {
                resolve(palette[0]);
            })
            .catch(err => {
                reject(err);
            })
    });

}

function getPalette(img, colorCount = 10, quality = 10) {
    return new Promise((resolve, reject) => {
        readImg(img)
            .then(imgData => {
                const pixelArray = createPixelArray(imgData, quality);
                const cmap = quantize(pixelArray, colorCount);
                const palette = cmap? cmap.palette() : null;
                resolve(palette);
            })
            .catch(err => {
                reject(err);
            })
    });
}

module.exports = {
    getColor,
    getPalette
};

