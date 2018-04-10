var crypto 		= require('crypto');
var MongoDB 	= require('mongodb').Db;
var Server 		= require('mongodb').Server;
var moment 		= require('moment');
var connection  = require('./mysql_connection');
var nodemailer  = require('nodemailer');

exports.addArticle = function(title, content, userObject, callback){
	var user = userObject.username;
	var today = new Date();
    var article_object={
        "author": user,
        "likes": 0,
        "title":title,
        "content":content,
        "created_at": today,
        "updated_at":today

    };
	var query = connection.query('INSERT INTO `articles` SET ? ', article_object, function(err, result, fields){
		if(err)
			throw err;
		else{
			console.log(result);
			callback(null, article_object);
		}
	});
	//console.log(query.sql);

}

exports.loadArticle = function(link, callback){
	var array = link.split('/');
	var id = array[2];
	var query = connection.query('SELECT * FROM `articles` WHERE `article_id` = ?', id, function(err, result, fields){
		if(err)
			throw err;
		else{
			callback(null, result[0]);
		}
	});
}

exports.incrementLike = function(articleId, callback){
	
	var query = connection.query('SELECT * FROM `articles` WHERE `article_id` = ?', articleId, function(err, result, fields){
		if(err)
			throw err;
		else{
			var query = connection.query("UPDATE articles SET likes = likes + 1 WHERE article_id = ?", result[0].article_id, function(error, results, fields){
        		if(error)
        			throw error;
        		else
        			callback(null, result[0]);
        	});

        	console.log(query.sql);
		}
	});
}

exports.getAllArticles = function(callback)
{
	var query = connection.query('SELECT * FROM `articles` ', function(e, results, fields){
		if(e) 
			callback(e);
		else
			callback(null, results);

	});
}