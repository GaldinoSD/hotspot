import React, { useState, useEffect } from "react";
import axios from "axios";
import { Key, Mail, Lock, Globe, Save, Activity, Copy, Check, ShieldAlert, Loader2, HelpCircle } from "lucide-react";

export default function ConfiguracaoMercadoPago() {
  const [form, setForm] = useState({
    public_key: "",
    access_token: "",
    client_id: "",
    client_secret: "",
    email_pagador: "",
    webhook_secret: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const token = localStorage.getItem("admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get("/api/empresa-config/mercadopago", { headers })
      .then(res => {
        setForm({
          public_key: res.data?.public_key || "",
          access_token: res.data?.access_token || "",
          client_id: res.data?.client_id || "",
          client_secret: res.data?.client_secret || "",
          email_pagador: res.data?.email_pagador || "",
          webhook_secret: res.data?.webhook_secret || "",
        });
      })
      .catch(err => console.error("Erro ao carregar config:", err));
  }, []);

  const salvar = () => {
    setSalvando(true);
    axios.post("/api/empresa-config/mercadopago", form, { headers })
      .then(() => alert("Configurações salvas com sucesso!"))
      .catch(() => alert("Erro ao salvar configurações."))
      .finally(() => setSalvando(false));
  };

  const testarConexao = () => {
    setTestando(true);
    axios.post("/api/empresa-config/mercadopago/testar", {}, { headers })
      .then(res => {
        alert("✅ Comunicação OK com Mercado Pago!\nUsuário: " + res.data.usuario.nickname);
      })
      .catch(err => {
        console.error(err);
        alert("❌ Falha na comunicação com Mercado Pago.");
      })
      .finally(() => setTestando(false));
  };

  const copiarWebhook = () => {
    const url = `${window.location.origin}/api/pagamentos/notificacao`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800/80 pb-4 mb-4">
        <h3 className="text-base font-bold text-slate-200">Credenciais do Mercado Pago</h3>
        <p className="text-slate-500 text-xs mt-1">Configure suas chaves de API oficiais para receber pagamentos via Pix ou Cartão no captive portal.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Public Key */}
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Public Key</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <Key className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="APP_USR-..."
              value={form.public_key}
              onChange={(e) => setForm({ ...form, public_key: e.target.value })}
              className="w-full bg-[#090b11] border border-slate-800 text-white rounded-lg pl-10 pr-3.5 py-2.5 outline-none focus:border-orange-500 transition-all placeholder-slate-700 text-sm font-sans"
            />
          </div>
        </div>

        {/* Access Token */}
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Access Token</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="APP_USR-..."
              value={form.access_token}
              onChange={(e) => setForm({ ...form, access_token: e.target.value })}
              className="w-full bg-[#090b11] border border-slate-800 text-white rounded-lg pl-10 pr-3.5 py-2.5 outline-none focus:border-orange-500 transition-all placeholder-slate-700 text-sm font-sans"
            />
          </div>
        </div>

        {/* Client ID */}
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Client ID</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <Key className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Insira o Client ID"
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="w-full bg-[#090b11] border border-slate-800 text-white rounded-lg pl-10 pr-3.5 py-2.5 outline-none focus:border-orange-500 transition-all placeholder-slate-700 text-sm font-sans"
            />
          </div>
        </div>

        {/* Client Secret */}
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Client Secret</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Insira o Client Secret"
              value={form.client_secret}
              onChange={(e) => setForm({ ...form, client_secret: e.target.value })}
              className="w-full bg-[#090b11] border border-slate-800 text-white rounded-lg pl-10 pr-3.5 py-2.5 outline-none focus:border-orange-500 transition-all placeholder-slate-700 text-sm font-sans"
            />
          </div>
        </div>

        {/* Email Pagador Fallback */}
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>Email do Pagador (fallback)</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 cursor-help" title="Usado quando o cliente não fornecer email durante a compra." />
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              placeholder="email@empresa.com"
              value={form.email_pagador}
              onChange={(e) => setForm({ ...form, email_pagador: e.target.value })}
              className="w-full bg-[#090b11] border border-slate-800 text-white rounded-lg pl-10 pr-3.5 py-2.5 outline-none focus:border-orange-500 transition-all placeholder-slate-700 text-sm font-sans"
            />
          </div>
        </div>

        {/* Webhook Secret */}
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Webhook Secret</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Secret do Webhook se aplicável"
              value={form.webhook_secret}
              onChange={(e) => setForm({ ...form, webhook_secret: e.target.value })}
              className="w-full bg-[#090b11] border border-slate-800 text-white rounded-lg pl-10 pr-3.5 py-2.5 outline-none focus:border-orange-500 transition-all placeholder-slate-700 text-sm font-sans"
            />
          </div>
        </div>
      </div>

      {/* Webhook Configuration URL info */}
      <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 space-y-2">
        <label className="block text-slate-450 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          Webhook URL de Notificação
        </label>
        <p className="text-slate-500 text-[11px] leading-relaxed">Cole esta URL na configuração de notificações (webhooks) do Mercado Pago para notificar o sistema no ato da aprovação do pagamento.</p>
        <div className="bg-[#090b11] border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between gap-4 font-mono text-xs text-slate-400 overflow-hidden">
          <span className="truncate select-all select-none">
            {`${window.location.origin}/api/pagamentos/notificacao`}
          </span>
          <button
            onClick={copiarWebhook}
            className={`flex-shrink-0 p-1.5 border border-slate-800 text-slate-450 hover:text-white rounded hover:bg-slate-850 transition-all active:scale-95 flex items-center justify-center gap-1`}
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-800/80 mt-6">
        <button
          onClick={salvar}
          disabled={salvando}
          className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-orange-600/10 active:scale-95 flex items-center gap-2 disabled:opacity-50"
        >
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </button>
        <button
          onClick={testarConexao}
          disabled={testando}
          className="bg-slate-900 border border-slate-800 text-emerald-500 hover:bg-slate-850 hover:text-emerald-400 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
        >
          {testando ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
          )}
          Testar Conexão
        </button>
      </div>
    </div>
  );
}
