/**
 * Color Thief Node v3.0.0
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

// Thanks to this PR for the work of migrating to ndarray-pixels pr https://github.com/lokesh/color-thief/pull/254
import { getPixels } from 'ndarray-pixels';
import quantize from '@lokesh.dhakar/quantize';
import sharp from 'sharp';
import ndarray from 'ndarray';

interface ColorThiefResult {
    'r': number;
    'g': number;
    'b': number;
}

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

/**
 * Load an image from the disk an pre-process
 * @param {string} img Path to the image on the disk
 * @returns {Promise<ndarray.NdArray<Uint8Array>>} Returns the pre-processed image
 */
const loadImg = ( img: string ): Promise<ndarray.NdArray<Uint8Array>> => {
    return new Promise( ( resolve, reject ) => {
        sharp( img )
            .toBuffer()
            .then( ( buffer ) => sharp( buffer ).metadata()
                .then( ( metadata ) => ( { buffer, 'format': metadata.format } ) ) )
            .then( ( { buffer, format } ) => getPixels( buffer, format ) )
            .then( resolve )
            .catch( reject );
    } );
};

/**
 * Get the dominant color of an image
 * @param {string} img Path to the image on the disk
 * @param {number?} quality (Optional) 1 = highest quality, 10 = default. The bigger the number, the
     * faster a color will be returned but the greater the likelihood that it will not be the visually
     * most dominant color.
 * @returns {Promise<ColorThiefResult>} Returns the dominant color
 */
const getColor = ( img: string, quality: number = 10 ): Promise<ColorThiefResult> => {
    return new Promise( ( resolve, reject ) => {
        getPalette( img, 5, quality )
            .then( ( palette ) => {
                resolve( palette[0] );
            } )
            .catch( ( err ) => {
                reject( err );
            } );
    } );
};

/**
 * Get the color palette of an image
 * @param {string} img Path to the image on the disk
 * @param {number?} colorCount (Optional) the target amount of colors to try and extract
 * @param {number?} quality (Optional) 1 = highest quality, 10 = default. The bigger the number, the
     * faster a color will be returned but the greater the likelihood that it will not be the visually
     * most dominant color.
 * @returns {Promise<ColorThiefResult[]>} Returns an array of colors
 */
const getPalette = ( img: string, colorCount: number = 10, quality: number = 10 ): Promise<ColorThiefResult[]> => {
    const options = validateOptions( {
        colorCount,
        quality,
    } );

    return new Promise( ( resolve, reject ) => {
        loadImg( img )
            .then( ( imgData ) => {
                const pixelCount = imgData.shape[0] * imgData.shape[1];
                const pixelArray = createPixelArray(
                    Array.from( imgData.data ),
                    pixelCount,
                    options.quality,
                );

                const cmap = quantize( pixelArray, options.colorCount );
                const palette = cmap ? cmap.palette() : null;

                resolve( palette );
            } )
            .catch( ( err ) => {
                reject( err );
            } );
    } );
};

module.exports = {
    getColor,
    getPalette,
};
