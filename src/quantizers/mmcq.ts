import type { Quantizer } from '../types.js';

// ---------------------------------------------------------------------------
// Constants (match original quantize library)
// ---------------------------------------------------------------------------

const SIGBITS = 5;
const RSHIFT = 8 - SIGBITS;
const MAX_ITERATIONS = 1000;
const FRACT_BY_POPULATIONS = 0.75;
const HISTO_SIZE = 1 << (3 * SIGBITS);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getColorIndex(r: number, g: number, b: number): number {
    return (r << (2 * SIGBITS)) + (g << SIGBITS) + b;
}

// ---------------------------------------------------------------------------
// VBox — a 3-D box in reduced (5-bit) RGB color space
// ---------------------------------------------------------------------------

class VBox {
    r1: number;
    r2: number;
    g1: number;
    g2: number;
    b1: number;
    b2: number;

    private readonly histo: Uint32Array;
    private _volume: number | undefined;
    private _count: number | undefined;
    private _avg: [number, number, number] | undefined;

    constructor(
        r1: number,
        r2: number,
        g1: number,
        g2: number,
        b1: number,
        b2: number,
        histo: Uint32Array,
    ) {
        this.r1 = r1;
        this.r2 = r2;
        this.g1 = g1;
        this.g2 = g2;
        this.b1 = b1;
        this.b2 = b2;
        this.histo = histo;
    }

    volume(force = false): number {
        if (this._volume === undefined || force) {
            this._volume =
                (this.r2 - this.r1 + 1) *
                (this.g2 - this.g1 + 1) *
                (this.b2 - this.b1 + 1);
        }
        return this._volume;
    }

    count(force = false): number {
        if (this._count === undefined || force) {
            let npix = 0;
            for (let i = this.r1; i <= this.r2; i++) {
                for (let j = this.g1; j <= this.g2; j++) {
                    for (let k = this.b1; k <= this.b2; k++) {
                        npix += this.histo[getColorIndex(i, j, k)] || 0;
                    }
                }
            }
            this._count = npix;
        }
        return this._count;
    }

    copy(): VBox {
        return new VBox(this.r1, this.r2, this.g1, this.g2, this.b1, this.b2, this.histo);
    }

    avg(force = false): [number, number, number] {
        if (this._avg === undefined || force) {
            const mult = 1 << RSHIFT;

            // Single-color box: return exact color
            if (this.r1 === this.r2 && this.g1 === this.g2 && this.b1 === this.b2) {
                this._avg = [
                    this.r1 << RSHIFT,
                    this.g1 << RSHIFT,
                    this.b1 << RSHIFT,
                ];
            } else {
                let ntot = 0;
                let rsum = 0;
                let gsum = 0;
                let bsum = 0;

                for (let i = this.r1; i <= this.r2; i++) {
                    for (let j = this.g1; j <= this.g2; j++) {
                        for (let k = this.b1; k <= this.b2; k++) {
                            const hval = this.histo[getColorIndex(i, j, k)] || 0;
                            ntot += hval;
                            rsum += hval * (i + 0.5) * mult;
                            gsum += hval * (j + 0.5) * mult;
                            bsum += hval * (k + 0.5) * mult;
                        }
                    }
                }

                if (ntot) {
                    this._avg = [
                        ~~(rsum / ntot),
                        ~~(gsum / ntot),
                        ~~(bsum / ntot),
                    ];
                } else {
                    this._avg = [
                        ~~((mult * (this.r1 + this.r2 + 1)) / 2),
                        ~~((mult * (this.g1 + this.g2 + 1)) / 2),
                        ~~((mult * (this.b1 + this.b2 + 1)) / 2),
                    ];
                }
            }
        }
        return this._avg;
    }
}

// ---------------------------------------------------------------------------
// PQueue — lazy-sorted priority queue
// ---------------------------------------------------------------------------

class PQueue<T> {
    private contents: T[] = [];
    private sorted = false;

    constructor(private comparator: (a: T, b: T) => number) {}

    private sort(): void {
        this.contents.sort(this.comparator);
        this.sorted = true;
    }

    push(item: T): void {
        this.contents.push(item);
        this.sorted = false;
    }

    peek(index?: number): T {
        if (!this.sorted) this.sort();
        return this.contents[index ?? this.contents.length - 1];
    }

    pop(): T {
        if (!this.sorted) this.sort();
        return this.contents.pop()!;
    }

    size(): number {
        return this.contents.length;
    }

    map<U>(fn: (item: T) => U): U[] {
        return this.contents.map(fn);
    }
}

// ---------------------------------------------------------------------------
// Histogram & initial VBox
// ---------------------------------------------------------------------------

function getHisto(pixels: Array<[number, number, number]>): Uint32Array {
    const histo = new Uint32Array(HISTO_SIZE);
    for (const pixel of pixels) {
        const rval = pixel[0] >> RSHIFT;
        const gval = pixel[1] >> RSHIFT;
        const bval = pixel[2] >> RSHIFT;
        histo[getColorIndex(rval, gval, bval)]++;
    }
    return histo;
}

function vboxFromPixels(
    pixels: Array<[number, number, number]>,
    histo: Uint32Array,
): VBox {
    let rmin = 1000000;
    let rmax = 0;
    let gmin = 1000000;
    let gmax = 0;
    let bmin = 1000000;
    let bmax = 0;

    for (const pixel of pixels) {
        const rval = pixel[0] >> RSHIFT;
        const gval = pixel[1] >> RSHIFT;
        const bval = pixel[2] >> RSHIFT;
        if (rval < rmin) rmin = rval;
        else if (rval > rmax) rmax = rval;
        if (gval < gmin) gmin = gval;
        else if (gval > gmax) gmax = gval;
        if (bval < bmin) bmin = bval;
        else if (bval > bmax) bmax = bval;
    }

    return new VBox(rmin, rmax, gmin, gmax, bmin, bmax, histo);
}

// ---------------------------------------------------------------------------
// Median-cut split
// ---------------------------------------------------------------------------

function medianCutApply(histo: Uint32Array, vbox: VBox): [VBox, VBox | null] | undefined {
    if (!vbox.count()) return undefined;

    // Only one pixel — no split possible
    if (vbox.count() === 1) return [vbox.copy(), null];

    const rw = vbox.r2 - vbox.r1 + 1;
    const gw = vbox.g2 - vbox.g1 + 1;
    const bw = vbox.b2 - vbox.b1 + 1;
    const maxw = Math.max(rw, gw, bw);

    let total = 0;
    const partialsum: number[] = [];
    const lookaheadsum: number[] = [];

    if (maxw === rw) {
        for (let i = vbox.r1; i <= vbox.r2; i++) {
            let sum = 0;
            for (let j = vbox.g1; j <= vbox.g2; j++) {
                for (let k = vbox.b1; k <= vbox.b2; k++) {
                    sum += histo[getColorIndex(i, j, k)] || 0;
                }
            }
            total += sum;
            partialsum[i] = total;
        }
    } else if (maxw === gw) {
        for (let i = vbox.g1; i <= vbox.g2; i++) {
            let sum = 0;
            for (let j = vbox.r1; j <= vbox.r2; j++) {
                for (let k = vbox.b1; k <= vbox.b2; k++) {
                    sum += histo[getColorIndex(j, i, k)] || 0;
                }
            }
            total += sum;
            partialsum[i] = total;
        }
    } else {
        for (let i = vbox.b1; i <= vbox.b2; i++) {
            let sum = 0;
            for (let j = vbox.r1; j <= vbox.r2; j++) {
                for (let k = vbox.g1; k <= vbox.g2; k++) {
                    sum += histo[getColorIndex(j, k, i)] || 0;
                }
            }
            total += sum;
            partialsum[i] = total;
        }
    }

    partialsum.forEach((d, i) => {
        lookaheadsum[i] = total - d;
    });

    function doCut(color: 'r' | 'g' | 'b'): [VBox, VBox] | undefined {
        const dim1 = (color + '1') as 'r1' | 'g1' | 'b1';
        const dim2 = (color + '2') as 'r2' | 'g2' | 'b2';

        for (let i = vbox[dim1]; i <= vbox[dim2]; i++) {
            if (partialsum[i] > total / 2) {
                const vbox1 = vbox.copy();
                const vbox2 = vbox.copy();
                const left = i - vbox[dim1];
                const right = vbox[dim2] - i;

                let d2: number;
                if (left <= right) {
                    d2 = Math.min(vbox[dim2] - 1, ~~(i + right / 2));
                } else {
                    d2 = Math.max(vbox[dim1], ~~(i - 1 - left / 2));
                }

                // Avoid 0-count boxes
                while (!partialsum[d2]) d2++;
                let count2 = lookaheadsum[d2];
                while (!count2 && partialsum[d2 - 1]) count2 = lookaheadsum[--d2];

                // Set dimensions
                vbox1[dim2] = d2;
                vbox2[dim1] = vbox1[dim2] + 1;

                return [vbox1, vbox2];
            }
        }
        return undefined;
    }

    if (maxw === rw) return doCut('r');
    if (maxw === gw) return doCut('g');
    return doCut('b');
}

// ---------------------------------------------------------------------------
// Iterative splitting
// ---------------------------------------------------------------------------

function iterate(pq: PQueue<VBox>, target: number, histo: Uint32Array): void {
    let ncolors = pq.size();
    let niters = 0;

    while (niters < MAX_ITERATIONS) {
        if (ncolors >= target) return;
        niters++;

        const vbox = pq.pop();

        if (!vbox.count()) {
            pq.push(vbox);
            continue;
        }

        const result = medianCutApply(histo, vbox);
        if (!result || !result[0]) return;

        pq.push(result[0]);
        if (result[1]) {
            pq.push(result[1]);
            ncolors++;
        }
    }
}

// ---------------------------------------------------------------------------
// Main quantize function
// ---------------------------------------------------------------------------

function quantize(
    pixels: Array<[number, number, number]>,
    maxColors: number,
): Array<{ color: [number, number, number]; population: number }> {
    if (!pixels.length || maxColors < 2 || maxColors > 256) return [];

    // Short-circuit: if unique colors <= maxColors, return them directly
    const seenColors = new Set<string>();
    const uniqueColors: Array<[number, number, number]> = [];
    for (const color of pixels) {
        const key = color.join(',');
        if (!seenColors.has(key)) {
            seenColors.add(key);
            uniqueColors.push(color);
        }
    }
    if (uniqueColors.length <= maxColors) {
        // Count populations for unique colors
        const countMap = new Map<string, number>();
        for (const color of pixels) {
            const key = color.join(',');
            countMap.set(key, (countMap.get(key) || 0) + 1);
        }
        return uniqueColors.map((color) => ({
            color,
            population: countMap.get(color.join(','))!,
        }));
    }

    const histo = getHisto(pixels);

    // Get the initial vbox from the pixels
    const vbox = vboxFromPixels(pixels, histo);
    const pq = new PQueue<VBox>((a, b) => a.count() - b.count());
    pq.push(vbox);

    // Phase 1: split by population until FRACT_BY_POPULATIONS * maxColors
    iterate(pq, FRACT_BY_POPULATIONS * maxColors, histo);

    // Phase 2: re-sort by count * volume, continue splitting
    const pq2 = new PQueue<VBox>((a, b) => a.count() * a.volume() - b.count() * b.volume());
    while (pq.size()) {
        pq2.push(pq.pop());
    }
    iterate(pq2, maxColors, histo);

    // Extract palette with population counts
    const results: Array<{ color: [number, number, number]; population: number }> = [];
    while (pq2.size()) {
        const box = pq2.pop();
        results.push({
            color: box.avg(),
            population: box.count(),
        });
    }

    return results;
}

// ---------------------------------------------------------------------------
// Quantizer adapter
// ---------------------------------------------------------------------------

/**
 * MMCQ (Modified Median Cut Quantization) — inlined TypeScript implementation.
 * Port of the @lokesh.dhakar/quantize algorithm with population tracking.
 */
export class MmcqQuantizer implements Quantizer {
    async init(): Promise<void> {
        // No-op — pure TypeScript, ready to use.
    }

    quantize(
        pixels: Array<[number, number, number]>,
        maxColors: number,
    ): Array<{ color: [number, number, number]; population: number }> {
        return quantize(pixels, maxColors);
    }
}
