//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

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
    userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

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

    app.post('/register', async (req, res) => {
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        });
        await newUser.save()
        .then(()=> {
            res.render("secrets");
        }).catch((err) => {
            console.log(err);
        })
    });

    app.post('/login', async (req, res) => {
        const username = req.body.username;
        const password = req.body.password;

        User.findOne({email: username})
        .then((foundUser) => {
            if(foundUser) {
                if(foundUser.password === password) {
                    res.render("secrets");
                }
            }
        }).catch((err) => {
            console.log(err);
        })
    });
    
    app.listen(port, () => console.log(`Server started at port: ${port}`)
    );
}
