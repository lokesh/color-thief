interface ColorThiefResult {
    'r': number;
    'g': number;
    'b': number;
}
/**
 * @class The main ColorThief class
 */
declare class ColorThief {
    /**
     * Use the median cut algorithm provided by quantize.js to cluster similar
     * colors and return the base color from the largest cluster.
     * @param {HTMLImageElement} sourceImage:HTMLImageElement
     * @param {number?} quality (Optional) 1 = highest quality, 10 = default. The bigger the number, the
     * faster a color will be returned but the greater the likelihood that it will not be the visually
     * most dominant color.
     * @returns {ColorThiefResult} returns {r: num, g: num, b: num}
     */
    getColor(sourceImage: HTMLImageElement, quality?: number): ColorThiefResult;
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
    getPalette(sourceImage: HTMLImageElement, colorCount?: number, quality?: number): ColorThiefResult[] | null;
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
    getColorFromUrl(imageUrl: string, callback: (color: ColorThiefResult, url: string) => void, quality?: number): void;
    /**
     * [ DEPRECATED ] Get Image Data as a Base64 string from a URL
     * @param {string} imageUrl The URL to the image. Has to be a full URL, if not relative
     * @param {( data: string ) => void} callback The callback function called, once download is complete. Will only be called if successful at downloading
     * @returns {void}
     * @deprecated since Version 3.0, use getImageDataFromURL instead
     */
    getImageData(imageUrl: string, callback: (data: string) => void): void;
    /**
     * Get Image Data as a Base64 string from a URL
     * @param {string} imageUrl The URL to the image. Has to be a full URL, if not relative
     * @returns {Promise<string>} returns a Promise resolving to a string with the base64 string
     */
    getImageDataFromURL(imageUrl: string): Promise<string>;
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
    getColorAsync: (imageUrl: string, callback: (data: ColorThiefResult, img: HTMLImageElement) => void, quality: number | null) => void;
    /**
     * Same as getColor, but promise-based
     * @param {string} imageUrl
     * @param {number?} quality (Optional) 1 = highest quality, 10 = default. The bigger the number, the
     * faster a color will be returned but the greater the likelihood that it will not be the visually
     * most dominant color.
     * @returns {Promise<{ 'color': ColorThiefResult, 'img': HTMLImageElement }>} Returns a promise resolving to an object containing the color and the image element
     */
    getColorPromise: (imageUrl: string, quality: number | null) => Promise<{
        "color": ColorThiefResult;
        "img": HTMLImageElement;
    }>;
}
export default ColorThief;
