/**
 * Color Thief Core v3.0.0
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
 * @license MIT
 */

/**
 * Create an array of arrays of pixels from an array of pixels
 * @param {number[]} pixels An array of pixels
 * @param {number} pixelCount The total number of pixels
 * @param {number} quality
 * @returns {number[][]} Returns an array of arrays of pixel values ([ r, g, b ])
 */
const createPixelArray = ( pixels: number[], pixelCount: number, quality: number ): number[][] => {
    const pixelArray: number[][] = [];

    for ( let i = 0; i < pixelCount; i = i + quality ) {
        const offset = i * 4;
        const r = pixels[ offset + 0 ];
        const g = pixels[ offset + 1 ];
        const b = pixels[ offset + 2 ];
        const a = pixels[ offset + 3 ];

        // If pixel is mostly opaque and not white
        if ( typeof a === 'undefined' || a >= 125 ) {
            if ( !( r > 250 && g > 250 && b > 250 ) ) {
                pixelArray.push( [ r, g, b ] );
            }
        }
    }
    return pixelArray;
};

/**
 * Validate Color-Thief options
 * @param {{ colorCount: number; quality: number; }} options The options object
 * @returns {{ colorCount: number, quality: number }} The same object, but validated
 */
const validateOptions = ( options: { 'colorCount': number; 'quality': number; } ): { 'colorCount': number; 'quality': number; } => {
    let colorCount = options.colorCount;
    let quality = options.quality;

    if ( typeof colorCount === 'undefined' || !Number.isInteger( colorCount ) ) {
        colorCount = 10;
    } else if ( colorCount === 1 ) {
        throw new Error(
            'colorCount should be between 2 and 20. To get one color, call getColor() instead of getPalette()',
        );
    } else {
        colorCount = Math.max( colorCount, 2 );
        colorCount = Math.min( colorCount, 20 );
    }

    if (
        typeof quality === 'undefined' ||
        !Number.isInteger( quality ) ||
        quality < 1
    ) {
        quality = 10;
    }

    return {
        colorCount,
        quality,
    };
};

export default {
    createPixelArray,
    validateOptions,
};
