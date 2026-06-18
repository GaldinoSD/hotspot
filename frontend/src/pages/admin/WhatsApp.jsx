import React, { useEffect, useState, useRef } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import PageHeader from "../../components/admin/PageHeader";
import {
  Smartphone,
  Send,
  MessageSquare,
  Users,
  Key,
  Link2,
  Settings,
  RefreshCw,
  LogOut,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Check,
  Copy,
  ChevronRight,
  Eye,
  EyeOff,
  Activity,
  Plus
} from "lucide-react";

export default function WhatsApp() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [mensagemTeste, setMensagemTeste] = useState({ telefone: "", mensagem: "" });
  const [envioResult, setEnvioResult] = useState(null);
  const [config, setConfig] = useState({ api_url: "", api_key: "", instance_name: "" });
  const [configSaved, setConfigSaved] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const token = localStorage.getItem("admin_token");
  const pollingRef = useRef(null);

  // Historico de envios
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsFilter, setLogsFilter] = useState({ status: "", telefone: "" });
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [cleanupDate, setCleanupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [showCleanup, setShowCleanup] = useState(false);
  const [cleanupType, setCleanupType] = useState("all"); // "all" ou "date"
  const [copiedKey, setCopiedKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const PER_PAGE = 10;
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchStatus();
    fetchConfig();
    fetchLogs();
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchLogs(); }, [logsPage, logsFilter.status]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({ page: logsPage, per_page: PER_PAGE });
      if (logsFilter.status) params.append("status", logsFilter.status);
      if (logsFilter.telefone) params.append("telefone", logsFilter.telefone);
      const res = await fetch(`/api/whatsapp/logs?${params}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setLogsTotal(data.total || 0);
      }
    } catch (err) { console.error("Erro ao buscar logs:", err); }
  };

  const handleLimparLogs = async () => {
    const confirmMsg = cleanupType === "all"
      ? "Tem certeza que deseja apagar TODO o histórico de envios do WhatsApp? Esta ação não pode ser desfeita!"
      : `Remover todos os logs anteriores a ${formatDateSimple(cleanupDate)}?`;

    if (!confirm(confirmMsg)) return;

    try {
      const params = new URLSearchParams();
      if (cleanupType === "date" && cleanupDate) {
        params.append("antes_de", cleanupDate);
      }

      const res = await fetch(`/api/whatsapp/logs?${params.toString()}`, {
        method: "DELETE", headers,
      });
      const data = await res.json();
      if (res.ok) {
        alert(`${data.removidos || 0} logs removidos.`);
        setShowCleanup(false);
        setLogsPage(1);
        fetchLogs();
      } else {
        alert(data.error || "Erro ao limpar logs.");
      }
    } catch (err) {
      console.error("Erro ao limpar logs:", err);
      alert("Erro ao limpar logs");
    }
  };

  const formatDate = (s) => {
    if (!s) return "";
    const d = new Date(s);
    return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateSimple = (dStr) => {
    if (!dStr) return "";
    const [year, month, day] = dStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const statusBadge = (s) => {
    if (s === "ok") return (
      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/20 inline-flex items-center gap-1 shadow-sm">
        <CheckCircle className="w-3 h-3 text-emerald-400" /> OK
      </span>
    );
    if (s === "erro") return (
      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-950/40 text-rose-400 border border-rose-900/20 inline-flex items-center gap-1 shadow-sm">
        <XCircle className="w-3 h-3 text-rose-400" /> Erro
      </span>
    );
    if (s === "skipped") return (
      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-gray-900 text-gray-400 border border-gray-800 inline-flex items-center gap-1 shadow-sm">
        <AlertTriangle className="w-3 h-3 text-gray-400" /> Pulado
      </span>
    );
    return <span className="text-xs text-gray-500">{s}</span>;
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/whatsapp/config", { headers });
      const data = await res.json();
      setConfig({ api_url: data.api_url || "", api_key: data.api_key || "", instance_name: data.instance_name || "" });
    } catch (err) { console.error("Erro ao buscar config:", err); }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setConfigSaved(null);
    try {
      const res = await fetch("/api/whatsapp/config", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setConfigSaved({ ok: true, msg: "Configuração salva com sucesso!" });
        fetchStatus();
        setTimeout(() => setShowConfig(false), 1500);
      } else {
        setConfigSaved({ ok: false, msg: "Erro ao salvar as configurações." });
      }
    } catch (err) {
      console.error("Erro ao salvar config:", err);
      setConfigSaved({ ok: false, msg: "Erro de conexão com o servidor." });
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/whatsapp/instance/status", { headers });
      const data = await res.json();
      setStatus(data);
      if (data.state === "open") {
        setQrCode(null);
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      }
    } catch (err) {
      console.error("Erro ao buscar status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/whatsapp/instance/create", { method: "POST", headers });
      await res.json();
      await fetchStatus();
      handleConnect();
    } catch (err) {
      console.error("Erro ao criar instancia:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/whatsapp/instance/qrcode", { headers });
      const data = await res.json();
      if (data.base64) {
        setQrCode(data.base64);
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(fetchStatus, 5000);
      } else if (data.instance?.state === "open") {
        setQrCode(null);
        await fetchStatus();
      }
    } catch (err) {
      console.error("Erro ao obter QR:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestart = async () => {
    setActionLoading(true);
    try {
      await fetch("/api/whatsapp/instance/restart", { method: "POST", headers });
      setTimeout(fetchStatus, 3000);
    } catch (err) {
      console.error("Erro ao reiniciar:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Desconectar o WhatsApp? Você precisará escanear o QR Code novamente.")) return;
    setActionLoading(true);
    try {
      await fetch("/api/whatsapp/instance/logout", { method: "POST", headers });
      setQrCode(null);
      setTimeout(fetchStatus, 2000);
    } catch (err) {
      console.error("Erro ao desconectar:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Remover a instância completamente? Todos os dados locais de conexão serão perdidos.")) return;
    setActionLoading(true);
    try {
      await fetch("/api/whatsapp/instance/delete", { method: "DELETE", headers });
      setQrCode(null);
      setTimeout(fetchStatus, 2000);
    } catch (err) {
      console.error("Erro ao remover:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnviarTeste = async (e) => {
    e.preventDefault();
    setEnvioResult(null);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ telefone: `55${mensagemTeste.telefone}`, mensagem: mensagemTeste.mensagem }),
      });
      const data = await res.json();
      if (res.ok) {
        setEnvioResult({ ok: true, msg: "Mensagem enviada com sucesso!" });
        setMensagemTeste({ telefone: "", mensagem: "" });
        fetchLogs();
      } else {
        setEnvioResult({ ok: false, msg: data.error || "Erro ao enviar a mensagem." });
      }
    } catch (err) {
      console.error("Erro ao enviar teste:", err);
      setEnvioResult({ ok: false, msg: "Erro de conexão ao tentar enviar." });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const stateLabel = (state) => {
    const labels = {
      open: { text: "Conectado", color: "bg-emerald-500", textClass: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-950/20" },
      close: { text: "Desconectado", color: "bg-rose-500", textClass: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-950/20" },
      connecting: { text: "Conectando...", color: "bg-amber-500 animate-pulse", textClass: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-950/20" },
    };
    return labels[state] || { text: state || "Desconhecido", color: "bg-gray-500", textClass: "text-gray-400", border: "border-gray-800", bg: "bg-gray-900/30" };
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400 text-sm">Carregando painel de integração...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-[#0b0c10] min-h-screen -m-4 lg:-m-8 p-4 lg:p-8 space-y-6 text-gray-200">
        <PageHeader
          title="Integração WhatsApp"
          subtitle="Conecte sua Evolution API para enviar avisos, dados de acesso e mensagens de liberação de Wi-Fi automáticas."
          icon={
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.453L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.63 1.97 14.162.946 11.536.946c-5.438 0-9.862 4.373-9.866 9.801-.002 2.03.535 4.022 1.558 5.793L2.24 21.8l5.407-1.417-.999-.44-.001-.001-.002.011z"/>
              </svg>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLUNA ESQUERDA - STATUS E KPIS */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-[#121420]/80 backdrop-blur-sm border border-gray-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-extrabold text-white">Status da Instância</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">Estado atual da conexão da Evolution API</p>
                </div>
                <button 
                  onClick={fetchStatus} 
                  disabled={actionLoading}
                  className="p-2 border border-gray-800 hover:border-gray-700 bg-gray-900/40 hover:bg-gray-800/50 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  title="Sincronizar Status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`} />
                </button>
              </div>

              {!status?.exists ? (
                /* Instancia nao existe */
                <div className="text-center py-10 border border-dashed border-gray-800/60 rounded-2xl bg-[#090b10]/40">
                  <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-4">
                    <Smartphone className="w-7 h-7" />
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1">WhatsApp Desconectado</h3>
                  <p className="text-gray-500 text-xs max-w-xs mx-auto mb-6 leading-relaxed">
                    Você ainda não inicializou uma instância exclusiva para o envio de mensagens do seu portal.
                  </p>
                  <button
                    onClick={handleCreate}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-emerald-950/20 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {actionLoading ? "Criando Instância..." : "Criar Instância WhatsApp"}
                  </button>
                </div>
              ) : (
                /* Instancia existe */
                <div className="space-y-6">
                  {/* Status Details Blocks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Estado de Conexao */}
                    <div className={`${stateLabel(status.state).bg} border ${stateLabel(status.state).border} rounded-xl p-4 flex items-center gap-3.5`}>
                      <span className={`w-3 h-3 rounded-full shrink-0 ${stateLabel(status.state).color} shadow-[0_0_10px_currentColor]`} />
                      <div>
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Conexão</p>
                        <p className={`text-sm font-black ${stateLabel(status.state).textClass}`}>{stateLabel(status.state).text}</p>
                      </div>
                    </div>

                    {/* Numero */}
                    <div className="bg-[#07080c] border border-[#161822] rounded-xl p-4 flex items-center gap-3.5">
                      <div className="p-2 bg-gray-900 text-gray-400 rounded-lg">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Número Conectado</p>
                        <p className="text-sm font-mono font-extrabold text-gray-300">
                          {status.number || status.owner_jid?.split("@")[0] || "Aguardando login..."}
                        </p>
                      </div>
                    </div>

                    {/* Nome do Perfil */}
                    <div className="bg-[#07080c] border border-[#161822] rounded-xl p-4 flex items-center gap-3.5">
                      <div className="p-2 bg-gray-900 text-gray-400 rounded-lg">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Nome do Perfil</p>
                        <p className="text-sm font-extrabold text-gray-300 truncate max-w-[170px]">{status.profile_name || "-"}</p>
                      </div>
                    </div>

                    {/* Instancia */}
                    <div className="bg-[#07080c] border border-[#161822] rounded-xl p-4 flex items-center gap-3.5">
                      <div className="p-2 bg-gray-900 text-gray-400 rounded-lg">
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Instância</p>
                        <p className="text-sm font-mono font-extrabold text-gray-300 truncate max-w-[170px]">{status.instance_name}</p>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  {qrCode && status.state !== "open" && (
                    <div className="bg-[#090b10] border border-[#161822] rounded-xl p-6 text-center space-y-4 relative overflow-hidden">
                      
                      <div>
                        <h4 className="text-sm font-extrabold text-white">Escanear QR Code</h4>
                        <p className="text-xs text-gray-500 leading-normal max-w-xs mx-auto mt-1">
                          Abra o WhatsApp &gt; Dispositivos Conectados &gt; Conectar um Dispositivo e aponte a câmera.
                        </p>
                      </div>
                      <div className="relative mx-auto w-64 h-64 border-2 border-blue-500/30 rounded-2xl overflow-hidden p-3 bg-white flex items-center justify-center shadow-lg group">
                        {/* Linha laser de escaneamento animada */}
                        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent top-0 animate-[bounce_3s_infinite]" />
                        <img src={qrCode} alt="QR Code WhatsApp" className="w-full h-full rounded-lg" />
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950/20 text-amber-400 border border-amber-900/30 rounded-lg text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Aguardando leitura do QR Code
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Grid */}
                  <div className="flex flex-wrap gap-2.5 pt-2 border-t border-gray-800/40">
                    {status.state !== "open" && (
                      <button
                        onClick={handleConnect}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-lg shadow-emerald-950/20 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {actionLoading ? "Carregando..." : "Conectar (Gerar QR)"}
                      </button>
                    )}
                    <button
                      onClick={handleRestart}
                      disabled={actionLoading}
                      className="px-4 py-2 border border-gray-800 hover:border-gray-700 bg-gray-900/40 hover:bg-gray-800/50 disabled:opacity-50 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Reiniciar Serviço
                    </button>
                    {status.state === "open" && (
                      <button
                        onClick={handleLogout}
                        disabled={actionLoading}
                        className="px-4 py-2 border border-amber-900/40 text-amber-400 hover:text-white bg-amber-950/10 hover:bg-amber-600 hover:border-amber-500 disabled:opacity-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Desconectar Conta
                      </button>
                    )}
                    <button
                      onClick={handleDelete}
                      disabled={actionLoading}
                      className="px-4 py-2 border border-rose-950 text-rose-500 hover:text-white bg-rose-950/25 hover:bg-rose-600 hover:border-rose-500 disabled:opacity-50 rounded-xl text-xs font-bold transition-all cursor-pointer ml-auto"
                    >
                      Excluir Instância
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Estatisticas (KPI Cards) */}
            {status?.exists && status?.state === "open" && (
              <div className="grid grid-cols-3 gap-4">
                {/* Mensagens */}
                <div className="bg-[#121420]/80 backdrop-blur-sm border border-gray-800/40 rounded-2xl p-4 shadow-lg group relative overflow-hidden">
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Disparos</span>
                    <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl font-black text-white">{status.messages_count}</div>
                    <div className="text-[9px] text-gray-500 uppercase font-black tracking-wider mt-0.5">Mensagens</div>
                  </div>
                </div>

                {/* Contatos */}
                <div className="bg-[#121420]/80 backdrop-blur-sm border border-gray-800/40 rounded-2xl p-4 shadow-lg group relative overflow-hidden">
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Lista</span>
                    <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl font-black text-white">{status.contacts_count}</div>
                    <div className="text-[9px] text-gray-500 uppercase font-black tracking-wider mt-0.5">Contatos</div>
                  </div>
                </div>

                {/* Conversas */}
                <div className="bg-[#121420]/80 backdrop-blur-sm border border-gray-800/40 rounded-2xl p-4 shadow-lg group relative overflow-hidden">
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Tópicos</span>
                    <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl font-black text-white">{status.chats_count}</div>
                    <div className="text-[9px] text-gray-500 uppercase font-black tracking-wider mt-0.5">Conversas</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA - CONFIGURAÇÃO E TESTE DE DISPARO */}
          <div className="space-y-6">
            {/* Configuracao evolution api */}
            <div className="bg-[#121420]/80 backdrop-blur-sm border border-gray-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-extrabold text-white">Configurações de Integração</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">Chaves de acesso e comunicação com a API</p>
                </div>
                <button 
                  onClick={() => setShowConfig(!showConfig)}
                  className="px-3 py-1.5 border border-[#161822] hover:border-gray-700 bg-gray-900/30 hover:bg-gray-800/40 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  {showConfig ? "Ocultar" : "Editar Parâmetros"}
                </button>
              </div>

              {!showConfig ? (
                <div className="space-y-3">
                  <div className="bg-[#07080c] border border-[#161822] p-3.5 rounded-xl flex items-center justify-between group/row">
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest block mb-0.5">URL da API</span>
                      <span className="text-xs font-mono font-extrabold text-gray-300 truncate max-w-[280px] block">{config.api_url || "Padrão do Servidor"}</span>
                    </div>
                    <div className="p-2 bg-gray-900/40 text-gray-500 rounded-lg shrink-0">
                      <Link2 className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="bg-[#07080c] border border-[#161822] p-3.5 rounded-xl flex items-center justify-between group/row">
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest block mb-0.5">Evolution API Token / Key</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-extrabold text-gray-300 block">
                          {showApiKey ? config.api_key : "••••••••••••••••" + config.api_key.slice(-8)}
                        </span>
                        <button 
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors uppercase font-bold tracking-wider"
                        >
                          {showApiKey ? "Ocultar" : "Revelar"}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {config.api_key && (
                        <button
                          onClick={() => copyToClipboard(config.api_key)}
                          className="p-2 border border-gray-800 hover:border-gray-755 text-gray-500 hover:text-blue-400 bg-gray-900/40 rounded-lg relative"
                        >
                          {copiedKey && (
                            <span className="absolute right-0 -top-8 text-[8px] bg-green-950/90 text-green-400 border border-green-800 px-2 py-0.5 rounded font-sans uppercase font-bold whitespace-nowrap shadow-md">
                              Copiado!
                            </span>
                          )}
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#07080c] border border-[#161822] p-3.5 rounded-xl flex items-center justify-between group/row">
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest block mb-0.5">Nome da Instância</span>
                      <span className="text-xs font-mono font-extrabold text-gray-300 block">{config.instance_name || "-"}</span>
                    </div>
                    <div className="p-2 bg-gray-900/40 text-gray-500 rounded-lg shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveConfig} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">URL da Evolution API</label>
                    <input
                      type="text"
                      placeholder="http://localhost:8080"
                      value={config.api_url}
                      onChange={(e) => setConfig(prev => ({ ...prev, api_url: e.target.value }))}
                      className="w-full bg-[#07080c] border border-[#161822] text-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-900/50 text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">API Key / Token de Acesso</label>
                    <input
                      type="text"
                      placeholder="Chave secreta obtida no painel da API"
                      value={config.api_key}
                      onChange={(e) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
                      className="w-full bg-[#07080c] border border-[#161822] text-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-900/50 text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Nome de Instância (Identificador)</label>
                    <input
                      type="text"
                      placeholder="empresa_exemplo"
                      value={config.instance_name}
                      onChange={(e) => setConfig(prev => ({ ...prev, instance_name: e.target.value }))}
                      className="w-full bg-[#07080c] border border-[#161822] text-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-900/50 text-sm transition-all"
                    />
                  </div>
                  
                  {configSaved && (
                    <div className={`px-4 py-2 rounded-xl text-xs font-bold border ${configSaved.ok ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30" : "bg-rose-950/20 text-rose-400 border-rose-900/30"}`}>
                      {configSaved.msg}
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowConfig(false)}
                      className="w-1/2 py-2.5 border border-[#161822] text-gray-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg shadow-blue-950/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Salvar Configurações
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Enviar mensagem teste */}
            {status?.exists && status?.state === "open" && (
              <div className="bg-[#121420]/80 backdrop-blur-sm border border-gray-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                
                <div>
                  <h2 className="text-base font-extrabold text-white">Enviar Mensagem de Teste</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5 mb-4">Valide o disparo em tempo real preenchendo as informações</p>
                </div>

                <form onSubmit={handleEnviarTeste} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Telefone de Destino (DDD + Número)</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 bg-[#07080c] border border-r-0 border-[#161822] text-gray-500 rounded-l-xl text-sm font-bold font-mono">+55</span>
                      <input
                        type="text"
                        placeholder="21999998888"
                        value={mensagemTeste.telefone}
                        onChange={(e) => setMensagemTeste(prev => ({ ...prev, telefone: e.target.value.replace(/\D/g, "") }))}
                        required
                        className="flex-1 bg-[#07080c] border border-[#161822] text-gray-200 rounded-r-xl px-4 py-2.5 focus:outline-none focus:border-blue-900/50 text-sm transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Conteúdo da Mensagem</label>
                    <textarea
                      placeholder="Escreva sua mensagem de texto para envio de teste..."
                      value={mensagemTeste.mensagem}
                      onChange={(e) => setMensagemTeste(prev => ({ ...prev, mensagem: e.target.value }))}
                      required
                      rows={3}
                      className="w-full bg-[#07080c] border border-[#161822] text-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-900/50 text-sm resize-none transition-all leading-relaxed"
                    />
                  </div>

                  {envioResult && (
                    <div className={`px-4 py-2 rounded-xl text-xs font-bold border ${envioResult.ok ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30" : "bg-rose-950/20 text-rose-400 border-rose-900/30"}`}>
                      {envioResult.msg}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" /> Enviar Mensagem de Teste
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* HISTORICO DE ENVIOS (Logs Table) */}
        <div className="bg-[#121420]/80 backdrop-blur-sm border border-gray-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-base font-extrabold text-white">Histórico de Disparos</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Relação de mensagens enviadas automaticamente pelos portais do hotspot</p>
            </div>
            
            {/* Filtros e Ações de Limpeza */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={logsFilter.status}
                onChange={(e) => { setLogsFilter({ ...logsFilter, status: e.target.value }); setLogsPage(1); }}
                className="bg-[#07080c] border border-[#161822] text-gray-350 text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-900/50 cursor-pointer"
              >
                <option value="">Todos os Status</option>
                <option value="ok">OK (Enviadas)</option>
                <option value="erro">Erros</option>
                <option value="skipped">Skipped (Puladas)</option>
              </select>
              <input
                type="text"
                value={logsFilter.telefone}
                onChange={(e) => setLogsFilter({ ...logsFilter, telefone: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") { setLogsPage(1); fetchLogs(); } }}
                placeholder="Buscar por telefone..."
                className="bg-[#07080c] border border-[#161822] text-gray-350 text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-blue-900/50 w-40"
              />
              <button
                onClick={() => { setLogsPage(1); fetchLogs(); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Filtrar
              </button>
              <button
                onClick={() => setShowCleanup(!showCleanup)}
                className="px-4 py-2 border border-rose-950 text-rose-500 hover:text-white bg-rose-950/20 hover:bg-rose-650 hover:border-rose-500 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Logs
              </button>
            </div>
          </div>

          {/* Modal de Limpeza de Logs */}
          {showCleanup && (
            <div className="mb-6 p-5 bg-[#0d0e15] border border-red-950/60 rounded-xl flex items-center gap-4 flex-wrap animate-pulse-once">
              <div className="space-y-1 w-full md:w-auto">
                <span className="text-xs uppercase font-extrabold tracking-wider text-rose-400 block">Configurar Limpeza</span>
                <span className="text-xs text-gray-500">Defina o escopo dos logs a serem removidos.</span>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* Seletor Tipo Limpeza */}
                <select
                  value={cleanupType}
                  onChange={(e) => setCleanupType(e.target.value)}
                  className="bg-[#07080c] border border-[#161822] text-gray-350 text-xs rounded-xl px-3 py-2 cursor-pointer"
                >
                  <option value="all">Limpar Todo o Histórico</option>
                  <option value="date">Antes de uma data específica</option>
                </select>

                {/* Se for por data */}
                {cleanupType === "date" && (
                  <input
                    type="date"
                    value={cleanupDate}
                    onChange={(e) => setCleanupDate(e.target.value)}
                    className="bg-[#07080c] border border-[#161822] text-gray-350 text-xs rounded-xl px-3 py-2"
                  />
                )}

                <button
                  onClick={handleLimparLogs}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Confirmar Exclusão
                </button>
                <button
                  onClick={() => setShowCleanup(false)}
                  className="px-4 py-2 border border-[#161822] text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Logs Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-850">
            <table className="w-full text-sm">
              <thead className="bg-[#090a0f] text-gray-400 text-[10px] uppercase tracking-wider font-extrabold border-b border-gray-850">
                <tr>
                  <th className="text-left px-4 py-3">Criado em</th>
                  <th className="text-left px-4 py-3">Número de Destino</th>
                  <th className="text-left px-4 py-3">Portal de Origem</th>
                  <th className="text-left px-4 py-3">Tipo de Gatilho</th>
                  <th className="text-left px-4 py-3">Status de Envio</th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500 text-xs italic">
                      Nenhum disparo registrado no histórico da empresa.
                    </td>
                  </tr>
                ) : logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="border-t border-gray-850 hover:bg-[#090a0f]/50 transition-colors">
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap text-xs">{formatDate(log.criado_em)}</td>
                      <td className="px-4 py-3 text-gray-350 font-mono text-xs font-bold">{log.telefone || "-"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs font-semibold">{log.portal_nome || "-"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{log.contexto_tipo || "-"}</td>
                      <td className="px-4 py-3">{statusBadge(log.status)}</td>
                      <td className="px-4 py-3 text-right">
                        {(log.mensagem || log.erro_msg) && (
                          <button
                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                            className="text-xs text-blue-400 hover:text-blue-300 uppercase font-black tracking-wider cursor-pointer select-none"
                          >
                            {expandedLogId === log.id ? "Recolher" : "Ver Detalhes"}
                          </button>
                        )}
                      </td>
                    </tr>
                    
                    {/* Linha de Detalhes Expandidos */}
                    {expandedLogId === log.id && (
                      <tr className="bg-[#090a0f]/40 border-t border-gray-850">
                        <td colSpan="6" className="px-6 py-4 space-y-4">
                          {log.erro_msg && (
                            <div className="p-3 bg-rose-950/10 border border-rose-900/20 rounded-xl">
                              <div className="text-[10px] text-rose-400 font-extrabold uppercase tracking-wider mb-1 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                Mensagem de Erro Retornada
                              </div>
                              <div className="text-xs text-rose-350 font-mono leading-relaxed">{log.erro_msg}</div>
                            </div>
                          )}
                          
                          {log.mensagem && (
                            <div className="p-3 bg-gray-900/35 border border-gray-800 rounded-xl">
                              <div className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider mb-1 flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                                Corpo do Conteúdo Enviado
                              </div>
                              <div className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{log.mensagem}</div>
                            </div>
                          )}

                          {log.skip_motivo && (
                            <div className="p-3 bg-gray-900/20 border border-gray-850 rounded-xl">
                              <div className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider mb-1">
                                Motivo do Pulo (Skipped)
                              </div>
                              <div className="text-xs text-gray-400 font-mono leading-relaxed">{log.skip_motivo}</div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {logsTotal > PER_PAGE && (
            <div className="flex items-center justify-between mt-5 text-xs text-gray-500 font-bold uppercase tracking-wider">
              <span>
                Exibindo {((logsPage - 1) * PER_PAGE) + 1} a {Math.min(logsPage * PER_PAGE, logsTotal)} de {logsTotal} disparos
              </span>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                  disabled={logsPage === 1}
                  className="px-3.5 py-2 bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-400 hover:text-white rounded-xl disabled:opacity-30 disabled:hover:bg-gray-900 disabled:hover:text-gray-400 transition-all cursor-pointer"
                >
                  Anterior
                </button>
                <span className="text-gray-400 font-mono text-sm leading-none">Pág. {logsPage} de {Math.ceil(logsTotal / PER_PAGE)}</span>
                <button
                  onClick={() => setLogsPage((p) => p + 1)}
                  disabled={logsPage * PER_PAGE >= logsTotal}
                  className="px-3.5 py-2 bg-gray-900 hover:bg-gray-855 border border-gray-800 text-gray-400 hover:text-white rounded-xl disabled:opacity-30 disabled:hover:bg-gray-900 disabled:hover:text-gray-400 transition-all cursor-pointer"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
