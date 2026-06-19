import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  RefreshCw, ArrowLeft, LogOut, Mail, CheckCircle2, XCircle,
  AlertTriangle, Loader2, ArrowRight, Database, FileText,
  Clock, Hash, Shield
} from "lucide-react";

export default function AtualizarSistema() {
  const { user, isSuperAdmin, logout } = useAuth();
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

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate(`/admin/${user?.empresa_slug || "default"}`);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    };
  }, []);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStep("checking");
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/system-update/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.authorized) {
        setErrorMsg(data.message || "Senha/token de atualizacao invalido ou nao autorizado.");
        setStep("error");
        return;
      }
      if (!data.updates || data.updates.length === 0) {
        setDoneMsg("Seu sistema ja esta na versao mais recente. Nenhuma atualizacao disponivel.");
        setStep("done");
        return;
      }
      setUpdates(data.updates);
      setStep("updates");
    } catch (err) {
      setErrorMsg("Erro ao verificar atualizacoes. Verifique sua conexao e tente novamente.");
      setStep("error");
    }
  };

  const fetchLogs = async (updateId) => {
    setLogsLoading(true);
    setLogsData([]);
    setLogsOpen(true);
    try {
      const token = localStorage.getItem("admin_token");
      const url = updateId
        ? `/api/system-update/logs?update_id=${encodeURIComponent(updateId)}`
        : "/api/system-update/logs";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setLogsData(Array.isArray(data.logs) ? data.logs : []);
      } else {
        setLogsData([
          {
            id: 0,
            step: "error",
            status: "erro",
            message: data.message || "Falha ao carregar logs",
            criado_em: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      setLogsData([
        {
          id: 0,
          step: "error",
          status: "erro",
          message: "Erro de conexao ao carregar logs",
          criado_em: new Date().toISOString(),
        },
      ]);
    } finally {
      setLogsLoading(false);
    }
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
        const res = await fetch("/api/system-update/apply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: email.trim(), update_id: update.id }),
        });

        let data = null;
        try {
          data = await res.json();
        } catch {
          if (isLast) {
            setDoneMsg(
              "Atualizacao aplicada com sucesso! O servidor foi reiniciado. A pagina sera recarregada automaticamente."
            );
            setStep("done");
            reloadTimerRef.current = setTimeout(() => window.location.reload(), 8000);
            return;
          }
          setErrorMsg(
            `Conexao perdida ao aplicar a atualizacao ${update.id}. Recomendamos verificar o estado do sistema e restaurar um backup se necessario.`
          );
          setStep("error");
          return;
        }

        if (!res.ok || !data.success) {
          if (isLast && data?.applied) {
            setDoneMsg(
              data.message || "Atualizacoes aplicadas com sucesso! A pagina sera recarregada em 8 segundos."
            );
            setStep("done");
            reloadTimerRef.current = setTimeout(() => window.location.reload(), 8000);
            return;
          }
          setErrorMsg(
            (data?.message || `Falha ao aplicar atualizacao "${update.descricao}".`) +
              (isLast ? "" : " Recomendamos restaurar o backup automatico criado antes desta operacao.")
          );
          setStep("error");
          return;
        }

        if (isLast) {
          setDoneMsg(
            data.message || "Todas as atualizacoes foram aplicadas com sucesso! A pagina sera recarregada em 8 segundos."
          );
          setStep("done");
          reloadTimerRef.current = setTimeout(() => window.location.reload(), 8000);
          return;
        }
      } catch (err) {
        if (isLast) {
          setDoneMsg(
            "Atualizacao aplicada com sucesso! O servidor foi reiniciado. A pagina sera recarregada automaticamente."
          );
          setStep("done");
          reloadTimerRef.current = setTimeout(() => window.location.reload(), 8000);
          return;
        }
        setErrorMsg(
          `Erro de conexao ao aplicar a atualizacao "${update.descricao}". Recomendamos restaurar o backup automatico criado antes desta operacao.`
        );
        setStep("error");
        return;
      }
    }
  };

  const handleReset = () => {
    setStep("email");
    setErrorMsg("");
    setDoneMsg("");
    setUpdates([]);
    setApplyProgress({ current: 0, total: 0 });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const progressPercent =
    applyProgress.total > 0
      ? Math.round((applyProgress.current / applyProgress.total) * 100)
      : 0;

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-700/30 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Atualizar Sistema</h1>
                <p className="text-[11px] text-gray-500 font-medium">Verifique e aplique atualizacoes da plataforma</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600/10 text-red-400 border border-red-900/30 rounded-xl hover:bg-red-600/20 hover:border-red-800/50 text-xs font-bold uppercase tracking-wider transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 lg:px-8 py-8">
        {/* Step: email */}
        {step === "email" && (
          <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-8 shadow-lg">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-800/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Verificar Atualizacoes</h2>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Informe a senha ou token do servidor para validar o acesso e verificar se ha atualizacoes disponiveis.
              </p>
            </div>

            <form onSubmit={handleCheck} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Senha / Token do Servidor
                </label>
                <input
                  type="password"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Insira a senha do servidor"
                  required
                  className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-all text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all text-sm uppercase tracking-wider shadow-md cursor-pointer"
              >
                Verificar Atualizacoes
              </button>
            </form>
          </div>
        )}

        {/* Step: checking */}
        {step === "checking" && (
          <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-12 flex flex-col items-center gap-6 shadow-lg">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-white text-lg font-bold">Verificando atualizacoes...</p>
              <p className="text-gray-500 text-sm mt-1">Validando token do servidor</p>
            </div>
          </div>
        )}

        {/* Step: updates */}
        {step === "updates" && (
          <div className="space-y-4">
            {/* Info box */}
            <div className="bg-blue-600/8 border border-blue-800/30 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-1.5 bg-blue-500/10 rounded-lg flex-shrink-0 mt-0.5">
                <Database className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-blue-300 text-sm leading-relaxed">
                Um backup automatico sera criado antes de aplicar as atualizacoes. Voce pode restaura-lo na pagina de Backups caso necessario.
              </p>
            </div>

            {/* Updates list */}
            <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="px-6 py-4 border-b border-gray-800/80 flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-blue-400" />
                <h2 className="text-white font-bold text-sm">
                  {updates.length} {updates.length === 1 ? "atualizacao disponivel" : "atualizacoes disponiveis"}
                </h2>
              </div>
              <div className="divide-y divide-gray-800/60">
                {updates.map((update, idx) => (
                  <div key={update.id} className="px-6 py-4 hover:bg-[#1f2330]/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="w-7 h-7 rounded-lg bg-blue-600/15 text-blue-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold border border-blue-800/30">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{update.descricao}</p>
                          {update.changelog && (
                            <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">{update.changelog}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-1">
                        <span className="inline-flex items-center gap-1 text-[10px] text-gray-600 font-mono bg-gray-800/50 px-2 py-0.5 rounded border border-gray-700/50">
                          <Hash className="w-2.5 h-2.5" />
                          {update.id}
                        </span>
                        {update.date && (
                          <p className="text-[10px] text-gray-600 flex items-center gap-1 justify-end">
                            <Clock className="w-2.5 h-2.5" />
                            {formatDate(update.date)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-wider border border-gray-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-wider shadow-md cursor-pointer"
              >
                Aplicar Todas
              </button>
            </div>
          </div>
        )}

        {/* Step: applying */}
        {step === "applying" && (
          <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-8 space-y-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/15 border border-emerald-800/30 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              </div>
              <div>
                <p className="text-white font-bold">Aplicando atualizacoes...</p>
                <p className="text-gray-500 text-sm">
                  {applyProgress.current > 0
                    ? `Atualizacao ${applyProgress.current} de ${applyProgress.total}`
                    : "Iniciando..."}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>{applyProgress.current} de {applyProgress.total} aplicadas</span>
                <span className="font-mono font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-600/8 border border-amber-800/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-300 text-sm font-medium">
                Nao feche esta pagina. O processo pode reiniciar o servidor automaticamente.
              </p>
            </div>
          </div>
        )}

        {/* Step: done */}
        {step === "done" && (
          <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-8 space-y-6 shadow-lg">
            <div className="bg-emerald-600/8 border border-emerald-800/30 rounded-xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/15 border border-emerald-800/30 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-300 font-bold text-lg">Sucesso!</p>
                <p className="text-emerald-400/80 text-sm mt-1 leading-relaxed">{doneMsg}</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-500 text-sm">A pagina sera recarregada automaticamente em 8 segundos.</p>
              <div className="mt-4 flex gap-3 justify-center flex-wrap">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Recarregar Agora
                </button>
                <button
                  onClick={() => fetchLogs(lastAppliedId)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-blue-800/30 hover:border-blue-700/50 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Ver Logs
                </button>
                <Link
                  to="/super"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-gray-700 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Ir para o Painel
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Step: error */}
        {step === "error" && (
          <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-8 space-y-6 shadow-lg">
            <div className="bg-red-600/8 border border-red-800/30 rounded-xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-800/30 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-red-300 font-bold text-lg">Erro na atualizacao</p>
                <p className="text-red-400/80 text-sm mt-1 leading-relaxed">{errorMsg}</p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleReset}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-wider shadow-md cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Tentar Novamente
              </button>
              <button
                onClick={() => fetchLogs(lastAppliedId)}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600/15 hover:bg-blue-600/25 text-blue-300 font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-wider border border-blue-800/30 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Ver Logs
              </button>
              <Link
                to="/super/backups"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-wider border border-gray-700 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                Ir para Backups
              </Link>
            </div>
          </div>
        )}

        {/* Logs Modal */}
        {logsOpen && (
          <div className="modal-overlay" onClick={() => setLogsOpen(false)}>
            <div className="modal-container max-w-3xl" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Logs do Apply
                  {lastAppliedId && (
                    <span className="ml-2 text-[10px] text-gray-500 font-mono bg-gray-900 border border-gray-800 px-2 py-0.5 rounded">
                      #{lastAppliedId}
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => setLogsOpen(false)}
                  className="modal-close-btn"
                  title="Fechar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="modal-body space-y-4">
                <div className="bg-[#151724] border border-[#323652] rounded-xl p-4 font-mono text-[11px] leading-relaxed overflow-y-auto max-h-[50vh] custom-scrollbar">
                  {logsLoading ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando logs...
                    </div>
                  ) : logsData.length === 0 ? (
                    <p className="text-gray-500 italic">
                      Nenhum log encontrado para este update.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {logsData.map((l) => {
                        const color =
                          l.status === "erro"
                            ? "text-red-400 font-semibold"
                            : l.status === "ok"
                            ? "text-emerald-400"
                            : "text-blue-400";
                        const ts = new Date(l.criado_em).toLocaleTimeString(
                          "pt-BR"
                        );
                        return (
                          <div key={l.id} className="flex gap-2">
                            <span className="text-gray-600 shrink-0">{ts}</span>
                            <span className={`shrink-0 w-14 ${color}`}>
                              [{l.status}]
                            </span>
                            <span className="shrink-0 w-24 text-gray-400">
                              {l.step}
                            </span>
                            <span className="text-gray-300 break-all">
                              {l.message}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => fetchLogs(lastAppliedId)}
                  className="px-4 py-2 bg-transparent hover:bg-gray-900 border border-gray-800 text-blue-400 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Recarregar
                </button>
                <button
                  onClick={() => setLogsOpen(false)}
                  className="px-4 py-2 bg-transparent hover:bg-gray-950 border border-gray-850 text-gray-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
