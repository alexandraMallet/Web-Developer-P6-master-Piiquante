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
    sauce.save
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
        if (sauce.userId != req.params.userId) {
            return res.status(401).json({message : "Cette sauce n'est pas la vôtre."})
        }
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
            return res.status(401).json({message : "Cette sauce n'est pas la vôtre."});
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

};