var express = require("express");
var mysql = require("mysql");
var fs = require("fs");
var path = require("path");
var bodyparser = require("body-parser");
var socket = require("socket.io");
const multer = require('multer');

const storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null,'./uploads/')
	},
	filename: function(req, file, cb) {
		cb(null, new Date().toISOString()+file.originalname)
	}
})

const fileFilter = function(req, file, cb) {
	if(file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
		cb(null, true)
	} else {
		cb(JSON.stringify({message: "File Type not supported"}), false)
	}
}
const upload = multer({
	storage: storage,
	limits: {
		fileSize: 1024 * 1024 * 5 // 5Mb 
	},
	fileFilter: fileFilter
});


var session = require("express-session");
var passport = require("passport");
var localStrategy = require("passport-local").Strategy;
var mySqlStore = require("express-mysql-session")(session);

const ToneAnalyzerV3 = require('ibm-watson/tone-analyzer/v3');

const toneAnalyzer = new ToneAnalyzerV3({
  version: '2017-09-21',
  iam_apikey: 'Pu3RQtNTKKDWHwXSZz0mqcZPHcQerhLPN2xo2s8sE_It',
  url: 'https://gateway-lon.watsonplatform.net/tone-analyzer/api',
  headers: {
    'X-Watson-Learning-Opt-Out': 'true'
  }
});

var flash = require("connect-flash");
var app = express();


app.set("views", path.join(__dirname, "views"));
app.set("view engine","ejs");

//This creates a Session table in database to store established user session
var options = {
	host : 'localhost',
	user : 'root',
	password : 'Vijju@005',
	database : 'customerChat'
};

/* For crearting sessions table in db to store user sessions */
/*var options = {
	host : 'us-cdbr-iron-east-02.cleardb.net',
	user : 'b1681473ab0ff1',
	password : '7f57f3dc',
	database : 'heroku_6b41e1e0702fd4d'
};*/

var mySessionStore = new mySqlStore(options);

app.use(bodyparser());
app.use(express.static(path.join(__dirname,"static")));
app.use('/uploads', express.static('uploads'));


app.use(session({
	secret : 'key',
	resave : false,
	store : mySessionStore,
	saveUninitialized : false,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

/* Authentication using local signup */
passport.use(new localStrategy({
	usernameField : 'email',
	passwordField : 'password',
	passReqToCallback : true
	},
	function(req,email,password,done)
	{
		//console.log(username + " " + password);
		
		db.query("SELECT id AS user_id from users WHERE email = ?",[email],function(err,result,fields)
		{
			if(err)
			{
				console.log("Error while retreiving id: " + err)
			}
			else
			{
				//console.log("email exists " + JSON.stringify(result));
				if(result.length == 0)
				{
					return done(null,false , {message : "User does not exists"});
				}
				else
				{
					db.query("SELECT password,confirm from users WHERE email = ?",[email],function(err,result1,fields)
					{
						//console.log("db password" + JSON.stringify(result1[0].password));
						if(err)
						{
							return done(null,false);
						}
						else if(result1[0].confirm == 0)
						{
							return done(null,false,{message : "User not registered using local signup"});
						} 
						else if(result1[0].confirm == 1)
						{
							return done(null,false,{message : "Please confirm your email address"});
						}
						else if(result1[0].password != password )
						{
							console.log("incorrect");
							return done(null,false, {message : 'Wrong password'});
						}						
						else
						{
							return done(null,result[0]);
						}
					});
				}
			}
		});
		//display error message if not successfully logged in pending
	}		
));


// Db connection

var db = mysql.createConnection(
{
	host : 'localhost',
	user : 'root',
	password : 'Vijju@005',
	database : 'customerChat',
	multipleStatements: true
});

/*var db_config = {
	host : 'us-cdbr-iron-east-02.cleardb.net',
	user : 'b1681473ab0ff1',
	password : '7f57f3dc',
	database : 'heroku_6b41e1e0702fd4d',
	multipleStatements: true
}*/


db.connect(function(err)
{
	if(err)
	{
		console.log("database connection failed");
	}
	else
	{
		console.log("database connection established successfully");
	}
})

/*var db;

function handleDisconnect() {
  db = mysql.createConnection(db_config); // Recreate the connection, since
                                                  // the old one cannot be reused.

  db.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }									  // to avoid a hot loop, and to allow our node script to
    else  								  // process asynchronous requests in the meantime.						
    { 									  // If you're also serving http, display a 503 error.			
    	console.log("database connection established");
    }                                     
  });                                     
                                          
  db.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();*/


app.get("/logout",authenticationMiddleware(),function(req,res)
{
	req.logout();
	req.session.destroy();
	res.redirect("/");
});


app.get("/",function(req,res) 
{	
		res.render("login",{message : false});
		//res.sendFile(__dirname + "/HS.html");
});

app.get("/home/admin",admincheck(),function(req,res)
{
	db.query("Select * FROM users",function(err,result)
	{
		if(err)
		{
			console.log("Error retreiving all users from db : "+err);
		}
		else
		{
			res.json(result);			
		}
	})
})

function admincheck(req,res,next)
{
	return (req,res,next) => 
	{
		var id = req.user.user_id;
		//db.query("SELECT `email` FROM users WHERE id=?",[id],function(err,result)
		db.query("SELECT `email` FROM users WHERE id=?",[id],function(err,result)
		{
			if(err)
			{
				console.log("Error while retreiving email of admin : "+err);
			}
			else
			{
				console.log("email id : "+ JSON.stringify(result[0].email));
				if(result[0].email == "vijayendrapagare05@gmail.com")
				{
					console.log("in if");
					return next();
				}
				else
				{
					console.log("in else");
					res.redirect("/");			
				}
			}
		})		
	}	
}


app.get("/login",function(req,res) 
{	
	//console.log("from signup : "+JSON.stringify(req.query.message));
	var confirmation_flag = req.query.message;
	if(confirmation_flag == 1)
	{
		res.render("login",{message : "This email address is already registered. Please confirm email address"});	
	}
	else if(confirmation_flag == 2)
	{
		res.render("login",{message : "This email address is already registered. Please login"});
	}
	else if(confirmation_flag == 'mailsent')
	{
		res.render("login",{message : "Confirmation Mail sent to registered mail address"});
	}
	else
	{
		res.render("login",{message : false});
	}		
});

app.post("/login",passport.authenticate(
	'local',{
	successRedirect : "/home",
	failureRedirect : "/failure",
	failureFlash : true
	}
));

app.get("/failure",function(req,res)
{
	res.render("login",{message : req.flash("error")});
})

app.post("/checkemail",function(req,res)
{
	//console.log("check email : "+JSON.stringify(req.body));
	var email = req.body.email;
	db.query("SELECT id AS user_id,confirm FROM users WHERE email = ?",[email],function(err,result)
	{
		if(err)
		{
			console.log("Error while checking email : "+err);
		}
		else
		{
			if(result.length == 0)
			{
				res.send({message : "email id does not exists"});
			}
			else if(result[0].confirm == 0) //email id exists because user has signed up using third party auth using the same mail id but has not done local signup
			{
				res.send({message : "Please do local signup"});	
			}
			else if(result[0].confirm == 2 && req.body.flag == "mail") //email id already confirmed
			{
				res.send({message : "email id already confirmed"});
			}
			else if(result[0].confirm == 1)
			{
				if(req.body.flag == "mail")	
				{
					var user_id = {user_id : result[0].user_id};
					//console.log(user_id);
					sendmail(user_id,'confirmation',0,email);
					res.send({message : "email send to registered email id"})
				}
				else if(req.body.flag == "password")
				{
					res.send({message : "Please confirm registered mail address"});	
				}
			}
			else if(req.body.flag == "password")
			{
				//console.log("password functionality");
				var user_id = {user_id : result[0].user_id};
				var OTP = generateOTP(email);
				//console.log(OTP[1]);
				//sendmail(user_id,'OTP',OTP[0],email);		
				res.send({message : OTP[1]})
			}
		}
	})
})

//Global varialbe resets when server restarts
var OTPmap = new Map();

function generateOTP(email)
{
	var timer;
	var OTP = 1234; //Generate Random value when in production;
	var generatedTime = Date.now();
	OTPmap.set(email,[OTP,generatedTime]);
	timer = generatedTime+60000;
	return [OTP,timer];
	//return [OTP,generatedTime];
}

//This function will run after certain time intervals and check for Expired OTP records in OTPmap. It will delete the 
//expired records from the map. Written for cleanizing of OTPmap.

/*setInterval(function()
{
	var currentTime = Date.now();
	//console.log("Each run");

	OTPmap.forEach(function(values,key)  
	{
		console.log("keys"+key);
		console.log("values"+values[1]);
		if(currentTime-values[1] > (1*60*1000))    //(5*60*1000 => mins*sec*millisec)
		{
			OTPmap.delete(key);
		}
	});

	console.log("map size is : "+OTPmap.size);

},20000)*/

function checkOTP(OTP,email)
{	
	//console.log(OTPmap.get(email));
	var value = OTPmap.get(email);
	var currentTime;
	if(OTPmap.has(email))
	{
		console.log("Email exists in map");
		currentTime = Date.now();
		if(currentTime-value[1] < 60000) //Expiry time for OTP 60 secs
		{
			if(value[0] == OTP)
			{
				OTPmap.delete(email);
				return 1; //OTP matched
			}
			else
			{
				return 0; //OTP did not match
			}
		}
		else
		{
			console.log("Deleting : "+currentTime-value[1]);
			OTPmap.delete(email);
			return 2; //Time limit Exceeded. Invalid
		}		
	}
	else
	{
		//console.log("Email does not exists in map");
		return 0; // Email does not exist	
	}	
}

app.post("/checkotp",function(req,res)
{
	//console.log("req : "+JSON.stringify(req.body));
	var status = checkOTP(req.body.otp,req.body.email);
	//console.log("flag is : "+flag);
	res.send({status : status});
});

app.post("/resetpassword",function(req,res)
{
	console.log("resetpassword data : "+JSON.stringify(req.body));
	db.query("UPDATE users SET password=? WHERE email=?",[req.body.newpassword,req.body.email],function(err)
	{
		if(err)
		{
			console.log("Error while storing new password : "+err);
		}
		else
		{
			//console.log("success");
			res.send({message : 'changed'});
		}
	});
});

app.get("/signup",function(req,res) 
{	
	res.render("signup");
});

app.get("/check_username",function(req,res)
{
	console.log("username is : "+ JSON.stringify(req.query.username));
	var username = req.query.username;
	var flag=0;
	db.query("SELECT username FROM users",function(err,result)
	{
		if(err)
		{
			console.log("Error while retreiving all usernames : "+err);
		}
		else
		{
			for(let i=0;i<result.length;i++)
			{
				if(username == result[i].username)
				{
					res.send("notavailable");
					flag=1;
				}
			}
			if(flag==0)
			{
				res.send("available");	
			}			
		}
	})
})


app.post("/signup",function(req,res)
{
	
		var username = req.body.username;
		var name = req.body.name;
		var email = req.body.email;
		var password = req.body.password;
		

		db.query("SELECT * FROM users WHERE email=?",[email],function(err,result)
		{
			if(err)
			{
				console.log("Error while checking if email exists : "+err);
			}
			else
			{
				//console.log("result1 is : "+JSON.stringify(result1));
			
				if(result.length == 0)
				{
					db.query('INSERT INTO users(username,name,password,confirm,email,gid) VALUES (?,?,?,1,?,0)',[username,name,password,email],
					function(err,result)
					{
						if(err)
						{
							console.log("\n error while inserting student data is " + err);
						}
						else
						{
							db.query('SELECT LAST_INSERT_ID() AS user_id',function(err,result,fields)
							{
								if(err)
								{
									console.log("\nError while retreiving last inserted id");
								}
								else
								{
									const user_id = result[0];
									console.log("last inserted user " + JSON.stringify(user_id));
									sendmail(user_id,'confirmation',0,email);
									
									res.redirect("/login?message=mailsent");	
									//res.send('<script>window.location.href="https://www.gmail.com";</script>');
									//res.redirect("https://www.gmail.com");
								}					
							});	
						}
					});
				}
				else if(result[0].confirm == 1)
				{
					//console.log("please confirm email");
					db.query('SELECT id AS user_id FROM users WHERE email = ?',[email],function(err,result,fields)
					{
						if(err)
						{
							console.log("\nError while retreiving last inserted id");
						}
						else
						{
							const user_id = result[0];
							console.log("last inserted user " + JSON.stringify(user_id));
							//sendmail(user_id,'confirmation',0,email);
							//req.login(user_id,function(err)
							//{
							//	res.redirect("/home");
							//})
							res.redirect("/login?message=1");	
						}					
					});
				}
				else if(result[0].confirm == 2)
				{
					console.log("user already exists. Please login");
					res.redirect("/login?message=2");
				}
				else if(result[0].confirm == 0)
				{
					
					db.query("UPDATE users SET username=?,name=?,password=?,confirm=1 WHERE email = ?; SELECT id AS 'user_id' FROM users WHERE email=?",[username,name,password,email,email],function(err,result)
					{
						if(err)
						{
							console.log("Error while updating user info then retreiving id of user : "+JSON.stringify(err));
						}
						else
						{
							var temp_user_id = result[1];
							var user_id = temp_user_id[0]; 
							
							sendmail(user_id,'confirmation',0,email);
							res.redirect("/login?message=mailsent");
						}
					})					
				}			
			}
		})
		//check display_name and user already exists in db using ajax before submitting form.
	
});

app.get("/profile",authenticationMiddleware(),function(req,res)
{		
	var id = req.user.user_id;
	
	var query = "SELECT u.id, u.username, u.name, u.email, u.userImageRef, p.productId, p.productName FROM users as u, userProductAssoc as up, products as p WHERE u.id = up.userId and p.productId = up.productId and id = ?";
	db.query(query, [id],function(err,result)
	{
		if(err)
		{
			console.log("\n Error while retreiving user profile info " + err);
		}
		else
		{
			let userObj = {
				userId: result[0].id,
				username: result[0].username,
				name: result[0].name,
				email: result[0].email,
				userImageRef: result[0].userImageRef
			}
			let userProducts = result.map(record => {
				return {
					productId: record['productId'],
					productName: record['productName']
				}
			})
			userObj['products'] = userProducts;
			res.render("profile",{info : userObj});
		}
	});	
	
	//res.redirect("/jugaad/profile/" + req.user.user_id);
})


app.post("/profile",authenticationMiddleware(),upload.single('userImage'),function(req,res)
{	
	var id = req.user.user_id;
	var username = req.body.username;
	var name = req.body.name;
	var email = req.body.email;
	var userImage = (req.file && req.file.path) ? req.file.path : undefined;
	var products = req.body.products
	/**
	 * products is an array of products modified
	 * products = [
	 * 	{
	 * 		productId: product1Id,
	 * 		operation: added/removed
	 * 	}
	 * ]
	 * Add/Remove rows from userProductAssoc
	 */
	db.query("UPDATE users SET username=?, userImageRef=?, name=?, email=? WHERE id= ?",[username, userImage, name, email, id],function(err,result)
	{
		if(err)
		{
			console.log("\nError while updating profile info " + err);
		}
		else
		{
			var query = "SELECT u.id, u.username, u.name, u.email, u.userImageRef, p.productId, p.productName FROM users as u, userProductAssoc as up, products as p WHERE u.id = up.userId and p.productId = up.productId and id = ?";
			db.query(query, [id],function(err,result)
			{
				if(err)
				{
					console.log("\n Error while retreiving user profile info " + err);
				}
				else
				{
					let userObj = {
						userId: result[0].id,
						username: result[0].username,
						name: result[0].name,
						email: result[0].email,
						userImageRef: result[0].userImageRef
					}
					let userProducts = result.map(record => {
						return {
							productId: record['productId'],
							productName: record['productName']
						}
					})
					userObj['products'] = userProducts;
					res.render("profile",{info : userObj});
				}
			});			
		}
	});
});



app.get("/home",authenticationMiddleware(),function(req,res,next)
{
	var id = req.user.user_id;	
	var username;
	//console.log("onlineusers",onlineusers);
	
	db.query("SELECT username FROM users WHERE id=? LIMIT 1",[id],function(err,result)
	{
		if(err)
		{
			console.log("Error while retreiving username on home page : "+err);
		}
		else
		{
			username = result[0].username
			res.render("home",{username : username});			
		}
	});
});

app.get("/staticList",authenticationMiddleware(),function(req,res,) {
	let userId = req.user.user_id;

	db.query("SELECT type FROM users WHERE id=?", [userId], function(err, user) {
		if(err) {
			console.log("===Error occured while getting users type")
			res.status(400).send({message: "Error"});
		} else {
			if(user) {
				db.query("SELECT username FROM users WHERE type != ? AND id != ?", [user[0].type, userId], function(err, staticList) {
					if(err) {
						console.log("===Error occured while getting static list")
						res.status(400).send({message: "Error"});
					} else {
						res.status(200).send(staticList)
					}
				})
			} else {
				res.status(400).send({message: "Error"});
			}
		}
	})
})

app.get("/getChatHistory",authenticationMiddleware(),function(req,res,) {
	let userId = req.user.user_id;
	var chatWithUsername = req.query.username;

	db.query("SELECT id, username from users where id=?",[userId], function(err, user) {
		if(err) {
			console.log("===Error occured while getting users")
			res.status(400).send({message: "Error"});
		} else {
			db.query("SELECT id, username from users where username=?",[chatWithUsername], function(err,chatWithUser) {
				if(err) {
					console.log("===Error occured while getting chatWithUser")
					res.status(400).send({message: "Error"});
				} else {	
					db.query("SELECT u1.username AS sourceUserName, c.message AS message, c.createdAt FROM chatHistory c INNER JOIN users u1 ON u1.id = c.sourceUserId  WHERE  c.sourceUserId in (?) and c.destUserId in (?) order by c.id desc", [[user[0]['id'],chatWithUser[0]['id']],[chatWithUser[0]['id'],user[0]['id']]], function(err, chatHistory) {
						if(err) {
							console.log("==Error occurred while fetching chat history: ",err)
						} else {
							res.status(200).send(chatHistory)
						}
					})
				}
			});
		}
	});
})

const port=process.env.PORT || 3000
var server=app.listen(port,function()
{
	console.log("listen to port 3000");
});


function detectexpression(sentenceform,tone)
{
	if(tone == "Joy" || tone == "joy" || tone == "Polite" || tone == "polite" || tone == "Sympathetic" || tone == "sympathetic")
	{
		expression = ":)";
		sentenceform=sentenceform+expression;
	}
	else if(tone == "Sad" || tone == "sad" || tone == "fear" || tone == "Fear")
	{
		expression = ":(";
		sentenceform=sentenceform+expression;
	}
	else
	{
		expression = ":|";
		sentenceform=sentenceform+expression;
	}

	return sentenceform;
}


/*  Socket connection for chat */
var onlineusers = {};
var io=socket(server);
io.on("connection",function(socket)
{
	console.log("socket connection established");
var tempdata;

	socket.on("chat",function(data)
	{
		//{message : message,sender : username}
		tempdata = data.message;
		const toneParams = {
		  tone_input: { 'text': tempdata },
		  content_type: 'application/json',
		};

		toneAnalyzer.tone(toneParams)
		  .then(toneAnalysis => {
		  	//console.log(JSON.stringify(toneAnalysis, null, 2));		  	
		    var expression,obj,arrayofexpression,tone,sentenceform="";
		  	if(!toneAnalysis.hasOwnProperty("sentences_tone"))
		  	{
		  		sentenceform = tempdata
		  		obj = toneAnalysis["document_tone"];
		  		arrayofexpression = obj["tones"];
		  		if(arrayofexpression.length == 0)
		  		{
		  			sentenceform = sentenceform+ ":)";
		  		}
		  		else
		  		{
		  			
			  		tone = arrayofexpression[0].tone_name;
			  		sentenceform = detectexpression(sentenceform,tone);	
		  		}
		  	}
		  	else		  		
		  	{
		  		var arrayofObjectsofSentencesExpression = toneAnalysis.sentences_tone;
		  	
			  	for(let i=0;i<arrayofObjectsofSentencesExpression.length;i++)
			  	{
			  		//Joy Fear Polite Sad Sympathetic Analytical Sadness
			  		obj = arrayofObjectsofSentencesExpression[i];
			  		//console.log("each sentence info : "+JSON.stringify(obj));
			  		if(sentenceform == "")
			  		{
			  			sentenceform = sentenceform+obj.text;	
			  		}
			  		else
			  		{
			  			sentenceform = sentenceform +"\n"+obj.text;
			  		}
			  		
			  		arrayofexpression = obj.tones;
			  		//console.log("arrayofexpression"+JSON.stringify(arrayofexpression));
			  		if(arrayofexpression.length != 0)
			  		{
			  			tone = arrayofexpression[0].tone_name;
				  		//console.log("tone of each sentence:"+JSON.stringify(tone));
				  		//console.log("\n\n\n");
				  		sentenceform = detectexpression(sentenceform,tone);			  			
			  		}
			  		else
			  		{
			  			expression = ":|";
				  		sentenceform=sentenceform+expression;
			  		}		  		
			  	}	
		  	}

		  	console.log("sentence formed : "+sentenceform);
		  	data.message = sentenceform;
		  	io.sockets.emit("chat",data);		  		
		  })
		  .catch(err => {
		    console.log('error:', err);
		  	io.sockets.emit("chat",data);
		  });	
		
	});

	socket.on("private_chat",function(data)
	{
		db.query("SELECT id, username from users where username=?",[data.sender], function(err, sourceUser) {
			if(err) {
				console.log("===Error occured while getting sender: ",err)
			} else {
				db.query("SELECT id, username from users where username=?",[data.receiver], function(err, destUser) {
					if(err) {
						console.log("===Error occured while getting receiver: ",err)
					} else {
						db.query("Insert into chatHistory (sourceUserId, destUserId, message) values (?,?,?)",[sourceUser[0].id, destUser[0].id, data.message], function(err, chatSaved) {
							if(err) {
								console.log("===Error occured while inserting chat message: ",err)
							} else {
								tempdata = data.message;
		
					
								const toneParams = {
								tone_input: { 'text': tempdata },
								content_type: 'application/json',
								};
						
								toneAnalyzer.tone(toneParams)
								.then(toneAnalysis => {
									//console.log(JSON.stringify(toneAnalysis, null, 2));		  	
									var expression,obj,arrayofexpression,tone,sentenceform="";
									if(!toneAnalysis.hasOwnProperty("sentences_tone"))
									{
										sentenceform = tempdata
										obj = toneAnalysis["document_tone"];
										arrayofexpression = obj["tones"];
										if(arrayofexpression.length == 0)
										{
											sentenceform = sentenceform+ ":)";
										}
										else
										{
											
											tone = arrayofexpression[0].tone_name;
											sentenceform = detectexpression(sentenceform,tone);	
										}
									}
									else
									{
										var arrayofObjectsofSentencesExpression = toneAnalysis.sentences_tone;
									
										for(let i=0;i<arrayofObjectsofSentencesExpression.length;i++)
										{
											//Joy Fear Polite Sad Sympathetic Analytical Sadness
											obj = arrayofObjectsofSentencesExpression[i];
											//console.log("each sentence info : "+JSON.stringify(obj));
											if(sentenceform == "")
											{
												sentenceform = sentenceform+obj.text;	
											}
											else
											{
												sentenceform = sentenceform +"\n"+obj.text;
											}
											
											arrayofexpression = obj.tones;
											//console.log("arrayofexpression"+JSON.stringify(arrayofexpression));
											if(arrayofexpression.length != 0)
											{
												tone = arrayofexpression[0].tone_name;
												//console.log("tone of each sentence:"+JSON.stringify(tone));
												//console.log("\n\n\n");
												sentenceform = detectexpression(sentenceform,tone);			  			
											}
											else
											{
												expression = ":|";
												sentenceform=sentenceform+expression;
											}		  		
										}	
									}
						
									console.log("sentence formed : "+sentenceform);
									data.message = sentenceform;
									if(Object.keys(onlineusers).includes(data.receiver)) {
										onlineusers[data.receiver].emit("private_chat",data);
									}		  		
								})
								.catch(err => {
									console.log('error:', err);
									if(Object.keys(onlineusers).includes(data.receiver)) {
										onlineusers[data.receiver].emit("private_chat",data);
									}		  		
								});
							}
						})
					}
				})
			}
		})
	});


	socket.on("username",function(username)
	{
		/*if(onlineusers.indexOf(username) == -1)
		{
			console.log("adding user to onlineusers array");
			//onlineusers.push(username);
		}*/
		socket.username = username;
		onlineusers[socket.username] = socket; 
		sendlistofonlineusers();		
	});

	function sendlistofonlineusers()
	{
		io.sockets.emit("onlineusers",Object.keys(onlineusers));
	}

	
	socket.on("disconnect",function()
	{
		//onlineusers.splice(onlineusers.indexOf(socket.username),1);
		delete onlineusers[socket.username];
		sendlistofonlineusers();
	})
});



passport.serializeUser(function(user_id,done)
{
	done(null,user_id);
});
passport.deserializeUser(function(user_id,done)
{
	done(null,user_id);
});

function authenticationMiddleware()
{
	return (req,res,next) => 
	{
		if(req.isAuthenticated())
		{
			return next();
		}
		
		res.redirect("/");
	}	
}

//Google authentication

const googlestrategy = require("passport-google-oauth20");

app.get("/google",passport.authenticate("google",{
	scope : ['profile','email']
}))

app.get("/google/redirect",passport.authenticate("google"),function(req,res)
{
	console.log("Redirected from google: " +JSON.stringify(req.user));
	res.redirect("/home");		
})

passport.use(
		new googlestrategy({
	callbackURL : "/google/redirect",
	//clientID : "509493354821-07dog3pdnbtgtukjtv2pp568u8enimpj.apps.googleusercontent.com",
	//clientSecret : "OFaHAH2OHK2uREuCy6NP1Afs"
	clientID : "734132093263-07tbcmloe50fjlfp5darjqasmeb6jovs.apps.googleusercontent.com", //google credentials for hosting on heroku
	clientSecret : "ru8T55pLk0tEf9j2JKtCTZPd"
},function(accessToken,refreshToken,profile,done)
{
	console.log("redirect to passport");
	//console.log(JSON.stringify(profile));
	var email = profile.emails[0].value;
	var username = profile.displayName; 
	var googleid = profile.id;

	//console.log("emailid is: "+JSON.stringify(emailid));
	//console.log("displayName is: "+JSON.stringify(displayName));
	//console.log("googleid is: "+googleid);
	//console.log("id is: "+JSON.stringify(emailid) + " " +JSON.stringify(googleid)+" "+JSON.stringify(displayName));
	
	db.query("SELECT `id`AS user_id,`username`,`gid` FROM users WHERE email = ?",[email],function(err,result)
	{
		if(err)
		{
			console.log("Error while retreiving id : "+ err);
		}
		else
		{
			//console.log("result is : "+ JSON.stringify(result[0].user_id));
			if(result.length != 0)
			{
				var userId = {user_id : result[0].user_id}
				if(result[0].gid == googleid)
				{
					done(null,userId);
				}
				else if(result[0].username === "")
				{
					db.query("UPDATE users SET username=?,name=?,gid=? WHERE id=?",[username,username,googleid,result[0].user_id],function(err,result2)
					{
						if(err)
						{
							console.log("Error while updating google id : "+err);
						}
						else
						{
							//console.log("in update displayname");
							done(null,userId);		
						}
					})
				}
				else
				{
					db.query("UPDATE users SET gid=? WHERE id=?",[googleid,result[0].user_id],function(err,result2)
					{
						if(err)
						{
							console.log("Error while updating google id : "+err);
						}
						else
						{
							//console.log("don't update displayname");
							done(null,userId);		
						}
					})	
				}									
			}
			else
			{
				db.query("INSERT INTO users(username,name,email,gid) VALUES (?,?,?,?)",[username,username,email,googleid],function(err,result1)
				{
					if(err)
					{
						console.log("Error while inserting student google auth info : "+err);
					}
					else
					{
						db.query("SELECT `id` AS user_id FROM users WHERE email = ?",[email],function(err,result2)
						{
							if(err)
							{
								console.log("Error while retreiving id for new google signup user : "+err);
							}
							else
							{
								done(null,result2[0]);
							}
						});
					}
				})
			}			
		}
	})	
}));


//TO send mail

var nodemailer = require('nodemailer');

function sendmail(user_id,flag,OTP,email)
{
	var id =	user_id.user_id;
	console.log("email while sending mail is : "+email);
	//console.log("id is: "+ JSON.stringify(window_name));
	/*var transporter = nodemailer.createTransport({
	  service: 'gmail',
	  auth: {
	    user: 'vijayendracourse@gmail.com',
	    pass: '1@testcourse'
	 },
     tls: {
            rejectUnauthorized: false
     }
	});*/

	var transporter = nodemailer.createTransport({
		service : 'gmail',
		auth : {
			type : "oauth2",	
			user : 'vijayendracourse@gmail.com',
			clientId : '734132093263-07tbcmloe50fjlfp5darjqasmeb6jovs.apps.googleusercontent.com',
			clientSecret : 'ru8T55pLk0tEf9j2JKtCTZPd',
			refreshToken :  '1/bnD8nGeCOvF8cN0IMKMmJaHn7U5Tsgj2oKR-gMdVPJg'	
		}
	})	

	if(flag == 'confirmation')
	{
		var mailOptions = {
		  from: 'vijayendracourse@gmail.com',
		  to: email,
		  subject: 'Confirm your mail id',
		  //text: 'http://localhost:3000/confirmemail?user_id='+id
		  html : '<a href="http://localhost:3000/confirmemail?user_id='+id+'" return false;>Click me</a>'
		  //html : '<!DOCTYPE html><html><body><a onclick="myWindow()" href="http://localhost:3000/confirmemail?user_id=102" >click here</a><button type="button" onclick="window.close()">close</button><script>function myWindow(){ alert("closing window"); myWindow.close();}</script></body</html>'
		  //href="http://localhost:3000/confirmemail?user_id='+id+'"
		};	
	}
	else if(flag == 'OTP')
	{
		var mailOptions = {
		  from: 'vijayendracourse@gmail.com',
		  to: email,
		  subject: 'OTP to chane password',
		  //text: 'http://localhost:3000/confirmemail?user_id='+id
		  html : '<div> OTP is : '+OTP+'</div>'
		  //html : '<!DOCTYPE html><html><body><a onclick="myWindow()" href="http://localhost:3000/confirmemail?user_id=102" >click here</a><button type="button" onclick="window.close()">close</button><script>function myWindow(){ alert("closing window"); myWindow.close();}</script></body</html>'
		  //href="http://localhost:3000/confirmemail?user_id='+id+'"
		};	
	}

	transporter.sendMail(mailOptions, function(error, info){
	  if (error) {
	    console.log(error);
	  } else {
	    console.log('Email sent: ' + info.response);
	  }
	});
}

//In confirm column
//0-user has not signed up using local signup
//1-user has signed up using local signup but not confirmed mail id
//2-user has signed up using local signup and confirmed mail id


//check authentication parameter
app.get("/confirmemail",function(req,res)
{
	console.log("user id is : "+ JSON.stringify(req.query));
	var user_id = req.query;
	db.query("SELECT `confirm` FROM users WHERE id = ?",[req.query.user_id],function(err,result)
	{
		if(err)
		{
			console.log("Error while retreiving confirm value : "+err);
		}
		else
		{
			console.log("result is : "+ JSON.stringify(result));
			if(result[0].confirm == 2)
			{
				//res.redirect("/login");
				res.send("Email id already confirmed");				
			}
			else if(result[0].confirm == 1) 
			{
				console.log("update 2 from 1"+ JSON.stringify(req.query.user_id));
				db.query("UPDATE users SET confirm = 2 WHERE id=?",[req.query.user_id],function(err,result)
				{
					if(err)
					{
						console.log("Error while updating confirm value : "+err)
					}
					else
					{
						req.login(user_id,function(err)
						{
							//res.redirect("/home");							
							res.send("Email id confirmed");
						})		
					}
				})				
			}
			else
			{
				//res.redirect("/signup");
				res.send("Email id confirmed");
			}	
		}		
	})
})

//Change password from profile page
app.put("/changePassword",authenticationMiddleware(),function(req,res,next) {
	let userId = req.user.user_id;
	let currentPassword = req.body.currentPassword;
	let newPassword = req.body.newPassword;

	//Get logged in user passoword from db
	db.query("SELECT password from users where id=?",[userId], function(err,userPassowrd) {
		if(err) {
			console.log("===Error occurred while get user password: ",err)
			res.status(400).send({message: "Error"})
		} else {
			if(userPassowrd[0] && userPassowrd[0][password]) {
				/**
				 * 1) Consider stored password is encrypted.
				 * 2) Convert incoming current password into encrypted format using same key
				 * 3) Compare encrypted formats of incoming current password with db password
				 * 4) If matched, encrypt new password and update db with new password
				 * 5) Return success
				 */
				res.status(200).send({message: "success"});
			} else {
				res.status(400).send({message: "Something went wrong"})
			}
		}
	})
})

//Forget password request
app.post("/forgotPassword",function(req,res,next) {
	let userEmail = req.body.userEmail;

	//Get user from db
	db.query("SELECT * from users where email=?",[userEmail], function(err,userPassowrd) {
		if(err) {
			console.log("===Error occurred while get user with email: ",err)
			res.status(400).send({message: "Error"})
		} else {
			/**
			 * 1) Create hash using email and timestamp say emailHash
			 * 2) send password reset link to the emailHash eg: http://localhost:3000/resetPassword?email=userHash
			 * 3) On redirecting to link, user will get a form to reset password
			 * 4) On sumbitting reset password, route /resetPassword will be hit
			 */
			 res.status(200).send({message: "success"});
		}
	})
})

//Reset password
app.put("/resetPassword",function(req,res,next) {
	let userNewPassword = req.body.newPassword;
	let emailHash = req.body.emailHash;

	/**
	 * 1) Decrypt email hash using key to get email id and timestamp
	 * 2) Check for link expiry using timestamp
	 * 3) If link not expired update user with new password
	 */

	res.status(200).send({message: "Password reset was successful. Please login"})
})


