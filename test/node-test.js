import { resolve } from 'path';
import { readFileSync } from 'fs';
import { getColor, getPalette, getSwatches, getPaletteProgressive, createColor } from '../dist/index.js';
import {
    rgbToOklch,
    oklchToRgb,
    srgbToLinear,
    linearToSrgb,
    p3ToSrgb,
    srgbToP3,
    isOutOfSrgbGamut,
    relativeLuminance,
    resolveOutputGamut,
    extractPalette,
    validateOptions,
    MmcqQuantizer,
    createNodeLoader,
} from '../dist/internals.js';
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
        typeof c.css === 'function' &&
        typeof c.array === 'function' &&
        typeof c.isDark === 'boolean' &&
        typeof c.isLight === 'boolean' &&
        typeof c.population === 'number' &&
        typeof c.proportion === 'number'
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

    it('returns perfect black for black.png', async function() {
        const color = await getColor(imgPath('black.png'));
        expect(isColorObject(color)).to.be.true;
        expect(color.array()).to.deep.equal([0, 0, 0]);
    });

    it('returns perfect red for red.png', async function() {
        const color = await getColor(imgPath('red.png'));
        expect(isColorObject(color)).to.be.true;
        expect(color.array()).to.deep.equal([255, 0, 0]);
    });

    it('returns perfect white for white.png', async function() {
        const color = await getColor(imgPath('white.png'));
        expect(isColorObject(color)).to.be.true;
        expect(color.array()).to.deep.equal([255, 255, 255]);
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

    it('palette colors have proportion summing to ~1', async function() {
        const palette = await getPalette(imgPath('rainbow-vertical.png'), { colorCount: 5 });
        const totalProportion = palette.reduce((sum, c) => sum + c.proportion, 0);
        expect(totalProportion).to.be.closeTo(1, 0.01);
        palette.forEach(c => {
            expect(c.proportion).to.be.a('number');
            expect(c.proportion).to.be.greaterThan(0);
            expect(c.proportion).to.be.at.most(1);
        });
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

    it('proportion defaults to 0', function() {
        expect(createColor(0, 0, 0, 42).proportion).to.equal(0);
    });

    it('css() returns rgb string by default', function() {
        const c = createColor(255, 128, 0, 1);
        expect(c.css()).to.equal('rgb(255, 128, 0)');
    });

    it("css('rgb') returns rgb string", function() {
        const c = createColor(255, 128, 0, 1);
        expect(c.css('rgb')).to.equal('rgb(255, 128, 0)');
    });

    it("css('hsl') returns hsl string", function() {
        const c = createColor(255, 0, 0, 1);
        expect(c.css('hsl')).to.equal('hsl(0, 100%, 50%)');
    });

    it("css('oklch') returns oklch string", function() {
        const c = createColor(255, 0, 0, 1);
        const result = c.css('oklch');
        expect(result).to.match(/^oklch\(\d+\.\d+ \d+\.\d+ \d+\.\d+\)$/);
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

// ===========================================================================
// Wide-gamut (Display P3) support
// ===========================================================================

describe('gamut math', function() {
    it('srgb → p3 → srgb round-trips for in-gamut colors', function() {
        // Tolerance is a few LSBs: the intermediate P3 value is re-quantized to
        // 8-bit, so a double round-trip legitimately loses a little precision.
        const samples = [[255, 0, 0], [0, 255, 0], [0, 0, 255], [128, 128, 128], [200, 100, 50]];
        for (const [r, g, b] of samples) {
            const [pr, pg, pb] = srgbToP3(r, g, b);
            const [sr, sg, sb] = p3ToSrgb(pr, pg, pb);
            expect(Math.abs(sr - r)).to.be.at.most(4);
            expect(Math.abs(sg - g)).to.be.at.most(4);
            expect(Math.abs(sb - b)).to.be.at.most(4);
        }
    });

    it('isOutOfSrgbGamut: pure P3 primaries are outside sRGB', function() {
        expect(isOutOfSrgbGamut(255, 0, 0)).to.be.true;
        expect(isOutOfSrgbGamut(0, 255, 0)).to.be.true;
    });

    it('isOutOfSrgbGamut: neutrals and white stay in gamut', function() {
        expect(isOutOfSrgbGamut(128, 128, 128)).to.be.false;
        expect(isOutOfSrgbGamut(255, 255, 255)).to.be.false;
        expect(isOutOfSrgbGamut(0, 0, 0)).to.be.false;
    });

    it('P3 red has higher OKLCH chroma than sRGB red', function() {
        const srgb = rgbToOklch(255, 0, 0, 'srgb');
        const p3 = rgbToOklch(255, 0, 0, 'display-p3');
        expect(p3.c).to.be.greaterThan(srgb.c);
    });

    it('OKLCH round-trips in the P3 gamut within ±1', function() {
        for (const [r, g, b] of [[255, 0, 0], [0, 200, 120], [40, 80, 220]]) {
            const { l, c, h } = rgbToOklch(r, g, b, 'display-p3');
            const [r2, g2, b2] = oklchToRgb(l, c, h, 'display-p3');
            expect(Math.abs(r2 - r)).to.be.at.most(1);
            expect(Math.abs(g2 - g)).to.be.at.most(1);
            expect(Math.abs(b2 - b)).to.be.at.most(1);
        }
    });

    it('relativeLuminance of white is ~1 in both gamuts', function() {
        expect(relativeLuminance(255, 255, 255, 'srgb')).to.be.closeTo(1, 0.001);
        expect(relativeLuminance(255, 255, 255, 'display-p3')).to.be.closeTo(1, 0.02);
    });
});

describe('resolveOutputGamut()', function() {
    it('sRGB pixels always resolve to sRGB', function() {
        expect(resolveOutputGamut([[255, 0, 0]], 'srgb', 'auto')).to.equal('srgb');
        expect(resolveOutputGamut([[255, 0, 0]], 'srgb', 'display-p3')).to.equal('srgb');
    });

    it('explicit display-p3 keeps P3 output', function() {
        expect(resolveOutputGamut([[128, 128, 128]], 'display-p3', 'display-p3')).to.equal('display-p3');
    });

    it('auto upgrades to P3 only when a pixel is out of sRGB gamut', function() {
        expect(resolveOutputGamut([[255, 0, 0]], 'display-p3', 'auto')).to.equal('display-p3');
        expect(resolveOutputGamut([[128, 128, 128]], 'display-p3', 'auto')).to.equal('srgb');
    });
});

describe('P3 Color object', function() {
    it('reports its gamut', function() {
        expect(createColor(255, 0, 0, 1, 0.5, 'display-p3').gamut).to.equal('display-p3');
        expect(createColor(255, 0, 0, 1, 0.5).gamut).to.equal('srgb');
    });

    it('css() emits color(display-p3 ...) for P3 colors', function() {
        const c = createColor(255, 0, 0, 1, 0.5, 'display-p3');
        expect(c.css()).to.equal('color(display-p3 1 0 0)');
    });

    it('css(rgb) and default css stay sRGB for sRGB colors', function() {
        const c = createColor(255, 0, 0, 1, 0.5);
        expect(c.css()).to.equal('rgb(255, 0, 0)');
        expect(c.css('rgb')).to.equal('rgb(255, 0, 0)');
    });

    it('hex()/array()/rgb() gamut-map P3 to safe sRGB values', function() {
        const c = createColor(255, 0, 0, 1, 0.5, 'display-p3');
        const [r, g, b] = c.array();
        expect([r, g, b].every((v) => Number.isInteger(v) && v >= 0 && v <= 255)).to.be.true;
        expect(c.hex()).to.match(/^#[0-9a-f]{6}$/);
        // Default rgb() is sRGB-mapped; raw P3 available via rgb('display-p3').
        expect(c.rgb('display-p3')).to.deep.equal({ r: 255, g: 0, b: 0 });
    });

    it('oklch() reflects the wider P3 chroma', function() {
        const p3 = createColor(255, 0, 0, 1, 0.5, 'display-p3');
        const srgb = createColor(255, 0, 0, 1, 0.5);
        expect(p3.oklch().c).to.be.greaterThan(srgb.oklch().c);
    });
});

// ===========================================================================
// Pipeline gamut integration (extractPalette with synthetic P3 buffers)
// ===========================================================================

/** Build an RGBA buffer from RGB triplets (alpha defaults to 255). */
function rgbaBuffer(pixels) {
    const data = new Uint8ClampedArray(pixels.length * 4);
    pixels.forEach(([r, g, b, a = 255], i) => {
        data[i * 4] = r;
        data[i * 4 + 1] = g;
        data[i * 4 + 2] = b;
        data[i * 4 + 3] = a;
    });
    return data;
}

describe('extractPalette() gamut integration', function() {
    let quantizer;
    before(async function() {
        quantizer = new MmcqQuantizer();
        await quantizer.init();
    });

    function run(pixels, gamut, pixelColorSpace, colorCount = 2) {
        const data = rgbaBuffer(pixels);
        const opts = validateOptions({ gamut, colorCount, quality: 1 });
        return extractPalette(data, pixels.length, 1, opts, quantizer, pixelColorSpace);
    }

    it('explicit display-p3 tags colors P3 and preserves saturation', function() {
        const palette = run(Array(16).fill([255, 0, 0]), 'display-p3', 'display-p3');
        expect(palette[0].gamut).to.equal('display-p3');
        expect(palette[0].css()).to.match(/^color\(display-p3 /);
        expect(palette[0].rgb('display-p3').r).to.be.greaterThan(250);
    });

    it("auto upgrades to P3 when pixels are out of sRGB gamut", function() {
        const palette = run(Array(16).fill([255, 0, 0]), 'auto', 'display-p3');
        expect(palette[0].gamut).to.equal('display-p3');
    });

    it('auto stays sRGB when P3 pixels are all within sRGB gamut', function() {
        const palette = run(Array(16).fill([128, 128, 128]), 'auto', 'display-p3');
        expect(palette[0].gamut).to.equal('srgb');
        expect(isCloseTo(palette[0], [128, 128, 128], 3)).to.be.true;
    });

    it('explicit srgb request maps P3 pixels down to sRGB', function() {
        // Guards the resolveOutputGamut fix: an explicit sRGB request wins even
        // when the pixels are P3-encoded.
        const palette = run(Array(16).fill([255, 0, 0]), 'srgb', 'display-p3');
        expect(palette[0].gamut).to.equal('srgb');
        const [r, g, b] = palette[0].array();
        expect(r).to.be.greaterThan(240);
        expect(g).to.be.at.most(20);
        expect(b).to.be.at.most(20);
    });

    it('sRGB pixels stay sRGB by default', function() {
        const palette = run(Array(16).fill([10, 120, 200]), 'srgb', 'srgb');
        expect(palette[0].gamut).to.equal('srgb');
        expect(isCloseTo(palette[0], [10, 120, 200], 2)).to.be.true;
    });

    it('quantizer path (more colors than colorCount) keeps the gamut tag', function() {
        const colors = [
            [255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0],
            [0, 255, 255], [255, 0, 255], [128, 64, 32], [32, 64, 128],
        ];
        const palette = run(colors, 'display-p3', 'display-p3', 4);
        expect(palette.length).to.be.greaterThan(1);
        palette.forEach((c) => expect(c.gamut).to.equal('display-p3'));
    });
});

describe('validateOptions() gamut', function() {
    it('defaults gamut to srgb', function() {
        expect(validateOptions({}).gamut).to.equal('srgb');
    });
    it('passes through display-p3 and auto', function() {
        expect(validateOptions({ gamut: 'display-p3' }).gamut).to.equal('display-p3');
        expect(validateOptions({ gamut: 'auto' }).gamut).to.equal('auto');
    });
});

// ===========================================================================
// P3 Color object — accessor consistency
// ===========================================================================

describe('P3 Color object accessors', function() {
    const p3 = () => createColor(255, 0, 0, 1, 0.5, 'display-p3');

    it("css('rgb') stays sRGB even for a P3 color", function() {
        expect(p3().css('rgb')).to.match(/^rgb\(/);
        expect(p3().css('rgb')).to.not.contain('display-p3');
    });

    it('default rgb(), rgb("srgb") and array() agree (all sRGB)', function() {
        const c = p3();
        const def = c.rgb();
        expect(c.rgb('srgb')).to.deep.equal(def);
        expect(c.array()).to.deep.equal([def.r, def.g, def.b]);
    });

    it('toString()/hex() are sRGB for a P3 color', function() {
        const c = p3();
        expect(c.toString()).to.equal(c.hex());
        const [r, g, b] = c.array();
        const hex = '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
        expect(c.hex()).to.equal(hex);
    });

    it("rgb('display-p3') widens an sRGB color into P3", function() {
        const srgb = createColor(255, 0, 0, 1, 0.5); // sRGB red
        const { r, g, b } = srgb.rgb('display-p3');
        // sRGB red is less saturated than P3 red, so it encodes below the P3 corner.
        expect(r).to.be.within(200, 250);
        expect(g).to.be.greaterThan(30);
        expect(b).to.be.greaterThan(15);
    });

    it('lazy accessors are cached (return the same object)', function() {
        const c = p3();
        expect(c.oklch()).to.equal(c.oklch());
        expect(c.hsl()).to.equal(c.hsl());
    });

    it('gamut-aware luminance still yields a usable isDark/contrast', function() {
        const c = p3();
        expect(c.isDark).to.be.a('boolean');
        expect(c.isLight).to.equal(!c.isDark);
        expect(c.contrast.white).to.be.within(1, 21);
        expect(c.contrast.black).to.be.within(1, 21);
    });
});

// ===========================================================================
// Existing-gap coverage
// ===========================================================================

describe('sRGB transfer round-trip', function() {
    it('linearToSrgb(srgbToLinear(c)) === c for integer channels', function() {
        for (const c of [0, 1, 15, 64, 128, 200, 254, 255]) {
            expect(linearToSrgb(srgbToLinear(c))).to.equal(c);
        }
    });
});

describe('oklchToRgb clamping', function() {
    it('clamps impossible (over-saturated) OKLCH into 0–255', function() {
        const [r, g, b] = oklchToRgb(0.6, 5, 30); // chroma far beyond any gamut
        [r, g, b].forEach((v) => {
            expect(Number.isInteger(v)).to.be.true;
            expect(v).to.be.within(0, 255);
        });
    });
});

describe('custom Node decoder', function() {
    it('honors a decoder supplied via createNodeLoader', async function() {
        const loader = createNodeLoader({
            decoder: async () => ({
                data: new Uint8Array([12, 34, 56, 255, 12, 34, 56, 255]),
                width: 2,
                height: 1,
            }),
        });
        const color = await getColor('ignored-source', { loader });
        expect(color.array()).to.deep.equal([12, 34, 56]);
        expect(color.gamut).to.equal('srgb');
    });
});
