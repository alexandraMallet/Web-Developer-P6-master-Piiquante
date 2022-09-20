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
            // if (sauce.userId != req.params.userId) {
            //     return res.status(403).json({message : "Cette sauce n'est pas la vôtre."})
            // }
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





/*
+====+================================+================================+========================+
|    | Liké                           | Disliké                        | Rien                   |
+====+================================+================================+========================+
| 0  | 200 - Retirer le like          | 200 - Retirer le dislike       | 404 - Rien à supprimer |
|----|--------------------------------|--------------------------------|------------------------|
| 1  | 409 - Like existant            | 409 - Dislike existant         | 201 - Créer like       |
|    |                                | 201 - Dislike converti en like |                        |
|----|--------------------------------|--------------------------------|------------------------|
| -1 | 409 - Like existant            | 409 - Dislike existant         | 201 - Créer dislike    |
|    | 201 - Like converti en dislike |                                |                        |
+====+================================+================================+========================+

*/

/*rappel modele Sauce : 
likes : {type : Number, default : 0},
dislikes : {type : Number, default : 0},
usersLiked = tableau des identifiants des users qui ont liké la sauce
usersDisliked = tableau des identifiants des users qui ont disliké la sauce
*/
/*
Définit le statut "Like" pour l'userId fourni.
like = 1 : user aime / like = -1 : user n'aime pas / like = 0 : user indifférent et annule like ou dislike
l'ID du user doit être ajouté ou retiré du tableau approprié pour garder trace et éviter +ieurs likes ou dislikes du même user sur la même sauce
Nombre total like et dislike de la sauce est mis à jour à chaque nouvelle notation
*/
/*
- Si j'ai déjà liké et que je demande de supprimer (0) : Retirer le like.
- Si j'ai déjà liké et que je demande de liker (1) : Erreur like déjà existant.
- Si j'ai déjà liké et que je demande de disliker (-1) : Erreur like déjà existant OU conversion du like en dislike.

- Si tu as déjà disliké et que je demande de supprimer (0) : Retirer le dislike.
- Si tu as déjà disliké et que je demande de liker (1) : Erreur dislike déjà existant OU conversion du dislike en like.
- Si tu as déjà disliké et que je demande de disliker (-1) : Errer dislike déjà existant.

- Si tu n'as pas réagi et que je demande de supprimer (0) : Erreur rien à supprimer.
- Si tu n'as pas réagi et que je demande de liker (1) : Créer le like.
- Si tu n'as pas réagi et que je demande de disliker (-1) : Créer le dislike.
*/