import React, { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import PageHeader from "../../components/admin/PageHeader";
import ConfiguracaoMercadoPago from "../../components/admin/ConfiguracaoMercadoPago";
import { Settings, Trash2, CreditCard, AlertTriangle, Loader2, Users, ShieldAlert } from "lucide-react";

const acoes = [
  { chave: "radius", titulo: "Limpar Usuários RADIUS", desc: "Remove todos os logins de clientes RADIUS gerados.", icon: Users, endpoint: "/api/limpeza/radius" },
  { chave: "pagamentos", titulo: "Limpar Pagamentos", desc: "Exclui permanentemente todo o histórico de cobranças do banco de dados.", icon: CreditCard, endpoint: "/api/limpeza/pagamentos" },
  { chave: "lgpd", titulo: "Limpar Logins LGPD", desc: "Apaga os registros de conexões de usuários armazenados para compliance LGPD.", icon: ShieldAlert, endpoint: "/api/limpeza/lgpd" },
];

export default function Configuracoes() {
  const [aba, setAba] = useState("limpeza");
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("admin_token");

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

  return (
    <AdminLayout>
      <PageHeader
        title="Configurações"
        subtitle="Preferências e ferramentas avançadas do sistema"
        icon={<Settings className="w-6 h-6 text-orange-500" />}
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 mb-6 animate-fadeIn">
        <button
          onClick={() => setAba("limpeza")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all ${
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
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all ${
            aba === "mercado"
              ? "border-orange-500 text-orange-500"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Mercado Pago
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
                    className="bg-red-650/15 border border-red-550/20 text-red-400 px-4 py-2.5 rounded-lg hover:bg-red-600 hover:text-white transition-all text-xs font-semibold active:scale-95 flex items-center justify-center"
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
    </AdminLayout>
  );
}
