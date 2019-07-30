var colorThief = new ColorThief();

var images = [
    'image-1.jpg',
    'image-2.jpg',
    'image-3.jpg',
];

// Render example images
var examplesHTML = Mustache.to_html(document.getElementById('image-tpl').innerHTML, images);
document.getElementById('example-images').innerHTML = examplesHTML;

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

// Run Color Thief functions and display results below image.
// We also log execution time of functions for display.
const showColorsForImage = function(image, section) {
    let start = Date.now();

    // 🎨🔓
    let result = colorThief.getColor(image);

    let elapsedTime = Date.now() - start;
    const colorHTML = Mustache.to_html(document.getElementById('color-tpl').innerHTML, {
        color: result,
        colorStr: result.toString(),
        elapsedTime
    })

    // getPalette(img)
    let paletteHTML = '';
    let colorCounts = [3, 9];
    colorCounts.forEach((count) => {
        let start = Date.now();

        // 🎨🔓
        let result = colorThief.getPalette(image, count);

        let elapsedTime = Date.now() - start;
        paletteHTML += Mustache.to_html(document.getElementById('palette-tpl').innerHTML, {
            count,
            palette: result,
            paletteStr: result.toString(),
            elapsedTime
        })
    });

    const outputEl = section.querySelector('.output');
    outputEl.innerHTML += colorHTML + paletteHTML;
};
