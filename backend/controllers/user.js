const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const validEmail = /^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$/;        //regex pour l'email. Normalement pris en charge par le front, mais mieux vaux double sécurité
const validPassword = /^[^\s]{8,}$/;                           //regex pour le password. idem email.
                                                               



exports.signup = (req, res, next) => {
    if (!req.body.email.match(validEmail)) {                                                             //regex évitent d'appeler inutilement la BDD en cas d'erreur de saisie
        return res.status(400).json({ message: "email incorrect" });
    }
    if (!req.body.password.match(validPassword)) {
        return res.status(400).json({ message: "le mot de passe doit contenir au moins 8 caracères" });
    }
    User.findOne({ email: req.body.email })                                                                  //recherche si l'email correspond déjà à un compte
        .then(user => {
            if (user) {                                                                                      //sécurité : impossible de créer 2 comptes avec le même email
                return res.status(409).json({ message: "impossible de créer un compte avec cet email" });    //le message ne dévoile pas explicitement qu'un compte existe déjà avec cet email
            }
            bcrypt.hash(req.body.password, 10)                                                              // hachage du mot de passe
                .then(hash => {
                    const user = new User({
                        email: req.body.email,
                        password: hash
                    });
                    user.save()                                                                                        // enregistrement du nouvel user dans la BDD, après toutes les vérifications
                        .then(() => res.status(201).json({ message: `nouveau compte créé : ${req.body.email}` }))
                        .catch(error => res.status(500).json({ error }));
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};


exports.login = (req, res, next) => {
    if (!req.body.email.match(validEmail)) {                                                                //regex évitent appel BDD dans le cas d'erreur de saisie
        return res.status(400).json({ message: "email incorrect" });
    }
    if (!req.body.password.match(validPassword)) {
        return res.status(400).json({ message: "le mot de passe doit contenir au moins 8 caractères" });
    }
    User.findOne({ email: req.body.email })                                                                  //recherche de l'user dans la BDD
        .then(user => {
            if (!user) {
                return res.status(401).json({ message: "paire identifiant - mot de passe incorrecte" });      //si l'user n'est pas dans la BDD, le message ne le révèle pas explicitement
            } else {
                bcrypt.compare(req.body.password, user.password)
                    .then(valid => {
                        if (!valid) {                                                                                       //gestion erreur password
                            return res.status(401).json({ message: "paire identifiant - mot de passe incorrecte" });
                        } else {
                            res.status(200).json({
                                userId: user._id,
                                token: jwt.sign(                                                                         //création et attribution d'un jeton de connextion JSON web token
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

