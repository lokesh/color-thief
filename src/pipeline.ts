import type {
    Color,
    ExtractionOptions,
    FilterOptions,
    PixelBuffer,
    Quantizer,
} from './types.js';
import { createColor } from './color.js';
import {
    pixelsRgbToOklchScaled,
    paletteOklchScaledToRgb,
} from './color-space.js';

// ---------------------------------------------------------------------------
// Validate & normalize options
// ---------------------------------------------------------------------------

export interface ValidatedOptions {
    colorCount: number;
    quality: number;
    ignoreWhite: boolean;
    whiteThreshold: number;
    alphaThreshold: number;
    minSaturation: number;
    colorSpace: 'rgb' | 'oklch';
}

export function validateOptions(options: ExtractionOptions): ValidatedOptions {
    let { colorCount, quality } = options;

    if (typeof colorCount === 'undefined' || !Number.isInteger(colorCount)) {
        colorCount = 10;
    } else if (colorCount === 1) {
        throw new Error(
            'colorCount should be between 2 and 20. To get one color, call getColor() instead of getPalette()',
        );
    } else {
        colorCount = Math.max(colorCount, 2);
        colorCount = Math.min(colorCount, 20);
    }

    if (
        typeof quality === 'undefined' ||
        !Number.isInteger(quality) ||
        quality < 1
    ) {
        quality = 10;
    }

    const ignoreWhite =
        options.ignoreWhite !== undefined ? !!options.ignoreWhite : true;
    const whiteThreshold =
        typeof options.whiteThreshold === 'number' ? options.whiteThreshold : 250;
    const alphaThreshold =
        typeof options.alphaThreshold === 'number' ? options.alphaThreshold : 125;
    const minSaturation =
        typeof options.minSaturation === 'number'
            ? Math.max(0, Math.min(1, options.minSaturation))
            : 0;
    const colorSpace = options.colorSpace ?? 'rgb';

    return {
        colorCount,
        quality,
        ignoreWhite,
        whiteThreshold,
        alphaThreshold,
        minSaturation,
        colorSpace,
    };
}

// ---------------------------------------------------------------------------
// Pixel sampling
// ---------------------------------------------------------------------------

export function createPixelArray(
    data: PixelBuffer,
    pixelCount: number,
    quality: number,
    filterOptions: FilterOptions,
): Array<[number, number, number]> {
    const {
        ignoreWhite = true,
        whiteThreshold = 250,
        alphaThreshold = 125,
        minSaturation = 0,
    } = filterOptions;

    const pixelArray: Array<[number, number, number]> = [];

    for (let i = 0; i < pixelCount; i += quality) {
        const offset = i * 4;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const a = data[offset + 3];

        // Skip transparent pixels
        if (a !== undefined && a < alphaThreshold) continue;

        // Skip white pixels
        if (
            ignoreWhite &&
            r > whiteThreshold &&
            g > whiteThreshold &&
            b > whiteThreshold
        )
            continue;

        // Skip low-saturation pixels
        if (minSaturation > 0) {
            const max = Math.max(r, g, b);
            if (max === 0 || (max - Math.min(r, g, b)) / max < minSaturation)
                continue;
        }

        pixelArray.push([r, g, b]);
    }

    return pixelArray;
}

// ---------------------------------------------------------------------------
// Fallback color (average)
// ---------------------------------------------------------------------------

export function computeFallbackColor(
    data: PixelBuffer,
    pixelCount: number,
    quality: number,
): [number, number, number] | null {
    let rTotal = 0;
    let gTotal = 0;
    let bTotal = 0;
    let count = 0;

    for (let i = 0; i < pixelCount; i += quality) {
        const offset = i * 4;
        rTotal += data[offset];
        gTotal += data[offset + 1];
        bTotal += data[offset + 2];
        count++;
    }

    if (count === 0) return null;

    return [
        Math.round(rTotal / count),
        Math.round(gTotal / count),
        Math.round(bTotal / count),
    ];
}

// ---------------------------------------------------------------------------
// Main extraction pipeline
// ---------------------------------------------------------------------------

export function extractPalette(
    data: PixelBuffer,
    width: number,
    height: number,
    opts: ValidatedOptions,
    quantizer: Quantizer,
): Color[] | null {
    const pixelCount = width * height;
    const filterOptions: FilterOptions = {
        ignoreWhite: opts.ignoreWhite,
        whiteThreshold: opts.whiteThreshold,
        alphaThreshold: opts.alphaThreshold,
        minSaturation: opts.minSaturation,
    };

    let pixelArray = createPixelArray(data, pixelCount, opts.quality, filterOptions);

    // Progressively relax filters if all pixels were excluded
    if (pixelArray.length === 0) {
        pixelArray = createPixelArray(data, pixelCount, opts.quality, {
            ...filterOptions,
            ignoreWhite: false,
        });
    }
    if (pixelArray.length === 0) {
        pixelArray = createPixelArray(data, pixelCount, opts.quality, {
            ...filterOptions,
            ignoreWhite: false,
            alphaThreshold: 0,
        });
    }

    // OKLCH quantization path
    let quantized: Array<{ color: [number, number, number]; population: number }>;
    if (opts.colorSpace === 'oklch') {
        const scaled = pixelsRgbToOklchScaled(pixelArray);
        quantized = paletteOklchScaledToRgb(
            quantizer.quantize(scaled, opts.colorCount),
        );
    } else {
        quantized = quantizer.quantize(pixelArray, opts.colorCount);
    }

    if (quantized.length > 0) {
        const totalPopulation = quantized.reduce((sum, q) => sum + q.population, 0);
        return quantized.map(({ color: [r, g, b], population }) =>
            createColor(r, g, b, population, totalPopulation > 0 ? population / totalPopulation : 0),
        );
    }

    // Fallback: average all pixels
    const fallback = computeFallbackColor(data, pixelCount, opts.quality);
    return fallback ? [createColor(fallback[0], fallback[1], fallback[2], 1, 1)] : null;
}
