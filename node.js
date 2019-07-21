const { resolve } = require('path');
const ColorThief = require(resolve(process.cwd(), "src/color-thief-node.js"));

const img = resolve(process.cwd(), 'cypress/test-pages/img/rainbow-vertical.png');

ColorThief.getColor(img)
    .then(color => { console.log(color) })
    .catch(err => { console.log(err) })

ColorThief.getPalette(img)
    .then(palette => { console.log(palette) })
    .catch(err => { console.log(err) })
