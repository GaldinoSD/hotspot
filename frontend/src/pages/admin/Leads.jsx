import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import PageHeader from "../../components/admin/PageHeader";

const API = "";

const statusColors = {
  novo: "border-l-blue-500",
  contactado: "border-l-amber-500",
  convertido: "border-l-emerald-500",
  descartado: "border-l-rose-500",
};

const badgeColors = {
  novo: "bg-blue-950/60 text-blue-400 border-blue-900/50",
  contactado: "bg-amber-950/60 text-amber-400 border-amber-900/50",
  convertido: "bg-emerald-950/60 text-emerald-400 border-emerald-900/50",
  descartado: "bg-rose-950/60 text-rose-400 border-rose-900/50",
};

const pillColors = {
  novo: "bg-blue-600 text-white shadow shadow-blue-500/20",
  contactado: "bg-amber-500 text-white shadow shadow-amber-500/20",
  convertido: "bg-emerald-600 text-white shadow shadow-emerald-500/20",
  descartado: "bg-rose-600 text-white shadow shadow-rose-500/20",
};

const columns = [
  { key: "novo", name: "Novos Leads", border: "border-t-blue-600", text: "text-blue-400", bg: "bg-blue-500/5", hoverBg: "hover:bg-blue-955/10" },
  { key: "contactado", name: "Em Contato", border: "border-t-amber-500", text: "text-amber-400", bg: "bg-amber-500/5", hoverBg: "hover:bg-amber-955/10" },
  { key: "convertido", name: "Convertidos", border: "border-t-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/5", hoverBg: "hover:bg-emerald-955/10" },
  { key: "descartado", name: "Descartados", border: "border-t-rose-500", text: "text-rose-400", bg: "bg-rose-500/5", hoverBg: "hover:bg-rose-955/10" },
];

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", cpf: "", observacoes: "" });
  
  // Details Panel State
  const [selectedLead, setSelectedLead] = useState(null);
  const [noteInput, setNoteInput] = useState("");
  const [copiedField, setCopiedField] = useState(null);

  const token = localStorage.getItem("admin_token");

  // Sincroniza noteInput com as observações do lead selecionado
  useEffect(() => {
    if (selectedLead) {
      setNoteInput(selectedLead.observacoes || "");
    } else {
      setNoteInput("");
    }
  }, [selectedLead]);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("q", search);

      const res = await fetch(`${API}/api/leads?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const loadedLeads = Array.isArray(data) ? data : [];
      setLeads(loadedLeads);
      
      if (selectedLead) {
        const updated = loadedLeads.find(l => l.id === selectedLead.id);
        if (updated) setSelectedLead(updated);
      }
    } catch (err) {
      console.error("Erro ao buscar leads:", err);
    } finally {
      setLoading(false);
    }
  }, [token, search, selectedLead]);

  useEffect(() => {
    fetchLeads();
  }, [search]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      // Optimistic UI Update
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
      if (selectedLead && selectedLead.id === id) {
        setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
      }

      await fetch(`${API}/api/leads/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      // Silently sync with DB
      const params = new URLSearchParams();
      if (search) params.append("q", search);
      const res = await fetch(`${API}/api/leads?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setLeads(data);
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      fetchLeads();
    }
  };

  const handleSaveNotes = async (id, notes) => {
    try {
      await fetch(`${API}/api/leads/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ observacoes: notes }),
      });
      
      // Atualizar localmente
      setLeads(prev => prev.map(l => l.id === id ? { ...l, observacoes: notes } : l));
      setSelectedLead(prev => prev ? { ...prev, observacoes: notes } : null);
    } catch (err) {
      console.error("Erro ao salvar observações:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este lead?")) return;
    try {
      await fetch(`${API}/api/leads/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedLead(null);
      fetchLeads();
    } catch (err) {
      console.error("Erro ao deletar lead:", err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API}/api/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, origem: "manual" }),
      });
      setShowModal(false);
      setForm({ nome: "", email: "", telefone: "", cpf: "", observacoes: "" });
      fetchLeads();
    } catch (err) {
      console.error("Erro ao criar lead:", err);
    }
  };

  const handleExport = () => {
    window.open(`${API}/api/leads/export?token=${token}`, "_blank");
  };

  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Drag and Drop
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) {
      handleStatusChange(Number(id), targetStatus);
    }
  };

  const handleCopyText = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const filteredLeads = leads;

  return (
    <AdminLayout>
      {/* Estilos para animação spring do Drawer */}
      <style>{`
        @keyframes customSlideIn {
          from {
            transform: translateX(100%);
            opacity: 0.8;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-drawer-in {
          animation: customSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="CRM Leads"
          subtitle="Gerencie o funil de prospecção. Arraste os cartões para atualizar o progresso."
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          }
        >
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-[#1a1d27] border border-gray-800 text-gray-300 rounded-lg hover:bg-[#252b3b] transition-colors text-sm cursor-pointer"
          >
            Exportar CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 text-sm font-medium flex items-center gap-2 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            Novo Lead
          </button>
        </PageHeader>

        {/* Toolbar: Search */}
        <div className="flex items-center justify-between border-b border-gray-800/60 pb-4">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Buscar por nome, email ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-[#1a1d27] border border-gray-800 rounded-lg text-gray-355 placeholder-gray-650 focus:outline-none focus:border-blue-800 text-sm"
            />
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Total: <span className="font-semibold text-gray-300">{leads.length}</span> leads no funil
          </div>
        </div>

        {/* Kanban Board Grid */}
        {loading && leads.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Carregando leads no CRM...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4 items-start">
            {columns.map((col) => {
              const list = filteredLeads.filter(l => l.status === col.key);
              return (
                <div
                  key={col.key}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.key)}
                  className={`p-4 bg-[#11131e] rounded-xl border border-gray-855 min-h-[600px] flex flex-col justify-start border-t-4 ${col.border} transition-all duration-200 ${col.hoverBg}`}
                >
                  {/* Column Header */}
                  <div className="flex justify-between items-center mb-4 border-b border-gray-800/80 pb-2.5">
                    <span className="text-xs font-bold text-gray-300 tracking-wider uppercase">{col.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badgeColors[col.key]}`}>
                      {list.length}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[650px] pr-1">
                    {list.length === 0 ? (
                      <div className="text-center py-12 text-[11px] text-gray-655 italic border border-dashed border-gray-855 rounded-xl">
                        Nenhum lead nesta etapa
                      </div>
                    ) : (
                      list.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          className={`p-3.5 bg-[#171924]/85 border border-gray-855 rounded-xl hover:border-gray-700 hover:bg-[#1a1d27]/90 transition-all cursor-pointer space-y-2.5 shadow-md relative group border-l-4 ${statusColors[col.key]} hover:-translate-y-0.5 active:scale-[0.98]`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-200 text-xs truncate max-w-[140px]">
                              {lead.nome || "Sem Nome"}
                            </h4>
                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800">
                              {lead.origem}
                            </span>
                          </div>

                          <div className="text-[10px] text-gray-400 space-y-1">
                            {lead.telefone && (
                              <div className="flex items-center gap-1.5 text-gray-450 font-medium">
                                <svg className="h-3 w-3 text-gray-655 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                {lead.telefone}
                              </div>
                            )}
                            {lead.email && (
                              <div className="flex items-center gap-1.5 text-gray-500 truncate">
                                <svg className="h-3 w-3 text-gray-655 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                {lead.email}
                              </div>
                            )}
                          </div>

                          {lead.observacoes && (
                            <div className="text-[9px] text-gray-505 bg-[#0c0d15] px-2.5 py-1 rounded border border-gray-900/60 truncate leading-relaxed">
                              {lead.observacoes}
                            </div>
                          )}

                          <div className="flex justify-between items-center text-[9px] text-gray-600 pt-1 border-t border-gray-800/30">
                            <span>#{lead.id}</span>
                            <span>{formatDate(lead.criado_em)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Side Panel Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-end transition-opacity duration-300">
          <div className="w-full max-w-md bg-[#0c0e15] border-l border-gray-800/90 h-full p-8 flex flex-col justify-between overflow-y-auto shadow-2xl relative animate-drawer-in">
            <div className="space-y-6">
              
              {/* Header com Avatar e Fechar */}
              <div className="flex justify-between items-start pb-4 border-b border-gray-850">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-600/20 to-emerald-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 font-extrabold shadow-inner shrink-0">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base tracking-tight leading-none mb-1">{selectedLead.nome || "Sem Nome"}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-[8px] font-bold text-gray-400 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded font-mono uppercase">
                        ID: {selectedLead.id}
                      </span>
                      <span className="text-[8px] font-bold text-gray-400 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded uppercase">
                        {selectedLead.origem}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 border border-gray-800 hover:border-gray-700 rounded-lg text-gray-400 hover:text-white bg-gray-900/40 hover:bg-gray-800/50 transition-all cursor-pointer shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Seletor Segmentado de Status */}
              <div className="space-y-2">
                <h4 className="text-[9px] uppercase font-bold tracking-widest text-gray-500">Etapa no Funil</h4>
                <div className="bg-gray-950 p-1.5 rounded-xl border border-gray-850 flex w-full gap-1">
                  {columns.map((col) => {
                    const isSelected = selectedLead.status === col.key;
                    return (
                      <button
                        key={col.key}
                        onClick={() => handleStatusChange(selectedLead.id, col.key)}
                        className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all duration-250 cursor-pointer ${
                          isSelected
                            ? pillColors[col.key]
                            : "text-gray-500 hover:text-gray-300 hover:bg-[#1a1d27]/20"
                        }`}
                      >
                        {col.name.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Informações Básicas do Lead */}
              <div className="space-y-3">
                <h4 className="text-[9px] uppercase font-bold tracking-widest text-gray-500">Dados do Lead</h4>
                <div className="space-y-2.5">
                  {[
                    { label: "Telefone", val: selectedLead.telefone, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/> },
                    { label: "Email", val: selectedLead.email, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/> },
                    { label: "CPF", val: selectedLead.cpf, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/> },
                    { label: "MAC Address", val: selectedLead.mac, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/> },
                    { label: "IP de Cadastro", val: selectedLead.ip, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/> }
                  ].map((field) => (
                    <div key={field.label} className="flex items-center justify-between p-3.5 bg-gray-950/45 border border-gray-855 rounded-xl hover:bg-gray-950/80 transition-colors group/row">
                      <div className="flex items-center gap-3">
                        <div className="h-8.5 w-8.5 rounded-lg bg-gray-900/60 border border-gray-800 text-gray-450 flex items-center justify-center">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {field.icon}
                          </svg>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest block mb-0.5">{field.label}</span>
                          <span className="text-xs text-gray-250 font-medium font-mono">{field.val || "Não informado"}</span>
                        </div>
                      </div>
                      
                      {field.val && (
                        <button
                          onClick={() => handleCopyText(field.val, field.label)}
                          className="p-1.5 border border-gray-855 rounded-md text-gray-500 hover:text-blue-400 hover:border-blue-900/50 bg-[#161922]/10 transition-all cursor-pointer relative"
                        >
                          {copiedField === field.label ? (
                            <span className="absolute right-0 -top-7 text-[8px] bg-green-950/80 text-green-400 border border-green-800 px-1.5 py-0.5 rounded font-sans uppercase font-bold whitespace-nowrap shadow-md">
                              Copiado!
                            </span>
                          ) : null}
                          {copiedField === field.label ? (
                            <svg className="w-3.5 h-3.5 text-green-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Seção Única de Histórico & Anotações (Sem duplicidade) */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-[9px] uppercase font-bold tracking-widest text-gray-500">Anotações do Lead</h4>
                  {noteInput !== (selectedLead.observacoes || "") && (
                    <span className="text-[8px] bg-blue-950/50 text-blue-400 border border-blue-900/50 px-2 py-0.5 rounded uppercase font-bold animate-pulse">
                      Alterações não salvas
                    </span>
                  )}
                </div>
                
                <div className="space-y-2.5">
                  <textarea
                    placeholder="Escreva anotações ou observações comerciais para este lead..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    rows={4}
                    className="w-full p-3.5 bg-gray-955 border border-gray-850 focus:border-blue-905 rounded-xl text-xs text-gray-300 placeholder-gray-650 focus:outline-none focus:ring-1 focus:ring-blue-900/30 resize-none leading-relaxed transition-all"
                  />
                  <button
                    onClick={() => handleSaveNotes(selectedLead.id, noteInput)}
                    disabled={noteInput === (selectedLead.observacoes || "")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-md shadow-blue-600/10"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>

            </div>

            {/* Rodapé do Slide Panel */}
            <div className="pt-4 border-t border-gray-850 flex justify-between items-center text-xs text-gray-500 mt-6">
              <span>Criado em: {new Date(selectedLead.criado_em).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              <button
                onClick={() => handleDelete(selectedLead.id)}
                className="px-3.5 py-2 border border-rose-955 text-rose-500 hover:text-white bg-rose-955/20 hover:bg-rose-600 hover:border-rose-650 rounded-lg transition-all cursor-pointer text-xs font-bold active:scale-95"
              >
                Excluir Lead
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Novo Lead */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d27] border border-gray-800 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">Novo Lead</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-200 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f111a] border border-gray-800 rounded-lg text-gray-255 focus:outline-none focus:border-blue-800 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f111a] border border-gray-800 rounded-lg text-gray-255 focus:outline-none focus:border-blue-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Telefone</label>
                <input
                  type="text"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f111a] border border-gray-800 rounded-lg text-gray-255 focus:outline-none focus:border-blue-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">CPF</label>
                <input
                  type="text"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0f111a] border border-gray-800 rounded-lg text-gray-255 focus:outline-none focus:border-blue-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#0f111a] border border-gray-850 rounded-lg text-gray-255 focus:outline-none focus:border-blue-800 text-sm resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-[#0f111a] border border-gray-800 text-gray-300 rounded-lg hover:bg-[#252b3b] transition-colors text-sm cursor-pointer"
                >
                  <span className="text-gray-300">Cancelar</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm cursor-pointer"
                >
                  Criar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
