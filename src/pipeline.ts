import type {
    Color,
    ExtractionOptions,
    FilterOptions,
    Gamut,
    PixelBuffer,
    Quantizer,
} from './types.js';
import { createColor } from './color.js';
import {
    pixelsRgbToOklchScaled,
    paletteOklchScaledToRgb,
    isOutOfSrgbGamut,
    p3ToSrgb,
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
    gamut: Gamut | 'auto';
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
    const colorSpace = options.colorSpace ?? 'oklch';
    const gamut = options.gamut ?? 'srgb';

    return {
        colorCount,
        quality,
        ignoreWhite,
        whiteThreshold,
        alphaThreshold,
        minSaturation,
        colorSpace,
        gamut,
    };
}

// ---------------------------------------------------------------------------
// Gamut resolution
// ---------------------------------------------------------------------------

/**
 * Decide the output gamut for a set of sampled pixels.
 * - sRGB pixels can only produce sRGB output.
 * - Explicit `'display-p3'` always reports P3.
 * - `'auto'` reports P3 only if some sampled pixel exceeds the sRGB gamut.
 */
export function resolveOutputGamut(
    pixelArray: Array<[number, number, number]>,
    nativeGamut: Gamut,
    requested: Gamut | 'auto',
): Gamut {
    // An explicit sRGB request always wins (map P3 pixels down if needed).
    if (requested === 'srgb') return 'srgb';
    // sRGB pixels can never carry wide-gamut information.
    if (nativeGamut !== 'display-p3') return 'srgb';
    if (requested === 'auto') {
        return pixelArray.some(([r, g, b]) => isOutOfSrgbGamut(r, g, b))
            ? 'display-p3'
            : 'srgb';
    }
    return 'display-p3';
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
    pixelColorSpace: Gamut = 'srgb',
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

    // Resolve the output gamut, then map each color from the pixels' native
    // gamut into it (only P3→sRGB is a non-identity conversion).
    const nativeGamut: Gamut = pixelColorSpace;
    const outputGamut = resolveOutputGamut(pixelArray, nativeGamut, opts.gamut);
    const toOutput = (c: [number, number, number]): [number, number, number] =>
        nativeGamut === outputGamut ? c : p3ToSrgb(c[0], c[1], c[2]);

    let quantized: Array<{ color: [number, number, number]; population: number }>;

    // Short-circuit check: collect up to opts.colorCount + 1 unique colors
    const seenColors = new Set<string>();
    const uniqueColors: Array<[number, number, number]> = [];

    for (const color of pixelArray) {
        const key = color.join(',');
        if (!seenColors.has(key)) {
            seenColors.add(key);
            uniqueColors.push(color);

            // The image contains more distinct colors than requested,
            // so we can stop searching for unique colors as we know we will have to use the quantizer.
            if (uniqueColors.length > opts.colorCount) break;
        }
    }

    // If unique colors <= maxColors, return them directly with population counts
    if (uniqueColors.length <= opts.colorCount) {
        // Count populations for unique colors
        const countMap = new Map<string, number>();
        for (const color of pixelArray) {
            const key = color.join(',');
            countMap.set(key, (countMap.get(key) || 0) + 1);
        }
        quantized = uniqueColors.map((color) => ({
            color,
            population: countMap.get(color.join(','))!,
        }));
    }
    // OKLCH quantization path
    else if (opts.colorSpace === 'oklch') {
        const scaled = pixelsRgbToOklchScaled(pixelArray, nativeGamut);
        quantized = paletteOklchScaledToRgb(
            quantizer.quantize(scaled, opts.colorCount),
            nativeGamut,
        );
    } else {
        quantized = quantizer.quantize(pixelArray, opts.colorCount);
    }

    if (quantized.length > 0) {
        const totalPopulation = quantized.reduce((sum, q) => sum + q.population, 0);
        return quantized.map(({ color, population }) => {
            const [r, g, b] = toOutput(color);
            return createColor(
                r,
                g,
                b,
                population,
                totalPopulation > 0 ? population / totalPopulation : 0,
                outputGamut,
            );
        });
    }

    // Fallback: average all pixels
    const fallback = computeFallbackColor(data, pixelCount, opts.quality);
    if (!fallback) return null;
    const [r, g, b] = toOutput(fallback);
    return [createColor(r, g, b, 1, 1, outputGamut)];
}
