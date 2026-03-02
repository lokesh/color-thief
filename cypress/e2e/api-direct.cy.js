describe('Direct API - getColorSync()', { testIsolation: false }, function() {
    before(function() {
        cy.visit('http://localhost:8080/cypress/test-pages/api-direct.html');
        cy.get('body[data-ready="true"]', { timeout: 10000 });
    });

    it('returns near-black for black.png', function() {
        cy.window().then((win) => {
            const img = win.document.getElementById('img-black');
            const color = win.ColorThief.getColorSync(img);
            const [r, g, b] = color.array();
            expect(r).to.be.lessThan(10);
            expect(g).to.be.lessThan(10);
            expect(b).to.be.lessThan(10);
        });
    });

    it('returns near-red for red.png', function() {
        cy.window().then((win) => {
            const img = win.document.getElementById('img-red');
            const color = win.ColorThief.getColorSync(img);
            const [r, g, b] = color.array();
            expect(r).to.be.greaterThan(240);
            expect(g).to.be.lessThan(15);
            expect(b).to.be.lessThan(15);
        });
    });

    it('returns near-white for white.png', function() {
        cy.window().then((win) => {
            const img = win.document.getElementById('img-white');
            const color = win.ColorThief.getColorSync(img);
            const [r, g, b] = color.array();
            expect(r).to.be.greaterThan(240);
            expect(g).to.be.greaterThan(240);
            expect(b).to.be.greaterThan(240);
        });
    });

    it('returns valid color for transparent.png', function() {
        cy.window().then((win) => {
            const img = win.document.getElementById('img-transparent');
            const color = win.ColorThief.getColorSync(img);
            const rgb = color.array();
            expect(rgb).to.have.lengthOf(3);
        });
    });

    it('respects quality parameter', function() {
        cy.window().then((win) => {
            const img = win.document.getElementById('img-rainbow');
            const color1 = win.ColorThief.getColorSync(img, { quality: 1 });
            const color100 = win.ColorThief.getColorSync(img, { quality: 100 });
            expect(color1.array()).to.have.lengthOf(3);
            expect(color100.array()).to.have.lengthOf(3);
        });
    });
});

describe('Direct API - getPaletteSync()', { testIsolation: false }, function() {
    before(function() {
        cy.visit('http://localhost:8080/cypress/test-pages/api-direct.html');
        cy.get('body[data-ready="true"]', { timeout: 10000 });
    });

    it('returns default 10 colors', function() {
        cy.window().then((win) => {
            const img = win.document.getElementById('img-rainbow');
            const palette = win.ColorThief.getPaletteSync(img);
            expect(palette).to.have.lengthOf(10);
            palette.forEach(color => {
                expect(color.array()).to.have.lengthOf(3);
            });
        });
    });

    it('returns palette with white for white.png', function() {
        cy.window().then((win) => {
            const img = win.document.getElementById('img-white');
            const palette = win.ColorThief.getPaletteSync(img);
            expect(palette).to.be.an('array').that.has.lengthOf(1);
            const [r, g, b] = palette[0].array();
            expect(r).to.be.greaterThan(240);
            expect(g).to.be.greaterThan(240);
            expect(b).to.be.greaterThan(240);
        });
    });

    it('returns valid palette for transparent.png', function() {
        cy.window().then((win) => {
            const img = win.document.getElementById('img-transparent');
            const palette = win.ColorThief.getPaletteSync(img);
            expect(palette).to.be.an('array').that.is.not.empty;
            palette.forEach(color => expect(color.array()).to.have.lengthOf(3));
        });
    });

    it('throws when colorCount=1', function() {
        cy.window().then((win) => {
            const img = win.document.getElementById('img-rainbow');
            expect(() => win.ColorThief.getPaletteSync(img, { colorCount: 1 })).to.throw();
        });
    });

    it('clamps colorCount=0 to 2', function() {
        cy.window().then((win) => {
            const img = win.document.getElementById('img-rainbow');
            const palette = win.ColorThief.getPaletteSync(img, { colorCount: 0 });
            expect(palette).to.have.lengthOf(2);
        });
    });

    it('clamps colorCount=21 to 20', function() {
        cy.window().then((win) => {
            const img = win.document.getElementById('img-rainbow');
            const palette = win.ColorThief.getPaletteSync(img, { colorCount: 21 });
            expect(palette).to.have.lengthOf(20);
        });
    });
});

describe('Direct API - Input Types', { testIsolation: false }, function() {
    before(function() {
        cy.visit('http://localhost:8080/cypress/test-pages/api-direct.html');
        cy.get('body[data-ready="true"]', { timeout: 10000 });
    });

    it('accepts HTMLCanvasElement input', function() {
        cy.window().then((win) => {
            const img = win.document.getElementById('img-red');
            const canvas = win.document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            const color = win.ColorThief.getColorSync(canvas);
            const [r] = color.array();
            expect(r).to.be.greaterThan(240);
        });
    });

    it('accepts ImageData input', function() {
        cy.window().then((win) => {
            const img = win.document.getElementById('img-red');
            const canvas = win.document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const color = win.ColorThief.getColorSync(imageData);
            const [r] = color.array();
            expect(r).to.be.greaterThan(240);
        });
    });

    it('accepts ImageBitmap input', function() {
        cy.window().then((win) => {
            const img = win.document.getElementById('img-red');
            return win.createImageBitmap(img).then((bitmap) => {
                const color = win.ColorThief.getColorSync(bitmap);
                const [r] = color.array();
                expect(r).to.be.greaterThan(240);
            });
        });
    });

    it('accepts options object with HTMLCanvasElement', function() {
        cy.window().then((win) => {
            const img = win.document.getElementById('img-rainbow');
            const canvas = win.document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            const palette = win.ColorThief.getPaletteSync(canvas, { colorCount: 5 });
            expect(palette).to.have.lengthOf(5);
        });
    });
});
