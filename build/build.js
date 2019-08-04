var fs = require('fs');
const { resolve } = require('path');

/*
color-thief.umd.js duplicated as color-thief.min.js for legacy support

In Color Thief v2.1 <= there was one distribution file (dist/color-thief.min.js)
and it exposed a global variable ColorThief. Starting from v2.2, the package
includes multiple dist files for the various module systems. One of these is
the UMD format which falls back to a global variable if the requirejs AMD format
is not being used. This file is called color-thief.umd.js in the dist folder. We
want to keep supporting the previous users who were loading
dist/color-thief.min.js and expecting a global var. For this reason we're
duplicating the UMD compatible file and giving it that name.
*/

const umdRelPath = 'dist/color-thief.umd.js';
const legacyRelPath = 'dist/color-thief.min.js';

const umdPath = resolve(process.cwd(), umdRelPath);
const legacyPath = resolve(process.cwd(), legacyRelPath);

fs.copyFile(umdPath, legacyPath, (err) => {
    if (err) throw err;
    console.log(`${umdRelPath} copied to ${legacyRelPath}.`);
});

const srcNodeRelPath = 'src/color-thief-node.js';
const distNodeRelPath = 'dist/color-thief.js';
const srcNodePath = resolve(process.cwd(), srcNodeRelPath);
const distNodePath = resolve(process.cwd(), distNodeRelPath);

fs.copyFile(srcNodePath, distNodePath, (err) => {
    if (err) throw err;
    console.log(`${srcNodeRelPath} copied to ${distNodeRelPath}.`);
});
