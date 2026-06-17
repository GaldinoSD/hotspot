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

    // Sessões por Mikrotik via radacct (conexões ativas online no momento)
    const [sessoes] = await db.query(`
      SELECT m.nome, COUNT(ra.radacctid) AS conectados
      FROM mikrotiks m
      LEFT JOIN radacct ra ON ra.nasipaddress COLLATE utf8mb4_unicode_ci = m.ip COLLATE utf8mb4_unicode_ci AND ra.acctstoptime IS NULL
      WHERE m.empresa_id = ?
      GROUP BY m.id, m.nome
    `, [empresaId]);

    // Consumo acumulado por Mikrotik (soma de sessões ativas + logs consolidados)
    const [consumoMikrotiks] = await db.query(`
      SELECT 
        m.id,
        m.nome,
        m.ip,
        COALESCE(SUM(combined.upload_bytes), 0) AS upload_bytes,
        COALESCE(SUM(combined.download_bytes), 0) AS download_bytes,
        COUNT(DISTINCT combined.username) AS total_usuarios_unicos,
        COUNT(combined.session_id) AS total_conexoes
      FROM mikrotiks m
      LEFT JOIN (
        SELECT 
          nas_ip,
          bytes_entrada AS upload_bytes,
          bytes_saida AS download_bytes,
          username,
          id AS session_id
        FROM connection_logs
        WHERE empresa_id = ?

        UNION ALL

        SELECT 
          nasipaddress AS nas_ip,
          acctinputoctets AS upload_bytes,
          acctoutputoctets AS download_bytes,
          username,
          radacctid AS session_id
        FROM radacct
        WHERE acctstoptime IS NULL
      ) combined ON combined.nas_ip COLLATE utf8mb4_unicode_ci = m.ip COLLATE utf8mb4_unicode_ci
      WHERE m.empresa_id = ?
      GROUP BY m.id, m.nome, m.ip
    `, [empresaId, empresaId]);

    // Consumo histórico diário nos últimos 7 dias (agrupado por dia e por Mikrotik)
    const [consumoHistorico] = await db.query(`
      SELECT data, mikrotik, SUM(upload_bytes) AS upload_bytes, SUM(download_bytes) AS download_bytes
      FROM (
        SELECT 
          DATE_FORMAT(cl.inicio_conexao, '%Y-%m-%d') AS data,
          m.nome AS mikrotik,
          COALESCE(cl.bytes_entrada, 0) AS upload_bytes,
          COALESCE(cl.bytes_saida, 0) AS download_bytes
        FROM mikrotiks m
        INNER JOIN connection_logs cl ON cl.nas_ip COLLATE utf8mb4_unicode_ci = m.ip COLLATE utf8mb4_unicode_ci
        WHERE m.empresa_id = ? 
          AND cl.inicio_conexao >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)

        UNION ALL

        SELECT 
          DATE_FORMAT(ra.acctstarttime, '%Y-%m-%d') AS data,
          m.nome AS mikrotik,
          COALESCE(ra.acctinputoctets, 0) AS upload_bytes,
          COALESCE(ra.acctoutputoctets, 0) AS download_bytes
        FROM mikrotiks m
        INNER JOIN radacct ra ON ra.nasipaddress COLLATE utf8mb4_unicode_ci = m.ip COLLATE utf8mb4_unicode_ci
        WHERE m.empresa_id = ? 
          AND ra.acctstarttime >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
          AND ra.acctstoptime IS NULL
      ) combined
      GROUP BY data, mikrotik
      ORDER BY data ASC, mikrotik ASC
    `, [empresaId, empresaId]);

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
