import React, { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import PageHeader from "../../components/admin/PageHeader";

export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [filtroMikrotik, setFiltroMikrotik] = useState("Todos");
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const token = localStorage.getItem("admin_token");

  const carregarDados = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Falha ao carregar");
      const json = await res.json();
      setDados(json);
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
      setErro("Erro ao carregar os dados do dashboard.");
    }
  }, [token]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const formatarBytes = (bytes) => {
    if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatarDiaSemana = (dataStr) => {
    try {
      const date = new Date(dataStr + "T00:00:00");
      const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const [, mes, dia] = dataStr.split("-");
      return `${diasSemana[date.getDay()]} ${dia}/${mes}`;
    } catch {
      return dataStr;
    }
  };

  // Processa dados históricos dos últimos 7 dias com preenchimento para dias vazios
  const processarHistorico = () => {
    if (!dados || !dados.consumoHistorico) return [];

    // Gerar os últimos 7 dias (incluindo hoje) no fuso horário local
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    });

    return dias.map((dia) => {
      let upload = 0;
      let download = 0;

      dados.consumoHistorico.forEach((item) => {
        const itemData = item.data.split("T")[0];
        if (itemData === dia) {
          if (filtroMikrotik === "Todos" || item.mikrotik === filtroMikrotik) {
            upload += Number(item.upload_bytes || 0);
            download += Number(item.download_bytes || 0);
          }
        }
      });

      return {
        dia,
        label: formatarDiaSemana(dia),
        upload,
        download,
        total: upload + download
      };
    });
  };

  const chartData = processarHistorico();
  const maxVal = chartData.length > 0 
    ? Math.max(...chartData.map(d => Math.max(d.download, d.upload)), 1024 * 1024) 
    : 1024 * 1024; // Mínimo 1MB para escala visual

  // Configuração do Gráfico SVG
  const width = 600;
  const height = 240;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const buildPaths = (key) => {
    if (chartData.length === 0) return null;
    const points = chartData.map((d, i) => {
      const x = paddingLeft + i * (plotWidth / 6);
      const val = d[key];
      const y = (height - paddingBottom) - (val / maxVal) * plotHeight;
      return { x, y };
    });

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

    return { linePath, areaPath, points };
  };

  const pathDownload = buildPaths("download");
  const pathUpload = buildPaths("upload");

  // Lista de Mikrotiks únicos do histórico para filtro
  const listaMikrotiks = dados && dados.consumoMikrotiks 
    ? ["Todos", ...dados.consumoMikrotiks.map(m => m.nome)]
    : ["Todos"];

  // Calcula tráfego total de todos os Mikrotiks
  const totalUpload = dados?.consumoMikrotiks?.reduce((acc, m) => acc + Number(m.upload_bytes), 0) || 0;
  const totalDownload = dados?.consumoMikrotiks?.reduce((acc, m) => acc + Number(m.download_bytes), 0) || 0;
  const totalTrafego = totalUpload + totalDownload;

  // Renderização do Hover no Gráfico
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Converte X da escala da tela para coordenadas de plot
    const relativeX = clientX - (paddingLeft / width) * rect.width;
    const plotWidthOnScreen = (plotWidth / width) * rect.width;

    if (relativeX < 0) {
      setHoveredIndex(0);
    } else if (relativeX > plotWidthOnScreen) {
      setHoveredIndex(6);
    } else {
      const idx = Math.round((relativeX / plotWidthOnScreen) * 6);
      setHoveredIndex(idx);
    }
    setTooltipPos({ x: clientX, y: clientY });
  };

  const cards = dados ? [
    {
      title: "Pagamentos (24h)",
      value: dados.pagamentos.ultimas_24h,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      ),
      color: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
      gradient: "from-[#0d1e1a] to-[#070e0c]",
      border: "border-emerald-900/20 hover:border-emerald-700/30 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]",
      glowBg: "bg-emerald-500/5",
      desc: "Transações nas últimas 24h"
    },
    {
      title: "Download Total",
      value: formatarBytes(totalDownload),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path></svg>
      ),
      color: "text-sky-400",
      iconBg: "bg-sky-500/10",
      gradient: "from-[#0c1825] to-[#060c13]",
      border: "border-sky-900/20 hover:border-sky-700/30 shadow-[0_0_15px_-3px_rgba(56,189,248,0.1)]",
      glowBg: "bg-sky-500/5",
      desc: "Consumo acumulado recebido"
    },
    {
      title: "Usuários Radius",
      value: dados.radius.total_usuarios,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
      ),
      color: "text-cyan-400",
      iconBg: "bg-cyan-500/10",
      gradient: "from-[#0c1825] to-[#060c13]",
      border: "border-cyan-900/20 hover:border-cyan-700/30 shadow-[0_0_15px_-3px_rgba(6,182,212,0.1)]",
      glowBg: "bg-cyan-500/5",
      desc: "Total de cadastros no Radius"
    },
    {
      title: "Mikrotiks Online",
      value: `${dados.mikrotiks.online} / ${dados.mikrotiks.total}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path></svg>
      ),
      color: "text-amber-400",
      iconBg: "bg-amber-500/10",
      gradient: "from-[#20180c] to-[#110c06]",
      border: "border-amber-900/20 hover:border-amber-700/30 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]",
      glowBg: "bg-amber-500/5",
      desc: "Roteadores cadastrados"
    }
  ] : [];

  if (erro) {
    return (
      <AdminLayout>
        <PageHeader title="Dashboard" subtitle="Visão geral do sistema" />
        <div className="bg-[#1c1214] border border-red-950 text-red-400 p-4 rounded-xl mt-6">
          <p>{erro}</p>
          <button onClick={carregarDados} className="mt-2 text-xs bg-red-900/20 hover:bg-red-900/40 text-red-300 px-3 py-1.5 rounded-lg border border-red-800/40 transition-colors">
            Tentar novamente
          </button>
        </div>
      </AdminLayout>
    );
  }

  if (!dados) {
    return (
      <AdminLayout>
        <PageHeader title="Dashboard" subtitle="Visão geral do sistema" />
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
          <span className="mt-4 text-sm text-gray-500">Carregando dados estatísticos...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        subtitle="Métricas em tempo real e análise de consumo"
        icon={
          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
        }
      />

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 border ${card.border} shadow-lg relative overflow-hidden group hover:scale-[1.01] transition-all duration-300`}>
            <div className={`absolute top-0 right-0 w-24 h-24 ${card.glowBg} rounded-full blur-2xl transform translate-x-4 -translate-y-4`}></div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{card.title}</span>
              <div className={`p-2.5 ${card.iconBg} ${card.color} rounded-xl`}>
                {card.icon}
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white group-hover:scale-[1.01] transition-transform duration-200">{card.value}</div>
              <div className="text-[10px] text-gray-500 mt-1">{card.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Gráfico de Histórico de Consumo (Últimos 7 dias) */}
        <div className="lg:col-span-2 bg-[#121420] border border-gray-800/40 rounded-2xl p-5 relative shadow-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Consumo de Dados (Últimos 7 Dias)</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Tráfego de download e upload diários</p>
            </div>
            
            {/* Seletor de Mikrotiks */}
            <div className="flex items-center gap-1.5 bg-[#171a2a] p-1 rounded-xl border border-gray-800/60">
              {listaMikrotiks.slice(0, 3).map((mk) => (
                <button
                  key={mk}
                  onClick={() => setFiltroMikrotik(mk)}
                  className={`text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
                    filtroMikrotik === mk
                      ? "bg-[#252a42] text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {mk}
                </button>
              ))}
              {listaMikrotiks.length > 3 && (
                <select
                  value={listaMikrotiks.includes(filtroMikrotik) && !listaMikrotiks.slice(0,3).includes(filtroMikrotik) ? filtroMikrotik : ""}
                  onChange={(e) => e.target.value && setFiltroMikrotik(e.target.value)}
                  className="bg-transparent text-[10px] text-gray-400 hover:text-white font-medium px-2 py-1.5 border-none outline-none cursor-pointer"
                >
                  <option value="" disabled>Outros</option>
                  {listaMikrotiks.slice(3).map(mk => (
                    <option key={mk} value={mk} className="bg-[#121420] text-white">{mk}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Gráfico SVG Customizado com Tooltip */}
          <div 
            className="relative h-60 w-full"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-gray-500">
                Sem registros de consumo para este período.
              </div>
            ) : (
              <>
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="downloadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
                    </linearGradient>
                    <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines Horizontais */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                    const yVal = (height - paddingBottom) - pct * plotHeight;
                    return (
                      <g key={idx}>
                        <line 
                          x1={paddingLeft} 
                          y1={yVal} 
                          x2={width - paddingRight} 
                          y2={yVal} 
                          stroke="rgba(255,255,255,0.04)" 
                          strokeWidth={1} 
                        />
                        <text 
                          x={paddingLeft - 10} 
                          y={yVal + 3} 
                          fill="#6b7280" 
                          fontSize={8} 
                          fontFamily="sans-serif"
                          textAnchor="end"
                        >
                          {formatarBytes(pct * maxVal)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Eixo X - Rótulos de Dia */}
                  {chartData.map((d, i) => {
                    const xVal = paddingLeft + i * (plotWidth / 6);
                    return (
                      <g key={i}>
                        <text 
                          x={xVal} 
                          y={height - 12} 
                          fill="#6b7280" 
                          fontSize={8} 
                          fontFamily="sans-serif"
                          textAnchor="middle"
                        >
                          {d.label}
                        </text>
                        <line
                          x1={xVal}
                          y1={height - paddingBottom}
                          x2={xVal}
                          y2={height - paddingBottom + 4}
                          stroke="rgba(255,255,255,0.1)"
                        />
                      </g>
                    );
                  })}

                  {/* Caminhos de Área e Linha para Upload (Orange) */}
                  {pathUpload && (
                    <>
                      <path d={pathUpload.areaPath} fill="url(#uploadGrad)" />
                      <path 
                        d={pathUpload.linePath} 
                        fill="none" 
                        stroke="#f59e0b" 
                        strokeWidth={2} 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                    </>
                  )}

                  {/* Caminhos de Área e Linha para Download (Green) */}
                  {pathDownload && (
                    <>
                      <path d={pathDownload.areaPath} fill="url(#downloadGrad)" />
                      <path 
                        d={pathDownload.linePath} 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth={2} 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                    </>
                  )}

                  {/* Linha Vertical de Indicador e Círculos no Hover */}
                  {hoveredIndex !== null && chartData[hoveredIndex] && (
                    <g>
                      {/* Linha vertical pontilhada */}
                      <line
                        x1={paddingLeft + hoveredIndex * (plotWidth / 6)}
                        y1={paddingTop}
                        x2={paddingLeft + hoveredIndex * (plotWidth / 6)}
                        y2={height - paddingBottom}
                        stroke="rgba(255, 255, 255, 0.15)"
                        strokeDasharray="4,4"
                        strokeWidth={1}
                      />
                      
                      {/* Ponto do Download */}
                      {pathDownload && (
                        <circle
                          cx={pathDownload.points[hoveredIndex].x}
                          cy={pathDownload.points[hoveredIndex].y}
                          r={4}
                          fill="#10b981"
                          stroke="#121420"
                          strokeWidth={2}
                          className="shadow-lg"
                        />
                      )}

                      {/* Ponto do Upload */}
                      {pathUpload && (
                        <circle
                          cx={pathUpload.points[hoveredIndex].x}
                          cy={pathUpload.points[hoveredIndex].y}
                          r={4}
                          fill="#f59e0b"
                          stroke="#121420"
                          strokeWidth={2}
                          className="shadow-lg"
                        />
                      )}
                    </g>
                  )}
                </svg>

                {/* Tooltip Absoluto em HTML sobreposto */}
                {hoveredIndex !== null && chartData[hoveredIndex] && (
                  <div 
                    className={`absolute bg-[#171b2f]/95 backdrop-blur border border-gray-800 text-[10px] p-2.5 rounded-lg shadow-xl pointer-events-none flex flex-col gap-1 w-36 transition-all duration-75 z-10 ${
                      hoveredIndex > 3 ? "-translate-x-[105%]" : "translate-x-3"
                    }`}
                    style={{ 
                      left: `${((paddingLeft + hoveredIndex * (plotWidth / 6)) / width) * 100}%`, 
                      top: `${Math.min(tooltipPos.y - 12, 140)}px`,
                      width: "150px"
                    }}
                  >
                    <div className="font-semibold text-gray-200 border-b border-gray-800 pb-1 mb-1 flex justify-between">
                      <span>{chartData[hoveredIndex].label}</span>
                      <span className="text-[8px] text-gray-500">RADIUS Acct</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span> Download:
                      </span>
                      <span className="font-medium text-white">{formatarBytes(chartData[hoveredIndex].download)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span> Upload:
                      </span>
                      <span className="font-medium text-white">{formatarBytes(chartData[hoveredIndex].upload)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-800/60 pt-1 mt-0.5 font-bold">
                      <span className="text-gray-300">Total:</span>
                      <span className="text-sky-400">{formatarBytes(chartData[hoveredIndex].total)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Legenda do Gráfico */}
          <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-gray-800/30 text-[10px]">
            <div className="flex items-center gap-1.5 text-gray-400">
              <span className="w-2.5 h-2.5 rounded-md bg-emerald-500"></span>
              <span>Download (Recebimento)</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <span className="w-2.5 h-2.5 rounded-md bg-amber-500"></span>
              <span>Upload (Envio)</span>
            </div>
          </div>
        </div>

        {/* Distribuição de Uso por Mikrotik */}
        <div className="bg-[#121420] border border-gray-800/40 rounded-2xl p-5 relative shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Uso por Roteador</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Participação no tráfego total</p>
          </div>

          <div className="my-4 space-y-4 flex-grow flex flex-col justify-center">
            {dados.consumoMikrotiks && dados.consumoMikrotiks.length > 0 ? (
              dados.consumoMikrotiks.map((mk) => {
                const mkTrafego = Number(mk.upload_bytes || 0) + Number(mk.download_bytes || 0);
                const pct = totalTrafego > 0 ? (mkTrafego / totalTrafego) * 100 : 0;
                
                return (
                  <div key={mk.id} className="space-y-1.5 group">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-medium text-gray-300 group-hover:text-white transition-colors">{mk.nome}</span>
                      <div className="flex gap-2 text-gray-400">
                        <span>{formatarBytes(mkTrafego)}</span>
                        <span className="text-[#38bdf8] font-bold">({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                    {/* Barra de progresso premium neon */}
                    <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800/50">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 rounded-full group-hover:shadow-[0_0_8px_#10b981] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-500 pt-0.5">
                      <span>{mk.total_conexoes || 0} conexões</span>
                      <span>{mk.total_usuarios_unicos || 0} usuários un.</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-gray-500">
                Nenhum tráfego registrado nos Mikrotiks.
              </div>
            )}
          </div>

          <div className="bg-[#171a2a]/60 border border-gray-800/40 rounded-xl p-3 text-center text-[10px] text-gray-400">
            Tráfego total acumulado de <span className="text-white font-semibold">{formatarBytes(totalTrafego)}</span> nas interfaces RADIUS.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabela de Métricas Detalhadas dos Mikrotiks */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <h2 className="text-sm font-semibold text-white">Métricas de Consumo por Roteador</h2>
          </div>
          <div className="bg-[#121420] rounded-2xl border border-gray-800/40 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#171a2a] text-gray-400 font-semibold border-b border-gray-800/60">
                  <tr>
                    <th className="px-5 py-3">Mikrotik</th>
                    <th className="px-5 py-3">IP Address</th>
                    <th className="px-5 py-3 text-right">Upload</th>
                    <th className="px-5 py-3 text-right">Download</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3 text-right">Usuários Únicos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-gray-300">
                  {dados.consumoMikrotiks && dados.consumoMikrotiks.length > 0 ? (
                    dados.consumoMikrotiks.map((mk) => (
                      <tr key={mk.id} className="hover:bg-[#181c2f] transition-colors">
                        <td className="px-5 py-3.5 font-medium text-white">{mk.nome}</td>
                        <td className="px-5 py-3.5 text-gray-500 font-mono">{mk.ip}</td>
                        <td className="px-5 py-3.5 text-right text-amber-500/90">{formatarBytes(mk.upload_bytes)}</td>
                        <td className="px-5 py-3.5 text-right text-emerald-500/90">{formatarBytes(mk.download_bytes)}</td>
                        <td className="px-5 py-3.5 text-right text-white font-semibold">
                          {formatarBytes(Number(mk.upload_bytes) + Number(mk.download_bytes))}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="px-2 py-0.5 bg-sky-950/40 text-sky-400 border border-sky-900/30 rounded text-[10px] font-semibold">
                            {mk.total_usuarios_unicos}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-gray-500">
                        Nenhum Mikrotik registrado ou sem dados no momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Painel Lateral: Sessões Ativas por Mikrotik */}
        {dados?.sessoes && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              <h2 className="text-sm font-semibold text-white">Clientes Conectados Agora</h2>
            </div>
            <div className="bg-[#121420] rounded-2xl border border-gray-800/40 overflow-hidden shadow-lg p-1">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#171a2a]/60 text-gray-400 font-semibold border-b border-gray-800/40">
                    <tr>
                      <th className="px-4 py-3 text-left">Mikrotik</th>
                      <th className="px-4 py-3 text-right">Online</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40 text-gray-300">
                    {dados.sessoes.map((s, i) => (
                      <tr key={i} className="hover:bg-[#181c2f] transition-colors">
                        <td className="px-4 py-3 text-gray-300 font-medium">{s.nome}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2.5 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 text-[10px] font-semibold rounded-full shadow-[0_0_8px_-1px_rgba(16,185,129,0.15)] animate-pulse">
                            {s.conectados} ativos
                          </span>
                        </td>
                      </tr>
                    ))}
                    {dados.sessoes.length === 0 && (
                      <tr>
                        <td colSpan="2" className="text-center py-6 text-gray-500">
                          Nenhum cliente conectado no momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
