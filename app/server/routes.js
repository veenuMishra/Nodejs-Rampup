
var CT = require('./modules/country-list');
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');
var ArM = require ('./modules/article-manager');
var pic = require('./modules/avatar');
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });
var fs = require('fs');

module.exports = function(app) {

// main login page //
	app.get('/', function(req, res){
	// check if the user's credentials are saved in a cookie //
		if(req.session.user)
			res.redirect('/home');
		else if (req.cookies.user == undefined || req.cookies.pass == undefined){
			console.log ( 'taking to login page as no cookies found');
			res.render('login', { title: 'Hello - Please Login To Your Account' });
		}	else{
	// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
				if (o != null){
				    req.session.user = o.username;
					res.redirect('/home');
				}	else{
					res.render('login', { title: 'Hello - Please Login To Your Account' });
				}
			});
		}
	});
	
	app.post('/', function(req, res){
		AM.manualLogin(req.body['user'], req.body['pass'], function(e, o){
			if (!o){
				res.status(400).send(e);
			}	else{
				req.session.user = o;
				if (req.body['remember-me'] == 'true'){
					res.cookie('user', o.username, { maxAge: 900000 });
					res.cookie('pass', o.password, { maxAge: 900000 });
				}
				res.status(200).send(o);
			}
		});
	});
	
//verification by token link
	app.get(/verify.*/, function(req, res){
		//console.log(req.originalUrl);
		console.log(req.path);
		
		AM.verifyTokenLink(req.path);
	});
// logged-in user homepage //
	
	app.get('/home', function(req, res) {
		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}	else{
			res.render('home', {
				title : 'Control Panel',
				countries : CT,
				udata : req.session.user
			});
		}
	});
	
	app.post('/home', function(req, res){
		if (req.session.user == null){
			res.redirect('/');
		}	else{
			AM.updateAccount({
				id		: req.session.user._id,
				name	: req.body['name'],
				email	: req.body['email'],
				pass	: req.body['pass'],
				country	: req.body['country']
			}, function(e, o){
				if (e){
					res.status(400).send('error-updating-account');
				}	else{
					req.session.user = o;
			// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
					}
					res.status(200).send('ok');
				}
			});
		}
	});

	//uploading avatar
	app.get('/upload', function(req, res){
		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}
		else{
			res.render('upload', {
        	title: 'Upload Images'
    		});
		}
	});
	app.post('/upload', upload.single('avatar'), function (req, res, next) {
  // req.file is the `avatar` file 
  // req.body will hold the text fields, if there were any 
  		if (!req.file) {
	    console.log("No file received");}
	    else{
	    	var tmp_path = req.file.path;

			  /** The original name of the uploaded file
			      stored in the variable "originalname". **/
			  var target_path = 'uploads/' + req.file.originalname;
			  console.log('file successfully uploaded at '+target_path+', redirecting to home now.');

			  pic.resizeImage(target_path, req.session.user, function(err, res){
			  	if(err)
			  		throw err;
			  	else{
			  		//res.redirect('/home');
			  	}
			  });
			  
			  res.redirect('/home');
	    }
	});

//adding new article
	app.get('/create', function(req, res) {
		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}	else{
			res.render('create', {
				title : 'Control Panel',
				countries : CT,
				udata : req.session.user
			});
		}
	});

	app.post('/create', function(req, res) {
		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}
		else{
			//console.log(req.session.user);
			ArM.addArticle(req.body['title'], req.body['content'],req.session.user, function(e, o){
				if (!o){
					console.log('article not added');
					res.status(400).send(e);
				}else{	
					console.log('article added');
					res.redirect('/article/');			
					//res.status(200).send(o);
				}
			});
		}
	});

	app.post ('/article/like', function(req, res){
		if (req.session.user == null){
		// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}
		else{
			//console.log(req.body);
			ArM.incrementLike(req.body.articleId, function(err, result){
				if(err)
					throw err;
				else {
					console.log("updated like: " + result.likes + req.get('referer'));
					/*res.render('article', {
						title : 'article is',
						artc : result
					});*/
					res.status(200).send('ok');
				}
			});
		}
	});

	app.get('/article/:articleId', function(req, res){
		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}
		else{
			//console.log(req.path);
			
			ArM.loadArticle(req.path, function(err, result){
				if(err)
					throw err;
				else if(!result){
					console.log('no article found with this article_id');
				}
				else {
					//console.log(result.likes);
					res.render('article', {
						title : 'article is',
						artc : result
					});
				}
			});			
		}
	});

	app.post('/article/:article_id', function(req, res){
		if(req.session.user == null)
			res.redirect('/');
		else{
			ArM.postComment(req.path, function(err, result){
				if(err)
					throw err;
				else {
					console.log ( 'updated Comment: ' + result);
					res.redirect('/article/:article_id');
				}
			});
		}
	});

	

	app.post('/logout', function(req, res){
		res.clearCookie('user');
		res.clearCookie('pass');
		req.session.destroy(function(e){ res.status(200).send('ok'); });
	});
	
// creating new accounts //
	
	app.get('/signup', function(req, res) {
		res.render('signup', {  title: 'Signup', countries : CT });
	});
	
	app.post('/signup', function(req, res){
		AM.addNewAccount({
			name 	: req.body['name'],
			email 	: req.body['email'],
			user 	: req.body['user'],
			pass	: req.body['pass'],
			country : req.body['country']
		}, function(e){
			if (e){
				res.status(400).send(e);
			}	else{
				res.status(200).send('ok');
			}
		});
	});

	// password reset //zzz

	app.post('/lost-password', function(req, res){
	// look up the user's account via their email //
		AM.getAccountByEmail(req.body['email'], function(o){
			if (o){
				EM.dispatchResetPasswordLink(o, function(e, m){
				// this callback takes a moment to return //
				// TODO add an ajax loader to give user feedback //
					if (!e){
						res.status(200).send('ok');
					}	else{
						for (k in e) console.log('ERROR : ', k, e[k]);
						res.status(400).send('unable to dispatch password reset');
					}
				});
			}	else{
				res.status(400).send('email-not-found');
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
			// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});
	
	app.post('/reset-password', function(req, res) {
		var nPass = req.body['pass'];
		// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
		// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		AM.updatePassword(email, nPass, function(e, o){
			if (o){
				res.status(200).send('ok');
			}	else{
				res.status(400).send('unable to update password');
			}
		})
	});
	
	// view & delete accounts //
	
	app.get('/print', function(req, res) {
		AM.getAllRecords( function(e, accounts){
			//console.log(accounts);
			res.render('print', { title : 'Account List', accts : accounts });
		})
	});
	
	app.post('/delete', function(req, res){
		AM.deleteAccount(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
				req.session.destroy(function(e){ res.status(200).send('ok'); });
			}	else{
				res.status(400).send('record not found');
			}
	    });
	});
	
	app.get('/reset', function(req, res) {
		AM.delAllRecords(function(){
			res.redirect('/print');	
		});
	});
	
	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

};
