//jshint esversion:6
require("dotenv").config();
// const SHA256 = require("crypto-js/sha256");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
// const encrypt = require("mongoose-encryption");

const saltRounds = 10;
const { Schema } = mongoose;

mongoose.set('strictQuery', false);
const app = express();
 
const port = process.env.PORT || 3000;
 
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

main().catch((err) => console.log(err));
async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/userDB");
  //   await mongoose.connect(`mongodb+srv://${USER}:${PASS}@cluster0.z0bjbyl.mongodb.net/secretsUserDB`)
    
  const userSchema = new mongoose.Schema({
    email: String,
    password: String
    });

    const secret = process.env.SECRET;
    // userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

    const User = mongoose.model("User", userSchema);
 
    app.get('/', (req, res) => {
    res.render('home');
    });
    
    app.get('/login', (req, res) => {
    res.render('login');
    });
    
    app.get('/register', (req, res) => {
    res.render('register');
    });

    app.post('/register', async function(req, res) {
        const hash = await bcrypt.hash(req.body.password, saltRounds);
 
        const newUser = new User({
          email: req.body.username,
       
                // bcrypt
          password: hash
        });
        newUser.save().then(()=>{
          res.render("secrets");
        }).catch((err)=>{
           console.log(err)
        })
      });


    app.post('/login', async (req, res) => {
        const username = req.body.username;
        // const password = SHA256(req.body.password).toString();
        const password = req.body.password;

        User.findOne({email: username})
        .then(async function(foundUser) {
            if(foundUser) {
                if (bcrypt.compare(password, foundUser.password)){
                    
                        res.render("secrets");
                    
                    };
                }
            }).catch((err) => {
            console.log(err);
        })
    });
    
    app.listen(port, () => console.log(`Server started at port: ${port}`)
    );
}
