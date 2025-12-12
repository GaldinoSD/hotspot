const db = require("../../db");
const { RouterOSAPI } = require("node-routeros");

// Criar plano
const criarPlano = async (req, res) => {
  try {
    const {
      nome, descricao, valor, duracao_minutos,
      velocidade_down, velocidade_up,
      mikrotik_id, address_pool, shared_users, ativo
    } = req.body;

    console.log("Criando plano com dados:", req.body);

    await db.execute(`
      INSERT INTO planos (
        nome, descricao, valor, duracao_minutos,
        velocidade_down, velocidade_up,
        mikrotik_id, address_pool, shared_users, ativo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nome, descricao, valor, duracao_minutos,
      velocidade_down, velocidade_up,
      mikrotik_id, address_pool, shared_users, ativo
    ]);

    res.status(201).json({ message: "Plano criado com sucesso" });
  } catch (err) {
    console.error("Erro ao criar plano:", err);
    res.status(500).json({ message: "Erro ao criar plano" });
  }
};
// Listar planos
async function listarPlanos(req, res) {
  console.log("ENTROU EM GET /api/planos, usuário:", req.user);
  try {
    const [rows] = await db.execute(`
      SELECT planos.*, mikrotiks.nome AS mikrotik_nome
      FROM planos
      JOIN mikrotiks ON mikrotiks.id = planos.mikrotik_id
      ORDER BY planos.id DESC
    `);
    console.log("Planos retornados:", rows);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao listar planos:", err);
    res.status(500).json({ message: "Erro ao listar planos" });
  }
}

// Atualizar plano
async function atualizarPlano(req, res) {
  const { id } = req.params;
  const {
    nome, descricao, valor, duracao_minutos,
    velocidade_down, velocidade_up,
    mikrotik_id, address_pool, shared_users, ativo
  } = req.body;

  try {
    console.log("Atualizando plano ID", id, "com dados:", req.body);

    await db.execute(`
      UPDATE planos
      SET nome = ?, descricao = ?, valor = ?, duracao_minutos = ?,
          velocidade_down = ?, velocidade_up = ?, mikrotik_id = ?,
          address_pool = ?, shared_users = ?, ativo = ?
      WHERE id = ?
    `, [
      nome, descricao, valor, duracao_minutos,
      velocidade_down, velocidade_up, mikrotik_id,
      address_pool, shared_users, ativo ? 1 : 0, id
    ]);

    res.json({ message: "Plano atualizado com sucesso" });
  } catch (err) {
    console.error("Erro ao atualizar plano:", err);
    res.status(500).json({ message: "Erro ao atualizar plano" });
  }
}
// Deletar plano
async function deletarPlano(req, res) {
  const { id } = req.params;

  try {
    const [[plano]] = await db.execute("SELECT * FROM planos WHERE id = ?", [id]);
    if (!plano) return res.status(404).json({ message: "Plano não encontrado" });

    const [[mikrotik]] = await db.execute("SELECT * FROM mikrotiks WHERE id = ?", [plano.mikrotik_id]);
    if (!mikrotik) return res.status(404).json({ message: "Mikrotik não encontrado" });

    const conn = new RouterOSAPI({
      host: mikrotik.ip,
      user: mikrotik.usuario,
      password: mikrotik.senha,
      port: mikrotik.porta || 8728,
      timeout: 5000
    });

    await conn.connect();

    const name = plano.nome.replace(/\s+/g, "_");

    // Tenta encontrar e remover o profile correspondente
    const profiles = await conn.write("/ip/hotspot/user/profile/print", [
      `?name=${name}`
    ]);

    if (profiles.length > 0) {
      await conn.write("/ip/hotspot/user/profile/remove", [
        `=.id=${profiles[0][".id"]}`
      ]);
      console.log(`Profile '${name}' removido do Mikrotik ${mikrotik.ip}`);
    }

    await conn.close();

    // Remove do banco após o Mikrotik
    await db.execute("DELETE FROM planos WHERE id = ?", [id]);

    res.json({ message: "Plano removido com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar plano:", err);
    res.status(500).json({ message: "Erro ao deletar plano" });
  }
}

// Enviar plano para Mikrotik
async function enviarParaMikrotik(req, res) {
  const { id } = req.params;

  try {
    const [[plano]] = await db.execute("SELECT * FROM planos WHERE id = ?", [id]);
    if (!plano) return res.status(404).json({ message: "Plano não encontrado" });

    const [[mikrotik]] = await db.execute("SELECT * FROM mikrotiks WHERE id = ?", [plano.mikrotik_id]);
    if (!mikrotik) return res.status(404).json({ message: "Mikrotik não encontrado" });

    const conn = new RouterOSAPI({
      host: mikrotik.ip,
      user: mikrotik.usuario,
      password: mikrotik.senha,
      port: mikrotik.porta || 8728,
      timeout: 5000
    });

    await conn.connect();

    const name = plano.nome.replace(/\s+/g, "_");

    await conn.write("/ip/hotspot/user/profile/add", [
      `=name=${name}`,
      `=rate-limit=${plano.velocidade_down}M/${plano.velocidade_up}M`,
      `=shared-users=${plano.shared_users || 1}`,
      `=session-timeout=${plano.duracao_minutos}m`,
      `=keepalive-timeout=2m`,
      `=status-autorefresh=1m`,
      `=address-pool=${plano.address_pool || "default-dhcp"}`,
      `=idle-timeout=none`,
      `=mac-cookie-timeout=${plano.duracao_minutos}m`
    ]);

    await conn.close();

    console.log(`Profile '${name}' criado no Mikrotik ${mikrotik.ip}`);
    res.json({ message: "Plano enviado e criado no Mikrotik com sucesso" });
  } catch (err) {
    console.error("Erro ao enviar plano para Mikrotik:", err);
    res.status(500).json({ message: "Erro ao enviar plano para Mikrotik" });
  }
}


module.exports = {
  criarPlano,
  listarPlanos,
  atualizarPlano,
  deletarPlano,
  enviarParaMikrotik
};

