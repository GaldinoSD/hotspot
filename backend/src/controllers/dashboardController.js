const db = require("../../db");

exports.getDashboard = async (req, res) => {
  try {
    const empresaId = req.empresa_id;

    // Pagamentos
    const [[{ total_pagamentos }]] = await db.query(
      "SELECT COUNT(*) as total_pagamentos FROM pagamentos WHERE empresa_id = ?",
      [empresaId]
    );
    const [[{ pagamentos_24h }]] = await db.query(
      "SELECT COUNT(*) as pagamentos_24h FROM pagamentos WHERE empresa_id = ? AND criado_em >= NOW() - INTERVAL 1 DAY",
      [empresaId]
    );

    // Usuários Radius (via radius_users para filtrar por empresa)
    const [[{ total_usuarios }]] = await db.query(
      "SELECT COUNT(*) as total_usuarios FROM radius_users WHERE empresa_id = ?",
      [empresaId]
    );

    // Mikrotiks
    const [[{ total_mikrotiks }]] = await db.query(
      "SELECT COUNT(*) as total_mikrotiks FROM mikrotiks WHERE empresa_id = ?",
      [empresaId]
    );

    // Sessões por Mikrotik via radius_users
    const [sessoes] = await db.query(`
      SELECT m.nome, COUNT(r.username) AS conectados
      FROM mikrotiks m
      LEFT JOIN radius_users r ON r.nas_id = m.id
      WHERE m.empresa_id = ?
      GROUP BY m.id, m.nome
    `, [empresaId]);

    // Consumo acumulado por Mikrotik
    const [consumoMikrotiks] = await db.query(`
      SELECT 
        m.id,
        m.nome,
        m.ip,
        COALESCE(SUM(ra.acctinputoctets), 0) AS upload_bytes,
        COALESCE(SUM(ra.acctoutputoctets), 0) AS download_bytes,
        COUNT(DISTINCT ra.username) AS total_usuarios_unicos,
        COUNT(ra.radacctid) AS total_conexoes
      FROM mikrotiks m
      LEFT JOIN radacct ra ON ra.nasipaddress COLLATE utf8mb4_unicode_ci = m.ip COLLATE utf8mb4_unicode_ci
      WHERE m.empresa_id = ?
      GROUP BY m.id, m.nome, m.ip
    `, [empresaId]);

    // Consumo histórico diário nos últimos 7 dias (agrupado por dia e por Mikrotik)
    const [consumoHistorico] = await db.query(`
      SELECT 
        DATE_FORMAT(ra.acctstarttime, '%Y-%m-%d') AS data,
        m.nome AS mikrotik,
        COALESCE(SUM(ra.acctinputoctets), 0) AS upload_bytes,
        COALESCE(SUM(ra.acctoutputoctets), 0) AS download_bytes
      FROM mikrotiks m
      INNER JOIN radacct ra ON ra.nasipaddress COLLATE utf8mb4_unicode_ci = m.ip COLLATE utf8mb4_unicode_ci
      WHERE m.empresa_id = ? 
        AND ra.acctstarttime >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE_FORMAT(ra.acctstarttime, '%Y-%m-%d'), m.id, m.nome
      ORDER BY data ASC, m.nome ASC
    `, [empresaId]);

    res.json({
      pagamentos: {
        total: total_pagamentos,
        ultimas_24h: pagamentos_24h,
      },
      radius: {
        total_usuarios,
      },
      mikrotiks: {
        total: total_mikrotiks,
        online: total_mikrotiks
      },
      sessoes,
      consumoMikrotiks,
      consumoHistorico
    });
  } catch (err) {
    console.error("Erro no dashboard:", err);
    res.status(500).json({ message: "Erro ao buscar dados do dashboard" });
  }
};
