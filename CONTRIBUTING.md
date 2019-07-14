## Running tests

Run Cypress integration tests in Chrome browser.

- `npm run dev` to start local server.
- `npm run test`

## Adding tests

- Update `cypress/test-pages/index.html` as needed or create a new test page if you need new examples.
- Add new tests in `cypress/integration/apis_spec.js`

## Making a new release

- Merge `dev` into `master`
- Pull down `master`
- Update version number in `src/color-thief.js` and `package.json`
- Run `npm run build`
- Push to Github repo
- Create a new Github release along with tag. Naming convention for both ```v2.8.1```
