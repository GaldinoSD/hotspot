const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  gerarPagamento,
  notificacaoWebhook,
  listarPagamentosAprovados,
  liberarManual,
  listarTodosPagamentos,
  verificarStatusPagamento
} = require("../controllers/pagamentoController");

router.post("/gerar", gerarPagamento);
router.post("/notificacao", notificacaoWebhook); // <- webhook
router.get("/aprovados", auth, listarPagamentosAprovados);
router.get("/todos", auth, listarTodosPagamentos);
router.post("/liberar/:id", auth, liberarManual);
router.get("/status", verificarStatusPagamento);

module.exports = router;
