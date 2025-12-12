const db = require("../../db");

exports.limparRadius = async (req, res) => {
  try {
    await db.query("DELETE FROM radcheck");
    await db.query("DELETE FROM radreply");
    await db.query("DELETE FROM radusergroup");
    await db.query("DELETE FROM radius_users");
    res.json({ message: "Usuários RADIUS limpos com sucesso." });
  } catch (error) {
    console.error("Erro ao limpar RADIUS:", error);
    res.status(500).json({ message: "Erro ao limpar RADIUS." });
  }
};

exports.limparPagamentos = async (req, res) => {
  try {
    await db.query("DELETE FROM pagamentos");
    res.json({ message: "Pagamentos limpos com sucesso." });
  } catch (error) {
    console.error("Erro ao limpar pagamentos:", error);
    res.status(500).json({ message: "Erro ao limpar pagamentos." });
  }
};

exports.limparLGPD = async (req, res) => {
  try {
    await db.query("DELETE FROM lgpd_logins");
    res.json({ message: "Logins LGPD limpos com sucesso." });
  } catch (error) {
    console.error("Erro ao limpar LGPD:", error);
    res.status(500).json({ message: "Erro ao limpar logins LGPD." });
  }
};

