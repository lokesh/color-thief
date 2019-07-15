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

const source = resolve(process.cwd(), 'dist/color-thief.umd.js');
const dest = resolve(process.cwd(), 'dist/color-thief.min.js');

fs.copyFile(source, dest, (err) => {
    if (err) throw err;
    console.log('source.txt was copied to destination.txt');
});
