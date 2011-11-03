
function getAverageRGB(sourceImage) {
	// Config
	var sampleSize = 10;
	
	// Create custom CanvasImage object
	var image = new CanvasImage(sourceImage),
		imageData = image.getImageData(),
		pixels = imageData.data,
		pixelCount = image.getPixelCount();  

	// Reset vars
	var i = 0,
		count = 0,
		rgb = {r:0,g:0,b:0};

	// Loop through every # pixels. (# is set in Config above via the blockSize var)
	// Add all the red values together, repeat for blue and green.
	// Last step, divide by the number of pixels checked to get average.
    while ( (i += sampleSize * 4) < pixelCount ) {
        ++count;
        rgb.r += pixels[i];
        rgb.g += pixels[i+1];
        rgb.b += pixels[i+2];
    }

  	rgb.r = Math.floor(rgb.r/count);
    rgb.g = Math.floor(rgb.g/count);
    rgb.b = Math.floor(rgb.b/count);

	return rgb;
}



function createAreaBasedPalette(sourceImage, colorCount){

	var palette = [];

	// Create custom CanvasImage object
	var image = new CanvasImage(sourceImage),
		imageData = image.getImageData(),
		pixels = imageData.data,
		pixelCount = image.getPixelCount();  
	
	
	// How big a pixel area does each palette color get
	var rowCount = colCount = Math.round(Math.sqrt(colorCount)),
		colWidth = Math.round(image.width / colCount),
		rowHeight = Math.round(image.height / rowCount);
	
	var count = offset = rowOffset = vertOffset = horizOffset = 0,
		rgb = {r:0,g:0,b:0};

	for(var i=0; i<rowCount; i++){
		vertOffset = i * rowHeight * image.width * 4;
		
		for(var j=0; j<colCount; j++){
			horizOffset = j * colWidth * 4;
	
			for( var k = 0; k < rowHeight; k++){
				rowOffset = k * image.width * 4;
				
				for( var l = 0; l < colWidth; l++){
					offset = vertOffset + horizOffset + rowOffset + (l * 4);
				    rgb.r += pixels[offset];
			        rgb.g += pixels[offset+1];
			        rgb.b += pixels[offset+2];
					count++;
				}
				
			}
			rgb.r = Math.floor(rgb.r/count);
		    rgb.g = Math.floor(rgb.g/count);
		    rgb.b = Math.floor(rgb.b/count);
			palette.push(rgb);

			// reset before next section
			rgb = {r:0,g:0,b:0};
			count = 0;
		}
	}
	
	return palette;
}


function createMedianCutPalette(sourceImage, colorCount){

	var palette = [];

	// Create custom CanvasImage object
	var image = new CanvasImage(sourceImage),
		imageData = image.getImageData(),
		pixels = imageData.data,
		pixelCount = image.getPixelCount();
		 
		var pixelArray = [];

		for (var i = 0; i < pixelCount; i++) {  
		    pixelArray.push( [pixels[i*4], pixels[i*4+1], pixels[i*4+2]]);
		};
		
		var cmap = MMCQ.quantize(pixelArray, colorCount);
		var newPalette = cmap.palette();

		return newPalette;
}

/*
	for (var i = 0; i < pixelCount; i++) {  
	    pixels[i*4] = pixels[i*4];	   // Red  
	    pixels[i*4+1] = pixels[i*4+1]; // Green  
	    pixels[i*4+2] = pixels[i*4+2]; // Blue  
	};

	image.clear();
	imageData.data = pixels;
	image.update(imageData);
*/
