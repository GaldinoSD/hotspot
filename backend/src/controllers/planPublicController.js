const db = require("../config/db");

exports.listarPlanosPublicos = async (req, res) => {
  try {
    const [planos] = await db.query("SELECT * FROM planos WHERE ativo = 1");
    res.json(planos);
  } catch (err) {
    console.error("Erro ao buscar planos públicos:", err);
    res.status(500).json({ message: "Erro ao buscar planos" });
  }
};

exports.buscarPlanoPublicoPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const [planos] = await db.query("SELECT * FROM planos WHERE id = ? AND ativo = 1", [id]);
    if (!planos.length) {
      return res.status(404).json({ message: "Plano não encontrado." });
    }
    res.json(planos[0]);
  } catch (err) {
    console.error("Erro ao buscar plano público:", err);
    res.status(500).json({ message: "Erro ao buscar plano" });
  }
};

