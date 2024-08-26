
<div id="title" align="center">
    <h1>ColorThief</h1>
</div>

<div id="badges" align="center">
    <img alt="Project License" src="https://img.shields.io/github/license/janishutz/color-thief.svg">
    <img alt="GitHub Repo size" src="https://img.shields.io/github/repo-size/janishutz/color-thief.svg">
    <img alt="GitHub Repo issues" src="https://img.shields.io/github/issues-pr-raw/janishutz/color-thief">
    <img alt="Top Languages" src="https://img.shields.io/github/languages/top/janishutz/color-thief">
    <img alt="GitHub Repo filecount" src="https://img.shields.io/github/directory-file-count/janishutz/color-thief.svg">
    <br>
    <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/janishutz/color-thief">
    <img alt="GitHub watchers" src="https://img.shields.io/github/watchers/janishutz/color-thief">
    <img alt="GitHub forks" src="https://img.shields.io/github/forks/janishutz/color-thief">
    <img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/m/janishutz/color-thief">
    <br>
    <img alt="GitHub all releases" src="https://img.shields.io/github/downloads/janishutz/color-thief/total?label=Downloads (total)">
    <img alt="GitHub release (latest by date)" src="https://img.shields.io/github/downloads/janishutz/color-thief/latest/total?label=Downloads (latest)">
    <img alt="Latest release" src="https://img.shields.io/github/release/janishutz/color-thief.svg">
    <img alt="App Version" src="https://img.shields.io/github/package-json/v/janishutz/color-thief.svg?label=Development Version">
</div>

Grab the color palette from an image using just Javascript.Works in the browser and in Node.

Full TypeScript implementation of the package originally created by [@lokesh.dhakar](https://github.com/lokesh/colorthief)

**View the [demo page](https://lokeshdhakar.com/projects/color-thief/) for examples, API docs, and more.**

---

# Contributing

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
2. Node tests run with [Karma](https://karma-runner.github.io/latest/index.html) and utilizing [Mocha](https://mochajs.org/)

To run both the browser and Node tests:

- `npm run dev` to start local server.
- `npm run test`

To run just the browser tests with the Cypress UI:

- `npm run dev` to start local server
- `npm run test:browser`

To run just the Node tests:

- `npm run test:node`


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
