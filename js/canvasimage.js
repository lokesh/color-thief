/*
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
	console.log('worked');
	this.context.putImageData(imageData, 0, 0);
}

CanvasImage.prototype.getPixelCount = function() {
	return this.width * this.height;
}

CanvasImage.prototype.getImageData = function() {
	return this.context.getImageData(0, 0, this.width, this.height);
}

