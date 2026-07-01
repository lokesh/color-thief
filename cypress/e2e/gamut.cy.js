// Wide-gamut (Display P3) browser tests.
//
// img-p3-red is a PNG whose raw pixels are (255,0,0) tagged with a Display P3
// ICC profile, so the red is outside the sRGB gamut when read through a P3
// canvas. P3-dependent tests are skipped where the browser lacks P3 canvas
// support (the library falls back to sRGB there).

function p3CanvasSupported(win) {
    try {
        const c = win.document.createElement('canvas');
        const ctx = c.getContext('2d', { colorSpace: 'display-p3' });
        return !!ctx && ctx.getContextAttributes?.().colorSpace === 'display-p3';
    } catch (e) {
        return false;
    }
}

/** Build a small Display-P3 ImageData filled with P3 red. */
function makeP3RedImageData(win) {
    const w = 4;
    const h = 4;
    const data = new win.Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
        data[i * 4] = 255;
        data[i * 4 + 3] = 255;
    }
    return new win.ImageData(data, w, h, { colorSpace: 'display-p3' });
}

describe('Wide-gamut (Display P3)', { testIsolation: false }, function() {
    let p3;

    before(function() {
        cy.visit('http://localhost:8080/cypress/test-pages/gamut.html');
        cy.get('body[data-ready="true"]', { timeout: 10000 });
        cy.window().then((win) => {
            p3 = p3CanvasSupported(win);
        });
    });

    // --- sRGB default stays backward compatible ---------------------------

    it('default (no gamut option) reports sRGB for the P3 image', function() {
        cy.window().then((win) => {
            const img = win.document.getElementById('img-p3-red');
            const color = win.ColorThief.getColorSync(img);
            expect(color.gamut).to.equal('srgb');
            const [r, g, b] = color.array();
            expect(r).to.be.greaterThan(240); // P3 red clips to sRGB red
            expect(g).to.be.lessThan(20);
            expect(b).to.be.lessThan(20);
            expect(color.css()).to.match(/^rgb\(/);
        });
    });

    // --- Explicit display-p3 ---------------------------------------------

    it('gamut:"display-p3" preserves the wide-gamut red (sync, <img>)', function() {
        if (!p3) this.skip();
        cy.window().then((win) => {
            const img = win.document.getElementById('img-p3-red');
            const color = win.ColorThief.getColorSync(img, { gamut: 'display-p3' });
            expect(color.gamut).to.equal('display-p3');
            expect(color.css()).to.match(/^color\(display-p3 /);
            const { r, g, b } = color.rgb('display-p3');
            expect(r).to.be.greaterThan(240);
            expect(g).to.be.lessThan(20);
            expect(b).to.be.lessThan(20);
            // rgb()/array() are still safe sRGB.
            expect(color.array().every((v) => v >= 0 && v <= 255)).to.be.true;
        });
    });

    it('gamut:"display-p3" red has higher OKLCH chroma than the sRGB read', function() {
        if (!p3) this.skip();
        cy.window().then((win) => {
            const img = win.document.getElementById('img-p3-red');
            const p3Color = win.ColorThief.getColorSync(img, { gamut: 'display-p3' });
            const srgbColor = win.ColorThief.getColorSync(img);
            expect(p3Color.oklch().c).to.be.greaterThan(srgbColor.oklch().c);
        });
    });

    // --- Auto detection ---------------------------------------------------

    it('gamut:"auto" upgrades to display-p3 for out-of-sRGB content', function() {
        if (!p3) this.skip();
        cy.window().then((win) => {
            const img = win.document.getElementById('img-p3-red');
            const color = win.ColorThief.getColorSync(img, { gamut: 'auto' });
            expect(color.gamut).to.equal('display-p3');
        });
    });

    // --- Async + worker paths --------------------------------------------

    it('async getColor honors gamut:"display-p3"', function() {
        if (!p3) this.skip();
        cy.window().then((win) => {
            const img = win.document.getElementById('img-p3-red');
            return win.ColorThief.getColor(img, { gamut: 'display-p3' }).then((color) => {
                expect(color.gamut).to.equal('display-p3');
            });
        });
    });

    it('async getPalette tags every color with the resolved gamut', function() {
        if (!p3) this.skip();
        cy.window().then((win) => {
            const img = win.document.getElementById('img-p3-red');
            return win.ColorThief.getPalette(img, { gamut: 'auto', colorCount: 3 }).then((palette) => {
                expect(palette).to.be.an('array').that.is.not.empty;
                palette.forEach((c) => expect(c.gamut).to.equal('display-p3'));
            });
        });
    });

    it('worker path carries the gamut through', function() {
        if (!p3) this.skip();
        cy.window().then((win) => {
            const img = win.document.getElementById('img-p3-red');
            return win.ColorThief.getPalette(img, { worker: true, gamut: 'display-p3' }).then((palette) => {
                expect(palette).to.be.an('array').that.is.not.empty;
                palette.forEach((c) => expect(c.gamut).to.equal('display-p3'));
            });
        });
    });

    // --- Other P3 source types -------------------------------------------

    it('reads a P3-backed canvas', function() {
        if (!p3) this.skip();
        cy.window().then((win) => {
            const canvas = win.document.createElement('canvas');
            canvas.width = canvas.height = 8;
            const ctx = canvas.getContext('2d', { colorSpace: 'display-p3' });
            ctx.fillStyle = 'color(display-p3 1 0 0)';
            ctx.fillRect(0, 0, 8, 8);
            const color = win.ColorThief.getColorSync(canvas, { gamut: 'display-p3' });
            expect(color.gamut).to.equal('display-p3');
            expect(color.css()).to.match(/^color\(display-p3 /);
        });
    });

    it('honors a Display-P3 ImageData source', function() {
        if (!p3) this.skip();
        cy.window().then((win) => {
            const imageData = makeP3RedImageData(win);
            const color = win.ColorThief.getColorSync(imageData, { gamut: 'auto' });
            expect(color.gamut).to.equal('display-p3');
        });
    });
});
