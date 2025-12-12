const express = require("express")
const router = express.Router()
const auth = require("../middleware/auth")
const db = require("../../db")
const { testarConexao } = require("../utils/mikrotikClient");
const { obterInformacoes } = require("../controllers/mikrotikAPIController");
console.log("DEBUG obterInformacoes:", typeof obterInformacoes);

// Criar Mikrotik
// Criar Mikrotik
router.post("/", auth, async (req, res) => {
  const { nome, ip, usuario, senha, porta, end_hotspot } = req.body;

  if (!nome || !ip || !usuario || !senha || !porta) {
    console.log("⚠️ Campos obrigatórios faltando:", req.body);
    return res.status(400).json({ message: "Campos obrigatórios faltando." });
  }

  try {
    // Verificar se já existe Mikrotik com esse IP
    const [existente] = await db.query("SELECT id FROM mikrotiks WHERE ip = ?", [ip]);
    if (existente.length > 0) {
      return res.status(400).json({ message: "Já existe um Mikrotik com este IP." });
    }

    // Verificar se já existe NAS com esse IP
    const [nasExiste] = await db.query("SELECT id FROM nas WHERE nasname = ?", [ip]);
    if (nasExiste.length > 0) {
      return res.status(400).json({ message: "Já existe um NAS com este IP." });
    }

    // Inserir Mikrotik com end_hotspot
    await db.execute(
      "INSERT INTO mikrotiks (nome, ip, usuario, senha, porta, end_hotspot) VALUES (?, ?, ?, ?, ?, ?)",
      [nome, ip, usuario, senha, porta, end_hotspot || null]
    );

    // Inserir NAS
    await db.execute(
      "INSERT INTO nas (nasname, shortname, type, secret, description) VALUES (?, ?, 'other', ?, 'RADIUS Client')",
      [ip, nome, senha]
    );

    console.log("✅ Mikrotik e NAS cadastrados com sucesso.");
    res.status(201).json({ message: "Mikrotik cadastrado com sucesso." });

  } catch (err) {
    console.error("❌ Erro ao salvar Mikrotik ou NAS:", err);
    res.status(500).json({ message: "Erro interno ao salvar Mikrotik." });
  }
});


router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM mikrotiks ORDER BY id DESC")
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: "Erro ao buscar Mikrotiks." })
  }
})


// Atualizar Mikrotik
// Atualizar Mikrotik
router.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { nome, ip, usuario, senha, porta, end_hotspot } = req.body;

  try {
    // Atualiza mikrotiks incluindo end_hotspot
    await db.execute(
      "UPDATE mikrotiks SET nome = ?, ip = ?, usuario = ?, senha = ?, porta = ?, end_hotspot = ? WHERE id = ?",
      [nome, ip, usuario, senha, porta, end_hotspot || null, id]
    );

    // Atualiza nas com base no IP atual
    await db.execute(
      "UPDATE nas SET nasname = ?, shortname = ?, secret = ? WHERE nasname = ?",
      [ip, nome, senha, ip]
    );

    res.json({ message: "Atualizado com sucesso." });
  } catch (err) {
    console.error("❌ Erro ao atualizar Mikrotik/NAS:", err);
    res.status(500).json({ message: "Erro ao atualizar Mikrotik." });
  }
});


// Deletar Mikrotik
// Deletar Mikrotik e correspondente na tabela NAS
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar IP do Mikrotik
    const [[mikrotik]] = await db.execute("SELECT ip FROM mikrotiks WHERE id = ?", [id]);
    if (!mikrotik) return res.status(404).json({ message: "Mikrotik não encontrado." });

    const ip = mikrotik.ip.trim();

    // Deletar Mikrotik
    await db.execute("DELETE FROM mikrotiks WHERE id = ?", [id]);

    // Verificar se existe NAS com esse IP antes de tentar remover
    const [nas] = await db.execute("SELECT id FROM nas WHERE nasname = ?", [ip]);
    if (nas.length > 0) {
      await db.execute("DELETE FROM nas WHERE nasname = ?", [ip]);
      console.log(`✅ NAS com IP ${ip} removido.`);
    } else {
      console.warn(`⚠️ Nenhum NAS encontrado com IP ${ip}`);
    }

    res.json({ message: "Removido com sucesso." });
  } catch (err) {
    console.error("❌ Erro ao deletar Mikrotik/NAS:", err);
    res.status(500).json({ message: "Erro ao deletar Mikrotik." });
  }
});

router.post("/:id/testar", auth, async (req, res) => {
  const { id } = req.params;
  try {
    const [[mikrotik]] = await db.execute("SELECT * FROM mikrotiks WHERE id = ?", [id]);
    if (!mikrotik) return res.status(404).json({ message: "Mikrotik não encontrado" });

    const resultado = await testarConexao(mikrotik);

    if (resultado.sucesso) {
      res.json({ status: "online", message: "Conexão bem-sucedida" });
    } else {
      res.status(400).json({ status: "offline", message: resultado.erro });
    }
  } catch (err) {
    console.error("Erro ao testar Mikrotik:", err);
    res.status(500).json({ message: "Erro interno ao testar Mikrotik" });
  }
});


router.post("/:id/info", auth, obterInformacoes);
module.exports = router

