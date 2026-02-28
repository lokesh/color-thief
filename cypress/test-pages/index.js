var images = [
    'black.png',
    'red.png',
    'rainbow-horizontal.png',
    'rainbow-vertical.png',
    'transparent.png',
    'white.png',
];

// Render example images
var examplesHTML = Mustache.to_html(document.getElementById('image-tpl').innerHTML, images);
document.getElementById('example-images').innerHTML = examplesHTML;

// Run Color Thief functions and display results below image.
// We also log execution time of functions for display.
const showColorsForImage = function(image, section) {
    // getColorSync(img)
    let start = Date.now();
    let result = ColorThief.getColorSync(image);
    let elapsedTime = Date.now() - start;
    const rgb = result ? result.array() : null;
    const colorHTML = Mustache.to_html(document.getElementById('color-tpl').innerHTML, {
        color: rgb,
        colorStr: rgb ? rgb.toString() : 'null',
        elapsedTime
    })

    // getPaletteSync(img, { colorCount })
    let paletteHTML = '';
    let colorCounts = [2, 3, 5, 7, 10, 20];
    colorCounts.forEach((count) => {
        let start = Date.now();
        let result = ColorThief.getPaletteSync(image, { colorCount: count });
        let elapsedTime = Date.now() - start;
        const rgbPalette = result ? result.map(c => c.array()) : null;
        paletteHTML += Mustache.to_html(document.getElementById('palette-tpl').innerHTML, {
            count,
            palette: rgbPalette,
            paletteStr: rgbPalette ? rgbPalette.toString() : 'null',
            elapsedTime
        })
    });

    const outputEl = section.querySelector('.output');
    outputEl.innerHTML += colorHTML + paletteHTML;
};

// Once images are loaded, process them
document.querySelectorAll('.image').forEach((image) => {
    const section = image.closest('.image-section');
    if (image.complete) {
        showColorsForImage(image, section);
    } else {
        image.addEventListener('load', function() {
            showColorsForImage(image, section);
        });
    }
})
