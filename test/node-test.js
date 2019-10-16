const { resolve } = require('path');
const { readFile } = require('fs');
const ColorThief = require(resolve(process.cwd(), "dist/color-thief.js"));
const img = resolve(process.cwd(), 'cypress/test-pages/img/rainbow-vertical.png');
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-as-promised"));


describe('getColor()', function() {
    it('returns valid color', function() {
        return expect(ColorThief.getColor(img)).to.eventually.have.lengthOf(3);
    });

    it('returns valid color when input is Buffer', function() {
        readFile(img, function(err, data) {
            const buffer = Buffer.from(data)
            return expect(ColorThief.getColor(buffer)).to.eventually.have.lengthOf(3);
        });
    });
});

describe('getPalette()', function() {
    it('returns 5 colors when colorCount set to 5', function() {
        return expect(ColorThief.getPalette(img, 5)).to.eventually.have.lengthOf(5);
    });

    it('returns 9 colors when colorCount set to 9', function() {
        return expect(ColorThief.getPalette(img, 9)).to.eventually.have.lengthOf(9);
    });
});

