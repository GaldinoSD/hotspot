import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import PageHeader from "../../components/admin/PageHeader";
import { Plus, Edit, Trash2, ShieldAlert, Users, UserCheck, Activity, Calendar, Mail, KeyRound, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({ email: "", senha: "" });
  const [editando, setEditando] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const token = localStorage.getItem("admin_token");

  const carregarUsuarios = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admins", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      console.error("Erro ao carregar admins:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editando ? `/api/admins/${editando}` : "/api/admins";
      const method = editando ? "PUT" : "POST";

      const payload = { email: form.email };
      if (!editando || form.senha) payload.senha = form.senha;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao salvar usuário");

      setShowModal(false);
      setEditando(null);
      setForm({ email: "", senha: "" });
      carregarUsuarios();
    } catch (err) {
      alert("Erro ao salvar usuário");
    }
  };

  const handleEditar = (admin) => {
    setEditando(admin.id);
    setForm({ email: admin.email, senha: "" });
    setShowModal(true);
  };

  const handleRemover = async (id) => {
    if (!confirm("Deseja remover este administrador?")) return;
    try {
      await fetch(`/api/admins/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      carregarUsuarios();
    } catch (err) {
      alert("Erro ao remover usuário");
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Administradores"
        subtitle="Gerenciamento de usuários administradores"
        icon={<ShieldAlert className="w-6 h-6 text-orange-500" />}
      >
        <button
          onClick={() => {
            setEditando(null);
            setForm({ email: "", senha: "" });
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-500 text-sm font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-orange-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Novo Admin
        </button>
      </PageHeader>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-fadeIn">
        <div className="bg-[#131722] border border-slate-800 rounded-xl p-5 flex items-center gap-4 hover:border-slate-700 transition-all duration-300">
          <div className="p-3 bg-orange-500/10 rounded-lg text-orange-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total de Admins</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">{usuarios.length}</h3>
          </div>
        </div>

        <div className="bg-[#131722] border border-slate-800 rounded-xl p-5 flex items-center gap-4 hover:border-slate-700 transition-all duration-300">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Sessão Atual</p>
            <h3 className="text-sm font-bold text-slate-100 mt-1 truncate" title={user?.email}>
              {user?.email || "Nenhum"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 capitalize">
              {user?.role === "super_admin" ? "Super Admin" : "Operador"}
            </p>
          </div>
        </div>

        <div className="bg-[#131722] border border-slate-800 rounded-xl p-5 flex items-center gap-4 hover:border-slate-700 transition-all duration-300">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Status do Painel</p>
            <h3 className="text-lg font-bold text-emerald-500 mt-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Ativo
            </h3>
          </div>
        </div>
      </div>

      {/* Tabela de Administradores */}
      <div className="bg-[#131722] rounded-xl border border-slate-800 overflow-hidden shadow-xl animate-fadeIn">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-800 bg-[#090b11]/50 text-slate-400 font-medium">
                <th className="p-4 pl-6">ID</th>
                <th className="p-4">E-mail</th>
                <th className="p-4">Data de Criação</th>
                <th className="p-4 pr-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">
                    <div className="flex justify-center items-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    </div>
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">
                    Nenhum administrador cadastrado.
                  </td>
                </tr>
              ) : (
                usuarios.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-850/30 transition-colors group">
                    <td className="p-4 pl-6">
                      <span className="font-mono text-xs bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                        #{a.id}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-200 font-medium group-hover:text-white transition-colors">
                          {a.email}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span>
                          {new Date(a.created_at).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditar(a)}
                          className="p-1.5 border border-slate-800 text-slate-400 rounded-lg hover:bg-slate-850 hover:text-white transition-all active:scale-95"
                          title="Editar Administrador"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemover(a.id)}
                          className="p-1.5 border border-slate-800 text-slate-400 rounded-lg hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all active:scale-95"
                          title="Remover Administrador"
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

      {/* Modal Criar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-[#131722] rounded-xl border border-slate-800 p-6 w-full max-w-md shadow-2xl relative animate-scaleIn">
            <h2 className="text-lg font-bold text-slate-100 mb-5 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-500" />
              {editando ? "Editar Administrador" : "Criar Administrador"}
            </h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="exemplo@email.com"
                    className="w-full bg-[#090b11] border border-slate-800 text-white rounded-lg pl-10 pr-3.5 py-2.5 outline-none focus:border-orange-500 transition-all placeholder-slate-600 text-sm font-sans"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Senha</span>
                  {editando && (
                    <span className="text-[10px] text-slate-500 normal-case font-normal">
                      (deixe em branco para manter)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required={!editando}
                    placeholder="••••••••"
                    className="w-full bg-[#090b11] border border-slate-800 text-white rounded-lg pl-10 pr-3.5 py-2.5 outline-none focus:border-orange-500 transition-all placeholder-slate-600 text-sm font-sans"
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-sm font-medium transition-colors text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold transition-all shadow-lg hover:shadow-orange-600/10 active:scale-95"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

