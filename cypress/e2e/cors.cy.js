describe('cross domain images with liberal CORS policy', function() {
    it('load', function() {
        cy.visit('http://localhost:8080/cypress/test-pages/cors.html');
        cy.get('#result').should(($el) => {
            const count = $el.text().split(',').length
            expect(count).to.equal(3);
        });
    })
});
