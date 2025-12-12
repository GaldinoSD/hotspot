const db = require("../config/db");

async function getConfig() {
  const [rows] = await db.execute("SELECT * FROM efi_config ORDER BY id DESC LIMIT 1");
  return rows[0];
}

async function saveConfig(config) {
  const { client_id, client_secret, chave_pix, ambiente, certificado_nome } = config;
  await db.execute(
    `INSERT INTO efi_config (client_id, client_secret, chave_pix, ambiente, certificado_nome) VALUES (?, ?, ?, ?, ?)`,
    [client_id, client_secret, chave_pix, ambiente, certificado_nome]
  );
}

module.exports = { getConfig, saveConfig };

