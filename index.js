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


    // Once images are loaded, loop through each one, getting dominant color
    // and palette and displaying them.
    $('img').imagesLoaded(function () {

        $('img').each(function (index) {

            var imageSection = $(this).closest('.imageSection'),
            swatchEl;

            // Dominant Color
            var dominantColor = getDominantColor(this);

            swatchEl = $('<div>', {
                'class': 'swatch'
            }).css('background-color','rgba('+dominantColor.r+','+dominantColor.g+ ','+dominantColor.b+', 1)');
            imageSection.find('.dominantColor .swatches').append(swatchEl);



            // Palette
            var colorCount = $(this).attr('data-colorcount') ? $(this).data('colorcount') : 10;
            var medianPalette = createPalette(this, colorCount);

            var medianCutPalette = imageSection.find('.medianCutPalette .swatches');
            $.each(medianPalette, function (index, value) {
                swatchEl = $('<div>', {
                    'class': 'swatch'
                }).css('background-color','rgba('+value[0]+','+value[1]+ ','+value[2]+', 1)');
                medianCutPalette.append(swatchEl);
            });

        });

    });
});
