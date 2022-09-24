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
    const sauceObject = req.file ? {                                                            //vérification de la présence d'une image ou non
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
    } : { ...req.body };

    delete sauceObject._userId;
    Sauce.findOne({ _id: req.params.id })                                                      //recherche de la sauce dans la BDD
        .then((sauce) => {
            if (sauce.userId != req.auth.userId) {
                return res.status(403).json({message : "Cette sauce n'est pas la vôtre."})       //vérification que l'user connecté est bien le propriétaire de la sauce
             }
            if (req.file) {
                fs.unlink(`images/${sauce.imageUrl.split("/images/")[1]}`, () => {                       //on efface l'ancienne image du server si la modification inclu une nouvelle image
                    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })      //on met à jour la sauce
                        .then(() => res.status(200).json({ message: "sauce modifiée" }))
                        .catch(error => res.status(400).json({ error }));
                })
            } else {
                Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })            //en l'absence de nouvelle image, on met simplement la sauce à jour
                    .then(() => res.status(200).json({ message: "sauce modifiée" }))
                    .catch(error => res.status(400).json({ error }));
            }
        })
        .catch(error => res.status(400).json({ error }));
};


exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })                                                        //on recherche la sauce à supprimer dans la BDD
        .then((sauce) => {
            if (sauce.userId != req.auth.userId) {                                                 //on vérifie que la sauce appartient bien à l'user connecté
                return res.status(403).json({ message: "Cette sauce n'est pas la vôtre." });
            }
            fs.unlink(`images/${sauce.imageUrl.split("/images/")[1]}`, () => {                      //on supprime l'image du server
                Sauce.deleteOne({ _id: req.params.id })                                              //on supprime la sauce
                    .then(() => res.status(200).json({ message: "sauce supprimée" }))
                    .catch(error => res.status(400).json({ error }));
            })
        })
        .catch(error => res.status(500).json({ error }));
};


exports.likeDislikeSauce = (req, res, next) => {

    Sauce.findOne({ _id: req.params.id })                                                             //on cherche la sauce dans la BDD
        .then((sauce) => {
            const user = req.auth.userId;                                                              //on place l'userId connecté dans une constante
            const userLiked = sauce.usersLiked.find(e => e == user);                                   //on place l'userId cherché dans le tableau des likes dans une constante
            const userDisliked = sauce.usersDisliked.find(e => e == user);                             //on place l'userId cherché dans le tableau des dislikes dans une constante

            if (!userLiked && !userDisliked) {                                                 //cas où l'user connecté n'a encore ni liké ni disliké la sauce
                switch (req.body.like) {
                    case 0:                                                                      // et qu'il reste neutre
                        res.status(404).json({ message: "rien à supprimer" });
                        break;
                    case 1:                                                                       // et qu'il like
                        sauce.likes += 1;
                        sauce.usersLiked.push(`${user}`);
                        sauce.save()
                            .then(() => res.status(201).json({ message: "like ajouté" }))
                            .catch(error => res.status(500).json({ error }));
                        break;
                    case -1:                                                                       // et qu'il dislike
                        sauce.dislikes += 1;
                        sauce.usersDisliked.push(`${user}`);
                        sauce.save()
                            .then(() => res.status(201).json({ message: "dislike ajouté" }))
                            .catch(error => res.status(500).json({error}));
                }
                return;
            }
            if (userLiked) {                                                                          //cas où l'user a déjà liké la sauce
                switch (req.body.like) {
                    case 0:                                                                            // et qu'il annule son like sans disliker
                        sauce.likes -= 1;
                        sauce.usersLiked = sauce.usersLiked.filter(e => e != `${user}`);
                        sauce.save()
                            .then(() => res.status(200).json({ message: "like supprimé" }))
                            .catch(error => res.status(500).json({ error }));
                        break;
                    case 1:                                                                            // et qu'il tente de liker à nouveau
                        res.status(409).json({ message: "like déjà existant" });                       // (cas rendu normalement impossible par la logique du front mais à prévoir tout de même)
                        break;
                    case -1:                                                                               // et qu'il change son like pour un dislike
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

            if (userDisliked) {                                                                           // cas où l'user a déjà disliké la sauce
                switch (req.body.like) {
                    case 0:                                                                                 // et qu'il annule son dislike sans liker
                        sauce.dislikes -= 1;
                        sauce.usersDisliked = sauce.usersDisliked.filter(e => e != `${user}`);
                        sauce.save()
                            .then(() => res.status(200).json({ message: "dislike supprimé" }))
                            .catch(error => res.status(500).json({ error }));
                        break;
                    case 1:                                                                                  // et qu'il change son dislike pour un like
                        sauce.dislikes -= 1;
                        sauce.likes += 1;
                        sauce.usersDisliked = sauce.usersDisliked.filter(e => e != `${user}`);
                        sauce.usersLiked.push(`${user}`);
                        sauce.save()
                            .then(() => res.status(201).json({ message: "like supprimé et dislike ajouté" }))
                            .catch(error => res.status(500).json({ error }));
                        break;
                    case -1:                                                                                // et qu'il tente de disliker une seconde fois
                        res.status(409).json({ message: "dislike déjà existant" });                          // (même logique que tentative de 2 likes)
                }
            }
        })
        .catch(error => res.status(500).json({ error }));
};


