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
        rmin = Math.min(rmin, rval);
        rmax = Math.max(rmax, rval);
        gmin = Math.min(gmin, gval);
        gmax = Math.max(gmax, gval);
        bmin = Math.min(bmin, bval);
        bmax = Math.max(bmax, bval);
    }

    return new VBox(rmin, rmax, gmin, gmax, bmin, bmax, histo);
}

// ---------------------------------------------------------------------------
// Median-cut split
// ---------------------------------------------------------------------------

function medianCutApply(histo: Uint32Array, vbox: VBox): [VBox, VBox] | undefined {
    const total = vbox.count();
    if (total <= 1) return undefined;

    const axes = [
        { min: 'r1', max: 'r2' },
        { min: 'g1', max: 'g2' },
        { min: 'b1', max: 'b2' },
    ] as const;

    const widestFirst = [...axes].sort((a, b) =>
        (vbox[b.max] - vbox[b.min]) - (vbox[a.max] - vbox[a.min]),
    );

    // A wide axis can still have all its pixels in one slice.
    for (const { min, max } of widestFirst) {
        const lower = vbox[min];
        const upper = vbox[max];
        if (lower === upper) continue;

        const sums = new Array<number>(upper - lower + 1).fill(0);
        for (let r = vbox.r1; r <= vbox.r2; r++) {
            for (let g = vbox.g1; g <= vbox.g2; g++) {
                for (let b = vbox.b1; b <= vbox.b2; b++) {
                    const slice = min === 'r1' ? r : min === 'g1' ? g : b;
                    sums[slice - lower] += histo[getColorIndex(r, g, b)];
                }
            }
        }

        for (let i = 1; i < sums.length; i++) sums[i] += sums[i - 1];
        const first = sums.findIndex(sum => sum > 0);
        const last = sums.findIndex(sum => sum === total);
        if (first === last) continue;

        const median = sums.findIndex(sum => sum > total / 2) + lower;
        const left = median - lower;
        const right = upper - median;
        const preferred = left <= right
            ? median + Math.floor(right / 2)
            : Math.floor(median - 1 - left / 2);
        const cut = Math.max(first + lower, Math.min(preferred, last + lower - 1));

        const vbox1 = vbox.copy();
        const vbox2 = vbox.copy();
        vbox1[max] = cut;
        vbox2[min] = cut + 1;
        return [vbox1, vbox2];
    }
    return undefined;
}

// ---------------------------------------------------------------------------
// Iterative splitting
// ---------------------------------------------------------------------------

function iterate(pq: PQueue<VBox>, target: number, histo: Uint32Array): void {
    const unsplittable: VBox[] = [];
    let niters = 0;

    while (pq.size() && pq.size() + unsplittable.length < target && niters < MAX_ITERATIONS) {
        niters++;
        const vbox = pq.pop();
        const result = medianCutApply(histo, vbox);

        if (result) {
            pq.push(result[0]);
            pq.push(result[1]);
        } else {
            unsplittable.push(vbox);
        }
    }

    for (const vbox of unsplittable) pq.push(vbox);
}

// ---------------------------------------------------------------------------
// Main quantize function
// ---------------------------------------------------------------------------

function quantize(
    pixels: Array<[number, number, number]>,
    maxColors: number,
): Array<{ color: [number, number, number]; population: number }> {
    if (!pixels.length || maxColors < 2 || maxColors > 256) return [];

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
