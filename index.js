    
    var express = require("express");
    var http = require('http');
    var bodyParser = require('body-parser');
    var path = require("path");
    var session = require('express-session');
    var errorHandler = require('errorhandler');
    var cookieParser = require('cookie-parser');
    //var util = require('util');
    var multer  = require('multer');
    var app = express();
    

    
    app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}));

    app.locals.pretty = true;
    app.set('port', process.env.PORT || 8012);
    app.set('views', __dirname + '/app/server/views');
    app.set('view engine', 'jade');
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(require('stylus').middleware({ src: __dirname + '/app/public' }));
    app.use(express.static(__dirname + '/app/public'));
    
    //wait for a connection
    require('./app/server/routes')(app);

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

/*
    CREATE TABLE `accounts` (
     `id` int(11) NOT NULL AUTO_INCREMENT,
     `name` varchar(255) NOT NULL,
     `email` varchar(255) NOT NULL,
     `location` varchar(255) NOT NULL,
     `username` varchar(255) NOT NULL,
     `password` varchar(255) NOT NULL,
     `created_at` datetime NOT NULL,
     `updated_at` datetime NOT NULL,

     PRIMARY KEY (`id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1

    CREATE TABLE `articles` (
     `article_id` int(11) NOT NULL AUTO_INCREMENT,
     `author` varchar(255) NOT NULL,
     `likes` int(11) NOT NULL,
     `title` text(500) NOT NULL,

     `content` longtext(5000) NOT NULL,
     `created_at` datetime NOT NULL,
     `updated_at` datetime NOT NULL,
     
     PRIMARY KEY (`article_id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1

    CREATE TABLE `comments` (
     `comment_id` int(11) NOT NULL AUTO_INCREMENT,
     `article_id` varchar(255) NOT NULL,
     `username` varchar(255) NOT NULL,
     `comment` text(500) NOT NULL,
     `likes` int(11) NOT NULL,
     

     
     `created_at` datetime NOT NULL,
     `updated_at` datetime NOT NULL,
     
     PRIMARY KEY (`comment_id`)
    ) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1


*/