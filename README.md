
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
