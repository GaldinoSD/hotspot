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
  const [filtroOrigem, setFiltroOrigem] = useState("Todos");
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

  // Helpers de Métricas e Filtros
  const getLeadsRecentes = () => {
    const umDiaAtras = new Date();
    umDiaAtras.setDate(umDiaAtras.getDate() - 1);
    return leads.filter(l => l.criado_em && new Date(l.criado_em) >= umDiaAtras).length;
  };

  const getWhatsAppLink = (lead) => {
    if (!lead.telefone) return "#";
    let clean = lead.telefone.replace(/\D/g, "");
    if (clean.length === 11 || clean.length === 10) {
      clean = "55" + clean;
    }
    const text = `Olá ${lead.nome || ""}, tudo bem? Vi seu cadastro no portal Wi-Fi. Gostaria de te ajudar com alguma informação?`;
    return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
  };

  const uniqueOrigens = ["Todos", ...new Set(leads.map(l => l.origem).filter(Boolean))];

  const filteredLeads = leads.filter(l => {
    const matchesSearch = !search || 
      (l.nome && l.nome.toLowerCase().includes(search.toLowerCase())) ||
      (l.email && l.email.toLowerCase().includes(search.toLowerCase())) ||
      (l.cpf && l.cpf.includes(search)) ||
      (l.telefone && l.telefone.includes(search));
    const matchesOrigem = filtroOrigem === "Todos" || l.origem === filtroOrigem;
    return matchesSearch && matchesOrigem;
  });

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
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
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
            className="px-4 py-2 bg-[#1a1d27] border border-gray-800 text-gray-300 rounded-xl hover:bg-[#252b3b] transition-colors text-sm cursor-pointer"
          >
            Exportar CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 text-sm font-medium flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-600/10 hover:shadow-blue-600/25 hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            Novo Lead
          </button>
        </PageHeader>

        {/* Cards de Métricas Principais (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#121420]/80 border border-gray-800/40 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total de Leads</span>
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white">{leads.length}</div>
              <div className="text-[10px] text-gray-500 mt-1">Leads registrados no funil</div>
            </div>
          </div>

          <div className="bg-[#121420]/80 border border-gray-800/40 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Taxa de Conversão</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white">
                {leads.length > 0 ? ((leads.filter(l => l.status === "convertido").length / leads.length) * 100).toFixed(0) : 0}%
              </div>
              <div className="text-[10px] text-gray-500 mt-1">Leads marcados como convertidos</div>
            </div>
          </div>

          <div className="bg-[#121420]/80 border border-gray-800/40 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Em Atendimento</span>
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white">
                {leads.filter(l => l.status === "contactado").length}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">Contatos comerciais iniciados</div>
            </div>
          </div>

          <div className="bg-[#121420]/80 border border-gray-800/40 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Novos (24h)</span>
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white">{getLeadsRecentes()}</div>
              <div className="text-[10px] text-gray-500 mt-1">Cadastros nas últimas 24 horas</div>
            </div>
          </div>
        </div>

        {/* Toolbar: Search and Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/60 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full max-w-2xl">
            {/* Search */}
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="Buscar por nome, email, telefone ou CPF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-[#1a1d27]/90 border border-gray-800 focus:border-blue-800 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none text-sm transition-all shadow-inner"
              />
              <svg
                className="absolute left-3.5 top-3 w-4 h-4 text-gray-500"
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

            {/* Origin Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Origem:</span>
              <select
                value={filtroOrigem}
                onChange={(e) => setFiltroOrigem(e.target.value)}
                className="bg-[#1a1d27] border border-gray-800 text-gray-300 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-blue-800 cursor-pointer"
              >
                {uniqueOrigens.map((origem) => (
                  <option key={origem} value={origem}>
                    {origem.charAt(0).toUpperCase() + origem.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
            Filtrados: <span className="font-semibold text-gray-300">{filteredLeads.length}</span> de <span className="font-semibold text-gray-300">{leads.length}</span> leads
          </div>
        </div>

        {/* Kanban Board Grid */}
        {loading && leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <span>Carregando leads no CRM...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4 items-start custom-scrollbar">
            {columns.map((col) => {
              const list = filteredLeads.filter(l => l.status === col.key);
              return (
                <div
                  key={col.key}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.key)}
                  className={`p-4 bg-[#0f111a]/85 rounded-2xl border border-gray-800/60 min-h-[600px] flex flex-col justify-start border-t-4 ${col.border} transition-all duration-300 shadow-lg`}
                >
                  {/* Column Header */}
                  <div className="flex justify-between items-center mb-4 border-b border-gray-800/50 pb-3">
                    <span className="text-[11px] font-bold text-gray-300 tracking-wider uppercase">{col.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badgeColors[col.key]}`}>
                      {list.length}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[650px] pr-1 custom-scrollbar">
                    {list.length === 0 ? (
                      <div className="text-center py-12 text-[10px] text-gray-600 italic border border-dashed border-gray-800/80 rounded-2xl">
                        Nenhum lead nesta etapa
                      </div>
                    ) : (
                      list.map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          className={`p-4 bg-[#161824]/95 border border-gray-800/40 rounded-2xl hover:border-gray-700 hover:bg-[#1c1f30]/95 transition-all duration-300 cursor-pointer space-y-3 shadow-md relative group border-l-4 ${statusColors[col.key]} hover:-translate-y-1 active:scale-[0.98] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-gray-200 text-xs truncate max-w-[140px] group-hover:text-white transition-colors">
                              {lead.nome || "Sem Nome"}
                            </h4>
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 font-mono">
                              {lead.origem}
                            </span>
                          </div>

                          <div className="text-[10px] text-gray-400 space-y-1.5 pb-2">
                            {lead.telefone && (
                              <div className="flex items-center gap-1.5 text-gray-450 font-medium">
                                <svg className="h-3.5 w-3.5 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                {lead.telefone}
                              </div>
                            )}
                            {lead.email && (
                              <div className="flex items-center gap-1.5 text-gray-500 truncate">
                                <svg className="h-3.5 w-3.5 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                {lead.email}
                              </div>
                            )}
                          </div>

                          {lead.observacoes && (
                            <div className="text-[9px] text-gray-450 bg-[#0e1017] px-2.5 py-1.5 rounded-xl border border-gray-900 leading-relaxed truncate">
                              {lead.observacoes}
                            </div>
                          )}

                          <div className="flex justify-between items-center text-[9px] text-gray-600 pt-1 border-t border-gray-800/40">
                            <span>#{lead.id}</span>
                            <span>{formatDate(lead.criado_em)}</span>
                          </div>

                          {/* Ações Rápidas em Hover */}
                          <div 
                            className="absolute right-3 bottom-3.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#161824]/95 p-1 rounded-xl shadow-md border border-gray-800" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            {lead.telefone && (
                              <a
                                href={getWhatsAppLink(lead)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg border border-emerald-500/20 hover:border-emerald-500 transition-all cursor-pointer"
                                title="Enviar WhatsApp"
                              >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.453L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.63 1.97 14.162.946 11.536.946c-5.438 0-9.862 4.373-9.866 9.801-.002 2.03.535 4.022 1.558 5.793L2.24 21.8l5.407-1.417-.999-.44-.001-.001-.002.011z"/>
                                </svg>
                              </a>
                            )}
                            
                            {col.key === "novo" && (
                              <button
                                onClick={() => handleStatusChange(lead.id, "contactado")}
                                className="p-1 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white rounded-lg border border-amber-500/20 hover:border-amber-500 transition-all cursor-pointer"
                                title="Iniciar Contato"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7M5 5l7 7-7 7"/></svg>
                              </button>
                            )}

                            {col.key === "contactado" && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(lead.id, "convertido")}
                                  className="p-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg border border-emerald-500/20 hover:border-emerald-500 transition-all cursor-pointer"
                                  title="Converter Lead"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                                </button>
                                <button
                                  onClick={() => handleStatusChange(lead.id, "descartado")}
                                  className="p-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg border border-rose-500/20 hover:border-rose-500 transition-all cursor-pointer"
                                  title="Descartar Lead"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                              </>
                            )}

                            {(col.key === "convertido" || col.key === "descartado") && (
                              <button
                                onClick={() => handleStatusChange(lead.id, "novo")}
                                className="p-1 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg border border-blue-500/20 hover:border-blue-500 transition-all cursor-pointer"
                                title="Mover para Novos"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18"/></svg>
                              </button>
                            )}
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

      {/* Details Side Panel Drawer (Translucent Dark Overlay) */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-end transition-opacity duration-300">
          <div className="w-full max-w-md bg-[#0a0c14]/95 border-l border-gray-800/80 h-full p-8 flex flex-col justify-between overflow-y-auto shadow-2xl relative animate-drawer-in custom-scrollbar">
            <div className="space-y-6">
              
              {/* Header com Avatar e Fechar */}
              <div className="flex justify-between items-start pb-4 border-b border-gray-800/50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-blue-600/20 to-emerald-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-extrabold shadow-inner shrink-0">
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
                      <span className="text-[8px] font-bold text-gray-400 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded uppercase font-mono">
                        {selectedLead.origem}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 border border-gray-800 hover:border-gray-750 rounded-xl text-gray-400 hover:text-white bg-gray-900/30 hover:bg-gray-800/40 transition-all cursor-pointer shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Seletor Segmentado de Status */}
              <div className="space-y-2">
                <h4 className="text-[9px] uppercase font-bold tracking-widest text-gray-500 font-sans">Etapa no Funil</h4>
                <div className="bg-[#05060a] p-1 rounded-xl border border-gray-800/80 flex w-full gap-0.5">
                  {columns.map((col) => {
                    const isSelected = selectedLead.status === col.key;
                    return (
                      <button
                        key={col.key}
                        onClick={() => handleStatusChange(selectedLead.id, col.key)}
                        className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${
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
                <h4 className="text-[9px] uppercase font-bold tracking-widest text-gray-500">Dados de Contrato e Rede</h4>
                <div className="space-y-2">
                  {[
                    { label: "Telefone", val: selectedLead.telefone, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/> },
                    { label: "Email", val: selectedLead.email, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/> },
                    { label: "CPF", val: selectedLead.cpf, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/> },
                    { label: "MAC Address", val: selectedLead.mac, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/> },
                    { label: "IP de Cadastro", val: selectedLead.ip, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/> }
                  ].map((field) => (
                    <div key={field.label} className="flex items-center justify-between p-3.5 bg-[#080a11]/90 border border-gray-800/60 rounded-2xl hover:bg-[#0c0f1b] transition-colors group/row">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gray-900/60 border border-gray-800 text-gray-400 flex items-center justify-center">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {field.icon}
                          </svg>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest block mb-0.5">{field.label}</span>
                          <span className="text-xs text-gray-300 font-medium font-mono">{field.val || "Não informado"}</span>
                        </div>
                      </div>
                      
                      {field.val && (
                        <button
                          onClick={() => handleCopyText(field.val, field.label)}
                          className="p-1.5 border border-gray-800 hover:border-gray-700 rounded-lg text-gray-500 hover:text-blue-400 bg-gray-900/20 hover:bg-gray-900/40 transition-all cursor-pointer relative"
                        >
                          {copiedField === field.label ? (
                            <span className="absolute right-0 -top-8 text-[8px] bg-green-950/90 text-green-400 border border-green-800 px-2 py-0.5 rounded font-sans uppercase font-bold whitespace-nowrap shadow-md">
                              Copiado!
                            </span>
                          ) : null}
                          {copiedField === field.label ? (
                            <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Histórico & Anotações */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-[9px] uppercase font-bold tracking-widest text-gray-500">Anotações Comerciais</h4>
                  {noteInput !== (selectedLead.observacoes || "") && (
                    <span className="text-[8px] bg-blue-950/60 text-blue-400 border border-blue-900/50 px-2 py-0.5 rounded uppercase font-bold animate-pulse font-mono">
                      Salvar Pendente
                    </span>
                  )}
                </div>
                
                <div className="space-y-2.5">
                  <textarea
                    placeholder="Escreva observações ou detalhes sobre a negociação comercial com este lead..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    rows={4}
                    className="w-full p-3.5 bg-[#080a11] border border-gray-800 focus:border-blue-800 rounded-2xl text-xs text-gray-300 placeholder-gray-650 focus:outline-none focus:ring-1 focus:ring-blue-900/25 resize-none leading-relaxed transition-all"
                  />
                  <button
                    onClick={() => handleSaveNotes(selectedLead.id, noteInput)}
                    disabled={noteInput === (selectedLead.observacoes || "")}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-45 disabled:hover:bg-blue-600 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-[0.98] shadow-md shadow-blue-600/10 hover:shadow-blue-600/20"
                  >
                    Salvar Observações
                  </button>
                </div>
              </div>

            </div>

            {/* Rodapé do Drawer */}
            <div className="pt-4 border-t border-gray-800/50 flex justify-between items-center text-xs text-gray-500 mt-6 font-medium">
              <span>Criado: {new Date(selectedLead.criado_em).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              <button
                onClick={() => handleDelete(selectedLead.id)}
                className="px-3.5 py-2 border border-rose-950 text-rose-500 hover:text-white bg-rose-950/20 hover:bg-rose-600 hover:border-rose-500 rounded-xl transition-all cursor-pointer text-xs font-bold active:scale-[0.98]"
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
          <div className="bg-[#161824] border border-gray-800/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-800/60">
              <h2 className="text-base font-bold text-white uppercase tracking-wider">Novo Lead</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-250 cursor-pointer p-1.5 border border-gray-800 rounded-xl hover:bg-gray-800/40 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1.5">Nome completo</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#0c0e15] border border-gray-800 focus:border-blue-850 rounded-xl text-gray-250 placeholder-gray-600 focus:outline-none text-sm transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1.5">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#0c0e15] border border-gray-800 focus:border-blue-850 rounded-xl text-gray-250 placeholder-gray-600 focus:outline-none text-sm transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1.5">Telefone</label>
                  <input
                    type="text"
                    value={form.telefone}
                    placeholder="(21) 99999-9999"
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0c0e15] border border-gray-800 focus:border-blue-850 rounded-xl text-gray-250 placeholder-gray-600 focus:outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1.5">CPF</label>
                  <input
                    type="text"
                    value={form.cpf}
                    placeholder="000.000.000-00"
                    onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#0c0e15] border border-gray-800 focus:border-blue-850 rounded-xl text-gray-250 placeholder-gray-600 focus:outline-none text-sm transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-1.5">Observações comerciais</label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-[#0c0e15] border border-gray-800 focus:border-blue-850 rounded-xl text-gray-250 placeholder-gray-600 focus:outline-none text-sm resize-none transition-all leading-relaxed"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-[#0c0e15] border border-gray-800 text-gray-400 hover:text-gray-300 rounded-xl hover:bg-gray-800/30 transition-colors text-sm font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all text-sm font-semibold cursor-pointer shadow-md shadow-blue-600/10 hover:scale-[1.02] active:scale-[0.98]"
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
