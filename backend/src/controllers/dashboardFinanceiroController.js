const db = require("../../db");

exports.getFinanceiroDashboard = async (req, res) => {
  try {
    const empresaId = req.empresa_id;

    // 1. KPIs
    // Receita Hoje
    const [[{ receita_hoje }]] = await db.query(
      "SELECT COALESCE(SUM(valor), 0) as receita_hoje FROM pagamentos WHERE empresa_id = ? AND status = 'approved' AND criado_em >= CURDATE()",
      [empresaId]
    );

    // Receita 7 Dias
    const [[{ receita_7d }]] = await db.query(
      "SELECT COALESCE(SUM(valor), 0) as receita_7d FROM pagamentos WHERE empresa_id = ? AND status = 'approved' AND criado_em >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)",
      [empresaId]
    );

    // Receita 30 Dias
    const [[{ receita_30d }]] = await db.query(
      "SELECT COALESCE(SUM(valor), 0) as receita_30d FROM pagamentos WHERE empresa_id = ? AND status = 'approved' AND criado_em >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)",
      [empresaId]
    );

    // Ticket Médio (All Time or Last 30 Days? Let's do all approved payments)
    const [[{ ticket_medio }]] = await db.query(
      "SELECT COALESCE(AVG(valor), 0) as ticket_medio FROM pagamentos WHERE empresa_id = ? AND status = 'approved'",
      [empresaId]
    );

    // 2. Taxa de Conversão (Aprovados vs Criados)
    const [[{ total_geral, total_aprovados }]] = await db.query(
      "SELECT COUNT(*) as total_geral, SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as total_aprovados FROM pagamentos WHERE empresa_id = ?",
      [empresaId]
    );

    // 3. Receita Diária últimos 30 dias (para o gráfico)
    const [receitaDiaria] = await db.query(
      `SELECT DATE_FORMAT(criado_em, '%Y-%m-%d') as data, COALESCE(SUM(valor), 0) as total 
       FROM pagamentos 
       WHERE empresa_id = ? AND status = 'approved' AND criado_em >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
       GROUP BY DATE_FORMAT(criado_em, '%Y-%m-%d')
       ORDER BY data ASC`,
      [empresaId]
    );

    // 4. Top 5 Planos mais vendidos
    const [topPlanos] = await db.query(
      `SELECT nome_plano, COUNT(*) as vendas, COALESCE(SUM(valor), 0) as total 
       FROM pagamentos 
       WHERE empresa_id = ? AND status = 'approved'
       GROUP BY nome_plano
       ORDER BY total DESC
       LIMIT 5`,
      [empresaId]
    );

    // 5. Métodos de Pagamento
    const [metodosPagamento] = await db.query(
      `SELECT metodo_pagamento, COUNT(*) as vendas, COALESCE(SUM(valor), 0) as total 
       FROM pagamentos 
       WHERE empresa_id = ? AND status = 'approved'
       GROUP BY metodo_pagamento`,
      [empresaId]
    );

    // 6. Receita por Portal
    const [receitaPortais] = await db.query(
      `SELECT COALESCE(po.nome, 'Sem Portal/Outros') as nome_portal, COUNT(p.id) as vendas, COALESCE(SUM(p.valor), 0) as total 
       FROM pagamentos p
       LEFT JOIN portais po ON po.id = p.portal_id
       WHERE p.empresa_id = ? AND p.status = 'approved'
       GROUP BY p.portal_id, po.nome
       ORDER BY total DESC`,
      [empresaId]
    );

    res.json({
      kpis: {
        receita_hoje: parseInt(receita_hoje, 10),
        receita_7d: parseInt(receita_7d, 10),
        receita_30d: parseInt(receita_30d, 10),
        ticket_medio: Math.round(parseFloat(ticket_medio)),
        total_geral: parseInt(total_geral || 0, 10),
        total_aprovados: parseInt(total_aprovados || 0, 10),
      },
      receitaDiaria,
      topPlanos,
      metodosPagamento,
      receitaPortais,
    });
  } catch (err) {
    console.error("Erro no dashboard financeiro:", err);
    res.status(500).json({ message: "Erro ao buscar dados financeiros do dashboard" });
  }
};
