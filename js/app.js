$(document).ready(function(){
	
	$('img').each(function(index){

		var averageRGB = getAverageRGB(this);
		var dominantColor = getDominantColor(this);
		var areaPalette = createAreaBasedPalette(this, 9);
		var medianPalette = createMedianCutPalette(this, 10);

		var imageSection = $(this).closest('.imageSection');
		
		var swatchEl = $('<div>', {
			'class': 'swatch'
		}).css('background-color','rgba('+averageRGB.r+','+averageRGB.g+ ','+averageRGB.b+', 1)');

		imageSection.find('.averageRGB').append(swatchEl);

		swatchEl = $('<div>', {
			'class': 'swatch'
		}).css('background-color','rgba('+dominantColor.r+','+dominantColor.g+ ','+dominantColor.b+', 1)');

		imageSection.find('.dominantColor').append(swatchEl);


		var areaBasedPalette = imageSection.find('.areaBasedPalette');

		$.each(areaPalette, function(index, value){
			swatchEl = $('<div>', {
				'class': 'swatch'
			}).css('background-color','rgba('+value.r+','+value.g+ ','+value.b+', 1)');
			areaBasedPalette.append(swatchEl);
		});
		
		var medianCutPalette = imageSection.find('.medianCutPalette');

		$.each(medianPalette, function(index, value){
			swatchEl = $('<div>', {
				'class': 'swatch'
			}).css('background-color','rgba('+value[0]+','+value[1]+ ','+value[2]+', 1)');
			medianCutPalette.append(swatchEl);
		});


	});
		
});