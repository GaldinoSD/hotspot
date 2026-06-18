import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import PageHeader from "../../components/admin/PageHeader";
import ConfiguracaoMercadoPago from "../../components/admin/ConfiguracaoMercadoPago";
import { Settings, Trash2, CreditCard, AlertTriangle, Loader2, Users, ShieldAlert, Key, Lock, QrCode } from "lucide-react";

const acoes = [
  { chave: "radius", titulo: "Limpar Usuários RADIUS", desc: "Remove todos os logins de clientes RADIUS gerados.", icon: Users, endpoint: "/api/limpeza/radius" },
  { chave: "pagamentos", titulo: "Limpar Pagamentos", desc: "Exclui permanentemente todo o histórico de cobranças do banco de dados.", icon: CreditCard, endpoint: "/api/limpeza/pagamentos" },
  { chave: "lgpd", titulo: "Limpar Logins LGPD", desc: "Apaga os registros de conexões de usuários armazenados para compliance LGPD.", icon: ShieldAlert, endpoint: "/api/limpeza/lgpd" },
];

export default function Configuracoes() {
  const [aba, setAba] = useState("limpeza");
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);

  // States para o fluxo de 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading2fa, setLoading2fa] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [totpSecret, setTotpSecret] = useState("");
  const [codeConfirm, setCodeConfirm] = useState("");
  const [setupMode, setSetupMode] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [erro2fa, setErro2fa] = useState("");
  const [sucesso2fa, setSucesso2fa] = useState("");

  const token = localStorage.getItem("admin_token");

  const carregarStatus2fa = useCallback(async () => {
    try {
      const res = await fetch("/api/2fa/status", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTwoFactorEnabled(data.enabled);
      }
    } catch (err) {
      console.error("Erro ao carregar status do 2FA:", err);
    }
  }, [token]);

  useEffect(() => {
    carregarStatus2fa();
  }, [carregarStatus2fa]);

  const executarAcao = async (acao) => {
    setLoading(true);
    try {
      const res = await fetch(acao.endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = res.headers.get("content-type");
      if (!res.ok) {
        const erroTexto = contentType?.includes("application/json")
          ? (await res.json()).message
          : await res.text();
        throw new Error(erroTexto || "Erro desconhecido.");
      }

      const data = await res.json();
      alert(data.message);
    } catch (err) {
      alert("Erro ao executar ação: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
      setModal(null);
    }
  };

  const iniciarSetup2fa = async () => {
    setLoading2fa(true);
    setErro2fa("");
    setSucesso2fa("");
    try {
      const res = await fetch("/api/2fa/setup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Falha ao iniciar configuração de 2FA");
      
      const data = await res.json();
      setQrCode(data.qrCode);
      setTotpSecret(data.secret);
      setSetupMode(true);
    } catch (err) {
      setErro2fa(err.message);
    } finally {
      setLoading2fa(false);
    }
  };

  const confirmarSetup2fa = async (e) => {
    e.preventDefault();
    if (codeConfirm.length !== 6) {
      setErro2fa("Digite o código de 6 dígitos");
      return;
    }
    setLoading2fa(true);
    setErro2fa("");
    try {
      const res = await fetch("/api/2fa/verify-setup", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: codeConfirm })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código de verificação incorreto");

      setTwoFactorEnabled(true);
      setSetupMode(false);
      setQrCode("");
      setTotpSecret("");
      setCodeConfirm("");
      setSucesso2fa("Autenticação em dois fatores (2FA) ativada com sucesso!");
    } catch (err) {
      setErro2fa(err.message);
    } finally {
      setLoading2fa(false);
    }
  };

  const desativar2fa = async (e) => {
    e.preventDefault();
    setLoading2fa(true);
    setErro2fa("");
    try {
      const res = await fetch("/api/2fa/disable", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password: disablePassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Senha incorreta");

      setTwoFactorEnabled(false);
      setShowDisableModal(false);
      setDisablePassword("");
      setSucesso2fa("2FA desativado com sucesso.");
    } catch (err) {
      setErro2fa(err.message);
    } finally {
      setLoading2fa(false);
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Configurações"
        subtitle="Preferências e ferramentas avançadas do sistema"
        icon={<Settings className="w-6 h-6 text-orange-500" />}
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 mb-6 overflow-x-auto">
        <button
          onClick={() => setAba("limpeza")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
            aba === "limpeza"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Trash2 className="w-4 h-4" />
          Limpeza Avançada
        </button>
        <button
          onClick={() => setAba("mercado")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
            aba === "mercado"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Mercado Pago
        </button>
        <button
          onClick={() => {
            setAba("seguranca");
            setErro2fa("");
            setSucesso2fa("");
          }}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all whitespace-nowrap ${
            aba === "seguranca"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Lock className="w-4 h-4" />
          Segurança (2FA)
        </button>
      </div>

      {/* Tab Contents */}
      <div className="animate-fadeIn">
        {aba === "limpeza" && (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-550/20 rounded-xl p-4 flex items-start gap-3 text-red-400 text-xs mb-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase tracking-wider mb-0.5">Aviso de Segurança</span>
                As ações abaixo limpam registros históricos e tabelas operacionais permanentemente. Certifique-se de realizar backups antes de proceder.
              </div>
            </div>

            {acoes.map((acao) => {
              const IconComp = acao.icon;
              return (
                <div key={acao.chave} className="bg-[#131722] border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-700 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-500/5 rounded-lg border border-slate-800 text-red-500 mt-0.5">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-200">{acao.titulo}</h2>
                      <p className="text-slate-400 text-xs mt-1 font-light leading-relaxed">{acao.desc} Esta ação é irreversível.</p>
                    </div>
                  </div>
                  <button
                    className="bg-red-650/15 border border-red-550/20 text-red-400 px-4 py-2.5 rounded-lg hover:bg-red-600 hover:text-white transition-all text-xs font-semibold active:scale-95 flex items-center justify-center cursor-pointer"
                    onClick={() => setModal(acao)}
                  >
                    Limpar Dados
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {aba === "mercado" && (
          <div className="bg-[#131722] border border-slate-800 rounded-xl p-6 shadow-xl">
            <ConfiguracaoMercadoPago />
          </div>
        )}

        {aba === "seguranca" && (
          <div className="bg-[#131722] border border-slate-800 rounded-xl p-6 shadow-xl max-w-2xl">
            <h2 className="text-base font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Key className="w-5 h-5 text-orange-500" />
              Autenticação em Dois Fatores (2FA)
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-light mb-6">
              A autenticação em duas etapas adiciona uma camada de segurança extra à sua conta de administrador. Após inserir sua senha normal, você precisará digitar um código dinâmico de 6 dígitos gerado pelo seu celular.
            </p>

            {sucesso2fa && (
              <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-xl p-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{sucesso2fa}</span>
              </div>
            )}

            {erro2fa && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{erro2fa}</span>
              </div>
            )}

            {twoFactorEnabled ? (
              <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <h3 className="text-sm font-bold text-emerald-400">Ativo no seu perfil</h3>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Sua conta está protegida por 2FA. Cada login exigirá um código temporário de verificação.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setErro2fa("");
                    setDisablePassword("");
                    setShowDisableModal(true);
                  }}
                  className="bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2 border border-red-500/20 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                >
                  Desativar 2FA
                </button>
              </div>
            ) : (
              <div>
                {!setupMode ? (
                  <div className="bg-[#1a1d29] border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-slate-500 rounded-full"></span>
                        <h3 className="text-sm font-bold text-slate-300">Desativado</h3>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        Proteja sua conta agora adicionando uma camada de segurança extra.
                      </p>
                    </div>
                    <button
                      onClick={iniciarSetup2fa}
                      disabled={loading2fa}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/10"
                    >
                      {loading2fa ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Carregando...
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4" />
                          Configurar 2FA
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={confirmarSetup2fa} className="border border-slate-850 bg-[#171a26]/40 p-6 rounded-2xl space-y-6">
                    <div className="border-b border-slate-800 pb-4">
                      <h3 className="text-sm font-bold text-white">Configurar Autenticador</h3>
                      <p className="text-[10px] text-slate-400 mt-1">Siga as instruções abaixo para vincular o aplicativo:</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      <div className="flex justify-center bg-white p-3 rounded-xl max-w-[180px] mx-auto">
                        {qrCode && <img src={qrCode} alt="QR Code 2FA" className="w-full h-auto" />}
                      </div>

                      <div className="space-y-3 text-[10px] text-slate-400 leading-relaxed">
                        <p>
                          <strong>1.</strong> Escaneie o QR Code ao lado usando seu aplicativo autenticador (Google Authenticator, Authy, Microsoft Authenticator, etc).
                        </p>
                        <p>
                          <strong>2.</strong> Se preferir, configure manualmente no aplicativo inserindo a chave secreta abaixo:
                        </p>
                        <div className="bg-[#0f1118] border border-slate-800 p-2.5 rounded-lg text-center font-mono text-[11px] text-orange-400 font-bold select-all tracking-wider">
                          {totpSecret}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-4 space-y-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-300 mb-2">
                          <strong>3. Digite o código de 6 dígitos gerado pelo aplicativo para confirmar:</strong>
                        </label>
                        <input
                          type="text"
                          pattern="\d*"
                          maxLength={6}
                          value={codeConfirm}
                          onChange={(e) => setCodeConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="w-full bg-[#0d1117] border border-gray-700 text-white rounded-lg py-2 text-center text-lg tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200"
                          placeholder="000000"
                          required
                        />
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSetupMode(false);
                            setQrCode("");
                            setTotpSecret("");
                            setCodeConfirm("");
                          }}
                          className="px-4 py-2 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={loading2fa}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
                        >
                          {loading2fa ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Verificando...
                            </>
                          ) : (
                            "Confirmar e Ativar"
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-container max-w-sm">
            <div className="modal-header">
              <h3 className="modal-title">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Confirmar Ação
              </h3>
              <button 
                onClick={() => setModal(null)} 
                className="modal-close-btn"
                title="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <p className="text-slate-350 text-sm leading-relaxed">
                Tem certeza que deseja executar <strong>{modal.titulo}</strong>? Essa operação apagará dados permanentemente e não poderá ser desfeita.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-4 py-2.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-sm font-medium text-slate-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => executarAcao(modal)}
                className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-550 text-white text-sm font-semibold transition-all shadow-lg hover:shadow-red-600/10 active:scale-95 flex items-center gap-2 cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Limpando...
                  </>
                ) : (
                  "Confirmar Limpeza"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desativar 2FA Modal */}
      {showDisableModal && (
        <div className="modal-overlay">
          <div className="modal-container max-w-sm">
            <div className="modal-header">
              <h3 className="modal-title text-red-400">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Desativar Autenticação 2FA
              </h3>
              <button 
                onClick={() => setShowDisableModal(false)} 
                className="modal-close-btn"
                title="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={desativar2fa}>
              <div className="modal-body space-y-4">
                <p className="text-slate-350 text-xs leading-relaxed font-light">
                  Para desativar a autenticação em dois fatores e retornar ao fluxo de login básico apenas por email e senha, digite sua senha de acesso atual para confirmar:
                </p>
                <div>
                  <input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Sua senha de administrador"
                    className="w-full bg-[#0d1117] border border-gray-750 text-white rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowDisableModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-550 text-white text-xs font-bold transition-all shadow-lg hover:shadow-red-600/10 active:scale-95 flex items-center gap-2 cursor-pointer"
                  disabled={loading2fa}
                >
                  {loading2fa ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Desativando...
                    </>
                  ) : (
                    "Confirmar e Desativar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
