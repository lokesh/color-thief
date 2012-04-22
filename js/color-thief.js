/*
 * Image Palette v0.1
 * by Lokesh Dhakar - http://www.lokeshdhakar.com
 *
 * Licensed under the Creative Commons Attribution 2.5 License - http://creativecommons.org/licenses/by/2.5/
 * 
 * The median cut palette function uses quantize.js which is written by Nick Rabinowitz
 * and licensed under the MIT license. Big props to Nick as this is where the magic happens.
 *
 * == Classes
 * CanvasImage
 * == Functions
 * getDominantColor()
 * createPalette()
 * getAverageRGB()
 * createAreaBasedPalette()
 *
 * Requires jquery and quantize.js.
*/


/*
	CanvasImage Class
	Class that wraps the html image element and canvas.
	It also simplifies some of the canvas context manipulation 
	with a set of helper functions.
*/
var CanvasImage = function(image){
	// If jquery object is passed in, get html element
	this.imgEl = (image.jquery)? image[0]: image;

	this.canvas = document.createElement('canvas'),
    this.context = this.canvas.getContext('2d');

	document.body.appendChild(this.canvas);

	this.width = this.canvas.width = $(this.imgEl).width(),
	this.height = this.canvas.height = $(this.imgEl).height();	

	this.context.drawImage(this.imgEl, 0, 0);
}

CanvasImage.prototype.clear = function() {
	this.context.clearRect(0, 0, this.width, this.height);  
}

CanvasImage.prototype.update = function(imageData) {
	this.context.putImageData(imageData, 0, 0);
}

CanvasImage.prototype.getPixelCount = function() {
	return this.width * this.height;
}

CanvasImage.prototype.getImageData = function() {
	return this.context.getImageData(0, 0, this.width, this.height);
}

CanvasImage.prototype.removeCanvas = function() {
	$(this.canvas).remove();
}


/*
 * getDominantColor(sourceImage)
 * returns {r: num, g: num, b: num}
 *
 * Use the median cut algorithm provided by quantize.js to cluster similar
 * colors and return the base color from the largest cluster.
*/
function getDominantColor(sourceImage){

	var palette = [];

	// Create custom CanvasImage object
	var image = new CanvasImage(sourceImage),
		imageData = image.getImageData(),
		pixels = imageData.data,
		pixelCount = image.getPixelCount();
		 
	// Store the RGB values in an array format suitable for quantize function
	var pixelArray = [];
	for (var i = 0; i < pixelCount; i++) {  
		// If pixel is mostly opaque and not white
		if(pixels[i*4+3] >= 125){
			if(!(pixels[i*4] > 250 && pixels[i*4+1] > 250 && pixels[i*4+2] > 250)){
	   			pixelArray.push( [pixels[i*4], pixels[i*4+1], pixels[i*4+2]]);
			}
		}
	};

	// Send array to quantize function which clusters values
	// using median cut algorithm
	var cmap = MMCQ.quantize(pixelArray, 5);
	
	if ( cmap === false ) {
	    // Clean up
	    image.removeCanvas();
	
	    return false;
	}
  
	var newPalette = cmap.palette();

	// Clean up
	image.removeCanvas();
	
	return {r: newPalette[0][0], g: newPalette[0][1], b: newPalette[0][2]};
}



/*
 * createPalette(sourceImage, colorCount)
 * returns array[ {r: num, g: num, b: num}, {r: num, g: num, b: num}, ...]
 *
 * Use the median cut algorithm provided by quantize.js to cluster similar
 * colors.
 *
 * BUGGY: Function does not always return the requested amount of colors. It can be +/- 2.
*/
function createPalette(sourceImage, colorCount){

	var palette = [];

	// Create custom CanvasImage object
	var image = new CanvasImage(sourceImage),
		imageData = image.getImageData(),
		pixels = imageData.data,
		pixelCount = image.getPixelCount();
		 
	// Store the RGB values in an array format suitable for quantize function
	var pixelArray = [];
	for (var i = 0; i < pixelCount; i++) {  
		// If pixel is mostly opaque and not white
		if(pixels[i*4+3] >= 125){
			if(!(pixels[i*4] > 250 && pixels[i*4+1] > 250 && pixels[i*4+2] > 250)){
	    		pixelArray.push( [pixels[i*4], pixels[i*4+1], pixels[i*4+2]]);
			}
		}
	};

	// Send array to quantize function which clusters values
	// using median cut algorithm
	var cmap = MMCQ.quantize(pixelArray, colorCount);
	
	if ( cmap === false ) {
	    // Clean up
	    image.removeCanvas();
	
	    return false;
	}
	
	var newPalette = cmap.palette();

	// Clean up
	image.removeCanvas();

	return newPalette;
}


/*
 * getAverageRGB(sourceImage)
 * returns {r: num, g: num, b: num}
 *
 * Add up all pixels RGB values and return average.
 * Tends to return muddy gray/brown color. Most likely, you'll be better
 * off using getDominantColor() instead.
*/
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
		// if pixel is mostly opaque
		if(pixels[i+3] > 125){
	        ++count;
			rgb.r += pixels[i];
	        rgb.g += pixels[i+1];
	        rgb.b += pixels[i+2];
		}
    }

  	rgb.r = Math.floor(rgb.r/count);
    rgb.g = Math.floor(rgb.g/count);
    rgb.b = Math.floor(rgb.b/count);

	return rgb;
}


/*
 * createAreaBasedPalette(sourceImage, colorCount)
 * returns array[ {r: num, g: num, b: num}, {r: num, g: num, b: num}, ...]
 *
 * Break the image into sections. Loops through pixel RGBS in the section and average color.
 * Tends to return muddy gray/brown color. You're most likely better off using createPalette().
 * 
 * BUGGY: Function does not always return the requested amount of colors. It can be +/- 2.
 * 
*/
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

	// Loop through pixels section by section.
	// At the end of each section, push the average rgb color to palette array.
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
