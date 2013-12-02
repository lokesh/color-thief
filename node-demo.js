var ColorThief = require('./js/color-thief');
var colorThief = new ColorThief();

var imageArray = [
  __dirname + '/img/photo1.jpg',
  __dirname + '/img/photo2.jpg',
  __dirname + '/img/photo3.jpg'
];


function showColorsForImage(image) {
  console.log(image);

  var color = colorThief.getColor(image);
  console.log(color);

  var palette = colorThief.getPalette(image);
  console.log(palette);
}

imageArray.forEach(showColorsForImage);
