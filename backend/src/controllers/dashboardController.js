const db = require("../config/db");
const { RouterOSAPI } = require("node-routeros");

async function testarConexaoMikrotik({ ip, usuario, senha, porta }) {
  const conn = new RouterOSAPI({ host: ip, user: usuario, password: senha, port: porta });
  try {
    await conn.connect();
    await conn.close();
    return true;
  } catch {
    return false;
  }
}

async function contarUsuariosConectados({ ip, usuario, senha, porta }) {
  const conn = new RouterOSAPI({ host: ip, user: usuario, password: senha, port: porta });
  try {
    await conn.connect();
    const result = await conn.write("/ip/hotspot/active/print");
    await conn.close();
    return result.length;
  } catch {
    return 0;
  }
}

exports.getDashboard = async (req, res) => {
  try {
    // Pagamentos
    const [[{ total_pagamentos }]] = await db.query("SELECT COUNT(*) as total_pagamentos FROM pagamentos");
    const [[{ pagamentos_24h }]] = await db.query(
      "SELECT COUNT(*) as pagamentos_24h FROM pagamentos WHERE criado_em >= NOW() - INTERVAL 1 DAY"
    );

    // Usuários Radius
    const [[{ total_usuarios }]] = await db.query("SELECT COUNT(*) as total_usuarios FROM radcheck");

    // Mikrotiks
    const [mikrotiks] = await db.query("SELECT id, nome, ip, usuario, senha, porta FROM mikrotiks");

    let online = 0;
    const sessaoPorMikrotik = [];

    for (const mk of mikrotiks) {
      const estaOnline = await testarConexaoMikrotik(mk);
      if (estaOnline) online++;
      const conectados = await contarUsuariosConectados(mk);
      sessaoPorMikrotik.push({ nome: mk.nome, conectados });
    }

    res.json({
      pagamentos: { total: total_pagamentos, ultimas_24h: pagamentos_24h },
      radius: { total_usuarios },
      mikrotiks: { total: mikrotiks.length, online },
      sessoes: sessaoPorMikrotik
    });
  } catch (err) {
    console.error("Erro no dashboard:", err);
    res.status(500).json({ message: "Erro ao buscar dados do dashboard" });
  }
};

