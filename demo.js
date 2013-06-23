$(document).ready(function () {

    // Uses mustache.js templating to create layout
    var imageArray = {images: [
        {"file": "img/photo1.jpg"},
        {"file": "img/photo2.jpg"},
        {"file": "img/photo3.jpg"}
    ]};

    var displayColors = function(image) {
      var $image = $(image);
      var imageSection = $image.closest('.image-section');
      var appendColors = function(colors, root) {
          $.each(colors, function(index, value) {
              var swatchEl = $('<div>', {'class': 'swatch'})
                  .css('background-color', 'rgba('+ value +', 1)');
              root.append(swatchEl);
          });
      };

      var colorThief = new ColorThief();

      // Dominant Color
      var dominantColor = colorThief.getColor(image);
      var dominantSwatch = imageSection.find('.get-color .swatches');
      appendColors([dominantColor], dominantSwatch);

      // Palette
      var colorCount = $image.attr('data-colorcount') ? $image.data('colorcount') : 10;
      var medianPalette = colorThief.getPalette(image, colorCount);
      var medianCutPalette = imageSection.find('.get-palette .swatches');
      appendColors(medianPalette, medianCutPalette);
    };


    // Setup the drag and drop behavior if supported
    if (typeof window.FileReader === 'function') {
      $('#dragDrop').show();

      var $dropZone = $('#dropZone');

      var handleDragEnter = function(event){
        $dropZone.addClass('dragging');
        return false;
      };

      var handleDragLeave = function(event){
        $dropZone.removeClass('dragging');
        return false;
      };

      var handleDragOver = function(event){
        return false;
      };

      var handleDrop = function(event){
        $dropZone.removeClass('dragging');

        var dt    = event.originalEvent.dataTransfer;
        var files = dt.files;

        handleFiles(files);

        return false;
      };

      $dropZone
        .on('dragenter', handleDragEnter)
        .on('dragleave', handleDragLeave)
        .on('dragover', handleDragOver)
        .on('drop', handleDrop);
    }

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

              // Must wait for image to load in DOM, not just load from FileReader
              $(img).on('load', function() {
                displayColors( img );
                util.centerImg( img, 400, 300);

                $('.droppedImage').slideDown();
              });
            };
          reader.readAsDataURL(file);
        } else {
          alert('File must be a supported image type.');
        }
      }
    }

    // Use lettering.js to give letter by letter styling control for the h1 title
    $("h1").lettering();


    var html = Mustache.to_html($('#image-section-template').html(), imageArray);
    $('#examples').append(html);


    // For each image:
    // Once image is loaded, get dominant color and palette and display them.
    // $('img').bind('load', function (event) {
    //   var image = event.target;
    //   displayColors(image);
    // });
});

var util = {
  centerImg: function( img, containerWidth, containerHeight) {
      var $img = $(img);
      var imgWidth = $img.get(0).width;
      var imgHeight = $img.get(0).height;
      var imgAspectRatio = imgHeight/imgWidth;

      if ( imgHeight > containerHeight ) {
        imgWidth = containerHeight / imgAspectRatio;
        $img.css('width', ( imgWidth + "px" ));
      }
      if ( imgWidth > containerWidth ) {
        $img.css('width', ( containerWidth + "px" ));
        imgHeight =  imgAspectRatio * containerWidth;
      }
      if ( imgWidth < containerWidth ) {
        var hOffset = ( containerWidth - imgWidth )/2;
        $img.css('margin-left', ( hOffset + "px" ));
      }
      if ( imgHeight < containerHeight ) {
        var vOffset = ( containerHeight - imgHeight )/2;
        $img.css('margin-top', ( vOffset + "px" ));
      }
    }
};
