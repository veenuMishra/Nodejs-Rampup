var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'task'
});
connection.connect(function(err){
if(!err) {
    console.log("Database is connected with thread ID:" + connection.threadId);
} else {
    console.log("Error while connecting with database ------ " + err.stack );
}
});
module.exports = connection;