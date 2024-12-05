import { Buffer } from 'buffer';
declare module 'colorthief' {
    /**
     * Gets the dominant color from the image.
     * @param img - The image source, either a Buffer or a path to a image.
     * @param quality - An optional argument that determines how many pixels are skipped before the next one is sampled. Defaults to 10.
     * @returns A promise that resolves to an array of three integers representing the RGB values of the dominant color.
     */
    export function getColor(img: Buffer | string, quality?: number): Promise<[number, number, number]>;
    /**
     * Gets a palette from the image by clustering similar colors.
     * @param img - The image source, either a Buffer or a path to a image.
     * @param colorCount - An optional argument that determines the number of colors in the palette. Defaults to 10.
     * @param quality - An optional argument that determines how many pixels are skipped before the next one is sampled. Defaults to 10.
     * @returns A promise that resolves to an array of arrays, each containing three integers representing the RGB values of a color in the palette.
     */
    export function getPalette(img: Buffer | string, colorCount?: number, quality?: number): Promise<[number, number, number][]>;
}