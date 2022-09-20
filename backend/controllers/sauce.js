const Sauce = require("../models/Sauce");
const fs = require("fs");


exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._userId;
    //delete sauceObject._id; ???
    const sauce = new Sauce({
        ...sauceObject,
        _userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
    });
    sauce.save()
        .then(() => res.status(201).json({ message: "nouvelle sauce téléchargée" }))
        .catch(error => res.status(400).json({ error }));
};


exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
};


exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
    } : { ...req.body };

    delete sauceObject._userId;
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            if (sauce.userId != req.auth.userId) {
                return res.status(403).json({message : "Cette sauce n'est pas la vôtre."})
             }
            if (req.file) {
                fs.unlink(`images/${sauce.imageUrl.split("/images/")[1]}`, () => {
                    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
                        .then(() => res.status(200).json({ message: "sauce modifiée" }))
                        .catch(error => res.status(400).json({ error }));
                })
            } else {
                Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: "sauce modifiée" }))
                    .catch(error => res.status(400).json({ error }));
            }
        })
        .catch(error => res.status(400).json({ error }));
};


exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            if (sauce.userId != req.auth.userId) {
                return res.status(403).json({ message: "Cette sauce n'est pas la vôtre." });
            }
            fs.unlink(`images/${sauce.imageUrl.split("/images/")[1]}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message: "sauce supprimée" }))
                    .catch(error => res.status(400).json({ error }));
            })
        })
        .catch(error => res.status(500).json({ error }));
};


exports.likeDislikeSauce = (req, res, next) => {

    Sauce.findOne({ _id: req.params.id })
        .then((sauce) => {
            const user = req.auth.userId;
            const userLiked = sauce.usersLiked.find(e => e == user);
            const userDisliked = sauce.usersDisliked.find(e => e == user);

            if (!userLiked && !userDisliked) {
                switch (req.body.like) {
                    case 0:
                        res.status(404).json({ message: "rien à supprimer" });
                        break;
                    case 1:
                        sauce.likes += 1;
                        sauce.usersLiked.push(`${user}`);
                        sauce.save()
                            .then(() => res.status(201).json({ message: "like ajouté" }))
                            .catch(error => res.status(500).json({ error }));
                        break;
                    case -1:
                        sauce.dislikes += 1;
                        sauce.usersDisliked.push(`${user}`);
                        sauce.save()
                            .then(() => res.status(201).json({ message: "dislike ajouté" }))
                            .catch(error => res.status(500).json({error}));
                }
                return;
            }
            if (userLiked) {
                switch (req.body.like) {
                    case 0:
                        sauce.likes -= 1;
                        sauce.usersLiked = sauce.usersLiked.filter(e => e != `${user}`);
                        sauce.save()
                            .then(() => res.status(200).json({ message: "like supprimé" }))
                            .catch(error => res.status(500).json({ error }));
                        break;
                    case 1:
                        res.status(409).json({ message: "like déjà existant" });
                        break;
                    case -1:
                        sauce.likes -= 1;
                        sauce.dislikes += 1;
                        sauce.usersLiked = sauce.usersLiked.filter(e => e != `${user}`);
                        sauce.usersDisliked.push(`${user}`);
                        sauce.save()
                            .then(() => res.status(201).json({ message: "like supprimé et dislike ajouté" }))
                            .catch(error => res.status(500).json({ error }));
                }
                return;
            }

            if (userDisliked) {
                switch (req.body.like) {
                    case 0:
                        sauce.dislikes -= 1;
                        sauce.usersDisliked = sauce.usersDisliked.filter(e => e != `${user}`);
                        sauce.save()
                            .then(() => res.status(200).json({ message: "dislike supprimé" }))
                            .catch(error => res.status(500).json({ error }));
                        break;
                    case 1:
                        sauce.dislikes -= 1;
                        sauce.likes += 1;
                        sauce.usersDisliked = sauce.usersDisliked.filter(e => e != `${user}`);
                        sauce.usersLiked.push(`${user}`);
                        sauce.save()
                            .then(() => res.status(201).json({ message: "like supprimé et dislike ajouté" }))
                            .catch(error => res.status(500).json({ error }));
                        break;
                    case -1:
                        res.status(409).json({ message: "dislike déjà existant" });
                }
            }
        })
        .catch(error => res.status(500).json({ error }));
};


