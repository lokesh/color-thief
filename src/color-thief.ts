import quantize from '../node_modules/@lokesh.dhakar/quantize/dist/index.mjs';
import core from './core.js';

/**
 * Color Thief v3.0.0
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
  @class CanvasImage that wraps the html image element and canvas.
  It also simplifies some of the canvas context manipulation
  with a set of helper functions.
*/
class CanvasImage {
    canvas: HTMLCanvasElement;

    context: CanvasRenderingContext2D;

    width: number;

    height: number;

    constructor ( image: HTMLImageElement ) {
        this.canvas = document.createElement( 'canvas' );
        this.context = this.canvas.getContext( '2d' );
        this.width = this.canvas.width = image.naturalWidth;
        this.height = this.canvas.height = image.naturalHeight;
        this.context.drawImage( image, 0, 0, this.width, this.height );
    }

    getImageData = function () {
        return this.context.getImageData( 0, 0, this.width, this.height );
    };
}


interface ColorThiefResult {
    'r': number;
    'g': number;
    'b': number;
}

/**
 * @class The main ColorThief class
 */
class ColorThief {
    /**
     * Use the median cut algorithm provided by quantize.js to cluster similar
     * colors and return the base color from the largest cluster.
     * @param {HTMLImageElement} sourceImage:HTMLImageElement
     * @param {number?} quality (Optional) 1 = highest quality, 10 = default. The bigger the number, the
     * faster a color will be returned but the greater the likelihood that it will not be the visually
     * most dominant color.
     * @returns {ColorThiefResult} returns {r: num, g: num, b: num}
     */
    getColor (
        sourceImage: HTMLImageElement,
        quality: number = 10,
    ): ColorThiefResult {
        const palette = this.getPalette( sourceImage, 5, quality );
        return palette[0];
    }

    /**
     * Use the median cut algorithm provided by quantize.js to cluster similar colors.
     * @param {HTMLImageElement} sourceImage The image you want to have processed, as an HTMLImageElement
     * @param {number?} colorCount colorCount determines the size of the palette; the number of colors returned. If not set, it
     * defaults to 10.
     * @param {number?} quality (Optional) 1 = highest quality, 10 = default. The bigger the number, the
     * faster a color will be returned but the greater the likelihood that it will not be the visually
     * most dominant color.
     * @returns {ColorThiefResult[] | null} returns array[ {r: num, g: num, b: num}, {r: num, g: num, b: num}, ...]
     */
    getPalette (
        sourceImage: HTMLImageElement,
        colorCount?: number,
        quality: number = 10,
    ): ColorThiefResult[] | null {
        const options = core.validateOptions( {
            colorCount,
            quality,
        } );

        // Create custom CanvasImage object
        const image = new CanvasImage( sourceImage );
        const imageData = image.getImageData();
        const pixelCount = image.width * image.height;

        const pixelArray = core.createPixelArray(
            imageData.data,
            pixelCount,
            options.quality,
        );

        // Send array to quantize function which clusters values
        // using median cut algorithm
        const cmap = quantize( pixelArray, options.colorCount );
        const palette: null | ColorThiefResult[] = cmap ? cmap.palette() : null;

        return palette;
    }

    /**
     * [ DEPRECATED ] Get the dominant color of an image, which is fetched from a URL.
     * @param {string} imageUrl
     * @param {( color: ColorThiefResult, url: string ) => void} callback The callback function called when the image has finished processing
     * @param {number?} quality (Optional) 1 = highest quality, 10 = default. The bigger the number, the
     * faster a color will be returned but the greater the likelihood that it will not be the visually
     * most dominant color.
     * @returns {void}
     * @deprecated since Version 3.0, use getColorFromURLPromise instead
     */
    getColorFromUrl ( imageUrl: string, callback: ( color: ColorThiefResult, url: string ) => void, quality: number = 10 ): void {
        const sourceImage = document.createElement( 'img' );

        sourceImage.addEventListener( 'load', () => {
            const palette = this.getPalette( sourceImage, 5, quality );
            const dominantColor = palette[0];
            callback( dominantColor, imageUrl );
        } );
        sourceImage.src = imageUrl;
    }

    /**
     * [ DEPRECATED ] Get Image Data as a Base64 string from a URL
     * @param {string} imageUrl The URL to the image. Has to be a full URL, if not relative
     * @param {( data: string ) => void} callback The callback function called, once download is complete. Will only be called if successful at downloading
     * @returns {void}
     * @deprecated since Version 3.0, use getImageDataFromURL instead
     */
    getImageData ( imageUrl: string, callback: ( data: string ) => void ): void {
        fetch( imageUrl ).then( ( res ) => {
            if ( res.status === 200 ) {
                res.arrayBuffer().then( ( response ) => {
                    const uInt8Array = new Uint8Array( response );
                    const binaryString = new Array( uInt8Array.length );
                    for ( let i = 0; i < uInt8Array.length; i++ ) {
                        binaryString[i] = String.fromCharCode( uInt8Array[i] );
                    }
                    const data = binaryString.join( '' );
                    callback( 'data:image/png;base64,' + window.btoa( data ) );
                } );
            }
        } );
    }

    /**
     * Get Image Data as a Base64 string from a URL
     * @param {string} imageUrl The URL to the image. Has to be a full URL, if not relative
     * @returns {Promise<string>} returns a Promise resolving to a string with the base64 string
     */
    getImageDataFromURL ( imageUrl: string ): Promise<string> {
        return new Promise( ( resolve, reject ) => {
            fetch( imageUrl ).then( ( res ) => {
                if ( res.status === 200 ) {
                    res.arrayBuffer().then( ( response ) => {
                        const uInt8Array = new Uint8Array( response );
                        const binaryString = new Array( uInt8Array.length );
                        for ( let i = 0; i < uInt8Array.length; i++ ) {
                            binaryString[i] = String.fromCharCode( uInt8Array[i] );
                        }
                        const data = binaryString.join( '' );
                        resolve( 'data:image/png;base64,' + window.btoa( data ) );
                    } );
                } else {
                    reject( 'ERR_LOADING' );
                }
            } );
        } );
    }

    /**
     * [ DEPRECATED ] Same as getColor, but async
     * @param {string} imageUrl
     * @param {( data: ColorThiefResult ) => void} callback
     * @param {number?} quality (Optional) 1 = highest quality, 10 = default. The bigger the number, the
     * faster a color will be returned but the greater the likelihood that it will not be the visually
     * most dominant color.
     * @returns {void}
     * @deprecated since Version 3.0, in favour of getColorPromise. Only retained for compatibility
     */
    getColorAsync = ( imageUrl: string, callback: ( data: ColorThiefResult, img: HTMLImageElement ) => void, quality: number | null ): void => {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const thief = this;
        this.getImageDataFromURL( imageUrl ).then( ( imageData ) => {
            const sourceImage = document.createElement( 'img' );
            sourceImage.addEventListener( 'load', () => {
                const palette = thief.getPalette( sourceImage, 5, quality );
                callback( palette[ 0 ], sourceImage );
            } );
            sourceImage.src = imageData;
        } );
    };

    /**
     * Same as getColor, but promise-based
     * @param {string} imageUrl
     * @param {number?} quality (Optional) 1 = highest quality, 10 = default. The bigger the number, the
     * faster a color will be returned but the greater the likelihood that it will not be the visually
     * most dominant color.
     * @returns {Promise<{ 'color': ColorThiefResult, 'img': HTMLImageElement }>} Returns a promise resolving to an object containing the color and the image element
     */
    getColorPromise = ( imageUrl: string, quality: number | null ): Promise<{ 'color': ColorThiefResult, 'img': HTMLImageElement }> => {
        return new Promise( ( resolve, reject ) => {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const thief = this;
            this.getImageDataFromURL( imageUrl ).then( ( imageData ) => {
                const sourceImage = document.createElement( 'img' );
                sourceImage.addEventListener( 'load', () => {
                    const palette = thief.getPalette( sourceImage, 5, quality );
                    resolve( { 'color': palette[ 0 ], 'img': sourceImage } );
                } );
                sourceImage.src = imageData;
            } ).catch( ( e ) => {
                reject( e );
            } );
        } );
    };
}

export default ColorThief;
