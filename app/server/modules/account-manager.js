
var crypto 		= require('crypto');
var MongoDB 	= require('mongodb').Db;
var Server 		= require('mongodb').Server;
var moment 		= require('moment');
var connection  = require('./mysql_connection');
var nodemailer  = require('nodemailer');
/*
	ESTABLISH DATABASE CONNECTION
*/
/*
var dbName = process.env.DB_NAME || 'node-login';
var dbHost = process.env.DB_HOST || 'localhost'
var dbPort = process.env.DB_PORT || 27017;

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
db.open(function(e, d){
	if (e) {
		console.log(e);
	} else {
		if (process.env.NODE_ENV == 'live') {
			db.authenticate(process.env.DB_USER, process.env.DB_PASS, function(e, res) {
				if (e) {
					console.log('mongo :: error: not authenticated', e);
				}
				else {
					console.log('mongo :: authenticated and connected to database :: "'+dbName+'"');
				}
			});
		}	else{
			console.log('mongo :: connected to database :: "'+dbName+'"');
		}
	}
});



var accounts = db.collection('accounts');

/* login validation methods */

exports.autoLogin = function(user, pass, callback)
{
	var query = connection.query('SELECT * FROM accounts WHERE username = ?',[user], function (error, results, fields) {
		if (results.length > 0){
			console.log(results[0]);
			results[0].password == pass ? callback(results[0]) : callback(null);
		}	else{
			callback(null);
		}
	});
}

exports.manualLogin = function(user, pass, callback)
{
	var query = connection.query('SELECT * FROM accounts WHERE username = ?',[user], function (error, results, fields) 
        {
          if (error) {
              throw error;
          }else{
            if(results.length == 1 && results[0].active == 'true'){
            	//console.log(fields);
                validatePassword(pass, results[0].password, function(err, res) {
                	if(err) throw err;
					else if (res){
						callback(null, results[0]);
						
					}else
						callback('invalid-password');
					
				});
			}
			           
          
            else{
              callback('invalid-password');
            }
          }
        });
	console.log(query.sql);
}

/* record insertion, update & deletion methods */

exports.addNewAccount = function(newData, callback)
{
	console.log('you posted: Name: ' + newData.name + ', Email: ' + newData.email + ' Password: ' + newData.pass + ' Username: ' + newData.user);
        var today = new Date();
        var accounts={
            "name":newData.name,
            "email":newData.email,
            "location":newData.country,
            "username": newData.user,
            "password":newData.pass,
            "created_at":today,
            "updated_at":today,
            "token": generateSalt()
        };
        var query = connection.query('SELECT * FROM accounts WHERE email = ?',[accounts.email], function (error, results, fields) {
          if (error) 
            throw error;
          else if(results.length >0)
          	callback('email-taken');
          else{
          	//hash the password and feed in db
            saltAndHash(accounts.password, function(hash){
				accounts.password = hash;
				var query = connection.query('INSERT INTO accounts SET ?',accounts, callback());
				console.log (query.sql);
				//send token link
				var link = 'localhost:8012/verify/' + accounts.username + '/'+ accounts.token;
				console.log(link);
				//sendTokenMail('localhost:8012/verify/' + accounts.username + '/'+ accounts.token, accounts.email);
			});            
          }
        });
        //console.log (query.sql);
}
exports.verifyTokenLink = function(link){
	var array = link.split("/");
	var username = array[2];
	var token = array[3];
	console.log(username, token);
	var query = connection.query('SELECT * FROM accounts WHERE username = ?',username, function (error, results, fields) {

		if(results.length >1)
			console.log('error')
          	//callback('user-not-found');
        else if(token != results[0].token){
        	console.log ('token not matching');
        }
        else{
        	var present_time = new Date();
        	var link_time = results[0].created_at;
        	var expired = present_time - link_time;
        	if(expired > 0){
	        	var query = connection.query("UPDATE accounts SET active = 'true' WHERE username = ?", username, function(error, results, fields){
	        		if(error)
	        			throw error;
	        	});
				console.log (query.sql);
			}
			else
				console.log('link expired kindly register again');
        }
	});
	console.log(query.sql);
}

exports.updateAccount = function(newData, callback)
{
	accounts.findOne({_id:getObjectId(newData.id)}, function(e, o){
		o.name 		= newData.name;
		o.email 	= newData.email;
		o.country 	= newData.country;
		if (newData.pass == ''){
			accounts.save(o, {safe: true}, function(e) {
				if (e) callback(e);
				else callback(null, o);
			});
		}	else{
			saltAndHash(newData.pass, function(hash){
				o.pass = hash;
				accounts.save(o, {safe: true}, function(e) {
					if (e) callback(e);
					else callback(null, o);
				});
			});
		}
	});
}

exports.updatePassword = function(email, newPass, callback)
{
	accounts.findOne({email:email}, function(e, o){
		if (e){
			callback(e, null);
		}	else{
			saltAndHash(newPass, function(hash){
		        o.pass = hash;
		        accounts.save(o, {safe: true}, callback);
			});
		}
	});
}

/* account lookup methods */

exports.deleteAccount = function(id, callback)
{
	accounts.remove({_id: getObjectId(id)}, callback);
}

exports.getAccountByEmail = function(email, callback)
{
	accounts.findOne({email:email}, function(e, o){ callback(o); });
}

exports.validateResetLink = function(email, passHash, callback)
{
	accounts.find({ $and: [{email:email, pass:passHash}] }, function(e, o){
		callback(o ? 'ok' : null);
	});
}

exports.getAllRecords = function(callback)
{
	var query = connection.query('SELECT * FROM `accounts` ', function(e, results, fields){
		if(e) 
			callback(e);
		else
			callback(null, results);

	});
	/*accounts.find().toArray(
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});*/
}

exports.delAllRecords = function(callback)
{
	accounts.remove({}, callback); // reset accounts collection for testing //
}

/* private encryption & validation methods */

var generateSalt = function()
{
	var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
	var salt = '';
	for (var i = 0; i < 10; i++) {
		var p = Math.floor(Math.random() * set.length);
		salt += set[p];
	}
	return salt;
}

var md5 = function(str) {
	return crypto.createHash('md5').update(str).digest('hex');
}

var saltAndHash = function(pass, callback)
{
	var salt = generateSalt();
	callback(salt + md5(pass + salt));
}

var validatePassword = function(plainPass, hashedPass, callback)
{
	var salt = hashedPass.substr(0, 10);
	var validHash = salt + md5(plainPass + salt);
	callback(null, hashedPass === validHash);
}

var getObjectId = function(id)
{
	return new require('mongodb').ObjectID(id);
}

var findById = function(id, callback)
{
	accounts.findOne({_id: getObjectId(id)},
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}

var findByMultipleFields = function(a, callback)
{
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
	accounts.find( { $or : a } ).toArray(
		function(e, results) {
		if (e) callback(e)
		else callback(null, results)
	});
}

var sendTokenMail = function(link, email){
	var transporter = nodemailer.createTransport({
	  service: 'gmail',
	  auth: {
	    user: 'veenu98mishra@gmail.com',
	    pass: 'password'
	  }
	});

	var mailOptions = {
	  from: 'veenu98mishra@gmail.com',
	  to: email,
	  subject: 'Verify your account',
	  text: link
	};

	transporter.sendMail(mailOptions, function(error, info){
	  if (error) {
	    console.log(error);
	  } else {
	    console.log('Email sent: ' + info.response);
	  }
	}); 
}