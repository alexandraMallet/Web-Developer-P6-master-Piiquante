const express = require("express");
const router = express.Router();
const sauceCrt = require("../controllers/sauce");
const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");


router.post("/", auth, multer, sauceCrt.createSauce);
router.get("/", auth, sauceCrt.getAllSauces);
router.get("/:id", auth, sauceCrt.getOneSauce);
router.put("/:id", auth, multer, sauceCrt.modifySauce);
router.delete("/:id", auth, sauceCrt.deleteSauce);
router.post("/:id/like", auth, sauceCrt.likeDislikeSauce);


module.exports = router;