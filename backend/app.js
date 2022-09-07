const express = require("express");
const mongoose = require("mongoose");

const app = express();

mongoose.connect("mongodb+srv://AlexandraMallet:piiquante@cluster0.zq66r16.mongodb.net/?retryWrites=true&w=majority",
    {
        useNewUrlParser : true,
        useUnifiedTopology : true
    })
    .then(() => console.log("Application connectée à MongoDB."))
    .catch(() => console.log("Impossible de se connecter à MongoDB."));


module.exports = app;