const { gerarAcessoTemporario } = require("./authTempController");

async function gerarAcessoTemporarioHandler(req, res) {
  const { mac, ip, plano_id } = req.body;

  if (!mac || !ip || !plano_id) {
    return res.status(400).json({ error: "mac, ip e plano_id são obrigatórios" });
  }

  try {
    const resultado = await gerarAcessoTemporario(mac, ip, plano_id);
    return res.json(resultado);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao gerar acesso temporário" });
  }
}

module.exports = {
  gerarAcessoTemporarioHandler,
};
