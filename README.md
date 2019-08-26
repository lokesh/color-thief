
# Color Thief

Grab the color palette from an image using just Javascript.Works in the browser and in Node.

### 🌈 View the [demo page](https://lokeshdhakar.com/projects/color-thief/) for examples, API docs, and more. 

---

## Contributing

### Running tests

Run Cypress integration tests in Chrome browser.

- `npm run dev` to start local server.
- `npm run test`

### Adding tests

- Update `cypress/test-pages/index.html` as needed or create a new test page if you need new examples.
- Add new tests in `cypress/integration/apis_spec.js`

### Making a new release

- Merge `dev` into `master`
- Pull down `master`
- Update version number in `src/color-thief.js` and `package.json`
- Run `npm run build`
- Commit and push built files back up to `master`
- Create a new Github release along with tag. Naming convention for both ```v2.8.1```
- `npm publish`
