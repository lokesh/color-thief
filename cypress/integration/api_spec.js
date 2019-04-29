function rgbCount(text) {
    const vals = text.split(',');
    for (const val of vals) {
        if (val < 0 || val > 255) {
            throw 'Invalid RGB color value';
        }
    }
    return vals.length / 3
}

describe('getColor()', function() {
	beforeEach(function() {
        cy.visit('http://localhost:8080');
    })

    it('returns valid color from black image', function() {
        cy.get('[data-image="black.png"] .output-color').should(($el) => {
            const count = rgbCount($el.text())
            expect(count).to.equal(1);
        });
	})

    it('returns valid color from red image', function() {
        cy.get('[data-image="red.png"] .output-color').should(($el) => {
            const count = rgbCount($el.text())
            expect(count).to.equal(1);
        });
    })

    it('returns valid color from rainbow image', function() {
        cy.get('[data-image="rainbow-horizontal.png"] .output-color').should(($el) => {
            const count = rgbCount($el.text())
            expect(count).to.equal(1);
        });
    })

    // ⚠️BREAKS
    // it('returns valid color from white image', function() {
    //     cy.get('[data-image="white.png"] .output-color').should(($el) => {
    //         const count = rgbCount($el.text())
    //         expect(count).to.equal(1);
    //     });
    // })

    // ⚠️BREAKS
    // it('returns valid color from transparent image', function() {
    //     cy.get('[data-image="transparent.png"] .output-color').should(($el) => {
    //         const count = rgbCount($el.text())
    //         expect(count).to.equal(1);
    //     });
    // })
})
