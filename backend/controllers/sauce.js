const Sauce = require("../models/Sauce");
const fs = require("fs");


exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._userId;
    //delete sauceObject._id; ???
    const sauce = new Sauce({
        ...sauceObject,
        _userId:req.auth.userId, 
        imageUrl:`${req.protocol}://${req.get("host")}/images/${req.file.filename}`
    });
    sauce.save()
    .then(()=> res.status(201).json({message : "nouvelle sauce téléchargée"}))
    .catch(error => res.status(400).json({error}));
};


exports.getAllSauces = (req, res, next) => {
    Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({error}));
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({_id : req.params.id})
    .then((sauce) => res.status(200).json(sauce))
    .catch(error => res.status(404).json({error}));
}; 


exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl:`${req.protocol}://${req.get("host")}/images/${req.file.filename}`
    } : {...req.body};

    delete sauceObject._userId;
    Sauce.findOne({_id : req.params.id})
    .then((sauce) => {
        // if (sauce.userId != req.params.userId) {
        //     return res.status(403).json({message : "Cette sauce n'est pas la vôtre."})
        // }
        if (req.file) {
            fs.unlink(`images/${sauce.imageUrl.split("/images/")[1]}`, () => {
                Sauce.updateOne({_id : req.params.id}, {...sauceObject, _id:req.params.id})
                .then(() => res.status(200).json({message : "sauce modifiée"}))
                .catch(error => res.status(400).json({error}));
            })
        } else {  
            Sauce.updateOne({_id : req.params.id}, {...sauceObject, _id:req.params.id})
            .then(() => res.status(200).json({message : "sauce modifiée"}))
            .catch(error => res.status(400).json({error}));
        }
    })
    .catch(error => res.status(400).json({error}));
}; 


exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({_id : req.params.id})
    .then((sauce) => {
        if (sauce.userId != req.auth.userId) {
            return res.status(403).json({message : "Cette sauce n'est pas la vôtre."});
        }
        fs.unlink(`images/${sauce.imageUrl.split("/images/")[1]}`, () => {
            Sauce.deleteOne({_id : req.params.id})
            .then(() => res.status(200).json({message : "sauce supprimée"}))
            .catch(error => res.status(400).json({error}));
        })
    })
    .catch(error => res.status(500).json({error}));
};


exports.likeDislikeSauce = (req, res, next) => {

    Sauce.findOne({_id : req.params.id})
    .then()
    .catch();



};


/*
     - like : 
     
     if (user in [usersLiked]) {
        => total likes -1
        => remove user from [usersLiked]
     } else if (user in [usersDisliked) {
        { => total dislikes -1
          => total likes +1
          => remove user from [usersDisliked]
          => add user to [usersLiked]
        } else {
            => total likes +1
            => add user to [usersLiked]
        }

     - dislike : 

     if (user in [usersDisliked]) {
        => total dislikes -1
        => remove user from [usersDislikes]
     } else if (user in [usersLiked]) {
        => total likes -1
        => total dislikes +1
        => remove user from [usersLiked]
        => add user to [usersDisliked]
     } else {
        => total dislikes +1
        => add user to [usersDislikes]
     }

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