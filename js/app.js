$(document).ready(function(){

	var view = {
	  title: "Joe",
	  calc: function() {
	    return 2 + 4;
	  }
	}

	var template = "{{title}} spends {{calc}}";

	var html = Mustache.to_html(template, view);

	$('body').prepend(html);
	
	$('img').imagesLoaded(function(){
	
		$('img').each(function(index){

			var dominantColor = getDominantColor(this);
			var medianPalette = createPalette(this, 10);

			var imageSection = $(this).closest('.imageSection');

			var switchEl;

			swatchEl = $('<div>', {
				'class': 'swatch'
			}).css('background-color','rgba('+dominantColor.r+','+dominantColor.g+ ','+dominantColor.b+', 1)');

			imageSection.find('.dominantColor').append(swatchEl);

			var medianCutPalette = imageSection.find('.medianCutPalette');

			$.each(medianPalette, function(index, value){
				swatchEl = $('<div>', {
					'class': 'swatch'
				}).css('background-color','rgba('+value[0]+','+value[1]+ ','+value[2]+', 1)');
				medianCutPalette.append(swatchEl);
			});

		});

	});

});