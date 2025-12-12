const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  criarPlano,
  listarPlanos,
  atualizarPlano,
  deletarPlano,
  enviarParaMikrotik,
} = require("../controllers/planController");

router.get("/", auth, listarPlanos);
router.post("/", auth, criarPlano);
router.put("/:id", auth, atualizarPlano);
router.delete("/:id", auth, deletarPlano);
router.post("/:id/enviar", auth, enviarParaMikrotik);

module.exports = router;
