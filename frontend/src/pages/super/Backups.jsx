import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { 
  Database, ArrowLeft, Plus, RotateCcw, Trash2, 
  CheckCircle2, AlertCircle, HardDrive, FileArchive,
  Clock, AlertTriangle, Shield
} from "lucide-react";

export default function Backups() {
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate(`/admin/${user?.empresa_slug || "default"}`);
      return;
    }
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/system-backup", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBackups(Array.isArray(data) ? data : data.backups || []);
      } else {
        setMessage({ type: "error", text: "Erro ao carregar backups." });
      }
    } catch (err) {
      console.error("Erro ao buscar backups:", err);
      setMessage({ type: "error", text: "Erro de conexão ao buscar backups." });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/system-backup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Backup criado com sucesso!" });
        fetchBackups();
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao criar backup." });
      }
    } catch (err) {
      console.error("Erro ao criar backup:", err);
      setMessage({ type: "error", text: "Erro de conexão ao criar backup." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (backup) => {
    const confirmed = confirm(
      `Tem certeza que deseja restaurar o backup "${backup.id || backup.filename}"?\n\nEsta ação irá sobrescrever os dados atuais. O sistema será reiniciado após a restauração.`
    );
    if (!confirmed) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/system-backup/restore/${backup.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: "Restauração iniciada com sucesso! A página será recarregada em 10 segundos...",
        });
        setTimeout(() => {
          window.location.reload();
        }, 10000);
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao restaurar backup." });
      }
    } catch (err) {
      console.error("Erro ao restaurar backup:", err);
      setMessage({ type: "error", text: "Erro de conexão ao restaurar backup." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (backup) => {
    const confirmed = confirm(
      `Tem certeza que deseja remover o backup "${backup.id || backup.filename}"?\n\nEsta ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/system-backup/${backup.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Backup removido com sucesso!" });
        fetchBackups();
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao remover backup." });
      }
    } catch (err) {
      console.error("Erro ao remover backup:", err);
      setMessage({ type: "error", text: "Erro de conexão ao remover backup." });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getTipoBadge = (tipo) => {
    if (tipo === "pre_update" || tipo === "pre-atualizacao" || tipo === "pre_atualizacao") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-950/40 text-cyan-400 border border-cyan-800/40">
          <RotateCcw className="w-3 h-3" />
          Pré-Atualização
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-800/60 text-gray-400 border border-gray-700/40">
        <HardDrive className="w-3 h-3" />
        Manual
      </span>
    );
  };

  const hasFiles = (backup) => {
    return backup.db_exists !== false && backup.files_exists !== false;
  };

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-700/30 flex items-center justify-center">
                <Database className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Backups do Sistema</h1>
                <p className="text-[11px] text-gray-500 font-medium">Gerencie backups de banco de dados e arquivos</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleCreateBackup}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {actionLoading ? "Aguarde..." : "Criar Backup"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6">
        {/* Status message */}
        {message && (
          <div
            className={`rounded-xl p-4 border flex items-start gap-3 text-sm ${
              message.type === "success"
                ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-400"
                : "bg-red-950/20 border-red-800/40 text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            {message.text}
          </div>
        )}

        {/* Backup list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-gray-700 border-t-blue-500 rounded-full animate-spin" style={{borderWidth: '3px'}}></div>
            <span className="ml-3 text-sm text-gray-500">Carregando backups...</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-16 text-center">
            <Database className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium">Nenhum backup encontrado.</p>
            <p className="text-gray-600 text-sm mt-2">
              Clique em "Criar Backup" para gerar o primeiro backup do sistema.
            </p>
          </div>
        ) : (
          <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileArchive className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {backups.length} backup(s) disponível(is)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#11141e]">
                  <tr className="border-b border-gray-800">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Atualização</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Banco de Dados</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Arquivos</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider pr-8">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {backups.map((backup) => {
                    const filesOk = hasFiles(backup);
                    return (
                      <tr
                        key={backup.id}
                        className="hover:bg-[#1f2330]/50 transition-colors"
                      >
                        <td className="px-6 py-4">{getTipoBadge(backup.tipo || backup.type)}</td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {backup.update_id ? (
                            <span className="font-mono bg-gray-800/60 px-2 py-0.5 rounded border border-gray-700/50">{backup.update_id}</span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-gray-300 text-xs">
                            <Clock className="w-3 h-3 text-gray-600" />
                            {formatDate(backup.criado_em || backup.created_at || backup.date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              backup.db_exists !== false
                                ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
                                : "bg-red-950/40 text-red-400 border-red-800/40"
                            }`}
                          >
                            {backup.db_exists !== false ? (
                              <><CheckCircle2 className="w-3 h-3" /> OK</>
                            ) : (
                              <><AlertCircle className="w-3 h-3" /> Ausente</>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              filesOk
                                ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
                                : "bg-gray-800/60 text-gray-500 border-gray-700/40"
                            }`}
                          >
                            {filesOk ? (
                              <><CheckCircle2 className="w-3 h-3" /> OK</>
                            ) : (
                              <><AlertCircle className="w-3 h-3" /> Ausente</>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRestore(backup)}
                              disabled={actionLoading || !filesOk}
                              title={!filesOk ? "Arquivos ausentes — restauração indisponível" : "Restaurar este backup"}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 hover:text-amber-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-amber-800/30 hover:border-amber-700/50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Restaurar
                            </button>
                            <button
                              onClick={() => handleDelete(backup)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-red-900/30 hover:border-red-800/50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Emergency info */}
        <div className="bg-[#1a1d27] border border-amber-900/25 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/3 rounded-full blur-3xl transform translate-x-8 -translate-y-8"></div>
          <div className="flex items-start gap-4 relative">
            <div className="p-2.5 bg-amber-500/10 rounded-xl flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-amber-400 font-bold text-sm mb-1.5">Acesso de Emergência</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Se o sistema estiver inacessível após uma restauração ou atualização, utilize o endpoint
                de emergência diretamente no servidor:
              </p>
              <code className="inline-block mt-3 bg-[#0d1117] border border-amber-900/20 text-amber-300 text-xs px-4 py-2.5 rounded-xl font-mono">
                http://servidor:3001/emergency
              </code>
              <p className="text-gray-600 text-xs mt-2">
                Este endpoint permite acesso direto ao backend mesmo quando o frontend estiver indisponível.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
