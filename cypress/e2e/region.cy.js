// Region / area extraction tests (issue #176).
//
// canvas-halves is a 40x40 canvas: top half solid red, bottom half solid blue.
// img-rainbow sweeps top-to-bottom from warm red/orange through green to
// magenta, so a region assertion on it can't accidentally pass on the
// whole-image result.

const TOP = { x: 0, y: 0, width: 1, height: 0.5 };
const BOTTOM = { x: 0, y: 0.5, width: 1, height: 0.5 };
const FULL = { x: 0, y: 0, width: 1, height: 1 };

describe('Region extraction', { testIsolation: false }, function() {
    before(function() {
        cy.visit('http://localhost:8080/cypress/test-pages/region.html');
        cy.get('body[data-ready="true"]', { timeout: 10000 });
    });

    // --- Sync API ---------------------------------------------------------

    it('getColorSync() on a canvas honors the top region', function() {
        cy.window().then((win) => {
            const canvas = win.document.getElementById('canvas-halves');
            const color = win.ColorThief.getColorSync(canvas, { region: TOP });
            expect(color.array()).to.deep.equal([255, 0, 0]);
        });
    });

    it('getColorSync() on a canvas honors the bottom region', function() {
        cy.window().then((win) => {
            const canvas = win.document.getElementById('canvas-halves');
            const color = win.ColorThief.getColorSync(canvas, { region: BOTTOM });
            expect(color.array()).to.deep.equal([0, 0, 255]);
        });
    });

    it('getPaletteSync() without a region sees both halves', function() {
        cy.window().then((win) => {
            const canvas = win.document.getElementById('canvas-halves');
            const hexes = win.ColorThief.getPaletteSync(canvas).map((c) => c.hex());
            expect(hexes).to.include('#ff0000');
            expect(hexes).to.include('#0000ff');
        });
    });

    it('getPaletteSync() with a region sees only that half', function() {
        cy.window().then((win) => {
            const canvas = win.document.getElementById('canvas-halves');
            const hexes = win.ColorThief.getPaletteSync(canvas, { region: BOTTOM }).map((c) => c.hex());
            expect(hexes).to.deep.equal(['#0000ff']);
        });
    });

    it('a full-image region matches the no-region result', function() {
        cy.window().then((win) => {
            const canvas = win.document.getElementById('canvas-halves');
            const plain = win.ColorThief.getPaletteSync(canvas).map((c) => c.hex());
            const full = win.ColorThief.getPaletteSync(canvas, { region: FULL }).map((c) => c.hex());
            expect(full).to.deep.equal(plain);
        });
    });

    it('getSwatchesSync() honors the region', function() {
        cy.window().then((win) => {
            const canvas = win.document.getElementById('canvas-halves');
            const swatches = win.ColorThief.getSwatchesSync(canvas, { region: TOP });
            const found = Object.values(swatches).filter(Boolean);
            expect(found.length).to.be.greaterThan(0);
            found.forEach((s) => expect(s.color.array()).to.deep.equal([255, 0, 0]));
        });
    });

    it('a horizontal region selects columns, not just rows', function() {
        cy.window().then((win) => {
            // Repaint a left/right split on a scratch canvas.
            const canvas = win.document.createElement('canvas');
            canvas.width = 40;
            canvas.height = 40;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgb(255, 0, 0)';
            ctx.fillRect(0, 0, 20, 40);
            ctx.fillStyle = 'rgb(0, 0, 255)';
            ctx.fillRect(20, 0, 20, 40);

            const left = win.ColorThief.getColorSync(canvas, { region: { x: 0, y: 0, width: 0.5, height: 1 } });
            const right = win.ColorThief.getColorSync(canvas, { region: { x: 0.5, y: 0, width: 0.5, height: 1 } });
            expect(left.array()).to.deep.equal([255, 0, 0]);
            expect(right.array()).to.deep.equal([0, 0, 255]);
        });
    });

    // --- <img> sources ----------------------------------------------------

    it('a region on an <img> picks up the local colors', function() {
        cy.window().then((win) => {
            const img = win.document.getElementById('img-rainbow');
            const top = win.ColorThief.getColorSync(img, { region: { x: 0, y: 0, width: 1, height: 0.1 } });
            const bottom = win.ColorThief.getColorSync(img, { region: { x: 0, y: 0.9, width: 1, height: 0.1 } });

            expect(top.hex()).to.not.equal(bottom.hex());
            expect(top.array()[2]).to.be.lessThan(60);      // warm, little blue
            expect(bottom.array()[2]).to.be.greaterThan(150); // magenta
        });
    });

    // --- ImageData sources ------------------------------------------------

    it('a region applies to ImageData sources', function() {
        cy.window().then((win) => {
            const canvas = win.document.getElementById('canvas-halves');
            const imageData = canvas.getContext('2d').getImageData(0, 0, 40, 40);
            const color = win.ColorThief.getColorSync(imageData, { region: BOTTOM });
            expect(color.array()).to.deep.equal([0, 0, 255]);
        });
    });

    // --- Async paths -------------------------------------------------------

    it('async getPalette() honors the region', function() {
        cy.window().then((win) => {
            const canvas = win.document.getElementById('canvas-halves');
            return win.ColorThief.getPalette(canvas, { region: BOTTOM }).then((palette) => {
                expect(palette.map((c) => c.hex())).to.deep.equal(['#0000ff']);
            });
        });
    });

    it('the deprecated worker option still honors the region', function() {
        cy.window().then((win) => {
            const canvas = win.document.getElementById('canvas-halves');
            return win.ColorThief.getPalette(canvas, { worker: true, region: TOP }).then((palette) => {
                expect(palette.length).to.be.greaterThan(0);
                palette.forEach((c) => {
                    const [r, g, b] = c.array();
                    expect(r).to.be.greaterThan(200);
                    expect(g).to.be.lessThan(60);
                    expect(b).to.be.lessThan(60);
                });
            });
        });
    });

    it('getPaletteProgressive() honors the region on every pass', function() {
        cy.window().then((win) => {
            const canvas = win.document.getElementById('canvas-halves');
            const seen = [];
            const iterate = async () => {
                for await (const result of win.ColorThief.getPaletteProgressive(canvas, { region: BOTTOM })) {
                    seen.push(result.palette.map((c) => c.hex()));
                }
            };
            return iterate().then(() => {
                expect(seen).to.have.lengthOf(3);
                seen.forEach((hexes) => expect(hexes).to.deep.equal(['#0000ff']));
            });
        });
    });

    // --- observe() --------------------------------------------------------

    it('observe() passes the region through', function() {
        cy.window().then((win) => {
            const img = win.document.getElementById('img-rainbow');
            const palettes = [];
            const controller = win.ColorThief.observe(img, {
                region: { x: 0, y: 0.9, width: 1, height: 0.1 },
                colorCount: 3,
                onChange(palette) {
                    palettes.push(palette);
                },
            });
            controller.stop();

            // An already-loaded <img> extracts synchronously on observe().
            expect(palettes.length).to.be.greaterThan(0);
            expect(palettes[0][0].array()[2]).to.be.greaterThan(150); // magenta
        });
    });

    // --- Validation -------------------------------------------------------

    it('throws for an out-of-range region (sync)', function() {
        cy.window().then((win) => {
            const canvas = win.document.getElementById('canvas-halves');
            // Caught by hand: the error comes from the app's realm, so chai's
            // instanceof-based .throw() matcher doesn't recognize it.
            let message = null;
            try {
                win.ColorThief.getColorSync(canvas, {
                    region: { x: 0, y: 0, width: 2, height: 1 },
                });
            } catch (err) {
                message = err.message;
            }
            expect(message).to.match(/region\.width/);
        });
    });

    it('rejects for an out-of-range region (async)', function() {
        cy.window().then((win) => {
            const canvas = win.document.getElementById('canvas-halves');
            return win.ColorThief.getPalette(canvas, {
                region: { x: 0, y: 0, width: 1, height: 0 },
            }).then(
                () => { throw new Error('should have rejected'); },
                (err) => { expect(err.message).to.match(/greater than 0/); },
            );
        });
    });
});
