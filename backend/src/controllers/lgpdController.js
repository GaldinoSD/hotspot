const db = require("../config/db");

exports.lgpdLogin = async (req, res) => {
  try {
    const { cpf, aceite, mac, ip } = req.body;

    if (!cpf || aceite === undefined || !mac || !ip) {
      return res.status(400).json({ message: "Dados obrigatórios faltando" });
    }

    const aceiteInt = aceite ? 1 : 0;

    // Salva no banco LGPD
    await db.execute(
      "INSERT INTO lgpd_logins (cpf, aceite, mac, ip) VALUES (?, ?, ?, ?)",
      [cpf, aceiteInt, mac, ip]
    );

    // Cadastra no radcheck
    await db.execute("DELETE FROM radcheck WHERE username = ?", [cpf]);
    await db.execute(
      "INSERT INTO radcheck (username, attribute, op, value) VALUES (?, 'Cleartext-Password', ':=', ?)",
      [cpf, cpf]
    );

    // Busca gateway do plano LGPD
    const [result] = await db.query(
      `SELECT m.end_hotspot FROM mikrotiks m
       JOIN planos p ON p.mikrotik_id = m.id
       WHERE p.nome = 'LGPD' LIMIT 1`
    );

    const gateway = result[0]?.end_hotspot || `http://${ip}/login`;

    return res.json({ success: true, gateway });
  } catch (err) {
    console.error("Erro LGPD Login:", err);
    return res.status(500).json({ message: "Erro interno ao processar login LGPD" });
  }
};

exports.lgpdLogin = async (req, res) => {
  try {
    const { cpf, aceite, mac, ip } = req.body;

    if (!cpf || aceite === undefined || !mac || !ip) {
      return res.status(400).json({ message: "Dados obrigatórios faltando" });
    }

    const aceiteInt = aceite ? 1 : 0;

    // Salva no banco LGPD
    await db.execute(
      "INSERT INTO lgpd_logins (cpf, aceite, mac, ip) VALUES (?, ?, ?, ?)",
      [cpf, aceiteInt, mac, ip]
    );

    // Cadastra no radcheck
    await db.execute("DELETE FROM radcheck WHERE username = ?", [cpf]);
    await db.execute(
      "INSERT INTO radcheck (username, attribute, op, value) VALUES (?, 'Cleartext-Password', ':=', ?)",
      [cpf, cpf]
    );

    // Busca gateway do plano LGPD
    const [result] = await db.query(
      `SELECT m.end_hotspot FROM mikrotiks m
       JOIN planos p ON p.mikrotik_id = m.id
       WHERE p.nome = 'LGPD' LIMIT 1`
    );

    const gateway = result[0]?.end_hotspot || `http://${ip}/login`;

    return res.json({ success: true, gateway });
  } catch (err) {
    console.error("Erro LGPD Login:", err);
    return res.status(500).json({ message: "Erro interno ao processar login LGPD" });
  }
};

exports.getAllLgpd = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, cpf, mac, ip, aceite, criado_em FROM lgpd_logins ORDER BY criado_em DESC");
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar cadastros LGPD:", err);
    res.status(500).json({ message: "Erro ao buscar dados LGPD" });
  }
};

exports.lgpdCadastro = async (req, res) => {
  try {
    const { cpf, aceite, mac, ip, nome, telefone } = req.body;

    if (!cpf || aceite === undefined) {
      return res.status(400).json({ message: "CPF e aceite são obrigatórios" });
    }

    const aceiteInt = aceite ? 1 : 0;

    await db.execute(
      `INSERT INTO lgpd_logins (cpf, aceite, mac, ip, nome, telefone)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cpf, aceiteInt, mac || null, ip || null, nome || null, telefone || null]
    );

    res.json({ success: true, message: "Cadastro LGPD realizado com sucesso" });
  } catch (err) {
    console.error("Erro ao cadastrar LGPD:", err);
    res.status(500).json({ message: "Erro interno ao cadastrar LGPD" });
  }
};


