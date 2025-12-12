// src/pages/public/CadastroLGPD.jsx
import React, { useEffect, useState } from "react";

export default function CadastroLGPD() {
  const [form, setForm] = useState({
    cpf: "",
    nome: "",
    telefone: "",
    aceite: false,
    mac: "",
    ip: "",
  });

  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mac = params.get("mac") || "";
    const ip = params.get("ip") || "";
    setForm((prev) => ({ ...prev, mac, ip }));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = value;

    if (name === "cpf") {
      val = val.replace(/\D/g, "").slice(0, 11);
      val = val.replace(/(\d{3})(\d)/, "$1.$2");
      val = val.replace(/(\d{3})(\d)/, "$1.$2");
      val = val.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    if (name === "telefone") {
      val = val.replace(/\D/g, "").slice(0, 11);
      val = val.replace(/(\d{2})(\d)/, "($1) $2");
      val = val.replace(/(\d{5})(\d)/, "$1-$2");
    }

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : val,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem(null);

    try {
      const res = await fetch("/api/lgpd/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao cadastrar");
      setMensagem("Cadastro realizado com sucesso!");

    const redirectUrl = `/planos-cliente-pix?cpf=${encodeURIComponent(form.cpf)}&mac=${encodeURIComponent(form.mac)}&ip=${encodeURIComponent(form.ip)}`;
window.location.href = redirectUrl;
    } catch (err) {
      setMensagem(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-800 to-blue-950 text-white px-4">
      <div className="bg-white text-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Cadastro</h1>
        {mensagem && (
          <div className="mb-4 text-center text-sm text-blue-700 font-semibold">
            {mensagem}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">CPF</label>
            <input
              type="text"
              name="cpf"
              value={form.cpf}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Nome (opcional)</label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Telefone (opcional)</label>
            <input
              type="text"
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm">MAC</label>
              <input
                type="text"
                name="mac"
                value={form.mac}
                readOnly
                className="w-full border rounded px-3 py-2 bg-gray-100"
              />
            </div>
            <div>
              <label className="text-sm">IP</label>
              <input
                type="text"
                name="ip"
                value={form.ip}
                readOnly
                className="w-full border rounded px-3 py-2 bg-gray-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="aceite"
              checked={form.aceite}
              onChange={handleChange}
              required
            />
            <label className="text-sm">Aceito</label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded font-semibold"
          >
            Cadastrar
          </button>
        </form>
      </div>
    </div>
  );
}

