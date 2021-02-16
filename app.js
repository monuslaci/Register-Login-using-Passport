//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const https = require("https");
const mongoose = require('mongoose');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.set('view engine', 'ejs');


//Tell the app to use the eypress-session package
app.use(session({
  secret: 'A secret sentence that can be anything',
  resave: false,
  saveUninitialized: true,

}))

//Initialize the passport package
app.use(passport.initialize());
//Tell the app to use passport to set up the session
app.use(passport.session());


// mongoose.connect('mongodb://localhost:27017/userDB', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.set("useCreateIndex", true);


const userSchema = new mongoose.Schema({
  username: String,
  password: String
})

//add a plugin to userSchema: passportLocalMongoose, we will use this to hash and salt passwords and to save the useres to the MongoDB database
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

//create a strategy to authenticate users using their username and password, and to serialize and deserialize the user
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function (req, res) {
  res.render("home")
});

app.get("/login", function (req, res) {
  res.render("login")
});

app.post("/login", function (req, res) {
  let emailTyped = req.body.username;
  let passwordTyped = req.body.password;
  let hidden = req.body.hidden;

  const user = new User({
    username: emailTyped,
    password: passwordTyped
  })

  //console.log(user)

  //login user, the login functin comes from passport
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      //authenticate the user
      passport.authenticate("local")(res, req, function () {
        //if we successfully authenticated them we redirect back to the secrets route
        res.redirect("/secrets");

      })
    }
  })
});



app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});


app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {

  //this register function comes from the passport-local-mongoose package
  //the callback gives us the new registered user
  User.register({
    username: req.body.username
  }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      //set local authentication
      //the callback is triggered if the authentication is successful and we managed to successfully setup a cookie that saved their current logged in session
      //so we can see if they are loged in or not
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});


app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});


app.get("/other", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("other");
  } else {
  }
});


app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});