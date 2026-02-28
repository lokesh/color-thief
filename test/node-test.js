import { resolve } from 'path';
import { readFileSync } from 'fs';
import { getColor, getPalette, getSwatches, getPaletteProgressive, createColor } from '../dist/node/index.js';
import { rgbToOklch, oklchToRgb } from '../dist/node/internals.js';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

const expect = chai.expect;
chai.use(chaiAsPromised);

const imgDir = resolve(process.cwd(), 'cypress/test-pages/img');
const imgPath = (name) => resolve(imgDir, name);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isColorObject(c) {
    return (
        c !== null &&
        typeof c.rgb === 'function' &&
        typeof c.hex === 'function' &&
        typeof c.hsl === 'function' &&
        typeof c.oklch === 'function' &&
        typeof c.array === 'function' &&
        typeof c.isDark === 'boolean' &&
        typeof c.isLight === 'boolean' &&
        typeof c.population === 'number'
    );
}

function isValidRGB(color) {
    const { r, g, b } = color.rgb();
    return [r, g, b].every(v => Number.isInteger(v) && v >= 0 && v <= 255);
}

function isCloseTo(color, expected, tolerance = 15) {
    const arr = color.array();
    return arr.every((v, i) => Math.abs(v - expected[i]) <= tolerance);
}


// ===========================================================================
// getColor()
// ===========================================================================

describe('getColor()', function() {
    it('returns a Color object from file path', async function() {
        const color = await getColor(imgPath('rainbow-vertical.png'));
        expect(isColorObject(color)).to.be.true;
        expect(isValidRGB(color)).to.be.true;
    });

    it('returns a Color object from Buffer', async function() {
        const buffer = readFileSync(imgPath('rainbow-vertical.png'));
        const color = await getColor(buffer);
        expect(isColorObject(color)).to.be.true;
        expect(isValidRGB(color)).to.be.true;
    });

    it('returns near-black for black.png', async function() {
        const color = await getColor(imgPath('black.png'));
        expect(isColorObject(color)).to.be.true;
        expect(isCloseTo(color, [0, 0, 0])).to.be.true;
    });

    it('returns near-red for red.png', async function() {
        const color = await getColor(imgPath('red.png'));
        expect(isColorObject(color)).to.be.true;
        expect(isCloseTo(color, [255, 0, 0])).to.be.true;
    });

    it('returns valid Color for white.png', async function() {
        const color = await getColor(imgPath('white.png'));
        expect(isColorObject(color)).to.be.true;
        expect(isCloseTo(color, [255, 255, 255])).to.be.true;
    });

    it('returns valid Color for transparent.png', async function() {
        const color = await getColor(imgPath('transparent.png'));
        expect(isColorObject(color)).to.be.true;
    });

    it('respects quality option (quality=1)', async function() {
        const color = await getColor(imgPath('rainbow-vertical.png'), { quality: 1 });
        expect(isColorObject(color)).to.be.true;
    });

    it('respects quality option (quality=100)', async function() {
        const color = await getColor(imgPath('rainbow-vertical.png'), { quality: 100 });
        expect(isColorObject(color)).to.be.true;
    });

    it('rejects for non-existent file path', async function() {
        await expect(getColor('/non/existent/file.png')).to.be.rejected;
    });
});


// ===========================================================================
// getPalette()
// ===========================================================================

describe('getPalette()', function() {
    it('returns 10 colors with default colorCount', async function() {
        const palette = await getPalette(imgPath('rainbow-vertical.png'));
        expect(palette).to.have.lengthOf(10);
        palette.forEach(c => {
            expect(isColorObject(c)).to.be.true;
            expect(isValidRGB(c)).to.be.true;
        });
    });

    it('returns 2 colors (boundary min)', async function() {
        const palette = await getPalette(imgPath('rainbow-vertical.png'), { colorCount: 2 });
        expect(palette).to.have.lengthOf(2);
    });

    it('returns 20 colors (boundary max)', async function() {
        const palette = await getPalette(imgPath('rainbow-vertical.png'), { colorCount: 20 });
        expect(palette).to.have.lengthOf(20);
    });

    it('clamps colorCount=0 to 2', async function() {
        const palette = await getPalette(imgPath('rainbow-vertical.png'), { colorCount: 0 });
        expect(palette).to.have.lengthOf(2);
    });

    it('clamps colorCount=-1 to 2', async function() {
        const palette = await getPalette(imgPath('rainbow-vertical.png'), { colorCount: -1 });
        expect(palette).to.have.lengthOf(2);
    });

    it('clamps colorCount=21 to 20', async function() {
        const palette = await getPalette(imgPath('rainbow-vertical.png'), { colorCount: 21 });
        expect(palette).to.have.lengthOf(20);
    });

    it('rejects when colorCount=1', async function() {
        await expect(getPalette(imgPath('rainbow-vertical.png'), { colorCount: 1 })).to.be.rejected;
    });

    it('defaults non-integer colorCount (5.5) to 10', async function() {
        const palette = await getPalette(imgPath('rainbow-vertical.png'), { colorCount: 5.5 });
        expect(palette).to.have.lengthOf(10);
    });

    it('returns valid palette for white.png', async function() {
        const palette = await getPalette(imgPath('white.png'));
        expect(palette).to.be.an('array').that.is.not.empty;
        palette.forEach(c => expect(isColorObject(c)).to.be.true);
    });

    it('returns valid palette for transparent.png', async function() {
        const palette = await getPalette(imgPath('transparent.png'));
        expect(palette).to.be.an('array').that.is.not.empty;
        palette.forEach(c => expect(isColorObject(c)).to.be.true);
    });

    it('works with Buffer input', async function() {
        const buffer = readFileSync(imgPath('rainbow-vertical.png'));
        const palette = await getPalette(buffer, { colorCount: 5 });
        expect(palette).to.have.lengthOf(5);
        palette.forEach(c => expect(isColorObject(c)).to.be.true);
    });

    it('rejects for non-existent file', async function() {
        await expect(getPalette('/non/existent/file.png')).to.be.rejected;
    });
});


// ===========================================================================
// Color object
// ===========================================================================

describe('Color object', function() {
    it('rgb() returns {r, g, b}', function() {
        const c = createColor(255, 128, 0, 1);
        const { r, g, b } = c.rgb();
        expect(r).to.equal(255);
        expect(g).to.equal(128);
        expect(b).to.equal(0);
    });

    it('hex() returns lowercase hex string', function() {
        const c = createColor(255, 128, 0, 1);
        expect(c.hex()).to.equal('#ff8000');
    });

    it('hex() pads zeros correctly', function() {
        const c = createColor(0, 0, 0, 1);
        expect(c.hex()).to.equal('#000000');
    });

    it('array() returns [r, g, b]', function() {
        const c = createColor(10, 20, 30, 1);
        expect(c.array()).to.deep.equal([10, 20, 30]);
    });

    it('hsl() returns {h, s, l}', function() {
        const c = createColor(255, 0, 0, 1);
        const hsl = c.hsl();
        expect(hsl.h).to.equal(0);
        expect(hsl.s).to.equal(100);
        expect(hsl.l).to.equal(50);
    });

    it('oklch() returns {l, c, h}', function() {
        const c = createColor(255, 0, 0, 1);
        const oklch = c.oklch();
        expect(oklch.l).to.be.a('number');
        expect(oklch.c).to.be.a('number');
        expect(oklch.h).to.be.a('number');
        expect(oklch.l).to.be.greaterThan(0);
        expect(oklch.c).to.be.greaterThan(0);
    });

    it('isDark is true for black', function() {
        expect(createColor(0, 0, 0, 1).isDark).to.be.true;
    });

    it('isLight is true for white', function() {
        expect(createColor(255, 255, 255, 1).isLight).to.be.true;
    });

    it('isDark is true for dark red', function() {
        expect(createColor(128, 0, 0, 1).isDark).to.be.true;
    });

    it('isLight is true for light yellow', function() {
        expect(createColor(255, 255, 128, 1).isLight).to.be.true;
    });

    it('contrast has white and black ratios', function() {
        const c = createColor(128, 128, 128, 1);
        expect(c.contrast.white).to.be.a('number');
        expect(c.contrast.black).to.be.a('number');
        expect(c.contrast.white).to.be.greaterThan(1);
        expect(c.contrast.black).to.be.greaterThan(1);
    });

    it('contrast foreground is white for dark colors', function() {
        const c = createColor(0, 0, 0, 1);
        expect(c.contrast.foreground.array()).to.deep.equal([255, 255, 255]);
    });

    it('contrast foreground is black for light colors', function() {
        const c = createColor(255, 255, 255, 1);
        expect(c.contrast.foreground.array()).to.deep.equal([0, 0, 0]);
    });

    it('population is stored', function() {
        expect(createColor(0, 0, 0, 42).population).to.equal(42);
    });

    it('toString() returns hex string', function() {
        const c = createColor(255, 128, 0, 1);
        expect(c.toString()).to.equal('#ff8000');
        expect(`${c}`).to.equal('#ff8000');
        expect('' + c).to.equal('#ff8000');
    });

    it('textColor is #ffffff for dark colors', function() {
        expect(createColor(0, 0, 0, 1).textColor).to.equal('#ffffff');
        expect(createColor(128, 0, 0, 1).textColor).to.equal('#ffffff');
    });

    it('textColor is #000000 for light colors', function() {
        expect(createColor(255, 255, 255, 1).textColor).to.equal('#000000');
        expect(createColor(255, 255, 128, 1).textColor).to.equal('#000000');
    });
});


// ===========================================================================
// Color space conversions
// ===========================================================================

describe('Color space round-trip', function() {
    const TEST_COLORS = [
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255],
        [128, 128, 128],
        [255, 255, 0],
        [0, 255, 255],
        [255, 0, 255],
        [0, 0, 0],
        [255, 255, 255],
    ];

    TEST_COLORS.forEach(([r, g, b]) => {
        it(`RGB(${r},${g},${b}) → OKLCH → RGB within ±1`, function() {
            const oklch = rgbToOklch(r, g, b);
            const [r2, g2, b2] = oklchToRgb(oklch.l, oklch.c, oklch.h);
            expect(Math.abs(r - r2)).to.be.at.most(1);
            expect(Math.abs(g - g2)).to.be.at.most(1);
            expect(Math.abs(b - b2)).to.be.at.most(1);
        });
    });
});


// ===========================================================================
// getSwatches()
// ===========================================================================

describe('getSwatches()', function() {
    it('returns a SwatchMap with all 6 roles', async function() {
        const swatches = await getSwatches(imgPath('rainbow-vertical.png'));
        const roles = ['Vibrant', 'Muted', 'DarkVibrant', 'DarkMuted', 'LightVibrant', 'LightMuted'];
        roles.forEach(role => {
            expect(swatches).to.have.property(role);
        });
    });

    it('each swatch has expected structure', async function() {
        const swatches = await getSwatches(imgPath('rainbow-vertical.png'));
        for (const [, swatch] of Object.entries(swatches)) {
            if (swatch !== null) {
                expect(isColorObject(swatch.color)).to.be.true;
                expect(swatch.role).to.be.a('string');
                expect(isColorObject(swatch.titleTextColor)).to.be.true;
                expect(isColorObject(swatch.bodyTextColor)).to.be.true;
            }
        }
    });
});


// ===========================================================================
// OKLCH color space option
// ===========================================================================

describe('OKLCH color space', function() {
    it('getPalette with colorSpace: oklch returns valid colors', async function() {
        const palette = await getPalette(imgPath('rainbow-vertical.png'), {
            colorCount: 5,
            colorSpace: 'oklch',
        });
        expect(palette).to.have.lengthOf(5);
        palette.forEach(c => {
            expect(isColorObject(c)).to.be.true;
            expect(isValidRGB(c)).to.be.true;
        });
    });
});


// ===========================================================================
// AbortController
// ===========================================================================

describe('AbortController', function() {
    it('rejects when signal is already aborted', async function() {
        const controller = new AbortController();
        controller.abort();
        await expect(
            getColor(imgPath('rainbow-vertical.png'), { signal: controller.signal })
        ).to.be.rejected;
    });
});


// ===========================================================================
// Progressive extraction
// ===========================================================================

describe('getPaletteProgressive()', function() {
    it('yields 3 results with increasing progress', async function() {
        const results = [];
        for await (const result of getPaletteProgressive(imgPath('rainbow-vertical.png'), { colorCount: 5 })) {
            results.push(result);
        }
        expect(results).to.have.lengthOf(3);
        expect(results[0].progress).to.be.closeTo(0.06, 0.01);
        expect(results[1].progress).to.be.closeTo(0.25, 0.01);
        expect(results[2].progress).to.equal(1.0);
        expect(results[2].done).to.be.true;
        expect(results[0].done).to.be.false;
    });

    it('final pass returns Color objects', async function() {
        const results = [];
        for await (const result of getPaletteProgressive(imgPath('rainbow-vertical.png'), { colorCount: 5 })) {
            results.push(result);
        }
        const final = results[results.length - 1];
        expect(final.palette).to.have.lengthOf(5);
        final.palette.forEach(c => expect(isColorObject(c)).to.be.true);
    });
});
