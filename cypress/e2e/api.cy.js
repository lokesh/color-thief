function rgbCount(text) {
    const vals = text.split(',');
    for (const val of vals) {
        if (val < 0 || val > 255) {
            throw 'Invalid RGB color value';
        }
    }
    return vals.length / 3
}

describe('getColorSync()', { testIsolation: false }, function() {
    before(function() {
        cy.visit('http://localhost:8080/cypress/test-pages/index.html');
    })

    it('returns valid color from black image', function() {
        cy.get('[data-image="black.png"] .output-color').should(($el) => {
            const count = rgbCount($el.text())
            expect(count).to.equal(1);
            const [r, g, b] = $el.text().split(',').map(Number);
            expect(r).to.be.lessThan(10);
            expect(g).to.be.lessThan(10);
            expect(b).to.be.lessThan(10);
        });
    })

    it('returns valid color from red image', function() {
        cy.get('[data-image="red.png"] .output-color').should(($el) => {
            const count = rgbCount($el.text())
            expect(count).to.equal(1);
            const [r, g, b] = $el.text().split(',').map(Number);
            expect(r).to.be.greaterThan(240);
            expect(g).to.be.lessThan(15);
            expect(b).to.be.lessThan(15);
        });
    })

    it('returns valid color from rainbow image', function() {
        cy.get('[data-image="rainbow-horizontal.png"] .output-color').should(($el) => {
            const count = rgbCount($el.text())
            expect(count).to.equal(1);
        });
    })

    it('returns valid color from white image', function() {
        cy.get('[data-image="white.png"] .output-color').should(($el) => {
            const count = rgbCount($el.text())
            expect(count).to.equal(1);
        });
    })

    it('returns valid color from transparent image', function() {
        cy.get('[data-image="transparent.png"] .output-color').should(($el) => {
            const count = rgbCount($el.text())
            expect(count).to.equal(1);
        });
    })
})

function testPaletteCount(num) {
    it(`returns ${num} color when colorCount set to ${num}`, function() {
        cy.get(`[data-image="rainbow-horizontal.png"] .palette[data-count="${num}"] .output-palette`).should(($el) => {
            const count = rgbCount($el.text())
            expect(count).to.equal(num);
        });
    })
}

describe('getPaletteSync()', function() {
    beforeEach(function() {
        cy.visit('http://localhost:8080/cypress/test-pages/index.html');
    })

    let testCounts = [2, 3, 5, 7, 10, 20];
    testCounts.forEach((count) => testPaletteCount(count))
})
