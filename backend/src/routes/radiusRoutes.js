const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { criarUsuarioRadius, vincularPlano, listarUsuarios, deletarUsuarioRadius,listarSessoesAtivas,} = require('../controllers/radiusController');

// Rotas protegidas
router.post('/criar-usuario', authMiddleware, criarUsuarioRadius);
router.post('/vincular-plano', authMiddleware, vincularPlano);
router.get('/usuarios', authMiddleware, listarUsuarios);
router.delete('/usuarios/:username', authMiddleware, deletarUsuarioRadius);
router.get("/sessoes", authMiddleware, listarSessoesAtivas); // ✅ Nova rota
module.exports = router;
