// backend/src/controllers/radiusController.js
const db = require('../config/db');

// Cria um novo usuário no FreeRADIUS
async function criarUsuarioRadius(req, res) {
  const { username, password } = req.body;

  try {
    await db.query('INSERT INTO radcheck (username, attribute, op, value) VALUES (?, "Cleartext-Password", ":=", ?)', [username, password]);
    res.status(201).json({ message: 'Usuário RADIUS criado com sucesso.' });
  } catch (error) {
    console.error('Erro ao criar usuário RADIUS:', error);
    res.status(500).json({ error: 'Erro ao criar usuário RADIUS.' });
  }
}


const vincularPlano = async (req, res) => {
  const { username, planoId } = req.body;

  try {
    const [[plano]] = await db.query('SELECT id, nome, velocidade_down, velocidade_up, duracao_minutos, mikrotik_id FROM planos WHERE id = ?', [planoId]);
    if (!plano) return res.status(404).json({ error: 'Plano não encontrado' });

    // Apaga replies antigos
    await db.query('DELETE FROM radreply WHERE username = ?', [username]);

    // Adiciona replies para banda e tempo
    await db.query('INSERT INTO radreply (username, attribute, op, value) VALUES (?, "Mikrotik-Rate-Limit", ":=", ?)', [
      username,
      `${plano.velocidade_up}M/${plano.velocidade_down}M`
    ]);

    await db.query('INSERT INTO radreply (username, attribute, op, value) VALUES (?, "Session-Timeout", ":=", ?)', [
      username,
      plano.duracao_minutos * 60
    ]);

    // Define grupo (compatibilidade com group reply)
    await db.query('INSERT INTO radusergroup (username, groupname) VALUES (?, ?)', [
      username,
      plano.id
    ]);

    // Atualiza ou insere vínculo em radius_users
    await db.query(`
      INSERT INTO radius_users (username, plano_id, nas_id)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE plano_id = VALUES(plano_id), nas_id = VALUES(nas_id)
    `, [username, plano.id, plano.mikrotik_id]);

    res.status(200).json({ message: 'Plano vinculado ao usuário com sucesso.' });
  } catch (error) {
    console.error('Erro ao vincular plano:', error);
    res.status(500).json({ error: 'Erro ao vincular plano ao usuário.' });
  }
};


const listarUsuarios = async (req, res) => {
  try {
    const [usuarios] = await db.query(`
      SELECT
        rc.username,
        rc.value,
        p.nome AS plano,
        m.nome AS nas
      FROM radcheck rc
      LEFT JOIN radius_users ru ON ru.username = rc.username
      LEFT JOIN planos p ON p.id = ru.plano_id
      LEFT JOIN mikrotiks m ON m.id = ru.nas_id
      WHERE rc.attribute = 'Cleartext-Password'
    `);

    res.json(usuarios);
  } catch (error) {
    console.error('Erro ao listar usuários RADIUS:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
};

async function deletarUsuarioRadius(req, res) {
  const { username } = req.params;

  try {
    // Remove o usuário de todas as tabelas relacionadas
    await db.query('DELETE FROM radcheck WHERE username = ?', [username]);
    await db.query('DELETE FROM radreply WHERE username = ?', [username]);
    await db.query('DELETE FROM radusergroup WHERE username = ?', [username]);
    await db.query('DELETE FROM radacct WHERE username = ?', [username]);
    await db.query('DELETE FROM radpostauth WHERE username = ?', [username]);

    res.status(200).json({ message: 'Usuário RADIUS deletado com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar usuário RADIUS:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário RADIUS.' });
  }
}


// Lista sessões RADIUS ativas
const listarSessoesAtivas = async (req, res) => {
  try {
    const [sessoes] = await db.query(`
      SELECT
        username,
        callingstationid AS mac,
        framedipaddress AS ip,
        nasipaddress AS gateway,
        acctstarttime
      FROM radacct
      WHERE acctstoptime IS NULL
      ORDER BY acctstarttime DESC
    `);

    res.json(sessoes);
  } catch (error) {
    console.error("Erro ao buscar sessões ativas:", error);
    res.status(500).json({ error: "Erro ao buscar sessões ativas" });
  }
};

module.exports = {
  criarUsuarioRadius,
  vincularPlano,
  listarUsuarios,
  deletarUsuarioRadius,
  listarSessoesAtivas
};

