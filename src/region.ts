/**
 * Region (sub-rectangle) extraction.
 *
 * A `Region` is expressed in normalized 0–1 coordinates so it is independent
 * of the image's pixel dimensions. The crop is applied to the decoded pixel
 * buffer right after loading, before any sampling happens — so every entry
 * point (async, sync, observe, progressive, CLI) and every custom loader or
 * quantizer gets region support without changes.
 */
import type { PixelBuffer, PixelData, Region } from './types.js';

/** A region resolved to integer pixel coordinates for a specific image. */
export interface PixelRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function checkFraction(value: unknown, name: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(
            `region.${name} must be a finite number between 0 and 1 (received ${String(value)})`,
        );
    }
    if (value < 0 || value > 1) {
        throw new Error(
            `region.${name} must be between 0 and 1 (received ${value}). Region coordinates are fractions of the image size, not pixels.`,
        );
    }
    return value;
}

/**
 * Validate a region and normalize it so it always fits inside the image.
 *
 * Coordinates must be finite numbers in 0–1, and `width`/`height` must be
 * greater than 0. A region that extends past the right or bottom edge is
 * clamped to the edge rather than rejected.
 */
export function validateRegion(region: Region): Region {
    if (region === null || typeof region !== 'object') {
        throw new Error(
            'region must be an object of the form { x, y, width, height } with values between 0 and 1',
        );
    }

    const x = checkFraction(region.x, 'x');
    const y = checkFraction(region.y, 'y');
    const width = checkFraction(region.width, 'width');
    const height = checkFraction(region.height, 'height');

    if (width <= 0 || height <= 0) {
        throw new Error(
            `region.width and region.height must be greater than 0 (received ${width} and ${height})`,
        );
    }

    // Clamp to the image bounds. x/y of exactly 1 leaves no room for the
    // region, which is a mistake worth surfacing rather than silently fixing.
    const clampedWidth = Math.min(width, 1 - x);
    const clampedHeight = Math.min(height, 1 - y);
    if (clampedWidth <= 0 || clampedHeight <= 0) {
        throw new Error(
            `region is outside the image: x=${x}, y=${y} leaves no area to sample`,
        );
    }

    return { x, y, width: clampedWidth, height: clampedHeight };
}

// ---------------------------------------------------------------------------
// Resolution to pixel coordinates
// ---------------------------------------------------------------------------

/**
 * Convert a normalized region into integer pixel coordinates for an image of
 * the given size. The result is always at least 1×1 and never extends past
 * the image bounds.
 */
export function regionToPixelRect(
    region: Region,
    width: number,
    height: number,
): PixelRect {
    const { x, y, width: w, height: h } = validateRegion(region);

    const left = Math.min(Math.max(Math.round(x * width), 0), Math.max(width - 1, 0));
    const top = Math.min(Math.max(Math.round(y * height), 0), Math.max(height - 1, 0));

    const rectWidth = Math.min(Math.max(Math.round(w * width), 1), width - left);
    const rectHeight = Math.min(Math.max(Math.round(h * height), 1), height - top);

    return { left, top, width: rectWidth, height: rectHeight };
}

// ---------------------------------------------------------------------------
// Cropping
// ---------------------------------------------------------------------------

function allocateLike(source: PixelBuffer, length: number): PixelBuffer {
    return source instanceof Uint8ClampedArray
        ? new Uint8ClampedArray(length)
        : new Uint8Array(length);
}

/**
 * Crop decoded pixel data to a region. Returns the input untouched when the
 * region covers the whole image, so the no-region path allocates nothing.
 */
export function cropPixelData(pixels: PixelData, region?: Region): PixelData {
    if (!region) return pixels;

    const { width, height } = pixels;
    if (!width || !height) return pixels;

    const rect = regionToPixelRect(region, width, height);

    if (
        rect.left === 0 &&
        rect.top === 0 &&
        rect.width === width &&
        rect.height === height
    ) {
        return pixels;
    }

    const rowBytes = rect.width * 4;
    const cropped = allocateLike(pixels.data, rowBytes * rect.height);

    for (let row = 0; row < rect.height; row++) {
        const srcStart = ((rect.top + row) * width + rect.left) * 4;
        cropped.set(pixels.data.subarray(srcStart, srcStart + rowBytes), row * rowBytes);
    }

    return {
        data: cropped,
        width: rect.width,
        height: rect.height,
        colorSpace: pixels.colorSpace,
    };
}
