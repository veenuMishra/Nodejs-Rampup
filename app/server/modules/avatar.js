//var util = require('util');
const sharp = require('sharp'); 


exports.resizeImage = function(path, user){
    var array = path.split('/');
    var file_name = array[1];
    console.log(file_name);
    var output_file = file_name+user.username;
    sharp(path)
    .resize(200, 200)
    .toFile(output_file, (err, info) => { 
        console.log('err: ', err);
        console.log('info: ', info);
  });
}