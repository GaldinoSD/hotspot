import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { 
  Building2, ArrowLeft, Plus, Edit3, Trash2, ExternalLink, 
  Mail, Phone, Hash, Shield, Search
} from "lucide-react";

export default function Empresas() {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nome: "", cnpj: "", email: "", telefone: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("admin_token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate("/admin");
      return;
    }
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    try {
      const res = await fetch("/api/empresas", { headers });
      if (res.ok) setEmpresas(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editId ? `/api/empresas/${editId}` : "/api/empresas";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      if (res.ok) {
        setShowModal(false);
        setEditId(null);
        setForm({ nome: "", cnpj: "", email: "", telefone: "" });
        fetchEmpresas();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (empresa) => {
    setEditId(empresa.id);
    setForm({ nome: empresa.nome, cnpj: empresa.cnpj || "", email: empresa.email, telefone: empresa.telefone || "" });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Deseja realmente deletar esta empresa?")) return;
    try {
      await fetch(`/api/empresas/${id}`, { method: "DELETE", headers });
      fetchEmpresas();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEmpresas = empresas.filter(e => 
    !searchTerm || 
    e.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0f111a] text-gray-300">
      {/* Top Bar */}
      <div className="border-b border-gray-800/80 bg-[#13161f]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/super"
              className="p-2 rounded-xl border border-gray-800 hover:border-gray-700 hover:bg-gray-800/50 text-gray-400 hover:text-white transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-700/30 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Gerenciar Empresas</h1>
                <p className="text-[11px] text-gray-500 font-medium">{empresas.length} empresa(s) cadastrada(s)</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setEditId(null); setForm({ nome: "", cnpj: "", email: "", telefone: "" }); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Empresa
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nome, slug ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1d27] border border-gray-800 focus:border-blue-500 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all placeholder-gray-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-gray-700 border-t-blue-500 rounded-full animate-spin" style={{borderWidth: '3px'}}></div>
            <span className="ml-3 text-sm text-gray-500">Carregando empresas...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEmpresas.map((e) => (
              <div 
                key={e.id} 
                className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-5 hover:border-gray-700/80 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-700/10 border border-blue-800/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-base font-bold text-blue-400">{e.nome?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="text-base font-bold text-white truncate">{e.nome}</h3>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          e.ativo 
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' 
                            : 'bg-red-950/40 text-red-400 border-red-800/40'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${e.ativo ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                          {e.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-gray-600" />
                          {e.email}
                        </span>
                        <span className="flex items-center gap-1.5 font-mono text-gray-600">
                          slug: {e.slug}
                        </span>
                        {e.cnpj && (
                          <span className="flex items-center gap-1.5">
                            <Hash className="w-3 h-3 text-gray-600" />
                            {e.cnpj}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <span className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700/50 font-bold text-gray-400">{e.total_mikrotiks || 0}</span>
                          mikrotiks
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <span className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700/50 font-bold text-gray-400">{e.total_planos || 0}</span>
                          planos
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                          <span className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700/50 font-bold text-gray-400">{e.total_admins || 0}</span>
                          admins
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      to={`/admin/${e.slug}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 hover:text-blue-300 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-blue-800/30 hover:border-blue-700/50"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Acessar
                    </Link>
                    <button
                      onClick={() => handleEdit(e)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 hover:text-amber-300 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-amber-800/30 hover:border-amber-700/50 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      Editar
                    </button>
                    {e.slug !== 'default' && (
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-red-900/30 hover:border-red-800/50 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Deletar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredEmpresas.length === 0 && !loading && (
              <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-12 text-center">
                <Building2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhuma empresa encontrada.</p>
                <p className="text-gray-600 text-sm mt-1">Ajuste a busca ou crie uma nova empresa.</p>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-container max-w-md">
              <div className="modal-header">
                <h3 className="modal-title">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  {editId ? "Editar Empresa" : "Nova Empresa"}
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

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="modal-body space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Nome da Empresa</label>
                    <input
                      type="text" required
                      placeholder="Ex: Empresa ABC Ltda"
                      value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      className="w-full px-4 py-2.5 text-white rounded-xl focus:outline-none text-xs transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Email de Contato</label>
                    <input
                      type="email" required
                      placeholder="contato@empresa.com"
                      value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2.5 text-white rounded-xl focus:outline-none text-xs transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">CNPJ</label>
                      <input
                        type="text"
                        placeholder="00.000.000/0000-00"
                        value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                        className="w-full px-4 py-2.5 text-white rounded-xl focus:outline-none text-xs transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Telefone</label>
                      <input
                        type="text"
                        placeholder="(00) 00000-0000"
                        value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                        className="w-full px-4 py-2.5 text-white rounded-xl focus:outline-none text-xs transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-transparent hover:bg-gray-900 border border-gray-800 text-gray-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  >
                    {editId ? "Salvar Alterações" : "Criar Empresa"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
