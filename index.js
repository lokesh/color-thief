$(document).ready(function () {

    // Use mustache.js templating to create layout

    var imageArray = { images: [
        {"file": "3.jpg"},
        {"file": "4.jpg"},
        {"file": "5.jpg"},
        {"file": "logo1.png"},
        {"file": "icon1.png", "colorCount": "4", "class": "fbIcon"}
    ]};

    var html = Mustache.to_html($('#template').html(), imageArray);
    $('#main').append(html);

    // Use lettering.js to give letter by letter styling control for the h1 title
    $("h1").lettering();


    // For each image:
    // Once image is loaded, get dominant color and palette and display them.
    $('img').bind('load', function (event) {
        var image = event.target;
        var $image = $(image);
        var imageSection = $image.closest('.imageSection');
        var appendColors = function (colors, root) {
            $.each(colors, function (index, value) {
                var swatchEl = $('<div>', {'class': 'swatch'})
                    .css('background-color', 'rgba('+ value +', 1)');
                root.append(swatchEl);
            });
        };

        // Dominant Color
        var dominantColor = getDominantColor(image);
        var dominantSwatch = imageSection.find('.dominantColor .swatches');
        appendColors([dominantColor], dominantSwatch);

        // Palette
        var colorCount = $image.attr('data-colorcount') ? $image.data('colorcount') : 10;
        var medianPalette = createPalette(image, colorCount);
        var medianCutPalette = imageSection.find('.medianCutPalette .swatches');
        appendColors(medianPalette, medianCutPalette);
    });
});