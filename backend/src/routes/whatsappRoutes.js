const express = require("express");
const router = express.Router();
const { enviarMensagem } = require("../controllers/whatsappController");

router.post("/send", enviarMensagem);

module.exports = router;

