const db = require("../config/db");

function gerarUsernameAleatorio() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6);
  return `pix_${timestamp}_${random}`;
}

async function gerarAcessoTemporario(mac, ip, planoId) {
  try {
    const username = gerarUsernameAleatorio();
    const senha = username;
    const rateLimit = "2M/2M";
    const tempoSegundos = 300;

    // Limpa registros antigos
    await db.query("DELETE FROM radcheck WHERE username LIKE 'pix_%'");
    await db.query("DELETE FROM radreply WHERE username LIKE 'pix_%'");
    await db.query("DELETE FROM radusergroup WHERE username LIKE 'pix_%'");

    // Insere novo usuário no RADIUS
    await db.query(
      `INSERT INTO radcheck (username, attribute, op, value)
       VALUES (?, 'Cleartext-Password', ':=', ?)`,
      [username, senha]
    );

    await db.query(
      `INSERT INTO radreply (username, attribute, op, value) VALUES
        (?, 'Mikrotik-Rate-Limit', ':=', ?),
        (?, 'Session-Timeout', ':=', ?)`,
      [username, rateLimit, username, tempoSegundos]
    );

    // Busca o Mikrotik vinculado ao plano
    const [planos] = await db.query(
      "SELECT mikrotik_id FROM planos WHERE id = ? LIMIT 1",
      [planoId]
    );
    const mikrotikId = planos[0]?.mikrotik_id;

    const [mtk] = await db.query(
      "SELECT end_hotspot FROM mikrotiks WHERE id = ? LIMIT 1",
      [mikrotikId]
    );

    const gateway = mtk[0]?.end_hotspot || "192.168.0.1";

    return { username, password: senha, gateway };
  } catch (err) {
    console.error("Erro ao gerar acesso temporário:", err);
    throw err;
  }
}

module.exports = {
  gerarAcessoTemporario,
};
