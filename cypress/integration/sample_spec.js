describe('My First Test', function() {
	it('Does not do much!', function() {
		cy.visit('https://lokeshdhakar.com');
		cy.get('.nav__item').contains('Blog').click();
		cy.url().should('contain', 'blog');
	})
})