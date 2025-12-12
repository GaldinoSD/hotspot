const pool = require("../../db");

async function getConfig() {
  const [rows] = await pool.query("SELECT * FROM config_mercadopago LIMIT 1");
  return rows[0] || null;
}

async function saveConfig({ public_key, access_token, client_id, client_secret, webhook_secret }) {
  const configAtual = await getConfig();

  if (configAtual) {
    await pool.query(`
      UPDATE config_mercadopago
      SET public_key = ?, access_token = ?, client_id = ?, client_secret = ?, webhook_secret = ?
    `, [public_key, access_token, client_id, client_secret, webhook_secret]);
  } else {
    await pool.query(`
      INSERT INTO config_mercadopago (public_key, access_token, client_id, client_secret, webhook_secret)
      VALUES (?, ?, ?, ?, ?)
    `, [public_key, access_token, client_id, client_secret, webhook_secret]);
  }
}
module.exports = { getConfig, saveConfig };

