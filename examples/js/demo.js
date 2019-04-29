var colorThief = new ColorThief();

var images = [
    'black.png',
    'red.png',
    'rainbow-horizontal.png',
    'rainbow-vertical.png',
    // 'transparent.png',
    // 'white.png',
];

// Render example images
var examplesHTML = Mustache.to_html(document.getElementById('image-tpl').innerHTML, images);
document.getElementById('example-images').innerHTML = examplesHTML;

// Once images are loaded, process them
document.querySelectorAll('.image').forEach((image) => {
    const section = image.closest('.image-section');
    if (this.complete) {
        showColorsForImage(image, section);
    } else {
        image.addEventListener('load', function() {
            showColorsForImage(image, section);
        });
    }
})

// Run Color Thief functions and display results below image.
// We also log execution time of functions for display.
const showColorsForImage = function(image, section) {
    const file = section.src;
    const start = Date.now();
    const color = colorThief.getColor(image);
    const elapsedTimeForGetColor = Date.now() - start;
    const palette = colorThief.getPalette(image);
    const elapsedTimeForGetPalette = Date.now() - start + elapsedTimeForGetColor;

    const output = {
      color: color,
      colorStr: color.toString(),
      palette: palette,
      paletteStr: palette.toString(),
      elapsedTimeForGetColor: elapsedTimeForGetColor,
      elapsedTimeForGetPalette: elapsedTimeForGetPalette
    };
    const ouputHTML = Mustache.to_html(document.getElementById('output-tpl').innerHTML, output);

    const outputEl = section.querySelector('.output');
    outputEl.innerHTML = ouputHTML;
};
