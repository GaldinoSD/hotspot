import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import PageHeader from "../../components/admin/PageHeader";
import { Building2, Cpu, Wifi, Plus, Edit, Trash2, Upload, Mail, Phone, FileText, Users, Loader2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

export default function EmpresasAdmin() {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nome: "", cnpj: "", email: "", telefone: "" });
  const [erro, setErro] = useState(null);
  
  // Vinculação de admins
  const [showAdminsModal, setShowAdminsModal] = useState(null); // empresa_id
  const [adminsEmpresa, setAdminsEmpresa] = useState([]);
  const [todosAdmins, setTodosAdmins] = useState([]);
  const [vinculandoAdmin, setVinculandoAdmin] = useState({ admin_id: "", role: "operator" });
  const [uploadingLogo, setUploadingLogo] = useState(null);

  const token = localStorage.getItem("admin_token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const handleLogoUpload = async (empresaId, file) => {
    if (!file) return;
    setUploadingLogo(empresaId);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await fetch(`${API}/api/empresas/${empresaId}/logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) fetchEmpresas();
      else alert('Erro ao enviar logo');
    } catch (err) {
      alert('Erro de conexão');
    } finally {
      setUploadingLogo(null);
    }
  };

  const fetchEmpresas = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/empresas`, { headers });
      if (res.ok) setEmpresas(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmpresas(); }, [fetchEmpresas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    try {
      const url = editId ? `${API}/api/empresas/${editId}` : `${API}/api/empresas`;
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      if (res.ok) {
        setShowModal(false);
        setEditId(null);
        setForm({ nome: "", cnpj: "", email: "", telefone: "" });
        fetchEmpresas();
      } else {
        const data = await res.json();
        setErro(data.message || "Erro ao salvar");
      }
    } catch (err) {
      setErro("Erro de conexão");
    }
  };

  const handleEdit = (empresa) => {
    setEditId(empresa.id);
    setForm({ nome: empresa.nome, cnpj: empresa.cnpj || "", email: empresa.email, telefone: empresa.telefone || "" });
    setShowModal(true);
  };

  const handleDelete = async (id, slug) => {
    if (slug === 'default') return alert("Não é possível deletar a empresa padrão");
    if (!confirm("Deseja realmente deletar esta empresa? Todos os dados serão perdidos!")) return;
    await fetch(`${API}/api/empresas/${id}`, { method: "DELETE", headers });
    fetchEmpresas();
  };

  // --- Admin vinculation ---
  const openAdminsModal = async (empresaId) => {
    setShowAdminsModal(empresaId);
    const [adminsRes, todosRes] = await Promise.all([
      fetch(`${API}/api/empresas/${empresaId}/admins`, { headers }),
      fetch(`${API}/api/empresas/admins/todos`, { headers }),
    ]);
    setAdminsEmpresa(await adminsRes.json());
    setTodosAdmins(await todosRes.json());
  };

  const vincularAdmin = async () => {
    if (!vinculandoAdmin.admin_id) return;
    await fetch(`${API}/api/empresas/${showAdminsModal}/vincular-admin`, {
      method: "POST", headers, body: JSON.stringify(vinculandoAdmin)
    });
    setVinculandoAdmin({ admin_id: "", role: "operator" });
    openAdminsModal(showAdminsModal);
  };

  const desvincularAdmin = async (adminId) => {
    if (!confirm("Remover este admin da empresa?")) return;
    await fetch(`${API}/api/empresas/${showAdminsModal}/desvincular-admin/${adminId}`, {
      method: "DELETE", headers
    });
    openAdminsModal(showAdminsModal);
  };

  // Cálculos de estatísticas agregadas
  const totalMikrotiks = empresas.reduce((acc, curr) => acc + (parseInt(curr.total_mikrotiks) || 0), 0);
  const totalPlanos = empresas.reduce((acc, curr) => acc + (parseInt(curr.total_planos) || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Empresas"
          subtitle={`${empresas.length} empresa(s) cadastrada(s)`}
          icon={<Building2 className="w-6 h-6 text-orange-500" />}
        >
          <button
            onClick={() => { setEditId(null); setForm({ nome: "", cnpj: "", email: "", telefone: "" }); setErro(null); setShowModal(true); }}
            className="px-4 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-500 text-sm font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-orange-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nova Empresa
          </button>
        </PageHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
          <div className="bg-[#131722] border border-slate-800 rounded-xl p-5 flex items-center gap-4 hover:border-slate-700 transition-all duration-300">
            <div className="p-3 bg-orange-500/10 rounded-lg text-orange-500">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Empresas</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{empresas.length}</h3>
            </div>
          </div>

          <div className="bg-[#131722] border border-slate-800 rounded-xl p-5 flex items-center gap-4 hover:border-slate-700 transition-all duration-300">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Mikrotiks Totais</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{totalMikrotiks}</h3>
            </div>
          </div>

          <div className="bg-[#131722] border border-slate-800 rounded-xl p-5 flex items-center gap-4 hover:border-slate-700 transition-all duration-300">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Wifi className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Planos Cadastrados</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{totalPlanos}</h3>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="bg-[#131722] border border-slate-800 rounded-xl overflow-hidden shadow-xl animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#090b11]/50 text-slate-400 font-medium">
                    <th className="text-left px-5 py-3.5 w-16">Logo</th>
                    <th className="text-left px-5 py-3.5">Empresa</th>
                    <th className="text-left px-5 py-3.5">CNPJ</th>
                    <th className="text-left px-5 py-3.5">Contato</th>
                    <th className="text-center px-5 py-3.5">Ativos</th>
                    <th className="text-center px-5 py-3.5">Status</th>
                    <th className="text-right px-5 py-3.5 pr-6">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {empresas.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-850/30 transition-colors group">
                      <td className="px-5 py-4">
                        <label className="cursor-pointer block w-11 h-11 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 hover:border-orange-500 transition-all relative group/logo">
                          {e.logo_url ? (
                            <img src={e.logo_url} alt="" className="w-full h-full object-contain p-1" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                              <Upload className="w-4 h-4 text-slate-600 group-hover/logo:text-orange-500 transition-colors" />
                            </div>
                          )}
                          <input type="file" accept="image/*" className="hidden" disabled={uploadingLogo === e.id}
                            onChange={(ev) => handleLogoUpload(e.id, ev.target.files[0])} />
                          {uploadingLogo === e.id && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                            </div>
                          )}
                        </label>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-200 group-hover:text-white transition-colors">{e.nome}</p>
                        <p className="text-xs font-mono text-slate-500">{`/${e.slug}`}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          {e.cnpj || "—"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <p className="text-slate-300 text-xs flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            {e.email}
                          </p>
                          {e.telefone && (
                            <p className="text-slate-500 text-xs flex items-center gap-1.5 font-mono">
                              <Phone className="w-3.5 h-3.5 text-slate-655" />
                              {e.telefone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex gap-2 justify-center text-[10px] font-bold">
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-md">
                            {e.total_mikrotiks || 0} MKT
                          </span>
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-md">
                            {e.total_planos || 0} Planos
                          </span>
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-md">
                            {e.total_admins || 0} Admins
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${e.ativo ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${e.ativo ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                          {e.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right pr-6">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openAdminsModal(e.id)}
                            className="p-1.5 border border-slate-800 text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white transition-all active:scale-95"
                            title="Gerenciar Admins"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(e)}
                            className="p-1.5 border border-slate-800 text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white transition-all active:scale-95"
                            title="Editar Empresa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {e.slug !== 'default' && (
                            <button
                              onClick={() => handleDelete(e.id, e.slug)}
                              className="p-1.5 border border-slate-800 text-slate-400 rounded-lg hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all active:scale-95"
                              title="Excluir Empresa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Criar/Editar Empresa */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <form onSubmit={handleSubmit} className="bg-[#131722] border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative animate-scaleIn">
              <h2 className="text-lg font-bold text-slate-100 mb-5 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-500" />
                {editId ? "Editar Empresa" : "Nova Empresa"}
              </h2>
              {erro && <p className="text-red-400 text-sm mb-4 bg-red-950/20 border border-red-900/30 p-2.5 rounded-lg">{erro}</p>}
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Nome *</label>
                  <input type="text" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="w-full bg-[#090b11] border border-slate-800 text-white rounded-lg px-3.5 py-2.5 outline-none focus:border-orange-500 transition-all placeholder-slate-600 text-sm font-sans" />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Email *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-[#090b11] border border-slate-800 text-white rounded-lg pl-10 pr-3.5 py-2.5 outline-none focus:border-orange-500 transition-all placeholder-slate-600 text-sm font-sans" />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">CNPJ</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <FileText className="w-4 h-4" />
                    </span>
                    <input type="text" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                      className="w-full bg-[#090b11] border border-slate-800 text-white rounded-lg pl-10 pr-3.5 py-2.5 outline-none focus:border-orange-500 transition-all placeholder-slate-600 text-sm font-sans font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Telefone</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input type="text" placeholder="(00) 00000-0000" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                      className="w-full bg-[#090b11] border border-slate-800 text-white rounded-lg pl-10 pr-3.5 py-2.5 outline-none focus:border-orange-500 transition-all placeholder-slate-600 text-sm font-sans font-mono" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-slate-800 hover:bg-slate-900 text-slate-300 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-orange-600/10 active:scale-95">
                  {editId ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        )}

      {/* Modal Admins da Empresa */}
      {showAdminsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#131722] border border-slate-800 rounded-xl p-6 w-full max-w-lg shadow-2xl relative max-h-[85vh] overflow-y-auto animate-scaleIn">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                Admins Vinculados
              </h2>
              <button onClick={() => setShowAdminsModal(null)} className="text-slate-400 hover:text-white transition-colors text-lg">✕</button>
            </div>

            {/* Lista de admins vinculados */}
            <div className="space-y-2 mb-6">
              {adminsEmpresa.length === 0 && <p className="text-slate-500 text-sm py-2 text-center">Nenhum admin vinculado</p>}
              {adminsEmpresa.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-[#090b11] border border-slate-800/80 rounded-lg px-4 py-3 group/admin-row">
                  <div>
                    <p className="text-slate-200 text-sm font-semibold group-hover/admin-row:text-white transition-colors">{a.nome || a.email}</p>
                    <p className="text-slate-500 text-xs font-mono">{a.email} · <span className="text-orange-500 font-sans font-semibold">{a.role_empresa}</span></p>
                  </div>
                  <button onClick={() => desvincularAdmin(a.id)}
                    className="p-1.5 border border-slate-800 text-slate-400 rounded-lg hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all active:scale-95">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Vincular novo admin */}
            <div className="border-t border-slate-800/80 pt-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Vincular Admin</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <select value={vinculandoAdmin.admin_id}
                  onChange={(e) => setVinculandoAdmin({ ...vinculandoAdmin, admin_id: e.target.value })}
                  className="flex-1 bg-[#090b11] border border-slate-800 text-white rounded-lg px-3.5 py-2.5 outline-none focus:border-orange-500 text-sm transition-all">
                  <option value="">Selecione um admin...</option>
                  {todosAdmins.filter(a => !adminsEmpresa.find(ae => ae.id === a.id)).map(a => (
                    <option key={a.id} value={a.id}>{a.nome || a.email} ({a.role})</option>
                  ))}
                </select>
                <select value={vinculandoAdmin.role}
                  onChange={(e) => setVinculandoAdmin({ ...vinculandoAdmin, role: e.target.value })}
                  className="bg-[#090b11] border border-slate-800 text-white rounded-lg px-3.5 py-2.5 outline-none focus:border-orange-500 text-sm transition-all sm:w-32">
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="operator">Operator</option>
                </select>
                <button onClick={vincularAdmin}
                  className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-orange-600/10 active:scale-95 flex items-center justify-center">
                  Vincular
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </AdminLayout>
);
}
