//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
	secret: "Our little secret.",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/secretsUserDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const usersSchema = new mongoose.Schema({
	email: String,
	password: String,
	secrets: String
});

usersSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", usersSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function (req, res) {
	res.render("home");
});

app.get("/login", function (req, res) {
	res.render("login");
});

app.get("/register", function (req, res) {
	res.render("register");
});

app.get("/secrets", function (req, res) {
	User.find({"secrets": {$ne: null}}, function (err, foundUsers) {
		if (err) {
			console.log(err);
		} else {
			if (foundUsers) {
				res.render("secrets", {
					usersWithSecrets: foundUsers
				});
			}
		}
	});
});

app.get('/submit', function (req, res) {
	if (req.isAuthenticated()) {
		res.render("submit");
	} else {
		res.redirect("/login");
	}
});

app.post("/submit", function (req, res) {
	const submittedSecret = req.body.secret;

	User.findById(req.user.id, function (err, foundUser) {
		if (err) {
			console.log(err);
		} else {
			if (foundUser) {
				console.log(submittedSecret);
				console.log(foundUser);
				foundUser.secrets = submittedSecret;
				foundUser.save(function () {
					res.redirect("/secrets");
				});
			}
		}
	});
});

app.get("/logout", function (req, res) {
	req.logout();
	res.redirect("/");
});

app.post("/register", function (req, res) {
	User.register({username: req.body.username}, req.body.password, function (err, user) {
		if (err) {
			console.log(err);
			res.redirect("/register");
		} else {
			passport.authenticate("local")(req, res, function () {
				res.redirect("/secrets");
			});
		}
	});
	
});

app.post("/login", function (req, res) {

	const user = new User({
		username: req.body.password,
		password: req.body.password
	});

	req.login(user, function (err) {
		if (err) {
			console.log(err);
		} else {
			passport.authenticate("local")(req, res, function () {
				res.redirect("/secrets");
			});
		}
	});
	
});


app.listen(3000, function() {
	console.log('Server running on Port 3000');
});
