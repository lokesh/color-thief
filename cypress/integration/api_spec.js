describe('API', function() {
	beforeEach(function() {
        cy.visit('http://localhost:8080');
    })

    it('Does not do much!', function() {
		// console.log(colorThief);
        expect(true).to.equal(true);
		// cy.get('.nav__item').contains('Blog').click();
		// cy.url().should('contain', 'blog');
	})
})
