import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import PageHeader from "../../components/admin/PageHeader";
import { Plus, Edit, Trash2, Megaphone, Eye, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function Campanhas() {
  const { empresaSlug } = useParams();
  const [campanhas, setCampanhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nome: "", descricao: "" });
  const [salvando, setSalvando] = useState(false);
  const token = localStorage.getItem("admin_token");

  const carregar = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/campanhas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar campanhas");
      setCampanhas(data.data || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleCriar = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) return alert("Informe o nome da campanha.");
    setSalvando(true);
    try {
      const res = await fetch("/api/campanhas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nome: form.nome, descricao: form.descricao }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar campanha");
      setShowModal(false);
      setForm({ nome: "", descricao: "" });
      carregar();
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleToggleAtivo = async (c) => {
    try {
      const res = await fetch(`/api/campanhas/${c.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ativo: !c.ativo }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar campanha");
      carregar();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletar = async (id) => {
    if (!confirm("Deseja realmente excluir esta campanha?")) return;
    try {
      const res = await fetch(`/api/campanhas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao excluir campanha");
      carregar();
    } catch (err) {
      alert(err.message);
    }
  };

  // Estatísticas Rápidas
  const totalCampanhas = campanhas.length;
  const campanhasAtivas = campanhas.filter(c => c.ativo).length;
  const totalViews = campanhas.reduce((sum, c) => sum + (c.views || 0), 0);

  return (
    <AdminLayout>
      <PageHeader
        title="Campanhas"
        subtitle="Gerenciamento de campanhas de marketing"
        icon={<Megaphone className="w-6 h-6 text-orange-500" />}
      >
        <button
          onClick={() => {
            setForm({ nome: "", descricao: "" });
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-500 text-sm font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-orange-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nova Campanha
        </button>
      </PageHeader>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-fadeIn">
        <div className="bg-[#131722] border border-slate-800 rounded-xl p-5 flex items-center gap-4 hover:border-slate-700 transition-all duration-300">
          <div className="p-3 bg-orange-500/10 rounded-lg text-orange-500">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Campanhas Criadas</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">{totalCampanhas}</h3>
          </div>
        </div>

        <div className="bg-[#131722] border border-slate-800 rounded-xl p-5 flex items-center gap-4 hover:border-slate-700 transition-all duration-300">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Campanhas Ativas</p>
            <h3 className="text-2xl font-bold text-emerald-550 mt-1">{campanhasAtivas}</h3>
          </div>
        </div>

        <div className="bg-[#131722] border border-slate-800 rounded-xl p-5 flex items-center gap-4 hover:border-slate-700 transition-all duration-300">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Visualizações Totais</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">{totalViews}</h3>
          </div>
        </div>
      </div>

      {/* Tabela de Campanhas */}
      <div className="bg-[#131722] border border-slate-800 rounded-xl overflow-hidden shadow-xl animate-fadeIn">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-[#090b11]/50 text-slate-400 font-medium">
                <th className="px-5 py-3.5 pl-6">Nome</th>
                <th className="px-5 py-3.5">Descrição</th>
                <th className="px-5 py-3.5 text-center">Itens de Mídia</th>
                <th className="px-5 py-3.5 text-center">Views</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right pr-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500">
                    <div className="flex justify-center items-center py-4">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    </div>
                  </td>
                </tr>
              ) : campanhas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    Nenhuma campanha cadastrada.
                  </td>
                </tr>
              ) : (
                campanhas.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-850/30 transition-colors group">
                    <td className="px-5 py-4 pl-6 font-semibold text-slate-200 group-hover:text-white transition-colors">
                      {c.nome}
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs max-w-xs truncate" title={c.descricao}>
                      {c.descricao || "—"}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        {c.total_itens ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-slate-300 font-mono">
                      {c.views ?? 0}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggleAtivo(c)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                          c.ativo
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                        title="Clique para alternar status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${c.ativo ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {c.ativo ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right pr-6">
                      <div className="flex gap-2 justify-end">
                        <Link
                          to={`/admin/${empresaSlug}/campanhas/${c.id}`}
                          className="p-1.5 border border-slate-800 text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white transition-all active:scale-95 inline-flex items-center"
                          title="Editar Campanha"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeletar(c.id)}
                          className="p-1.5 border border-slate-800 text-slate-400 rounded-lg hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all active:scale-95"
                          title="Excluir Campanha"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar Campanha */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container max-w-md">
            <div className="modal-header">
              <h3 className="modal-title">
                <Megaphone className="w-5 h-5 text-orange-500" />
                Nova Campanha
              </h3>
              <button 
                type="button"
                onClick={() => setShowModal(false)} 
                className="modal-close-btn"
                title="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCriar} className="flex flex-col flex-1 overflow-hidden">
              <div className="modal-body space-y-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    Nome <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nome identificador da campanha"
                    className="w-full text-white rounded-lg px-3.5 py-2.5 outline-none transition-all placeholder-slate-600 text-sm font-sans"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Descrição</label>
                  <textarea
                    placeholder="Onde essa campanha vai ser exibida ou qual o objetivo?"
                    className="w-full text-white rounded-lg px-3.5 py-2.5 outline-none transition-all placeholder-slate-600 text-sm font-sans"
                    rows={3}
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-sm font-medium transition-colors text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-all shadow-lg hover:shadow-orange-600/10 active:scale-95 cursor-pointer"
                >
                  {salvando ? "Criando..." : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
