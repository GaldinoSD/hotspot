import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { 
  Building2, Cpu, Users, Shield, ArrowRight, 
  RefreshCw, Database, Upload, LogOut, LayoutDashboard,
  ExternalLink, ChevronRight, Plus, Edit3, Trash2,
  Mail, Hash, Search, ArrowLeft, RotateCcw,
  CheckCircle2, AlertCircle, HardDrive, FileArchive,
  Clock, AlertTriangle, FileText, Loader2, XCircle, X
} from "lucide-react";

// ─── EMPRESAS MODAL ─────────────────────────────────────────────────────────
function EmpresasModal({ open, onClose }) {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nome: "", cnpj: "", email: "", telefone: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("admin_token");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => { if (open) fetchEmpresas(); }, [open]);

  const fetchEmpresas = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/empresas", { headers });
      if (res.ok) setEmpresas(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editId ? `/api/empresas/${editId}` : "/api/empresas";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      if (res.ok) {
        setShowForm(false); setEditId(null);
        setForm({ nome: "", cnpj: "", email: "", telefone: "" });
        fetchEmpresas();
      }
    } catch (err) { console.error(err); }
  };

  const handleEdit = (empresa) => {
    setEditId(empresa.id);
    setForm({ nome: empresa.nome, cnpj: empresa.cnpj || "", email: empresa.email, telefone: empresa.telefone || "" });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Deseja realmente deletar esta empresa?")) return;
    try {
      await fetch(`/api/empresas/${id}`, { method: "DELETE", headers });
      fetchEmpresas();
    } catch (err) { console.error(err); }
  };

  const filtered = empresas.filter(e =>
    !searchTerm ||
    e.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d27] rounded-2xl border border-gray-700 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-800/30 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Gerenciar Empresas</h3>
              <p className="text-[10px] text-gray-500">{empresas.length} empresa(s) cadastrada(s)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditId(null); setForm({ nome: "", cnpj: "", email: "", telefone: "" }); setShowForm(true); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Nova Empresa
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-800/60 flex-shrink-0">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text" placeholder="Buscar empresa..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 text-white rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none transition-all placeholder-gray-600"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-7 h-7 border-3 border-gray-700 border-t-blue-500 rounded-full animate-spin" style={{borderWidth:'3px'}}></div>
              <span className="ml-3 text-sm text-gray-500">Carregando...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10"><Building2 className="w-8 h-8 text-gray-700 mx-auto mb-2"/><p className="text-gray-500 text-sm">Nenhuma empresa encontrada.</p></div>
          ) : filtered.map((e) => (
            <div key={e.id} className="bg-[#0d1117] border border-gray-800 rounded-xl p-4 hover:border-gray-700/80 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/15 border border-blue-800/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-400">{e.nome?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-white truncate">{e.nome}</h4>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${e.ativo ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' : 'bg-red-950/40 text-red-400 border-red-800/40'}`}>
                        <span className={`w-1 h-1 rounded-full ${e.ativo ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                        {e.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 text-[10px] text-gray-500">
                      <span>{e.email}</span>
                      <span className="font-mono text-gray-600">slug: {e.slug}</span>
                      {e.cnpj && <span>{e.cnpj}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {[['mikrotiks', e.total_mikrotiks], ['planos', e.total_planos], ['admins', e.total_admins]].map(([label, val]) => (
                        <span key={label} className="text-[9px] text-gray-500">
                          <span className="px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700/50 font-bold text-gray-400 mr-1">{val || 0}</span>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Link to={`/admin/${e.slug}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600/15 text-blue-400 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border border-blue-800/30 hover:bg-blue-600/25">
                    <ExternalLink className="w-2.5 h-2.5" /> Acessar
                  </Link>
                  <button onClick={() => handleEdit(e)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-600/10 text-amber-400 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border border-amber-800/30 hover:bg-amber-600/20 cursor-pointer">
                    <Edit3 className="w-2.5 h-2.5" /> Editar
                  </button>
                  {e.slug !== 'default' && (
                    <button onClick={() => handleDelete(e.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-600/10 text-red-400 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border border-red-900/30 hover:bg-red-600/20 cursor-pointer">
                      <Trash2 className="w-2.5 h-2.5" /> Deletar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Form Sub-Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-[#1a1d27] rounded-2xl border border-gray-700 w-full max-w-md p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-5 pb-2 border-b border-gray-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  {editId ? "Editar Empresa" : "Nova Empresa"}
                </h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white transition-colors"><X className="w-4 h-4"/></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">Nome</label>
                  <input type="text" required placeholder="Ex: Empresa ABC" value={form.nome} onChange={(e) => setForm({...form, nome: e.target.value})}
                    className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">Email</label>
                  <input type="email" required placeholder="contato@empresa.com" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                    className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">CNPJ</label>
                    <input type="text" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={(e) => setForm({...form, cnpj: e.target.value})}
                      className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-wider">Telefone</label>
                    <input type="text" placeholder="(00) 00000-0000" value={form.telefone} onChange={(e) => setForm({...form, telefone: e.target.value})}
                      className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-800/80">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-800 hover:bg-[#151821] text-gray-300 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer">{editId ? "Salvar" : "Criar"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BACKUPS MODAL ──────────────────────────────────────────────────────────
function BackupsModal({ open, onClose }) {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const token = localStorage.getItem("admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { if (open) fetchBackups(); }, [open]);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system-backup", { headers });
      if (res.ok) { const data = await res.json(); setBackups(Array.isArray(data) ? data : data.backups || []); }
      else setMessage({ type: "error", text: "Erro ao carregar backups." });
    } catch { setMessage({ type: "error", text: "Erro de conexão." }); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setActionLoading(true); setMessage(null);
    try {
      const res = await fetch("/api/system-backup", { method: "POST", headers });
      const data = await res.json();
      if (res.ok) { setMessage({ type: "success", text: "Backup criado com sucesso!" }); fetchBackups(); }
      else setMessage({ type: "error", text: data.error || "Erro ao criar backup." });
    } catch { setMessage({ type: "error", text: "Erro de conexão." }); }
    finally { setActionLoading(false); }
  };

  const handleRestore = async (backup) => {
    if (!confirm(`Restaurar backup "${backup.id}"?\nOs dados atuais serão sobrescritos.`)) return;
    setActionLoading(true); setMessage(null);
    try {
      const res = await fetch(`/api/system-backup/restore/${backup.id}`, { method: "POST", headers });
      const data = await res.json();
      if (res.ok) { setMessage({ type: "success", text: "Restauração iniciada! Recarregando em 10s..." }); setTimeout(() => window.location.reload(), 10000); }
      else setMessage({ type: "error", text: data.error || "Erro ao restaurar." });
    } catch { setMessage({ type: "error", text: "Erro de conexão." }); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (backup) => {
    if (!confirm(`Remover backup "${backup.id}"?`)) return;
    setActionLoading(true); setMessage(null);
    try {
      const res = await fetch(`/api/system-backup/${backup.id}`, { method: "DELETE", headers });
      const data = await res.json();
      if (res.ok) { setMessage({ type: "success", text: "Backup removido!" }); fetchBackups(); }
      else setMessage({ type: "error", text: data.error || "Erro ao remover." });
    } catch { setMessage({ type: "error", text: "Erro de conexão." }); }
    finally { setActionLoading(false); }
  };

  const formatDate = (d) => { if (!d) return "—"; try { return new Date(d).toLocaleString("pt-BR"); } catch { return d; } };
  const hasFiles = (b) => b.db_exists !== false && b.files_exists !== false;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d27] rounded-2xl border border-gray-700 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-800/30 flex items-center justify-center"><Database className="w-4 h-4 text-amber-400" /></div>
            <div>
              <h3 className="text-base font-bold text-white">Backups do Sistema</h3>
              <p className="text-[10px] text-gray-500">Gerencie backups de banco e arquivos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCreate} disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer">
              <Plus className="w-3 h-3" /> {actionLoading ? "Aguarde..." : "Criar Backup"}
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
          {message && (
            <div className={`rounded-xl p-3 border flex items-center gap-2 text-xs ${message.type === "success" ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-400" : "bg-red-950/20 border-red-800/40 text-red-400"}`}>
              {message.type === "success" ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="w-7 h-7 border-3 border-gray-700 border-t-blue-500 rounded-full animate-spin" style={{borderWidth:'3px'}}></div><span className="ml-3 text-sm text-gray-500">Carregando...</span></div>
          ) : backups.length === 0 ? (
            <div className="text-center py-10"><Database className="w-8 h-8 text-gray-700 mx-auto mb-2"/><p className="text-gray-500 text-sm">Nenhum backup encontrado.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#11141e]">
                  <tr className="border-b border-gray-800">
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Update</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">DB</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Arquivos</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {backups.map((b) => {
                    const tipo = b.tipo || b.type;
                    const isPre = tipo === "pre_update" || tipo === "pre-atualizacao" || tipo === "pre_atualizacao";
                    const ok = hasFiles(b);
                    return (
                      <tr key={b.id} className="hover:bg-[#1f2330]/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${isPre ? 'bg-cyan-950/40 text-cyan-400 border-cyan-800/40' : 'bg-gray-800/60 text-gray-400 border-gray-700/40'}`}>
                            {isPre ? <><RotateCcw className="w-2.5 h-2.5"/>Pré-Atualização</> : <><HardDrive className="w-2.5 h-2.5"/>Manual</>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[10px] text-gray-500 font-mono">{b.update_id || "—"}</td>
                        <td className="px-4 py-3 text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5 text-gray-600"/>{formatDate(b.criado_em || b.created_at || b.date)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${b.db_exists !== false ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' : 'bg-red-950/40 text-red-400 border-red-800/40'}`}>
                            {b.db_exists !== false ? <><CheckCircle2 className="w-2.5 h-2.5"/>OK</> : <><AlertCircle className="w-2.5 h-2.5"/>—</>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${ok ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' : 'bg-gray-800/60 text-gray-500 border-gray-700/40'}`}>
                            {ok ? <><CheckCircle2 className="w-2.5 h-2.5"/>OK</> : <><AlertCircle className="w-2.5 h-2.5"/>—</>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => handleRestore(b)} disabled={actionLoading || !ok}
                              className="px-2.5 py-1 bg-amber-600/10 text-amber-400 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border border-amber-800/30 hover:bg-amber-600/20 disabled:opacity-40 cursor-pointer">Restaurar</button>
                            <button onClick={() => handleDelete(b)} disabled={actionLoading}
                              className="px-2.5 py-1 bg-red-600/10 text-red-400 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border border-red-900/30 hover:bg-red-600/20 disabled:opacity-40 cursor-pointer">Remover</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Emergency */}
          <div className="bg-[#0d1117] border border-amber-900/25 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-bold text-xs mb-1">Acesso de Emergência</p>
              <code className="text-[10px] text-amber-300 font-mono bg-black/40 px-2 py-1 rounded">http://servidor:3001/emergency</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ATUALIZAR SISTEMA MODAL ────────────────────────────────────────────────
function AtualizarModal({ open, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [updates, setUpdates] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [doneMsg, setDoneMsg] = useState("");
  const [applyProgress, setApplyProgress] = useState({ current: 0, total: 0 });
  const [lastAppliedId, setLastAppliedId] = useState(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsData, setLogsData] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const reloadTimerRef = useRef(null);

  useEffect(() => { return () => { if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current); }; }, []);
  useEffect(() => { if (open) { setStep("email"); setErrorMsg(""); setDoneMsg(""); setUpdates([]); } }, [open]);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStep("checking");
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/system-update/check", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ email: email.trim() }) });
      const data = await res.json();
      if (!res.ok || !data.authorized) { setErrorMsg(data.message || "Assinatura não autorizada."); setStep("error"); return; }
      if (!data.updates || data.updates.length === 0) { setDoneMsg("Sistema já está na versão mais recente."); setStep("done"); return; }
      setUpdates(data.updates); setStep("updates");
    } catch { setErrorMsg("Erro ao verificar atualizações."); setStep("error"); }
  };

  const fetchLogs = async (updateId) => {
    setLogsLoading(true); setLogsData([]); setLogsOpen(true);
    try {
      const token = localStorage.getItem("admin_token");
      const url = updateId ? `/api/system-update/logs?update_id=${encodeURIComponent(updateId)}` : "/api/system-update/logs";
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => ({}));
      setLogsData(res.ok ? (Array.isArray(data.logs) ? data.logs : []) : [{ id:0, step:"error", status:"erro", message: data.message || "Falha", criado_em: new Date().toISOString() }]);
    } catch { setLogsData([{ id:0, step:"error", status:"erro", message:"Erro de conexão", criado_em: new Date().toISOString() }]); }
    finally { setLogsLoading(false); }
  };

  const handleApply = async () => {
    setStep("applying");
    const total = updates.length;
    setApplyProgress({ current: 0, total });
    const token = localStorage.getItem("admin_token");

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      setApplyProgress({ current: i + 1, total });
      setLastAppliedId(update.id);
      const isLast = i === updates.length - 1;
      try {
        const res = await fetch("/api/system-update/apply", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ email: email.trim(), update_id: update.id }) });
        let data = null;
        try { data = await res.json(); } catch {
          if (isLast) { setDoneMsg("Atualização aplicada! Servidor reiniciado. Recarregando..."); setStep("done"); reloadTimerRef.current = setTimeout(() => window.location.reload(), 8000); return; }
          setErrorMsg(`Conexão perdida ao aplicar ${update.id}.`); setStep("error"); return;
        }
        if (!res.ok || !data.success) {
          if (isLast && data?.applied) { setDoneMsg(data.message || "Sucesso! Recarregando em 8s."); setStep("done"); reloadTimerRef.current = setTimeout(() => window.location.reload(), 8000); return; }
          setErrorMsg(data?.message || `Falha ao aplicar "${update.descricao}".`); setStep("error"); return;
        }
        if (isLast) { setDoneMsg(data.message || "Todas aplicadas com sucesso! Recarregando em 8s."); setStep("done"); reloadTimerRef.current = setTimeout(() => window.location.reload(), 8000); return; }
      } catch {
        if (isLast) { setDoneMsg("Atualização aplicada! Servidor reiniciado."); setStep("done"); reloadTimerRef.current = setTimeout(() => window.location.reload(), 8000); return; }
        setErrorMsg(`Erro de conexão ao aplicar "${update.descricao}".`); setStep("error"); return;
      }
    }
  };

  const progressPercent = applyProgress.total > 0 ? Math.round((applyProgress.current / applyProgress.total) * 100) : 0;
  const formatDate = (d) => { if (!d) return ""; try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; } };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d27] rounded-2xl border border-gray-700 w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-800/30 flex items-center justify-center"><RefreshCw className="w-4 h-4 text-blue-400" /></div>
            <div>
              <h3 className="text-base font-bold text-white">Atualizar Sistema</h3>
              <p className="text-[10px] text-gray-500">Verifique e aplique atualizações</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
          {step === "email" && (
            <form onSubmit={handleCheck} className="space-y-4">
              <p className="text-sm text-gray-400">Informe o email Hotmart para validar sua assinatura.</p>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Hotmart</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required
                  className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none text-sm" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow-md cursor-pointer">Verificar Atualizações</button>
            </form>
          )}

          {step === "checking" && (
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="w-14 h-14 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="text-center"><p className="text-white font-bold">Verificando...</p><p className="text-gray-500 text-sm">Validando assinatura</p></div>
            </div>
          )}

          {step === "updates" && (
            <div className="space-y-4">
              <div className="bg-blue-600/8 border border-blue-800/30 rounded-xl p-3 flex items-start gap-2">
                <Database className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-blue-300 text-xs">Um backup automático será criado antes de aplicar.</p>
              </div>
              <div className="bg-[#0d1117] border border-gray-800 rounded-xl divide-y divide-gray-800/60">
                <div className="px-4 py-3 flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 text-blue-400"/><span className="text-white font-bold text-xs">{updates.length} atualização(ões)</span></div>
                {updates.map((u, idx) => (
                  <div key={u.id} className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-blue-600/15 text-blue-400 text-[10px] flex items-center justify-center font-bold border border-blue-800/30">{idx+1}</span>
                      <div><p className="text-white text-xs font-medium">{u.descricao}</p>{u.changelog && <p className="text-gray-500 text-[10px] mt-1">{u.changelog}</p>}</div>
                    </div>
                    <span className="text-[9px] text-gray-600 font-mono">{u.id}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep("email")} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider border border-gray-700 cursor-pointer">Cancelar</button>
                <button onClick={handleApply} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md cursor-pointer">Aplicar Todas</button>
              </div>
            </div>
          )}

          {step === "applying" && (
            <div className="space-y-5 py-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin flex-shrink-0" />
                <div><p className="text-white font-bold text-sm">Aplicando...</p><p className="text-gray-500 text-xs">{applyProgress.current} de {applyProgress.total}</p></div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-gray-500 mb-1.5"><span>{applyProgress.current}/{applyProgress.total}</span><span className="font-mono font-bold">{progressPercent}%</span></div>
                <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden"><div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-2.5 rounded-full transition-all duration-500" style={{width:`${progressPercent}%`}}></div></div>
              </div>
              <div className="bg-amber-600/8 border border-amber-800/30 rounded-xl p-3 flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5"/><p className="text-amber-300 text-xs">Não feche esta janela.</p></div>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-5 py-4">
              <div className="bg-emerald-600/8 border border-emerald-800/30 rounded-xl p-5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div><p className="text-emerald-300 font-bold">Sucesso!</p><p className="text-emerald-400/80 text-sm mt-1">{doneMsg}</p></div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => window.location.reload()} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer"><RefreshCw className="w-3 h-3"/>Recarregar</button>
                <button onClick={() => fetchLogs(lastAppliedId)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600/15 text-blue-400 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-blue-800/30 cursor-pointer"><FileText className="w-3 h-3"/>Logs</button>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="space-y-5 py-4">
              <div className="bg-red-600/8 border border-red-800/30 rounded-xl p-5 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div><p className="text-red-300 font-bold">Erro</p><p className="text-red-400/80 text-sm mt-1">{errorMsg}</p></div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => {setStep("email");setErrorMsg("");}} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer"><RefreshCw className="w-3 h-3"/>Tentar Novamente</button>
                <button onClick={() => fetchLogs(lastAppliedId)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600/15 text-blue-300 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-blue-800/30 cursor-pointer"><FileText className="w-3 h-3"/>Ver Logs</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logs sub-modal */}
      {logsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setLogsOpen(false)}>
          <div className="bg-[#1a1d27] border border-gray-700 rounded-2xl p-5 max-w-2xl w-full max-h-[75vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-800">
              <h3 className="text-white font-bold text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-blue-400"/>Logs {lastAppliedId && <span className="text-[10px] text-gray-500 font-mono">#{lastAppliedId}</span>}</h3>
              <button onClick={() => setLogsOpen(false)} className="text-gray-500 hover:text-gray-300"><X className="w-4 h-4"/></button>
            </div>
            <div className="flex-1 overflow-y-auto bg-[#0d1117] border border-gray-800 rounded-xl p-3 font-mono text-[10px]">
              {logsLoading ? <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-3.5 h-3.5 animate-spin"/>Carregando...</div> :
               logsData.length === 0 ? <p className="text-gray-500">Nenhum log encontrado.</p> :
               <div className="space-y-1">{logsData.map(l => {
                 const c = l.status === "erro" ? "text-red-400" : l.status === "ok" ? "text-emerald-400" : "text-blue-400";
                 return <div key={l.id} className="flex gap-2"><span className="text-gray-600 shrink-0">{new Date(l.criado_em).toLocaleTimeString("pt-BR")}</span><span className={`shrink-0 w-12 ${c}`}>[{l.status}]</span><span className="text-gray-300 break-all">{l.message}</span></div>;
               })}</div>}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => fetchLogs(lastAppliedId)} className="px-3 py-1.5 bg-blue-600/15 text-blue-300 rounded-lg text-[10px] font-bold uppercase border border-blue-800/30 cursor-pointer">Recarregar</button>
              <button onClick={() => setLogsOpen(false)} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-[10px] font-bold uppercase border border-gray-700 cursor-pointer">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PUBLICAR ATUALIZAÇÃO MODAL (placeholder) ──────────────────────────────
function PublicarModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1d27] rounded-2xl border border-gray-700 w-full max-w-md p-8 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-800/30 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-6 h-6 text-cyan-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Publicar Atualização</h3>
        <p className="text-gray-500 text-sm mb-6">Este módulo está temporariamente desabilitado.</p>
        <button onClick={onClose} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold uppercase tracking-wider border border-gray-700 cursor-pointer">Fechar</button>
      </div>
    </div>
  );
}

// ─── SUPER DASHBOARD ────────────────────────────────────────────────────────
export default function SuperDashboard() {
  const { user, isSuperAdmin, logout, switchEmpresa } = useAuth();
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showEmpresas, setShowEmpresas] = useState(false);
  const [showBackups, setShowBackups] = useState(false);
  const [showAtualizar, setShowAtualizar] = useState(false);
  const [showPublicar, setShowPublicar] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate(`/admin/${user?.empresa_slug || 'default'}`);
      return;
    }
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/empresas", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setEmpresas(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const quickActions = [
    { label: "Gerenciar Empresas", icon: Building2, color: "emerald", desc: "Criar, editar e remover empresas", onClick: () => setShowEmpresas(true) },
    { label: "Atualizar Sistema", icon: RefreshCw, color: "blue", desc: "Verificar e aplicar atualizações", onClick: () => setShowAtualizar(true) },
    { label: "Backups", icon: Database, color: "amber", desc: "Backup e restauração do sistema", onClick: () => setShowBackups(true) },
    { label: "Publicar Atualização", icon: Upload, color: "cyan", desc: "Publicar nova versão para clientes", onClick: () => setShowPublicar(true) },
  ];

  const colorMap = {
    emerald: { border: "border-emerald-800/30", hover: "hover:border-emerald-600/50", icon: "text-emerald-400", iconBg: "bg-emerald-500/10", arrow: "text-emerald-500" },
    blue: { border: "border-blue-800/30", hover: "hover:border-blue-600/50", icon: "text-blue-400", iconBg: "bg-blue-500/10", arrow: "text-blue-500" },
    amber: { border: "border-amber-800/30", hover: "hover:border-amber-600/50", icon: "text-amber-400", iconBg: "bg-amber-500/10", arrow: "text-amber-500" },
    cyan: { border: "border-cyan-800/30", hover: "hover:border-cyan-600/50", icon: "text-cyan-400", iconBg: "bg-cyan-500/10", arrow: "text-cyan-500" },
  };

  return (
    <div className="min-h-screen bg-[#0f111a] text-gray-300">
      {/* Top Bar */}
      <div className="border-b border-gray-800/80 bg-[#13161f]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-700/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Super Admin</h1>
              <p className="text-[11px] text-gray-500 font-medium">Centro de Controle da Plataforma</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/admin/${user?.empresa_slug || 'default'}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600/15 text-blue-400 border border-blue-800/30 rounded-xl hover:bg-blue-600/25 hover:border-blue-700/50 text-xs font-bold uppercase tracking-wider transition-all duration-200">
              <LayoutDashboard className="w-3.5 h-3.5" /> Meu Painel
            </Link>
            <button onClick={() => { logout(); navigate("/"); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600/10 text-red-400 border border-red-900/30 rounded-xl hover:bg-red-600/20 hover:border-red-800/50 text-xs font-bold uppercase tracking-wider transition-all duration-200">
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold text-white">Olá, {user?.nome?.split(' ')[0] || 'Admin'} 👋</h2>
          <p className="text-sm text-gray-500 mt-1">Visão geral de todas as empresas e recursos do sistema.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-gradient-to-br from-[#1b1e2c] to-[#121420] rounded-2xl border border-blue-900/25 p-6 shadow-lg relative overflow-hidden group hover:border-blue-700/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/5 rounded-full blur-2xl transform translate-x-6 -translate-y-6"></div>
            <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total de Empresas</span><div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400"><Building2 className="w-4 h-4" /></div></div>
            <div className="mt-4"><div className="text-4xl font-extrabold text-white group-hover:scale-[1.02] transition-transform duration-200">{empresas.length}</div><div className="text-[10px] text-gray-500 mt-1.5">Empresas ativas na plataforma</div></div>
          </div>
          <div className="bg-gradient-to-br from-[#24221b] to-[#141416] rounded-2xl border border-amber-900/25 p-6 shadow-lg relative overflow-hidden group hover:border-amber-700/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl transform translate-x-6 -translate-y-6"></div>
            <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total de MikroTiks</span><div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400"><Cpu className="w-4 h-4" /></div></div>
            <div className="mt-4"><div className="text-4xl font-extrabold text-amber-400 group-hover:scale-[1.02] transition-transform duration-200">{empresas.reduce((acc, e) => acc + (e.total_mikrotiks || 0), 0)}</div><div className="text-[10px] text-gray-500 mt-1.5">Roteadores cadastrados</div></div>
          </div>
          <div className="bg-gradient-to-br from-[#122220] to-[#0e171b] rounded-2xl border border-emerald-900/25 p-6 shadow-lg relative overflow-hidden group hover:border-emerald-700/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl transform translate-x-6 -translate-y-6"></div>
            <div className="flex items-center justify-between"><span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total de Admins</span><div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400"><Users className="w-4 h-4" /></div></div>
            <div className="mt-4"><div className="text-4xl font-extrabold text-emerald-400 group-hover:scale-[1.02] transition-transform duration-200">{empresas.reduce((acc, e) => acc + (e.total_admins || 0), 0)}</div><div className="text-[10px] text-gray-500 mt-1.5">Administradores</div></div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>Ações Rápidas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const c = colorMap[action.color];
              const Icon = action.icon;
              return (
                <button key={action.label} onClick={action.onClick}
                  className={`group relative rounded-2xl border ${c.border} ${c.hover} bg-[#1a1d27] p-5 transition-all duration-300 hover:shadow-lg text-left cursor-pointer w-full`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${c.iconBg}`}><Icon className={`w-5 h-5 ${c.icon}`} /></div>
                    <ChevronRight className={`w-4 h-4 ${c.arrow} opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200`} />
                  </div>
                  <p className="text-sm font-bold text-white mb-1">{action.label}</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{action.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Empresas Table */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Building2 className="w-4 h-4 text-blue-400" /></div>
              <div><h2 className="text-base font-bold text-white">Empresas Cadastradas</h2><p className="text-[10px] text-gray-500 mt-0.5">{empresas.length} empresa(s)</p></div>
            </div>
            <button onClick={() => setShowEmpresas(true)}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-400 uppercase tracking-wider hover:text-blue-300 transition-colors cursor-pointer">
              Gerenciar <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-3 border-gray-700 border-t-blue-500 rounded-full animate-spin" style={{borderWidth:'3px'}}></div><span className="ml-3 text-sm text-gray-500">Carregando...</span></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#11141e]">
                  <tr className="border-b border-gray-800">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Empresa</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Slug</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">MikroTiks</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Planos</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Admins</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider pr-8">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {empresas.map((e) => (
                    <tr key={e.id} className="hover:bg-[#1f2330]/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600/20 to-blue-700/10 border border-blue-800/30 flex items-center justify-center"><span className="text-xs font-bold text-blue-400">{e.nome?.charAt(0)?.toUpperCase()}</span></div>
                          <span className="font-bold text-white">{e.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500">{e.slug}</td>
                      <td className="px-6 py-4 text-center font-bold text-gray-300">{e.total_mikrotiks || 0}</td>
                      <td className="px-6 py-4 text-center font-bold text-gray-300">{e.total_planos || 0}</td>
                      <td className="px-6 py-4 text-center font-bold text-gray-300">{e.total_admins || 0}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${e.ativo ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' : 'bg-red-950/40 text-red-400 border-red-800/40'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${e.ativo ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                          {e.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right pr-6">
                        <button onClick={async () => { try { await switchEmpresa(e.id); window.location.href = `/admin/${e.slug}`; } catch { window.location.href = `/admin/${e.slug}`; } }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 hover:text-blue-300 text-xs font-bold uppercase tracking-wider transition-all rounded-xl border border-blue-800/30 hover:border-blue-700/50 cursor-pointer">
                          <ExternalLink className="w-3 h-3" /> Acessar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <EmpresasModal open={showEmpresas} onClose={() => { setShowEmpresas(false); fetchEmpresas(); }} />
      <BackupsModal open={showBackups} onClose={() => setShowBackups(false)} />
      <AtualizarModal open={showAtualizar} onClose={() => setShowAtualizar(false)} />
      <PublicarModal open={showPublicar} onClose={() => setShowPublicar(false)} />
    </div>
  );
}
