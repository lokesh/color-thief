const { resolve } = require('path');
const { readFileSync } = require('fs');
const { getColor, getPalette, createColor } = require('../dist/index.cjs');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const expect = chai.expect;
chai.use(chaiAsPromised);

const imgDir = resolve(process.cwd(), 'cypress/test-pages/img');
const imgPath = (name) => resolve(imgDir, name);

function isColorObject(c) {
    return (
        c !== null &&
        typeof c.rgb === 'function' &&
        typeof c.hex === 'function' &&
        typeof c.array === 'function' &&
        typeof c.isDark === 'boolean' &&
        typeof c.population === 'number'
    );
}

describe('CommonJS require()', function() {
    it('getColor works via require()', async function() {
        const color = await getColor(imgPath('rainbow-vertical.png'));
        expect(isColorObject(color)).to.be.true;
    });

    it('getPalette works via require()', async function() {
        const palette = await getPalette(imgPath('rainbow-vertical.png'), { colorCount: 5 });
        expect(palette).to.have.lengthOf(5);
        palette.forEach(c => expect(isColorObject(c)).to.be.true);
    });

    it('createColor works via require()', function() {
        const c = createColor(255, 0, 0, 1);
        expect(c.hex()).to.equal('#ff0000');
        expect(c.isDark).to.be.false;
    });
});
