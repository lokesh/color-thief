
# Color Thief

Grab the color palette from an image using just Javascript.Works in the browser and in Node.

### View the [demo page](https://lokeshdhakar.com/projects/color-thief/) for examples, API docs, and more.

---

## Contributing

### Project structure

+ `build/` - Simple script that copies and renames files into the /dist folder.
+ `cypress/` - Browsers tests.
+ `dist/` - Generated distribution files created by [microbundle](https://github.com/developit/microbundle) package and a couple of files copied via build script.
+ `examples/` - CSS, JS, and Images for the index.html example page.
+ `src/color-thief-node.js` - Source for the Node (commonjs) compatible version of the script.
+ `src/color-thief.js` - Source for the browser (ES6, AMD, Global var) compatible version of the script.
+ `src/core.js` - Functions shared between the node and browser versions of the script.
+ `test/` - Node integration tests. Uses Chai.
+ `index.html` - Example page.


### Running tests

There are two sets of tests:

1. Browser tests run with [Cypress](https://www.cypress.io)
2. Node tests run with [Karma](https://karma-runner.github.io/latest/index.html) and [Mocha](https://mochajs.org/)

To run both the browser and Node tests:

- `npm run dev` to start local server.
- `npm run test` then run tests in a separate process

To run just the browser tests with the Cypress UI:

- `npm run dev` to start local server
- `npm run test:browser`
or
- `npm run cypress` to view the Cypress UI

To run just the Node tests:

- `npm run test:node`


### Adding tests

- Update `cypress/test-pages/index.html` as needed or create a new test page if you need new examples.
- Add new tests in `cypress/integration/apis_spec.js`

### Making a new release

- Merge `dev` into `master`
- Pull down `master`
- Update version number in `src/color-thief.js` and `package.json`
- Delete `package-lock.json` and then install deps
- Run `npm run build`
- Confirm tests pass `npm run dev` and `npm run test`
- Commit and push built files back up to `master`
- Create a new Github release along with tag. Naming convention for both ```v2.8.1```
- `npm publish`