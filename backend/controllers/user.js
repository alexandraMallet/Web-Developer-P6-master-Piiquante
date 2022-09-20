const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const validEmail = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;
const validPassword = /^[^\s]{8,}$/;




exports.signup = (req, res, next) => {
    if (!req.body.email.match(validEmail)) {
        return res.status(400).json({ message: "email incorrect" });
    }
    if (!req.body.password.match(validPassword)) {
        return res.status(400).json({ message: "le mot de passe doit contenir au moins 8 caracères" });
    }
    User.findOne({ email: req.body.email })
        .then(user => {
            if (user) {
                return res.status(409).json({ message: "impossible de créer un compte avec cet email" });
            }
            bcrypt.hash(req.body.password, 10)
                .then(hash => {
                    const user = new User({
                        email: req.body.email,
                        password: hash
                    });
                    user.save()
                        .then(() => res.status(201).json({ message: `nouveau compte créé : ${req.body.email}` }))
                        .catch(error => res.status(500).json({ error }));
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};


exports.login = (req, res, next) => {
    if (!req.body.email.match(validEmail)) {
        return res.status(400).json({ message: "email incorrect" });
    }
    if (!req.body.password.match(validPassword)) {
        return res.status(400).json({ message: "le mot de passe doit contenir au moins 8 caractères" });
    }
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) {
                return res.status(401).json({ message: "paire identifiant - mot de passe incorrecte" });
            } else {
                bcrypt.compare(req.body.password, user.password)
                    .then(valid => {
                        if (!valid) {
                            return res.status(401).json({ message: "paire identifiant - mot de passe incorrecte" });
                        } else {
                            res.status(200).json({
                                userId: user._id,
                                token: jwt.sign(
                                    { userId: user._id },
                                    process.env.SECRET_TOKEN,
                                    { expiresIn: "24h" }
                                )
                            });
                        }
                    })
                    .catch(error => res.status(500).json({ error }));
            }
        })
        .catch(error => res.status(500).json({ error }));
};

