const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  limparRadius,
  limparPagamentos,
  limparLGPD
} = require("../controllers/limpezaController");

router.delete("/radius", auth, limparRadius);
router.delete("/pagamentos", auth, limparPagamentos);
router.delete("/lgpd", auth, limparLGPD);

module.exports = router;
