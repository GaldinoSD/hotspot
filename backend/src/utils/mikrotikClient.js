const { RouterOSAPI } = require("node-routeros");

async function testarConexao({ ip, usuario, senha, porta }) {
  const conn = new RouterOSAPI({
    host: ip,
    user: usuario,
    password: senha,
    port: porta || 8728,
    timeout: 5000,
    keepalive: false,
  });

  try {
    await conn.connect();
    try {
      await conn.close();
    } catch (e) {}
    return { sucesso: true };
  } catch (error) {
    return { sucesso: false, erro: error.message };
  }
}

module.exports = { testarConexao };

