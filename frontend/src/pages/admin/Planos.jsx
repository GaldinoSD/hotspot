import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import PageHeader from "../../components/admin/PageHeader";
import { Send, Edit, Trash2, Copy, Plus, AlertTriangle, HelpCircle } from "lucide-react";

export default function Planos() {
  const [planos, setPlanos] = useState([]);
  const [mikrotiks, setMikrotiks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    duracao: 1,
    valor: "0,00",
    velocidade_download: 0,
    velocidade_upload: 0,
    mikrotik_id: "",
    address_pool: "default-dhcp",
    shared_users: 10,
    ativo: true,
  });
  const token = localStorage.getItem("admin_token");
  const [copiedText, setCopiedText] = useState("");

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 1500);
  };

  const preencherPlanoAutomatico = (tipo) => {
    const isLGPD = tipo === "LGPD";
    setForm({
      nome: isLGPD ? "LGPD" : "Lead",
      descricao: isLGPD 
        ? "Plano gratuito obrigatório para autenticação LGPD" 
        : "Plano gratuito obrigatório para autenticação de Leads",
      duracao: 525600, // 1 ano
      valor: "0,00",
      velocidade_download: 0,
      velocidade_upload: 0,
      mikrotik_id: mikrotiks.length > 0 ? mikrotiks[0].id.toString() : "",
      address_pool: "default-dhcp",
      shared_users: 10,
      ativo: true,
    });
    setEditando(null);
    setShowModal(true);
  };

  const carregarPlanos = async () => {
    try {
      const res = await fetch("/api/planos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Erro ao carregar planos");
      setPlanos(data);
    } catch (err) {
      alert("Erro ao carregar planos.");
    } finally {
      setLoading(false);
    }
  };

  const carregarMikrotiks = async () => {
    try {
      const res = await fetch("/api/mikrotiks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMikrotiks(data);
    } catch (err) {
      alert("Erro ao carregar Mikrotiks");
    }
  };

  useEffect(() => {
    carregarPlanos();
    carregarMikrotiks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editando ? `/api/planos/${editando}` : "/api/planos";
      const method = editando ? "PUT" : "POST";
      const valorEmCentavos = Math.round(
        parseFloat(form.valor.replace(",", ".") || "0") * 100
      );

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: form.nome,
          descricao: form.descricao,
          valor: valorEmCentavos,
          duracao_minutos: parseInt(form.duracao),
          velocidade_down: parseInt(form.velocidade_download),
          velocidade_up: parseInt(form.velocidade_upload),
          mikrotik_id: parseInt(form.mikrotik_id),
          address_pool: form.address_pool,
          shared_users: parseInt(form.shared_users),
          ativo: form.ativo,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar plano");
      setShowModal(false);
      setEditando(null);
      carregarPlanos();
    } catch (err) {
      alert("Erro ao salvar plano.");
    }
  };

  const handleEditar = (plano) => {
    setForm({
      nome: plano.nome,
      descricao: plano.descricao,
      valor: (plano.valor / 100).toFixed(2).replace(".", ","),
      duracao: plano.duracao_minutos,
      velocidade_download: plano.velocidade_down,
      velocidade_upload: plano.velocidade_up,
      mikrotik_id: plano.mikrotik_id,
      address_pool: plano.address_pool || "default-dhcp",
      shared_users: plano.shared_users || 10,
      ativo: plano.ativo,
    });
    setEditando(plano.id);
    setShowModal(true);
  };

  const handleRemover = async (id) => {
    if (!confirm("Deseja remover este plano?")) return;
    try {
      await fetch(`/api/planos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      carregarPlanos();
    } catch (err) {
      alert("Erro ao remover plano.");
    }
  };
  const handleCopiar = (plano) => {
  setForm({
    nome: plano.nome + " (cópia)",
    descricao: plano.descricao,
    valor: (plano.valor / 100).toFixed(2).replace(".", ","),
    duracao: plano.duracao_minutos,
    velocidade_download: plano.velocidade_down,
    velocidade_upload: plano.velocidade_up,
    mikrotik_id: plano.mikrotik_id,
    address_pool: plano.address_pool || "default-dhcp",
    shared_users: plano.shared_users || 10,
    ativo: plano.ativo,
  });
  setEditando(null); // Não estamos editando, é um novo
  setShowModal(true);
};

  const enviarParaMikrotik = async (id) => {
    if (!confirm("Deseja realmente enviar esse plano para o Mikrotik?")) return;
    try {
      const res = await fetch(`/api/planos/${id}/enviar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("Plano enviado com sucesso para o Mikrotik!");
    } catch (err) {
      alert("Erro ao enviar plano: " + err.message);
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Planos"
        subtitle="Configuração de planos de acesso"
        icon={
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
        }
      >
        <div className="flex items-center gap-3">
          {!loading && (!planos.some(p => p.nome === 'LGPD') || !planos.some(p => p.nome.toLowerCase() === 'lead')) && (
            <div className="relative group/help">
              <div className="px-3 py-2 bg-amber-950/20 hover:bg-amber-950/30 border border-amber-600/30 rounded-sm flex items-center gap-2 text-[10px] text-amber-300 cursor-help shadow-lg transition-all duration-300 select-none">
                <AlertTriangle className="text-amber-500 w-4 h-4 animate-pulse shrink-0" />
                <div className="leading-tight text-left">
                  <span className="font-black block uppercase tracking-wider text-[8px] text-amber-500 mb-0.5">Pendência</span>
                  <span className="text-gray-300">Planos ausentes: </span>
                  {!planos.some(p => p.nome === 'LGPD') && <span className="font-semibold text-yellow-400">"LGPD"</span>}
                  {!planos.some(p => p.nome === 'LGPD') && !planos.some(p => p.nome.toLowerCase() === 'lead') && <span className="text-gray-400"> e </span>}
                  {!planos.some(p => p.nome.toLowerCase() === 'lead') && <span className="font-semibold text-yellow-400">"Lead"</span>}
                </div>
              </div>
              
              {/* Popover Hover Card */}
              <div className="absolute top-full right-0 mt-2 z-50 w-80 p-4 bg-[#0c0f17] border border-slate-800 rounded-sm shadow-2xl invisible opacity-0 group-hover/help:visible group-hover/help:opacity-100 transition-all duration-300 transform translate-y-1 group-hover/help:translate-y-0 pointer-events-none group-hover/help:pointer-events-auto">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                    <h5 className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" /> Guia de Criação
                    </h5>
                    <span className="text-[8px] bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded-sm font-mono uppercase tracking-wide">Mikrotik</span>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Crie os planos obrigatórios abaixo. O sistema preencherá os dados automaticamente para você:
                  </p>

                  <div className="space-y-3">
                    {!planos.some(p => p.nome === 'LGPD') && (
                      <div className="bg-[#07090e] p-3 rounded-sm border border-slate-800/80 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-amber-400">1. Plano "LGPD"</span>
                          <span className="text-[8px] text-slate-500 font-mono">Conformidade</span>
                        </div>
                        <div className="text-[9px] text-slate-400 space-y-1.5">
                          <div className="flex items-center justify-between bg-[#0f121d] px-2 py-1 rounded-sm border border-slate-800/40">
                            <span>Nome: <strong className="text-white font-mono">LGPD</strong></span>
                            <button 
                              onClick={() => handleCopy("LGPD")} 
                              className="text-[9px] text-emerald-400 hover:text-emerald-300 font-medium"
                            >
                              {copiedText === "LGPD" ? "✓ Copiado" : "Copiar"}
                            </button>
                          </div>
                          <button
                            onClick={() => preencherPlanoAutomatico("LGPD")}
                            className="w-full py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 hover:text-blue-300 font-bold rounded-sm text-[8px] uppercase tracking-widest transition-all duration-200"
                          >
                            ⚡ Auto-Criar LGPD
                          </button>
                        </div>
                      </div>
                    )}

                    {!planos.some(p => p.nome.toLowerCase() === 'lead') && (
                      <div className="bg-[#07090e] p-3 rounded-sm border border-slate-800/80 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-amber-400">2. Plano "Lead"</span>
                          <span className="text-[8px] text-slate-500 font-mono">Marketing</span>
                        </div>
                        <div className="text-[9px] text-slate-400 space-y-1.5">
                          <div className="flex items-center justify-between bg-[#0f121d] px-2 py-1 rounded-sm border border-slate-800/40">
                            <span>Nome: <strong className="text-white font-mono">Lead</strong></span>
                            <button 
                              onClick={() => handleCopy("Lead")} 
                              className="text-[9px] text-emerald-400 hover:text-emerald-300 font-medium"
                            >
                              {copiedText === "Lead" ? "✓ Copiado" : "Copiar"}
                            </button>
                          </div>
                          <button
                            onClick={() => preencherPlanoAutomatico("Lead")}
                            className="w-full py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 hover:text-blue-300 font-bold rounded-sm text-[8px] uppercase tracking-widest transition-all duration-200"
                          >
                            ⚡ Auto-Criar Lead
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={() => {
              setForm({
                nome: "",
                descricao: "",
                duracao: 1,
                valor: "0,00",
                velocidade_download: 0,
                velocidade_upload: 0,
                mikrotik_id: "",
                address_pool: "default-dhcp",
                shared_users: 10,
                ativo: true,
              });
              setEditando(null);
              setShowModal(true);
            }}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-sm hover:bg-blue-500 text-xs uppercase tracking-wider font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Novo Plano
          </button>
        </div>
      </PageHeader>

      {/* Dashboard Cards Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#111420] border border-slate-800/80 p-5 rounded-sm flex items-center justify-between shadow-md">
          <div>
            <span className="text-[9px] uppercase font-black tracking-widest text-slate-500 block mb-1">Total de Planos</span>
            <span className="text-3xl font-black text-white">{planos.length}</span>
          </div>
          <div className="w-10 h-10 rounded-sm bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          </div>
        </div>

        <div className="bg-[#111420] border border-slate-800/80 p-5 rounded-sm flex items-center justify-between shadow-md">
          <div>
            <span className="text-[9px] uppercase font-black tracking-widest text-slate-500 block mb-1">Planos Ativos</span>
            <span className="text-3xl font-black text-emerald-400">{planos.filter(p => p.ativo).length}</span>
          </div>
          <div className="w-10 h-10 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
        </div>

        <div className="bg-[#111420] border border-slate-800/80 p-5 rounded-sm flex items-center justify-between shadow-md">
          <div>
            <span className="text-[9px] uppercase font-black tracking-widest text-slate-500 block mb-1">Média de Preços</span>
            <span className="text-3xl font-black text-amber-500">
              R$ {planos.length > 0 
                ? (planos.reduce((acc, curr) => acc + curr.valor, 0) / planos.length / 100).toFixed(2)
                : "0.00"
              }
            </span>
          </div>
          <div className="w-10 h-10 rounded-sm bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1m-4-6h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
        </div>
      </div>

      <div className="bg-[#111420] border border-slate-800/80 rounded-sm p-6 shadow-md">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Planos Cadastrados
        </h2>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-6 h-6 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 mt-2 font-mono">Carregando planos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500 border-b border-slate-800/80 bg-slate-950/40 text-[9px] uppercase tracking-widest font-bold">
                <tr>
                  <th className="p-3">Nome / Descrição</th>
                  <th className="p-3 text-center">Duração</th>
                  <th className="p-3 text-center">Velocidade</th>
                  <th className="p-3 text-right">Preço</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {planos.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800/30 odd:bg-[#111420] even:bg-[#141724] hover:bg-[#191e30] transition-colors duration-150">
                    <td className="p-3 max-w-xs">
                      <div className="font-bold text-white text-sm tracking-tight">{p.nome}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate" title={p.descricao}>{p.descricao}</div>
                    </td>
                    <td className="p-3 text-center font-mono text-xs text-slate-300">
                      {p.duracao_minutos >= 1440 
                        ? `${Math.round(p.duracao_minutos / 1440)} dias` 
                        : `${p.duracao_minutos} min`
                      }
                    </td>
                    <td className="p-3 text-center text-xs">
                      <div className="flex flex-col items-center justify-center gap-0.5 font-mono">
                        <span className="text-emerald-400">⬇ {p.velocidade_down} Mbps</span>
                        <span className="text-amber-500">⬆ {p.velocidade_up} Mbps</span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-white text-sm">
                      R$ {(p.valor / 100).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-sm select-none ${
                        p.ativo 
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/60" 
                          : "bg-slate-900/60 text-slate-500 border border-slate-800/60"
                      }`}>
                        {p.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => enviarParaMikrotik(p.id)} 
                          className="p-1.5 text-blue-400 hover:text-blue-300 bg-blue-950/30 border border-blue-900/50 hover:bg-blue-950/60 hover:border-blue-700 rounded-sm cursor-pointer transition-all duration-150" 
                          title="Enviar para o Mikrotik"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        
                        <button 
                          onClick={() => handleEditar(p)} 
                          className="p-1.5 text-slate-400 hover:text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-sm cursor-pointer transition-all duration-150" 
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        
                        <button 
                          onClick={() => handleCopiar(p)} 
                          className="p-1.5 text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 border border-emerald-900/50 hover:bg-emerald-950/60 hover:border-emerald-700 rounded-sm cursor-pointer transition-all duration-150" 
                          title="Copiar"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        
                        <button 
                          onClick={() => handleRemover(p.id)} 
                          className="p-1.5 text-red-400 hover:text-red-300 bg-red-950/30 border border-red-900/50 hover:bg-red-950/60 hover:border-red-700 rounded-sm cursor-pointer transition-all duration-150" 
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Criar / Editar Plano */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container max-w-lg">
            <div className="modal-header">
              <h3 className="modal-title">
                {editando ? "Editar Plano" : "Criar Novo Plano"}
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="modal-close-btn"
                title="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form className="flex flex-col flex-1 overflow-hidden" onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Nome do Plano</label>
                  <input 
                    type="text" 
                    className="w-full text-slate-200 px-3 py-2.5 rounded-sm focus:outline-none transition-all text-sm font-semibold" 
                    placeholder="Ex: Plano Intermediário"
                    value={form.nome} 
                    onChange={(e) => setForm({ ...form, nome: e.target.value })} 
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Descrição</label>
                  <textarea 
                    className="w-full text-slate-200 px-3 py-2.5 rounded-sm focus:outline-none transition-all text-sm h-20 resize-none" 
                    placeholder="Descreva o plano ou políticas de acesso..."
                    value={form.descricao} 
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })} 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Duração (minutos)</label> 
                    <input 
                      type="number" 
                      className="w-full text-slate-200 px-3 py-2.5 rounded-sm focus:outline-none transition-all text-sm font-mono" 
                      value={form.duracao} 
                      onChange={(e) => setForm({ ...form, duracao: e.target.value })} 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Valor (R$)</label>
                    <input 
                      type="text" 
                      className="w-full text-slate-200 px-3 py-2.5 rounded-sm focus:outline-none transition-all text-sm font-mono" 
                      placeholder="0,00"
                      value={form.valor} 
                      onChange={(e) => setForm({ ...form, valor: e.target.value })} 
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Download (Mbps)</label>
                    <input 
                      type="number" 
                      className="w-full text-slate-200 px-3 py-2.5 rounded-sm focus:outline-none transition-all text-sm font-mono" 
                      value={form.velocidade_download} 
                      onChange={(e) => setForm({ ...form, velocidade_download: e.target.value })} 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Upload (Mbps)</label>
                    <input 
                      type="number" 
                      className="w-full text-slate-200 px-3 py-2.5 rounded-sm focus:outline-none transition-all text-sm font-mono" 
                      value={form.velocidade_upload} 
                      onChange={(e) => setForm({ ...form, velocidade_upload: e.target.value })} 
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1.5">Mikrotik</label>
                  <select 
                    className="w-full text-slate-300 px-3 py-2.5 rounded-sm focus:outline-none transition-all text-sm cursor-pointer" 
                    value={form.mikrotik_id} 
                    onChange={(e) => setForm({ ...form, mikrotik_id: e.target.value })}
                    required
                  >
                    <option value="">Selecione o Mikrotik</option>
                    {mikrotiks.map((m) => (
                      <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-2.5 pt-2">
                  <input 
                    type="checkbox" 
                    id="ativo-chk"
                    className="rounded-sm bg-[#07090e] border-slate-800 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    checked={form.ativo} 
                    onChange={(e) => setForm({ ...form, ativo: e.target.checked })} 
                  />
                  <label htmlFor="ativo-chk" className="text-xs text-slate-400 cursor-pointer select-none">Disponibilizar plano para contratação (Ativo)</label>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2.5 border border-slate-800 text-slate-400 rounded-sm hover:bg-slate-900 hover:text-slate-200 transition-colors text-xs uppercase tracking-wider font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-500 rounded-sm transition-colors text-xs uppercase tracking-wider font-bold cursor-pointer"
                >
                  {editando ? "Salvar Alterações" : "Criar Plano"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

