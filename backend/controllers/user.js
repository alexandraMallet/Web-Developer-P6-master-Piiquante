const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10)
    .then(hash => {
        const user = new User({
            email : req.body.email,
            password : hash
        });
        user.save()
        .then(() => res.status(201).json({message : "Nouvel utilisateur.ice créé.e"}))
        .catch(error => res.status);
    })
    .catch(error => res.status(500).json({error}));
};




exports.login = (req, res, next) => {

};

