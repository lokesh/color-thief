$(document).ready(function () {

    // Use mustache.js templating to create layout

    var imageArray = { images: [
        {"file": "img/3.jpg"},
        {"file": "img/4.jpg"},
        {"file": "img/5.jpg"},
        {"file": "img/logo1.png"},
        {"file": "img/icon1.png", "colorCount": "4", "class": "fbIcon"}
    ]};

    // Setup the drag and drop behavior if supported
    if (typeof window.FileReader === 'function') {
      $('#dragDrop').show();

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

        handleFiles( files );
      };

      $dropZone
        .on('dragenter', dragEnter)
        .on('dragleave', dragLeave)
        .on('dragover', dragOver)
        .on('drop', drop);
    }

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

    function handleFiles( files ) {
      var imageType = /image.*/;
      var fileCount = files.length;

      for (var i = 0; i < fileCount; i++) {
        var file = files[i];

        if ( file.type.match(imageType) ) {
          var reader = new FileReader();
          reader.onload = function( e ) {
              imageInfo = { images: [
                  {'class': 'droppedImage', file: e.target.result}
                ]};

              var html = Mustache.to_html($('#template').html(), imageInfo);
              $('#draggedImages').prepend( html );

              var img = $('.droppedImage .targetImage').get(0);
              displayColors( img );
              util.centerImg( img, 400, 300);

              $('.droppedImage').slideDown();
            };
          reader.readAsDataURL(file);
        } else {
          alert('File must be a supported image type.');
        }
      }
    }

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

var util = {
  centerImg: function( img, containerWidth, containerHeight) {
      var $img = $(img);
      var imgHeight = $img.get(0).height;
      var imgWidth = $img.get(0).width;

      if ( imgHeight < containerHeight ) {
        var vOffset = ( containerHeight - imgHeight )/2;
        $img.css('margin-top', ( hOffset + "px" ));
      }
      if ( imgWidth < containerWidth ) {
        var hOffset = ( containerWidth - imgWidth )/2;
        $img.css('margin-left', ( hOffset + "px" ));
      }
    }
};
