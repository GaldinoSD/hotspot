import { useSearchParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";

export default function PlanosCliente() {
  const [searchParams] = useSearchParams();
  const mac = searchParams.get("mac");
  const ip = searchParams.get("ip");
  const mikrotikId = searchParams.get("mikrotik_id");
  const empresaId = searchParams.get("empresa_id");
  const clienteId = searchParams.get("cliente_id");
  const clienteNome = searchParams.get("cliente_nome");
  // portal_id explicito (vindo do redirect entre portais).
  // Quando o cliente vem do portal Login -> Planos via "Clique aqui",
  // esse id identifica o portal Planos correto pra carregar configs.
  const portalId = searchParams.get("portal_id");
  const [planos, setPlanos] = useState([]);
  const navigate = useNavigate();
  const [cfg, setCfg] = useState({});

  useEffect(() => {
    if (empresaId) {
      fetch(`/api/portal-config/planos?empresa_id=${empresaId}`)
        .then(r => r.json()).then(setCfg).catch(() => {});
    }
  }, [empresaId]);

  useEffect(() => {
    const carregarPlanos = async () => {
      try {
        // Filtrar planos pela empresa via mikrotik_id ou empresa_id
        const params = new URLSearchParams();
        if (mikrotikId) params.set("mikrotik_id", mikrotikId);
        else if (empresaId) params.set("empresa_id", empresaId);

        const res = await fetch(`/api/planos-publicos?${params.toString()}`);
        const data = await res.json();
        const ativos = data.filter((p) => p.ativo === 1);
        setPlanos(ativos);
      } catch (err) {
        console.error("Erro ao carregar planos:", err);
      }
    };

    carregarPlanos();
  }, [mikrotikId, empresaId]);

  // Lógica para destacar um plano (Efeito Von Restorff)
  const getPlanoDestacadoId = () => {
    if (planos.length === 0) return null;
    const comNomePopular = planos.find(p => 
      p.nome.toLowerCase().includes("popular") || 
      p.nome.toLowerCase().includes("recomendado") || 
      p.nome.toLowerCase().includes("turbo") || 
      p.nome.toLowerCase().includes("premium")
    );
    if (comNomePopular) return comNomePopular.id;
    if (planos.length === 3) return planos[1].id;
    if (planos.length > 1) {
      const ordenados = [...planos].sort((a, b) => parseFloat(b.valor) - parseFloat(a.valor));
      return ordenados[0].id;
    }
    return planos[0].id;
  };
  
  const planoDestacadoId = getPlanoDestacadoId();

  const formatarDuracao = (minutos) => {
    if (!minutos) return "";
    if (minutos >= 525600) {
      const anos = Math.round(minutos / 525600);
      return anos === 1 ? "1 ano" : `${anos} anos`;
    }
    if (minutos >= 43200) {
      const meses = Math.round(minutos / 43200);
      return meses === 1 ? "1 mês" : `${meses} meses`;
    }
    if (minutos >= 1440) {
      const dias = Math.round(minutos / 1440);
      return dias === 1 ? "1 dia" : `${dias} dias`;
    }
    if (minutos >= 60) {
      const horas = Math.round(minutos / 60);
      return horas === 1 ? "1 hora" : `${horas} horas`;
    }
    return `${minutos} minutos`;
  };

  const isCustomTheme = !!cfg.cor_fundo_1;
  const bgStyle = isCustomTheme ? { background: `linear-gradient(135deg, ${cfg.cor_fundo_1}, ${cfg.cor_fundo_2 || cfg.cor_fundo_1})` } : undefined;
  const btnStyle = cfg.cor_botao ? { backgroundColor: cfg.cor_botao } : undefined;
  
  const textColor = isCustomTheme ? 'text-white' : 'text-slate-100';
  const subtextColor = isCustomTheme ? 'text-gray-200' : 'text-slate-400';
  const cardBgClass = isCustomTheme 
    ? 'bg-[#181d29]/40 backdrop-blur-md border border-white/10' 
    : 'bg-[#0c101b] border border-slate-800/80';
  const themeCardText = isCustomTheme ? "text-white" : "text-slate-100";
  const themeCardSubtext = isCustomTheme ? "text-white/70" : "text-slate-400";

  // Redireciona para cadastro se não tem cliente_id
  if (!clienteId) {
    const params = new URLSearchParams({ mac: mac || '', ip: ip || '', mikrotik_id: mikrotikId || '', empresa_id: empresaId || '' });
    if (portalId) params.set("portal_id", portalId);
    return <Navigate to={`/cadastro-cliente?${params.toString()}`} replace />;
  }

  // Painel de status do dispositivo
  const devicePanel = mac && ip && (
    <div className={`mb-10 p-4 rounded-sm border max-w-md w-full shadow-lg transition-all duration-300 ${
      isCustomTheme 
        ? 'bg-black/20 border-white/10' 
        : 'bg-[#0a0d14] border-slate-800/80 hover:border-slate-700'
    }`}>
      <div className="flex items-center justify-between mb-3 border-b pb-2 border-slate-800/40">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Conexão Detectada</span>
        </div>
        <span className="text-[8px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-sm uppercase tracking-wide">ONLINE</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-[11px] font-mono">
        <div>
          <span className="text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">Endereço IP</span>
          <span className={isCustomTheme ? 'text-white' : 'text-slate-300'}>{ip}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">Endereço MAC</span>
          <span className={isCustomTheme ? 'text-white' : 'text-slate-300'}>{mac}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className={`min-h-screen flex flex-col items-center px-4 py-12 transition-all duration-500 ${
        !isCustomTheme 
          ? 'bg-[#07090e] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#131b2f] via-[#07090e] to-[#040508]' 
          : ''
      }`} 
      style={bgStyle}
    >
      {/* Header */}
      <div className="text-center mb-12 max-w-3xl animate-fade-in">
        {cfg.logo_url ? (
          <img src={cfg.logo_url} alt="Logo" className="max-h-24 mx-auto mb-8 object-contain transition-transform hover:scale-105 duration-300" />
        ) : (
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-sm mb-6 shadow-xl border border-white/10" 
            style={cfg.cor_botao ? { background: cfg.cor_botao } : { background: 'linear-gradient(135deg, #ff6b00, #ff8c33)' }}
          >
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        )}
        <h1 className={`text-4xl md:text-5xl font-black tracking-tight mb-4 ${textColor}`}>
          {cfg.titulo || 'Escolha seu Plano'}
        </h1>
        <p className={`text-sm md:text-base max-w-2xl mx-auto leading-relaxed ${subtextColor}`}>
          {cfg.subtitulo || 'Selecione o plano ideal para sua conexão e navegue com velocidade e qualidade'}
        </p>
      </div>

      {/* Info do dispositivo */}
      {devicePanel}

      {/* Grid de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {planos.map((plano, index) => {
          const isDestacado = plano.id === planoDestacadoId;
          return (
            <div
              key={plano.id}
              className={`relative rounded-sm shadow-xl transition-all duration-300 p-6 flex flex-col justify-between hover:-translate-y-2 animate-fade-in-up group overflow-hidden ${cardBgClass} ${
                isDestacado 
                  ? isCustomTheme 
                    ? 'ring-2 ring-white border-transparent' 
                    : 'ring-2 ring-[#ff6b00] border-transparent shadow-[0_10px_30px_rgba(255,107,0,0.15)]'
                  : ''
              }`}
              style={{ 
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both'
              }}
            >
              {/* Badge Recomendado */}
              {isDestacado && (
                <div 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-black font-black uppercase text-[9px] tracking-widest px-4 py-1.5 shadow-lg select-none"
                  style={cfg.cor_botao ? { backgroundColor: cfg.cor_botao } : { backgroundColor: '#ff6b00' }}
                >
                  Recomendado
                </div>
              )}

              <div>
                {/* Cabeçalho do Card */}
                <div className="mb-6 pb-5 border-b border-slate-800/40">
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="inline-flex items-center justify-center w-10 h-10 rounded-sm shadow-md border border-white/5"
                      style={cfg.cor_botao && isDestacado ? { background: cfg.cor_botao } : { background: 'rgba(255,255,255,0.05)' }}
                    >
                      <svg 
                        className={`w-5 h-5 ${isDestacado && !cfg.cor_botao ? 'text-[#ff6b00]' : 'text-slate-400'}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    
                    {parseFloat(plano.valor) === 0 && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-900/60 px-2.5 py-1 rounded-sm shadow-sm">
                        Grátis
                      </span>
                    )}
                  </div>
                  
                  <h2 className={`text-2xl font-black tracking-tight ${themeCardText} mb-2`}>
                    {plano.nome}
                  </h2>
                  <p className={`text-xs leading-relaxed ${themeCardSubtext} min-h-[40px]`}>
                    {plano.descricao}
                  </p>
                </div>

                {/* Grid de Velocidades */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className={`p-3 rounded-sm ${isCustomTheme ? 'bg-white/5 border border-white/10' : 'bg-[#121622] border border-slate-800/50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[9px] uppercase tracking-wider ${themeCardSubtext}`}>Download</span>
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2.5xl font-black tracking-tight">{plano.velocidade_down}</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Mbps</span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-sm ${isCustomTheme ? 'bg-white/5 border border-white/10' : 'bg-[#121622] border border-slate-800/50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[9px] uppercase tracking-wider ${themeCardSubtext}`}>Upload</span>
                      <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={cfg.cor_botao && isDestacado ? { color: cfg.cor_botao } : {}}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2.5xl font-black tracking-tight">{plano.velocidade_up}</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">Mbps</span>
                    </div>
                  </div>
                </div>

                {/* Duração */}
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-sm mb-6 text-xs ${isCustomTheme ? 'bg-white/5 border border-white/10' : 'bg-[#0f121d] border border-slate-800/60'}`}>
                  <span className={themeCardSubtext}>Tempo de Acesso:</span>
                  <span className="font-bold tracking-tight text-white">{formatarDuracao(plano.duracao_minutos)}</span>
                </div>

                {/* Investimento */}
                <div className="text-center py-5 mb-6 border-t border-b border-slate-800/40 relative">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">Investimento</span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm font-bold text-slate-400">R$</span>
                    <span className="text-4.5xl font-black tracking-tighter text-white" style={cfg.cor_botao && isDestacado ? { color: cfg.cor_botao } : isDestacado ? { color: '#ff6b00' } : {}}>
                      {(parseFloat(plano.valor) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão de Ação */}
              <button
                onClick={() => navigate(`/pagamento/${plano.id}?mac=${mac}&ip=${ip}&mikrotik_id=${mikrotikId || ''}&empresa_id=${empresaId || ''}&cliente_id=${clienteId}${portalId ? `&portal_id=${portalId}` : ''}`)}
                className={`w-full font-black uppercase text-xs tracking-wider py-4 rounded-sm transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-95 group ${
                  isDestacado 
                    ? isCustomTheme
                      ? 'text-black hover:opacity-90'
                      : 'bg-[#ff6b00] text-black hover:bg-white hover:text-black shadow-[0_0_20px_rgba(255,107,0,0.25)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]'
                    : 'bg-[#121622] text-slate-300 border border-slate-800 hover:border-slate-500 hover:text-white'
                }`}
                style={isDestacado && btnStyle ? btnStyle : undefined}
              >
                <span>{cfg.texto_botao || 'Escolher este Plano'}</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {planos.length === 0 && (
        <div className="text-center py-20 animate-fade-in max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-900 border border-slate-800 rounded-sm mb-6 shadow-xl">
            <svg className="w-10 h-10 text-slate-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className={`text-lg font-bold ${textColor} mb-2`}>Nenhum Plano Ativo</p>
          <p className={`text-sm ${subtextColor}`}>Não existem planos de acesso à internet cadastrados e ativos para este estabelecimento no momento.</p>
        </div>
      )}

      {/* Footer */}
      <div className={`mt-16 text-center text-xs tracking-wider uppercase font-medium ${isCustomTheme ? 'text-gray-300' : 'text-slate-500'}`}>
        <p>💳 {cfg.texto_rodape || 'Pagamento 100% seguro • 🔒 Conexão criptografada'}</p>
      </div>
    </div>
  );
}
