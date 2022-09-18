const multer = require("multer");

const MIME_TYPE = {
    "image/jpg" : "jpg",
    "image/jpeg" : "jpg",
    "image/png" : "png"
};

const storage = multer.diskStorage({
    destination : (req, file, callback) => {
        callback(null, "images");
    },
    filename : (req, file, callback) => {
        callback(null, `${file.originalname.split(" ").join("_")}${Date.now()}.${MIME_TYPE[file.mimetype]}`);
    }
});


module.exports = multer({storage}).single("image");