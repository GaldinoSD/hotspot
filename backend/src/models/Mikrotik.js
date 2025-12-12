const db = require("../../db");

const Mikrotik = {
  create: async ({ nome, ip, usuario, senha, porta }) => {
    const [result] = await db.execute(
      "INSERT INTO mikrotiks (nome, ip, usuario, senha, porta) VALUES (?, ?, ?, ?, ?)",
      [nome, ip, usuario, senha, porta]
    );
    return result;
  },

  findAll: async () => {
    const [rows] = await db.execute("SELECT * FROM mikrotiks");
    return rows;
  }
};

module.exports = Mikrotik;

