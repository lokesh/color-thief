$(document).ready(function () {

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





$(function(){

	var dropbox = $('#dropbox'),
		message = $('.message', dropbox);

	dropbox.filedrop({
		// The name of the $_FILES entry:
		paramname:'pic',

		maxfiles: 5,
    	maxfilesize: 2, // in mb
		url: 'post_file.php',

		uploadFinished:function(i,file,response){
			$.data(file).addClass('done');
			// response is the JSON object that post_file.php returns
		},

    	error: function(err, file) {
			switch(err) {
				case 'BrowserNotSupported':
					showMessage('Your browser does not support HTML5 file uploads!');
					break;
				case 'TooManyFiles':
					alert('Too many files! Please select 5 at most!');
					break;
				case 'FileTooLarge':
					alert(file.name+' is too large! Please upload files up to 2mb.');
					break;
				default:
					break;
			}
		},

		// Called before each upload is started
		beforeEach: function(file){
			if(!file.type.match(/^image\//)){
				alert('Only images are allowed!');

				// Returning false will cause the
				// file to be rejected
				return false;
			}
		},

		uploadStarted:function(i, file, len){
			createImage(file);
		},

		progressUpdated: function(i, file, progress) {
			$.data(file).find('.progress').width(progress);
		}

	});

  var template = '<div class="preview">'+
  						'<span class="imageHolder">'+
  							'<img />'+
  							'<span class="uploaded"></span>'+
  						'</span>'+
  						'<div class="progressHolder">'+
  							'<div class="progress"></div>'+
  						'</div>'+
  					'</div>'; 


	function createImage(file){
  	var preview = $(template),
  		image = $('img', preview);

  	var reader = new FileReader();

  	image.width = 100;
  	image.height = 100;

  	reader.onload = function(e){

  		// e.target.result holds the DataURL which
  		// can be used as a source of the image:

  		image.attr('src',e.target.result);
  	};

  	// Reading the file as a DataURL. When finished,
  	// this will trigger the onload function above:
  	reader.readAsDataURL(file);

  	message.hide();
  	preview.appendTo(dropbox);

  	// Associating a preview container
  	// with the file, using jQuery's $.data():

  	$.data(file,preview);
	}

	function showMessage(msg){
		message.html(msg);
	}

});