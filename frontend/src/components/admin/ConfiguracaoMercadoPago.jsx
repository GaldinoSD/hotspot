import React, { useState, useEffect } from "react";
import axios from "axios";

export default function ConfiguracaoMercadoPago() {
  const [form, setForm] = useState({
    public_key: "",
    access_token: "",
    client_id: "",
    client_secret: "",
  });

useEffect(() => {
  axios.get("/api/config-mercadopago")
    .then(res => {
      setForm({
        public_key: res.data?.public_key || "",
        access_token: res.data?.access_token || "",
        client_id: res.data?.client_id || "",
        client_secret: res.data?.client_secret || "",
      });
    })
    .catch(err => console.error("Erro ao carregar config:", err));
}, []);
const salvar = () => {
  axios.post("/api/config-mercadopago", form)
    .then(() => alert("Configurações salvas com sucesso!"))
    .catch(() => alert("Erro ao salvar configurações."));
};

const testarConexao = () => {
  axios.get("/api/config-mercadopago/testar-conexao")
    .then(res => {
      alert("✅ Comunicação OK com Mercado Pago!\nUsuário: " + res.data.usuario.nickname);
    })
    .catch(err => {
      console.error(err);
      alert("❌ Falha na comunicação com Mercado Pago.");
    });
};

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-medium">Public Key</label>
        <input
          type="text"
          value={form.public_key}
          onChange={(e) => setForm({ ...form, public_key: e.target.value })}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block font-medium">Access Token</label>
        <input
          type="text"
          value={form.access_token}
          onChange={(e) => setForm({ ...form, access_token: e.target.value })}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block font-medium">Client ID</label>
        <input
          type="text"
          value={form.client_id}
          onChange={(e) => setForm({ ...form, client_id: e.target.value })}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block font-medium">Client Secret</label>
        <input
          type="text"
          value={form.client_secret}
          onChange={(e) => setForm({ ...form, client_secret: e.target.value })}
          className="w-full p-2 border rounded"
        />
      </div>
	  <div>
  <label className="block font-medium">Webhook URL</label>
  <input
    type="text"
    value={"https://hotspot.forumtelecom.com.br/api/pagamentos/notificacao"}
    readOnly
    className="w-full p-2 border rounded bg-gray-100 text-gray-500"
  />
</div>
	  <div className="mb-4">
  <label className="block mb-1 font-medium">Webhook Secret</label>
  <input
    type="text"
    className="w-full border p-2 rounded"
    value={form.webhook_secret}
    onChange={(e) => setForm({ ...form, webhook_secret: e.target.value })}
  />
</div>

<div className="text-sm text-gray-600 mt-2">
  <strong>URL do Webhook:</strong><br />
  {window.location.origin}/api/pagamentos/webhook
</div>

      <button
        onClick={salvar}
        className="bg-blue-600 text-white px-4 py-2 rounded">
        Salvar
      </button>
	  <button
  onClick={testarConexao}
  className="ml-2 bg-green-600 text-white px-4 py-2 rounded">
  Testar Conexão
</button>
    </div>
  );
}

