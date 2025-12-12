const axios = require("axios");

const WHATSAPP_API_URL = "http://localhost:3030";


function formatarNumeroComNonoDigito(numero) {
    const regex = /^55(\d{2})(\d{8,9})$/;
    const match = numero.match(regex);
    if (!match) return numero;
    const ddd = parseInt(match[1], 10);
    let numeroFinal = match[2];
    if (ddd <= 30 && numeroFinal.length === 8) {
      numeroFinal = '9' + numeroFinal;
    } else if (ddd > 30 && numeroFinal.length === 9 && numeroFinal.startsWith('9')) {
      numeroFinal = numeroFinal.slice(1);
    }
    return `55${ddd}${numeroFinal}`;
  };

async function enviarMensagem(req, res) {
  const { telefone, mensagem } = req.body;

  if (!telefone || !mensagem) {
    return res.status(400).json({ error: "Telefone e mensagem são obrigatórios." });
  }

  const numeroFormatado = formatarNumeroComNonoDigito(telefone);

  try {
    const resposta = await axios.post(`${WHATSAPP_API_URL}/send`, {
      telefone: numeroFormatado,
      mensagem,
    });

    return res.json(resposta.data);
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err.message);
    return res.status(500).json({ error: "Erro ao enviar mensagem via API WhatsApp." });
  }
}

module.exports = {
  enviarMensagem,
};

