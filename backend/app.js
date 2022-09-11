const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./routes/user");

const app = express();

app.use(express.json());

mongoose.connect("mongodb+srv://AlexandraMallet:piiquante@cluster0.zq66r16.mongodb.net/?retryWrites=true&w=majority",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log("Application connectée à MongoDB."))
    .catch(() => console.log("Impossible de se connecter à MongoDB."));



app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use("/api/auth", userRoutes);

module.exports = app;