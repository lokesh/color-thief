$(document).ready(function () {

    // Use mustache.js templating to create layout

    var imageArray = { images: [
        {"file": "3.jpg"},
        {"file": "4.jpg"},
        {"file": "5.jpg"},
        {"file": "logo1.png"},
        {"file": "icon1.png", "colorCount": "4", "class": "fbIcon"}
    ]};

    // Setup the drag and drop behavior
    var $dropZone = $('#dropZone');

    var dragEnter = function( evt ){
      evt.stopPropagation();
      evt.preventDefault();
      $dropZone.addClass('dragging');
    };

    var dragLeave = function( evt ){
      evt.stopPropagation();
      evt.preventDefault();
      $dropZone.removeClass('dragging');
    };

    var dragOver = function( evt ){
      evt.stopPropagation();
      evt.preventDefault();
    };

    var drop = function( evt ){
      evt.stopPropagation();
      evt.preventDefault();
      $dropZone.removeClass('dragging');
      
      var dt = evt.originalEvent.dataTransfer;
      var files = dt.files;

      handleFile( files );
    };

    var displayColors = function( image ) {
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
    };

    function handleFile(files) {
      var file = files[0];
      var imageType = /image.*/;

      if (file.type.match(imageType)) {
        var img = document.createElement("img");
        img.classList.add("targetImage");
        img.width = 400;
        img.height = 300;
        img.file = file;
        $dropZone.append(img);
         
        var reader = new FileReader();
        reader.onload = function(e){
            img.src = e.target.result;
            displayColors( img );
          };
        reader.readAsDataURL(file);
      }
    }

    $dropZone
      .on('dragenter', dragEnter)
      .on('dragleave', dragLeave)
      .on('dragover', dragOver)
      .on('drop', drop);

    var html = Mustache.to_html($('#template').html(), imageArray);
    $('#main').append(html);

    // Use lettering.js to give letter by letter styling control for the h1 title
    $("h1").lettering();

    // For each image:
    // Once image is loaded, get dominant color and palette and display them.
    $('img').bind('load', function (event) {
      var image = event.target;
      displayColors( image );
    });
});
