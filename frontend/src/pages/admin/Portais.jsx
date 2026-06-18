import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import PageHeader from "../../components/admin/PageHeader";

export default function Portais() {
  const [portais, setPortais] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewPortal, setPreviewPortal] = useState(null);
  const [previewMode, setPreviewMode] = useState("mobile");
  const [copiedText, setCopiedText] = useState("");

  const { empresaSlug } = useParams();
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 1500);
  };
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token");

  const carregarPlanos = async () => {
    try {
      const res = await fetch("/api/planos", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setPlanos(await res.json());
    } catch { /* silencioso */ }
  };

  const carregarPortais = async () => {
    try {
      const res = await fetch("/api/portais", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setPortais(data);
    } catch (err) {
      console.error("Erro ao carregar portais:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPortais();
    carregarPlanos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getConfigObj = (portalItem) => {
    if (!portalItem.configuracoes) return {};
    try {
      return typeof portalItem.configuracoes === "string" 
        ? JSON.parse(portalItem.configuracoes) 
        : portalItem.configuracoes;
    } catch {
      return {};
    }
  };

  const tipoBadge = (tipo) => {
    const map = {
      lgpd: { label: "LGPD", cls: "bg-cyan-900/30 text-cyan-400 border-cyan-800/50" },
      planos: { label: "Planos", cls: "bg-green-900/30 text-green-400 border-green-800/50" },
      lead: { label: "Lead", cls: "bg-yellow-900/30 text-yellow-400 border-yellow-800/50" },
      lead_passivo: { label: "Lead (Sem Internet)", cls: "bg-orange-900/30 text-orange-400 border-orange-800/50" },
      status: { label: "Página de Status", cls: "bg-pink-900/30 text-pink-400 border-pink-800/50" },
      custom: { label: "Custom", cls: "bg-orange-900/30 text-orange-400 border-orange-800/50" },
    };
    const t = map[tipo] || map.custom;
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${t.cls}`}>{t.label}</span>;
  };

  const tipoIcon = (tipo) => {
    if (tipo === "lgpd") return (
      <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
    );
    if (tipo === "planos") return (
      <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    );
    if (tipo === "lead" || tipo === "lead_passivo") return (
      <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
    );
    if (tipo === "status") return (
      <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
    );
    return (
      <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
    );
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Portais Captive"
        subtitle="Configuração de portais de autenticação"
        icon={
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg>
        }
      >
        {!loading && (!planos.some(p => p.nome === 'LGPD') || !planos.some(p => p.nome.toLowerCase() === 'lead')) && (
          <div className="relative group/help">
            <div className="px-3.5 py-2 bg-gradient-to-r from-yellow-950/20 to-amber-950/10 hover:from-yellow-950/30 hover:to-amber-950/20 border border-yellow-600/30 rounded-xl flex items-center gap-2 max-w-md text-[10px] text-yellow-300 cursor-help shadow-lg transition-all duration-300">
              <span className="text-yellow-400 text-sm animate-pulse shrink-0">⚠️</span>
              <div className="leading-tight text-left">
                <span className="font-bold block uppercase tracking-wider text-[8px] text-amber-500 mb-0.5">Configuração Exigida</span>
                <span className="text-gray-300">Planos ausentes no Mikrotik: </span>
                {!planos.some(p => p.nome === 'LGPD') && <span className="font-semibold text-yellow-400">"LGPD"</span>}
                {!planos.some(p => p.nome === 'LGPD') && !planos.some(p => p.nome.toLowerCase() === 'lead') && <span className="text-gray-400"> e </span>}
                {!planos.some(p => p.nome.toLowerCase() === 'lead') && <span className="font-semibold text-yellow-400">"Lead"</span>}
                <span className="text-emerald-400 font-semibold ml-2 hover:text-emerald-300 underline transition-colors cursor-pointer">(Como criar?)</span>
              </div>
            </div>
            
            {/* Popover Hover Card */}
            <div className="absolute top-full right-0 mt-2 z-50 w-80 p-4 bg-[#11141e]/95 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl invisible opacity-0 group-hover/help:visible group-hover/help:opacity-100 transition-all duration-300 transform translate-y-1 group-hover/help:translate-y-0 pointer-events-none group-hover/help:pointer-events-auto">
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-gray-800/80 pb-2">
                  <h5 className="text-[11px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📋</span> Guia de Configuração
                  </h5>
                  <span className="text-[8px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 px-1.5 py-0.5 rounded font-mono uppercase">Mikrotik Link</span>
                </div>
                
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Os portais captive dependem de planos específicos para registrar conexões gratuitas e capturar leads. Crie-os na página de planos:
                </p>

                <div className="space-y-3">
                  {!planos.some(p => p.nome === 'LGPD') && (
                    <div className="bg-[#0b0c12]/80 p-3 rounded-xl border border-gray-800/60 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10.5px] font-bold text-yellow-400">1. Plano "LGPD"</span>
                        <span className="text-[8px] text-gray-500 font-medium">Conformidade</span>
                      </div>
                      <div className="text-[9px] text-gray-400 space-y-1.5">
                        <div className="flex items-center justify-between bg-[#151722] px-2 py-1 rounded border border-gray-800">
                          <span>Nome: <strong className="text-white font-mono">LGPD</strong></span>
                          <button 
                            onClick={() => handleCopy("LGPD")} 
                            className="text-[9px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                          >
                            {copiedText === "LGPD" ? "✓ Copiado" : "Copiar"}
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-[#151722] px-2 py-1 rounded border border-gray-800">
                          <span>Valor: <strong className="text-white font-mono">0,00</strong></span>
                          <button 
                            onClick={() => handleCopy("0,00")} 
                            className="text-[9px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                          >
                            {copiedText === "0,00" ? "✓ Copiado" : "Copiar"}
                          </button>
                        </div>
                        <p className="text-[8.5px] text-gray-500 italic mt-1">
                          Vincule ao Mikrotik de destino e salve.
                        </p>
                      </div>
                    </div>
                  )}

                  {!planos.some(p => p.nome.toLowerCase() === 'lead') && (
                    <div className="bg-[#0b0c12]/80 p-3 rounded-xl border border-gray-800/60 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10.5px] font-bold text-yellow-400">2. Plano "Lead"</span>
                        <span className="text-[8px] text-gray-500 font-medium">Captura</span>
                      </div>
                      <div className="text-[9px] text-gray-400 space-y-1.5">
                        <div className="flex items-center justify-between bg-[#151722] px-2 py-1 rounded border border-gray-800">
                          <span>Nome: <strong className="text-white font-mono">Lead</strong></span>
                          <button 
                            onClick={() => handleCopy("Lead")} 
                            className="text-[9px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                          >
                            {copiedText === "Lead" ? "✓ Copiado" : "Copiar"}
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-[#151722] px-2 py-1 rounded border border-gray-800">
                          <span>Valor: <strong className="text-white font-mono">0,00</strong></span>
                          <button 
                            onClick={() => handleCopy("0,00")} 
                            className="text-[9px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                          >
                            {copiedText === "0,00" ? "✓ Copiado" : "Copiar"}
                          </button>
                        </div>
                        <p className="text-[8.5px] text-gray-500 italic mt-1">
                          Vincule ao Mikrotik de destino e salve.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate(`/admin/${empresaSlug}/planos`)}
                  className="w-full mt-2 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-1 group/btn"
                >
                  Configurar Planos
                  <span className="group-hover/btn:translate-x-1 transition-transform duration-200">➔</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </PageHeader>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="text-gray-500">Carregando...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portais.map((p) => (
            <div key={p.id} className="bg-[#1a1d27] rounded-xl border border-gray-800 p-5 hover:border-gray-700 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0d1117] rounded-lg">{tipoIcon(p.tipo)}</div>
                  <div>
                    <h3 className="text-white font-semibold">{p.nome}</h3>
                    <p className="text-xs text-gray-500">/{p.slug}</p>
                  </div>
                </div>
                {tipoBadge(p.tipo)}
              </div>

              {p.descricao && <p className="text-sm text-gray-400 mb-3 line-clamp-2">{p.descricao}</p>}

              {(() => {
                const cfg = getConfigObj(p);
                if (p.tipo === "lead_passivo" && cfg.redirect_portal_url) {
                  const dest = portais.find(x => x.url_redirect === cfg.redirect_portal_url);
                  return (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-3 py-1.5 rounded-lg mb-3">
                      <span className="text-emerald-500 font-bold">➜</span>
                      <span>Encaminha para: <strong className="font-semibold text-white">{dest?.nome || cfg.redirect_portal_url}</strong></span>
                    </div>
                  );
                }
                if (p.tipo === "login" && cfg.link_portal_url) {
                  const dest = portais.find(x => x.url_redirect === cfg.link_portal_url);
                  return (
                    <div className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-950/20 border border-blue-900/30 px-3 py-1.5 rounded-lg mb-3">
                      <span className="text-blue-500 font-bold">🔗</span>
                      <span>Atalho para: <strong className="font-semibold text-white">{dest?.nome || cfg.link_portal_url}</strong></span>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {p.template_nome && (
                  <span className="px-2 py-0.5 text-xs rounded border bg-emerald-950/30 text-emerald-400 border-emerald-800/50">
                    {p.template_nome}
                  </span>
                )}
                {p.cor_primaria && (
                  <div className="flex items-center gap-1" title={`Primaria: ${p.cor_primaria}`}>
                    <div className="w-3 h-3 rounded-full border border-gray-600" style={{ backgroundColor: p.cor_primaria }} />
                  </div>
                )}
                {p.cor_fundo && p.cor_fundo !== '#0f111a' && (
                  <div className="flex items-center gap-1" title={`Fundo: ${p.cor_fundo}`}>
                    <div className="w-3 h-3 rounded-full border border-gray-600" style={{ backgroundColor: p.cor_fundo }} />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"></path></svg>
                {p.mikrotiks_vinculados} Mikrotik{p.mikrotiks_vinculados !== 1 ? "s" : ""} vinculado{p.mikrotiks_vinculados !== 1 ? "s" : ""}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
                <button
                  onClick={() => setPreviewPortal(p)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-400 border border-blue-800/50 rounded hover:bg-blue-900/20 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  Preview
                </button>
                <button
                  onClick={() => navigate(`/admin/${empresaSlug}/portais/${p.id}/editor`)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-emerald-400 border border-emerald-800/50 rounded hover:bg-emerald-900/20 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  Editor Visual
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewPortal && (
        <div className="modal-overlay">
          <div className="modal-container max-w-[90vw]">
            {/* Modal Header */}
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 rounded font-semibold text-[10px] tracking-wider uppercase">PREVIEW</span>
                <div>
                  <h3 className="modal-title">{previewPortal.nome}</h3>
                  <p className="text-[10px] text-gray-400">Visualização do portal em tempo real</p>
                </div>
              </div>
              
              {/* Device Selector */}
              <div className="flex items-center bg-[#0d1117] p-1 rounded-lg border border-gray-800">
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    previewMode === "mobile"
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  📱 Celular
                </button>
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    previewMode === "desktop"
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  💻 Computador
                </button>
              </div>

              <button
                onClick={() => setPreviewPortal(null)}
                className="modal-close-btn"
                title="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content / Preview Area */}
            <div className="modal-body bg-[#0a0c10] p-6 flex items-center justify-center min-h-[300px] md:min-h-[450px] no-scrollbar">
              <style>{`
                .custom-scroll::-webkit-scrollbar {
                  width: 3px;
                  height: 3px;
                }
                .custom-scroll::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scroll::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.08);
                  border-radius: 9999px;
                }
                .custom-scroll::-webkit-scrollbar-thumb:hover {
                  background: rgba(16, 185, 129, 0.3);
                }
                .no-scrollbar::-webkit-scrollbar {
                  display: none;
                  width: 0;
                  height: 0;
                }
                .no-scrollbar {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
                }
              `}</style>
              {previewMode === "mobile" ? (
                /* Smartphone Device Frame (iPhone style - scaled for compatibility) */
                <div className="relative w-[310px] h-[560px] rounded-[46px] border-[12px] border-zinc-900 ring-4 ring-zinc-800 bg-[#0d1117] flex flex-col shadow-2xl shrink-0 overflow-hidden transition-all duration-300">
                  {/* Dynamic Island */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[90px] h-[20px] bg-black rounded-full z-20 flex items-center justify-between px-2.5 select-none pointer-events-none">
                    <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
                    <div className="w-2 h-0.5 bg-gray-900 rounded-full"></div>
                  </div>
                  
                  {/* Mock Status Bar */}
                  <div className="h-8 bg-[#0a0c10] flex items-center justify-between px-5 shrink-0 z-10 select-none text-white text-[9px] font-semibold border-b border-white/5">
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5">
                      <span>📶</span>
                      <span>🔋</span>
                    </div>
                  </div>

                  <iframe
                    src={
                      previewPortal.tipo === "status"
                        ? `/api/hotspot-status/preview/${previewPortal.id}`
                        : `/api/portais/${previewPortal.id}/preview?token=${encodeURIComponent(token)}`
                    }
                    className="w-full flex-1 border-0 bg-transparent"
                    title="Preview Mobile"
                  />

                  {/* Home Indicator Bar */}
                  <div className="absolute bottom-1.5 inset-x-0 h-1 flex justify-center z-20 pointer-events-none">
                    <div className="w-20 h-1 bg-white/20 rounded-full"></div>
                  </div>
                </div>
              ) : (
                /* Browser/Desktop Device Frame */
                <div className="w-full max-w-6xl h-[680px] bg-[#0d1117] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300">
                  {/* Browser top bar simulation */}
                  <div className="bg-[#181b26] px-4 py-2 flex items-center justify-between border-b border-gray-800 shrink-0 select-none">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5 shrink-0">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 text-xs ml-2 shrink-0">
                        <span className="hover:text-white transition-colors cursor-pointer">&larr;</span>
                        <span className="hover:text-white transition-colors cursor-pointer">&rarr;</span>
                        <span className="text-[10px] hover:text-white transition-colors cursor-pointer">⟳</span>
                      </div>
                    </div>
                    <div className="bg-[#0a0c10] border border-gray-850 rounded-lg text-[10px] text-gray-400 px-4 py-1.5 font-mono flex-1 text-center max-w-xl mx-auto truncate select-none flex items-center justify-center gap-1.5">
                      <span className="text-emerald-500 text-[9px]">🔒</span>
                      https://hotspot.local/portal/{previewPortal.slug}
                    </div>
                    <div className="w-16"></div>
                  </div>
                  <iframe
                    src={
                      previewPortal.tipo === "status"
                        ? `/api/hotspot-status/preview/${previewPortal.id}`
                        : `/api/portais/${previewPortal.id}/preview?token=${encodeURIComponent(token)}`
                    }
                    className="w-full flex-1 border-0 bg-transparent"
                    title="Preview Desktop"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
