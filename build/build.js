const minify = require('@node-minify/core');
const uglify = require('@node-minify/uglify-es');

minify({
  compressor: uglify,
  input: './src/color-thief.js',
  output: './dist/color-thief.min.js',
  options: {
    output: {
        comments: 'some'
    }
  },
  callback: function(err, min) {
    if (err) {
        console.log('⚠️ERROR:' + err);
    } else {
        console.log('✅ Minification completed');
    }
  }
});
