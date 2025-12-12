const express = require("express");
const router = express.Router();
const { lgpdLogin, getAllLgpd, lgpdCadastro } = require("../controllers/lgpdController");
const auth = require("../middleware/auth");

router.post("/login", lgpdLogin);
router.get("/", auth, getAllLgpd);
router.post("/cadastro", lgpdCadastro);

module.exports = router;

