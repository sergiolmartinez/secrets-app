//jshint esversion:6
require("dotenv").config();
// const SHA256 = require("crypto-js/sha256");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const findOrCreate = require('mongoose-findorcreate');

// const bcrypt = require("bcrypt");
// const encrypt = require("mongoose-encryption");

// const saltRounds = 10;
const { Schema } = mongoose;

mongoose.set('strictQuery', false);
const app = express();
 
const port = process.env.PORT || 3000;
 
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

main().catch((err) => console.log(err));
async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/userDB");
  //   await mongoose.connect(`mongodb+srv://${USER}:${PASS}@cluster0.z0bjbyl.mongodb.net/secretsUserDB`)
    
  const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
    });

    userSchema.plugin(passportLocalMongoose);
    // userSchema.plugin(findOrCreate);

    const secret = process.env.SECRET;
    // userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

    const User = mongoose.model("User", userSchema);

    passport.use(User.createStrategy());

    passport.serializeUser(function(user, done) {
        done(null, user);
      });
     
    passport.deserializeUser(function(user, done) {
        done(null, user);
    });

    passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets"
      },
      function(accessToken, refreshToken, profile, cb) {
        User.findOne({ googleId: profile.id }).then((foundUser) => {
            if (foundUser) {
              return foundUser;
            } else {
              const newUser = new User({
                googleId: profile.id
              });
              return newUser.save();
            }
          }).then((user) => {
            return cb(null, user);
          }).catch((err) => {
            return cb(err);
          });
      }
    ));
 
    app.get('/', (req, res) => {
    res.render('home');
    });

    app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));

    app.get("/auth/google/secrets", 
        passport.authenticate("google", { failureRedirect: "/login" }),
        function(req, res) {
            res.redirect("/secrets");
        });
    
    app.get('/login', (req, res) => {
    res.render('login');
    });
    
    app.get('/register', (req, res) => {
    res.render('register');
    });

    // Method to stop the cache from being stored in the browser and catch errors
    app.get("/secrets", function(req, res) {
        if (req.isAuthenticated()) {
            res.render("secrets");
        } else {
            res.redirect("/login");
        }
    })


    //Method to logout and redirect to home page and catch errors
    app.get('/logout', (req, res) => {
        req.logout((err) =>{
            if (err) {
                console.log(err);
            } else {
                res.redirect('/');
            }
        });
    });

    //Method to register a new user and catch errors
    app.post("/register", function(req,res){
        User.register({username: req.body.username}, req.body.password, function (err, user) {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
                })
            }
        })
    });

    app.post("/login",
        passport.authenticate("local", { failureRedirect: "/login" }), function(req, res) {
            res.redirect("/secrets");
        });


    app.listen(port, () => console.log(`Server started at port: ${port}`)
    );
}
