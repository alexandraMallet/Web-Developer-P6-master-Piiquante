const express = require("express");
const router = express.Router();
const sauceCrt = require("../controllers/sauce");
const auth = require("../middleware/auth");


router.post("/", auth, sauceCrt.createSauce);
router.get("/", auth, sauceCrt.getAllSauces);
router.get("/:id", auth, sauceCrt.getOneSauce);
router.put("/:id", auth, sauceCrt.modifySauce);
router.delete("/:id", auth, sauceCrt.deleteSauce);
router.post("/:id/like", auth, sauceCrt.likeDislikeSauce);


module.exports = router;