import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import PageHeader from "../../components/admin/PageHeader";

const API = import.meta.env.VITE_API_URL || "";

const MODULOS_LABELS = {
  dashboard: "Dashboard",
  mikrotiks: "Mikrotiks",
  vpn: "VPN WireGuard",
  portais: "Portais",
  planos: "Planos",
  clientes: "Clientes (LGPD)",
  leads: "Leads",
  radius: "Usuários RADIUS",
  pagamentos: "Pagamentos",
  sessoes: "Sessões Ativas",
  sessoeslog: "Log Radius",
  compliance: "Marco Civil",
  configuracoes: "Configurações",
  usuarios: "Usuários",
};

const ACOES = ["ver", "criar", "editar", "excluir"];
const ACOES_LABELS = { ver: "Ver", criar: "Criar", editar: "Editar", excluir: "Excluir" };

function emptyPermissoes() {
  return Object.keys(MODULOS_LABELS).map((m) => ({
    modulo: m,
    ver: false,
    criar: false,
    editar: false,
    excluir: false,
  }));
}

export default function GruposPermissao() {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nome: "", descricao: "", permissoes: emptyPermissoes() });
  const [erro, setErro] = useState(null);

  // Admins modal
  const [showAdminsModal, setShowAdminsModal] = useState(null);
  const [adminsGrupo, setAdminsGrupo] = useState([]);
  const [todosAdmins, setTodosAdmins] = useState([]);
  const [adminSelecionado, setAdminSelecionado] = useState("");

  const token = localStorage.getItem("admin_token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchGrupos = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/grupos-permissao`, { headers });
      if (res.ok) setGrupos(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGrupos(); }, [fetchGrupos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    try {
      const url = editId ? `${API}/api/grupos-permissao/${editId}` : `${API}/api/grupos-permissao`;
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      if (res.ok) {
        setShowModal(false);
        setEditId(null);
        setForm({ nome: "", descricao: "", permissoes: emptyPermissoes() });
        fetchGrupos();
      } else {
        const data = await res.json();
        setErro(data.message || "Erro ao salvar");
      }
    } catch (err) {
      setErro("Erro de conexão");
    }
  };

  const handleEdit = async (grupo) => {
    try {
      const res = await fetch(`${API}/api/grupos-permissao/${grupo.id}`, { headers });
      const data = await res.json();
      const perms = emptyPermissoes().map((p) => {
        const found = data.permissoes?.find((dp) => dp.modulo === p.modulo);
        return found ? { ...p, ver: !!found.ver, criar: !!found.criar, editar: !!found.editar, excluir: !!found.excluir } : p;
      });
      setEditId(grupo.id);
      setForm({ nome: data.nome, descricao: data.descricao || "", permissoes: perms });
      setShowModal(true);
    } catch (err) {
      alert("Erro ao carregar grupo");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deletar este grupo de permissão?")) return;
    await fetch(`${API}/api/grupos-permissao/${id}`, { method: "DELETE", headers });
    fetchGrupos();
  };

  const togglePerm = (modulo, acao) => {
    setForm((prev) => ({
      ...prev,
      permissoes: prev.permissoes.map((p) =>
        p.modulo === modulo ? { ...p, [acao]: !p[acao] } : p
      ),
    }));
  };

  const toggleAllModulo = (modulo) => {
    const perm = form.permissoes.find((p) => p.modulo === modulo);
    const allChecked = ACOES.every((a) => perm[a]);
    setForm((prev) => ({
      ...prev,
      permissoes: prev.permissoes.map((p) =>
        p.modulo === modulo ? { ...p, ver: !allChecked, criar: !allChecked, editar: !allChecked, excluir: !allChecked } : p
      ),
    }));
  };

  const toggleAllAcao = (acao) => {
    const allChecked = form.permissoes.every((p) => p[acao]);
    setForm((prev) => ({
      ...prev,
      permissoes: prev.permissoes.map((p) => ({ ...p, [acao]: !allChecked })),
    }));
  };

  // Admins
  const openAdminsModal = async (grupoId) => {
    setShowAdminsModal(grupoId);
    const [admRes, todosRes] = await Promise.all([
      fetch(`${API}/api/grupos-permissao/${grupoId}/admins`, { headers }),
      fetch(`${API}/api/grupos-permissao/admins/todos`, { headers }),
    ]);
    setAdminsGrupo(await admRes.json());
    setTodosAdmins(await todosRes.json());
  };

  const vincularAdmin = async () => {
    if (!adminSelecionado) return;
    await fetch(`${API}/api/grupos-permissao/${showAdminsModal}/vincular-admin`, {
      method: "POST", headers, body: JSON.stringify({ admin_id: adminSelecionado })
    });
    setAdminSelecionado("");
    openAdminsModal(showAdminsModal);
  };

  const desvincularAdmin = async (adminId) => {
    if (!confirm("Remover este admin do grupo?")) return;
    await fetch(`${API}/api/grupos-permissao/${showAdminsModal}/desvincular-admin/${adminId}`, { method: "DELETE", headers });
    openAdminsModal(showAdminsModal);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Grupos de Permissão"
          subtitle={`${grupos.length} grupo(s) cadastrado(s)`}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          }
        >
          <button
            onClick={() => { setEditId(null); setForm({ nome: "", descricao: "", permissoes: emptyPermissoes() }); setErro(null); setShowModal(true); }}
            className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-500 text-sm font-medium flex items-center gap-2 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
            Novo Grupo
          </button>
        </PageHeader>

        {/* Table */}
        {loading ? (
          <p className="text-gray-500 text-center py-10">Carregando...</p>
        ) : (
          <div className="bg-[#1a1d27] border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="text-left px-5 py-3 font-medium">Nome</th>
                  <th className="text-left px-5 py-3 font-medium">Descrição</th>
                  <th className="text-center px-5 py-3 font-medium">Admins</th>
                  <th className="text-right px-5 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((g) => (
                  <tr key={g.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{g.nome}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">{g.descricao || "—"}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded text-xs">{g.total_admins || 0}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openAdminsModal(g.id)} className="px-2.5 py-1.5 bg-cyan-600/20 text-cyan-400 rounded-lg text-xs hover:bg-cyan-600/30">👥</button>
                        <button onClick={() => handleEdit(g)} className="px-2.5 py-1.5 bg-yellow-600/20 text-yellow-400 rounded-lg text-xs hover:bg-yellow-600/30">Editar</button>
                        <button onClick={() => handleDelete(g.id)} className="px-2.5 py-1.5 bg-red-600/20 text-red-400 rounded-lg text-xs hover:bg-red-600/30">Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Criar/Editar */}
        {showModal && (
          <div className="modal-overlay">
            <form onSubmit={handleSubmit} className="modal-container max-w-2xl">
              <div className="modal-header">
                <h3 className="modal-title">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {editId ? "Editar Grupo de Permissão" : "Novo Grupo de Permissão"}
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

              <div className="modal-body space-y-4">
                {erro && <p className="text-red-400 text-xs font-semibold mb-3 bg-red-950/20 border border-red-900/30 p-2.5 rounded-xl">{erro}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Nome *</label>
                    <input type="text" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      className="w-full px-4 py-2.5 text-white rounded-xl focus:outline-none text-xs transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Descrição</label>
                    <input type="text" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                      className="w-full px-4 py-2.5 text-white rounded-xl focus:outline-none text-xs transition-all" />
                  </div>
                </div>

                {/* Grid de Permissões */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Permissões por Módulo</label>
                  <div className="bg-[#151724] border border-[#323652] rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#181a25] border-b border-[#26293c] text-gray-400 font-semibold">
                        <tr>
                          <th className="px-4 py-2.5 font-semibold">Módulo</th>
                          {ACOES.map((a) => (
                            <th key={a} className="text-center px-2 py-2.5 font-semibold cursor-pointer hover:text-white" onClick={() => toggleAllAcao(a)}>
                              {ACOES_LABELS[a]}
                            </th>
                          ))}
                          <th className="text-center px-2 py-2.5 font-semibold text-gray-500">Todos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/40 text-gray-300">
                        {form.permissoes.map((p) => (
                          <tr key={p.modulo} className="hover:bg-gray-850/5 transition-colors">
                            <td className="px-4 py-2.5 text-white font-medium">{MODULOS_LABELS[p.modulo]}</td>
                            {ACOES.map((a) => (
                              <td key={a} className="text-center px-2 py-2.5">
                                <input
                                  type="checkbox"
                                  checked={p[a]}
                                  onChange={() => togglePerm(p.modulo, a)}
                                  className="w-4 h-4 rounded border-gray-650 bg-gray-850 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer"
                                />
                              </td>
                            ))}
                            <td className="text-center px-2 py-2.5">
                              <button type="button" onClick={() => toggleAllModulo(p.modulo)}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                  ACOES.every((a) => p[a])
                                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 hover:bg-emerald-950/60"
                                    : "bg-gray-950/40 text-gray-500 border border-gray-900/30 hover:bg-gray-900/50"
                                }`}>
                                {ACOES.every((a) => p[a]) ? "✓" : "—"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-transparent hover:bg-gray-900 border border-gray-800 text-gray-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer">
                  {editId ? "Salvar Alterações" : "Criar Grupo"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal Admins do Grupo */}
        {showAdminsModal && (
          <div className="modal-overlay">
            <div className="modal-container max-w-lg">
              <div className="modal-header">
                <h3 className="modal-title">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 01-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Admins do Grupo
                </h3>
                <button onClick={() => setShowAdminsModal(null)} className="modal-close-btn" title="Fechar">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="modal-body space-y-4">
                <div className="space-y-2">
                  {adminsGrupo.length === 0 && <p className="text-gray-500 text-xs text-center py-4">Nenhum admin vinculado</p>}
                  {adminsGrupo.map((a) => (
                    <div key={a.id} className="flex items-center justify-between bg-[#151724] border border-[#323652]/50 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-white text-xs font-semibold">{a.nome || a.email}</p>
                        <p className="text-gray-500 text-[10px] mt-0.5">{a.email} · <span className="text-emerald-400">{a.role}</span></p>
                      </div>
                      <button onClick={() => desvincularAdmin(a.id)}
                        className="px-2.5 py-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-900/30 rounded-lg text-[10px] font-semibold transition-colors">
                        Remover
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#26293c] pt-4">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Vincular Admin</h4>
                  <div className="flex gap-2">
                    <select value={adminSelecionado}
                      onChange={(e) => setAdminSelecionado(e.target.value)}
                      className="flex-1 px-4 py-2 text-white rounded-xl focus:outline-none text-xs transition-all cursor-pointer">
                      <option value="">Selecione um admin...</option>
                      {todosAdmins.filter((a) => !adminsGrupo.find((ag) => ag.id === a.id)).map((a) => (
                        <option key={a.id} value={a.id}>{a.nome || a.email} ({a.role})</option>
                      ))}
                    </select>
                    <button onClick={vincularAdmin}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs px-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer">
                      Vincular
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={() => setShowAdminsModal(null)} className="px-4 py-2 bg-transparent hover:bg-gray-900 border border-gray-800 text-gray-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
