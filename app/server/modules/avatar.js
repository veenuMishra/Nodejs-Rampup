//var util = require('util');



exports.resizeImage = function(path){

    sharp('input.jpg')
  .resize(200, 200)
  .toFile('ouput.jpg', function(err) {
    // output.jpg is a 200 pixels wide and 200 pixels high image
    // containing a scaled and cropped version of input.jpg
  });
}