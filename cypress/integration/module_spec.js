describe('es6 module', function() {
    it('loads', function() {
        cy.visit('http://localhost:8080/cypress/test-pages/es6-module.html');
        cy.get('#result').should(($el) => {
            const count = $el.text().split(',').length
            expect(count).to.equal(3);
        });
    })
});
