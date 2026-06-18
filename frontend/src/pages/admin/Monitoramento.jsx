import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import PageHeader from "../../components/admin/PageHeader";
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Users, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Settings, 
  AlertTriangle, 
  Clock,
  Copy,
  Check,
  ChevronRight,
  GripVertical
} from "lucide-react";

// Medidor circular de alto desempenho (Circular Progress Gauge)
function CircularGauge({ percent, label, strokeColor, icon: Icon }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-[#0d0e15] rounded-xl border border-gray-800/40 w-full">
      <div className="relative w-12 h-12 flex items-center justify-center">
        {/* Círculo de fundo */}
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="24" cy="24" r={radius} className="stroke-[#1d2030]/50" strokeWidth="3" fill="none" />
          <circle 
            cx="24" 
            cy="24" 
            r={radius} 
            className={`transition-all duration-500 ease-out ${strokeColor}`}
            strokeWidth="3" 
            fill="none" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        {/* Conteúdo Central */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-black text-gray-200">{percent}%</span>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
        {Icon && <Icon className="w-2.5 h-2.5 text-gray-500" />}
        <span>{label}</span>
      </div>
    </div>
  );
}

// Ilustrações realistas de alta definição (High-Tech SVG) para os MikroTiks
function DeviceVisual({ model, online }) {
  const modelLower = (model || "").toLowerCase();
  const ledColor = online ? "fill-[#22c55e] drop-shadow-[0_0_4px_#22c55e]" : "fill-[#ef4444] drop-shadow-[0_0_4px_#ef4444]";
  const actLed = online ? "fill-[#3b82f6] drop-shadow-[0_0_2px_#3b82f6] animate-pulse" : "fill-gray-700";

  // Case 1: Rackmount CCR / Roteadores Profissionais
  if (modelLower.includes("ccr") || modelLower.includes("3011") || modelLower.includes("4011") || modelLower.includes("5009")) {
    return (
      <svg className="w-full h-14 bg-[#090a0f] rounded-lg border border-gray-800/80 p-2 drop-shadow-md" viewBox="0 0 240 40">
        {/* Chassi Metálico */}
        <rect x="5" y="6" width="230" height="28" rx="2" fill="#1b1c26" stroke="#2c2f3f" strokeWidth="1" />
        {/* Painel do Display LCD */}
        <rect x="180" y="11" width="45" height="18" rx="1" fill="#13141a" stroke="#373a4e" strokeWidth="0.5" />
        {online ? (
          <g>
            <rect x="182" y="13" width="41" height="14" rx="0.5" fill="#0284c7" className="opacity-95" />
            <rect x="185" y="16" width="18" height="2" fill="#e0f2fe" />
            <rect x="185" y="20" width="28" height="2" fill="#e0f2fe" />
          </g>
        ) : (
          <rect x="182" y="13" width="41" height="14" rx="0.5" fill="#0a0a0f" />
        )}
        {/* Orelhas de Rack */}
        <path d="M 2 4 L 5 4 L 5 36 L 2 36 Z" fill="#787c8a" />
        <path d="M 238 4 L 235 4 L 235 36 L 238 36 Z" fill="#787c8a" />
        <circle cx="3.5" cy="9" r="0.8" fill="#475569" />
        <circle cx="3.5" cy="31" r="0.8" fill="#475569" />
        <circle cx="236.5" cy="9" r="0.8" fill="#475569" />
        <circle cx="236.5" cy="31" r="0.8" fill="#475569" />
        {/* Portas SFP+ e RJ45 em blocos */}
        <g>
          {/* Bloco 1 (SFP) */}
          <rect x="18" y="12" width="14" height="16" rx="1" fill="#101117" stroke="#484e68" strokeWidth="0.5" />
          <path d="M 21 16 L 29 16 L 25 23 Z" fill="#64748b" />
          {/* Blocos de Portas RJ45 */}
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} transform={`translate(${40 + i * 26}, 0)`}>
              <rect x="0" y="12" width="22" height="16" rx="1" fill="#101117" stroke="#313446" strokeWidth="0.5" />
              <rect x="2" y="16" width="8" height="10" rx="0.5" fill="#07080a" />
              <rect x="12" y="16" width="8" height="10" rx="0.5" fill="#07080a" />
              <circle cx="4" cy="14" r="0.8" className={ledColor} />
              <circle cx="14" cy="14" r="0.8" className={actLed} />
            </g>
          ))}
        </g>
        {/* LEDs Globais de Status */}
        <g transform="translate(172, 12)">
          <circle cx="0" cy="4" r="1.2" className={ledColor} />
          <circle cx="0" cy="10" r="1.2" className={actLed} />
        </g>
      </svg>
    );
  }

  // Case 2: hAP / AP Vertical / Wireless Tower
  if (modelLower.includes("hap") || modelLower.includes("cap") || modelLower.includes("wap") || modelLower.includes("lhg") || modelLower.includes("wireless")) {
    return (
      <svg className="w-full h-14 bg-[#090a0f] rounded-lg border border-gray-800/80 p-2 drop-shadow-md" viewBox="0 0 240 40">
        {/* Roteador Torre deitado em perspectiva */}
        <rect x="95" y="4" width="50" height="32" rx="4" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
        <rect x="105" y="9" width="30" height="3" rx="0.5" fill="#0284c7" />
        <rect x="102" y="18" width="36" height="12" rx="1.5" fill="#0f172a" />
        <g transform="translate(106, 24)">
          <circle cx="0" cy="0" r="1.5" className={ledColor} />
          <circle cx="6" cy="0" r="1.2" className={actLed} />
          <circle cx="12" cy="0" r="1.2" className={online ? "fill-[#ffb703] drop-shadow-[0_0_2px_#ffb703]" : "fill-gray-600"} />
          <circle cx="18" cy="0" r="1.2" className={online ? "fill-[#a855f7]" : "fill-gray-600"} />
          <circle cx="24" cy="0" r="1.2" className={online ? "fill-[#06b6d4] animate-ping" : "fill-gray-600"} />
        </g>
        {/* Sinais Wireless */}
        {online && (
          <g stroke="rgba(59,130,246,0.4)" fill="none" strokeWidth="1.5" strokeLinecap="round">
            <path d="M 85 12 A 10 10 0 0 0 85 28" className="animate-pulse" />
            <path d="M 78 8 A 16 16 0 0 0 78 32" className="opacity-45" />
            <path d="M 155 12 A 10 10 0 0 1 155 28" className="animate-pulse" />
            <path d="M 162 8 A 16 16 0 0 1 162 32" className="opacity-45" />
          </g>
        )}
      </svg>
    );
  }

  // Case 3: hEX / RB750 / Desktop Compacto (Azul e Branco padrão)
  return (
    <svg className="w-full h-14 bg-[#090a0f] rounded-lg border border-gray-800/80 p-2 drop-shadow-md" viewBox="0 0 240 40">
      {/* Corpo retangular do hEX */}
      <rect x="50" y="6" width="140" height="28" rx="3" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
      {/* Placa frontal azul escuro */}
      <path d="M 54 10 L 186 10 L 186 18 L 54 18 Z" fill="#172554" />
      {/* Portas Ethernet RJ45 */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${78 + i * 20}, 20)`}>
          <rect x="0" y="0" width="14" height="12" rx="1" fill="#1e293b" />
          <rect x="2" y="3" width="10" height="9" fill="#020617" />
          <circle cx="7" cy="1.5" r="0.6" className={online ? "fill-[#22c55e]" : "fill-gray-600"} />
        </g>
      ))}
      {/* LEDs de Status principal */}
      <g transform="translate(60, 24)">
        <circle cx="0" cy="0" r="1.5" className={ledColor} />
        <circle cx="6" cy="0" r="1.2" className={actLed} />
      </g>
      <rect x="58" y="13" width="18" height="2.5" rx="0.5" fill="#ffffff" />
    </svg>
  );
}

// Card do MikroTik Individual
function MikrotikMonitorCard({ mikrotik, index, onDragStart, onDragOver, onDragEnd, onDrop, isDragging }) {
  const [status, setStatus] = useState("loading"); // loading, online, offline
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchStatus = useCallback(async () => {
    setStatus("loading");
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/mikrotiks/${mikrotik.id}/info`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.status === "online") {
          setData(result);
          setStatus("online");
        } else {
          setData({ message: result.message || "Roteador inacessível" });
          setStatus("offline");
        }
      } else {
        setData({ message: "Erro na resposta" });
        setStatus("offline");
      }
    } catch (err) {
      setData({ message: err.message || "Erro de conexão" });
      setStatus("offline");
    }
  }, [mikrotik.id]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const copyIp = () => {
    navigator.clipboard.writeText(mikrotik.ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ramPercent = data && data.totalMemory 
    ? Math.round(((data.totalMemory - data.freeMemory) / data.totalMemory) * 100) 
    : 0;

  const getGaugeColor = (percent) => {
    if (percent > 85) return "stroke-red-500";
    if (percent > 60) return "stroke-amber-500";
    return "stroke-emerald-500";
  };

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, index)}
      className={`bg-[#0d0e15] border ${
        isDragging ? "border-blue-600/40 opacity-40 scale-[0.98]" : "border-gray-800/80 hover:border-gray-700/60"
      } rounded-xl p-4 transition-all duration-300 flex flex-col group relative overflow-hidden shadow-lg shadow-black/25 select-none`}
    >
      {/* Indicador de status de borda superior */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] transition-all duration-500 ${
        status === "online" ? "bg-emerald-500 shadow-[0_1px_8px_rgba(16,185,129,0.3)]" : 
        status === "offline" ? "bg-red-500 shadow-[0_1px_8px_rgba(239,68,68,0.3)]" : "bg-blue-500 animate-pulse"
      }`} />

      {/* Card Header */}
      <div className="flex justify-between items-start gap-3 mb-3.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Drag Handle Icon */}
          <div className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 p-0.5 rounded flex-shrink-0 transition-colors">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-extrabold text-sm group-hover:text-blue-400 transition-colors leading-tight truncate">
              {mikrotik.nome}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
              <span className="font-mono bg-[#07080c] px-1.5 py-0.5 rounded border border-gray-850">{mikrotik.ip}</span>
              <button 
                onClick={copyIp}
                className="p-0.5 rounded hover:bg-[#1a1c27] text-gray-600 hover:text-gray-300 transition-colors"
                title="Copiar IP"
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        {status === "loading" && (
          <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded bg-blue-950/40 text-blue-400 border border-blue-900/20 flex items-center gap-1.5 animate-pulse flex-shrink-0">
            <span className="w-1 h-1 rounded-full bg-blue-400 animate-ping" />
            Checando
          </span>
        )}
        {status === "online" && (
          <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/20 flex items-center gap-1.5 flex-shrink-0">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        )}
        {status === "offline" && (
          <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded bg-red-950/40 text-red-400 border border-red-900/20 flex items-center gap-1.5 flex-shrink-0">
            <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
            Offline
          </span>
        )}
      </div>

      {/* SVG Device Graphic */}
      <div className="mb-4">
        <DeviceVisual model={status === "online" ? data?.modelo : "Generic"} online={status === "online"} />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-between">
        {status === "loading" && (
          <div className="space-y-3 py-2">
            <div className="h-4 bg-gray-800/30 rounded w-2/3 animate-pulse" />
            <div className="h-3 bg-gray-800/30 rounded w-full animate-pulse" />
            <div className="flex gap-3 mt-2">
              <div className="h-14 bg-gray-800/20 rounded-lg w-full animate-pulse" />
              <div className="h-14 bg-gray-800/20 rounded-lg w-full animate-pulse" />
            </div>
          </div>
        )}

        {status === "offline" && (
          <div className="py-3 px-3 bg-red-950/10 border border-red-900/15 rounded-lg text-red-400/90 text-[10px] flex items-start gap-2 mb-3.5">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-500" />
            <div className="min-w-0">
              <p className="font-extrabold mb-0.5">Sem Conexão API</p>
              <p className="text-[9px] text-red-500/70 leading-normal font-mono truncate">
                {data?.message || "Inacessível"}
              </p>
            </div>
          </div>
        )}

        {status === "online" && data && (
          <div className="space-y-3.5 text-xs py-1">
            {/* Model & Version Details */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-[#07080c] p-2 rounded-lg border border-gray-850">
                <span className="text-gray-500 block mb-0.5 uppercase tracking-wider text-[8px] font-black">Modelo</span>
                <span className="text-gray-300 font-extrabold truncate block">{data.modelo}</span>
              </div>
              <div className="bg-[#07080c] p-2 rounded-lg border border-gray-850">
                <span className="text-gray-500 block mb-0.5 uppercase tracking-wider text-[8px] font-black">RouterOS</span>
                <span className="text-gray-300 font-extrabold block truncate">v{data.versao}</span>
              </div>
            </div>

            {/* Circular Gauges */}
            <div className="grid grid-cols-2 gap-3">
              <CircularGauge 
                percent={data.cpuLoad} 
                label="CPU Load" 
                strokeColor={getGaugeColor(data.cpuLoad)} 
                icon={Cpu} 
              />
              <CircularGauge 
                percent={ramPercent} 
                label="Memória RAM" 
                strokeColor={getGaugeColor(ramPercent)} 
                icon={HardDrive} 
              />
            </div>

            {/* Active Users Section */}
            <div className="bg-gradient-to-r from-blue-950/15 to-[#07080c] border border-blue-900/20 p-2.5 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-950/40 flex items-center justify-center border border-blue-900/25">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div>
                  <span className="text-[8px] text-gray-500 uppercase tracking-wider block font-black">Clientes</span>
                  <span className="text-[10px] font-bold text-gray-400">Ativos no Hotspot</span>
                </div>
              </div>
              <span className="text-xl font-black text-blue-400 tracking-tight leading-none pr-1">
                {data.activeUsers}
              </span>
            </div>

            {/* Uptime box */}
            <div className="flex items-center gap-2 text-[9px] text-gray-500 bg-[#07080c] px-3 py-1.5 rounded-lg border border-gray-850 font-bold uppercase tracking-wide">
              <Clock className="w-3 h-3 text-gray-500" />
              <span>Uptime: <span className="text-gray-300 font-mono tracking-tight font-extrabold ml-1">{data.uptime}</span></span>
            </div>
          </div>
        )}

        {/* Card Footer Actions */}
        <div className="border-t border-gray-800/40 pt-3 mt-3 flex items-center justify-between gap-2.5">
          <button
            onClick={fetchStatus}
            disabled={status === "loading"}
            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-[#07080c] border border-gray-850 hover:bg-[#11131c] hover:border-gray-700 text-gray-400 hover:text-white disabled:opacity-50 text-[10px] transition-all cursor-pointer font-bold w-1/2"
          >
            <RefreshCw className={`w-3 h-3 ${status === "loading" ? "animate-spin" : ""}`} />
            Sincronizar
          </button>
          
          <Link
            to={`/admin/${useParams().empresaSlug}/mikrotiks`}
            className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-blue-950/20 border border-blue-900/20 hover:border-blue-700/40 text-blue-400 hover:text-blue-300 text-[10px] font-bold w-1/2 transition-all"
          >
            <Settings className="w-3 h-3" />
            Configurar
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Monitoramento() {
  const { empresaSlug } = useParams();
  const [mikrotiks, setMikrotiks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Carrega e reordena os MikroTiks baseado no localStorage
  const fetchMikrotiksList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/mikrotiks", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        
        // Carrega ordenação salva
        const savedOrder = localStorage.getItem(`mikrotik_order_${empresaSlug}`);
        if (savedOrder) {
          try {
            const orderIds = JSON.parse(savedOrder);
            const orderedData = [];
            
            // Adiciona elementos ordenados
            orderIds.forEach(id => {
              const item = data.find(m => m.id === id);
              if (item) orderedData.push(item);
            });
            
            // Adiciona itens novos que não estavam na ordenação anterior
            data.forEach(item => {
              if (!orderedData.find(m => m.id === item.id)) {
                orderedData.push(item);
              }
            });
            setMikrotiks(orderedData);
          } catch {
            setMikrotiks(data);
          }
        } else {
          setMikrotiks(data);
        }
      } else {
        setError("Não foi possível carregar a lista de MikroTiks");
      }
    } catch {
      setError("Erro ao se comunicar com o servidor");
    } finally {
      setLoading(false);
    }
  }, [empresaSlug]);

  useEffect(() => {
    fetchMikrotiksList();
  }, [fetchMikrotiksList]);

  // Efeito auto-refresh
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        setRefreshKey(prev => prev + 1);
      }, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const handleRefreshAll = () => {
    fetchMikrotiksList().then(() => {
      setRefreshKey(prev => prev + 1);
    });
  };

  // Funções para implementar Native Drag & Drop
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updatedList = [...mikrotiks];
    const draggedItem = updatedList[draggedIndex];
    
    // Move o item de posição
    updatedList.splice(draggedIndex, 1);
    updatedList.splice(targetIndex, 0, draggedItem);

    setMikrotiks(updatedList);
    
    // Salva a ordenação no localStorage
    const orderIds = updatedList.map(m => m.id);
    localStorage.setItem(`mikrotik_order_${empresaSlug}`, JSON.stringify(orderIds));
  };

  return (
    <div className="bg-[#0b0c10] min-h-screen -m-4 lg:-m-8 p-4 lg:p-8">
      <PageHeader 
        icon={<Activity className="w-5 h-5 text-blue-400" />}
        title="Painel de Monitoramento"
        subtitle="Verifique o status, uso de hardware e usuários conectados dos MikroTiks em tempo real. Arraste os cards para reorganizar a ordem de exibição."
      >
        <div className="flex items-center gap-4 bg-[#0d0e15] border border-gray-800/80 px-4 py-2 rounded-xl shadow-md backdrop-blur-sm">
          {/* Auto Refresh Toggle */}
          <label className="flex items-center gap-3 text-xs font-bold text-gray-400 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={() => setAutoRefresh(!autoRefresh)}
              className="sr-only peer"
            />
            <div className="relative w-8 h-4 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white" />
            <span>Auto Refresh (10s)</span>
          </label>

          <span className="h-5 w-px bg-gray-800"></span>

          {/* Refresh All */}
          <button
            onClick={handleRefreshAll}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-blue-950/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Sincronizar Tudo
          </button>
        </div>
      </PageHeader>

      {loading && mikrotiks.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[#0d0e15] border border-gray-850 rounded-xl p-4 space-y-4 shadow-md">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-800/40 rounded w-1/3 animate-pulse" />
                <div className="h-5 bg-gray-800/40 rounded w-1/4 animate-pulse" />
              </div>
              <div className="h-14 bg-gray-850/40 rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-800/30 rounded w-full animate-pulse" />
                <div className="h-3 bg-gray-800/30 rounded w-2/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
          <div className="w-14 h-14 bg-red-950/20 border border-red-900/30 rounded-2xl flex items-center justify-center text-red-500 mb-5 shadow-lg shadow-red-950/10">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-white font-extrabold text-lg mb-2">Erro ao carregar roteadores</h3>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">{error}</p>
          <button 
            onClick={fetchMikrotiksList}
            className="px-5 py-2.5 bg-[#0d0e15] border border-gray-800 hover:border-gray-750 text-white font-bold rounded-xl text-sm transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      ) : mikrotiks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-gray-800 rounded-3xl max-w-lg mx-auto bg-[#0d0e15]/40 mt-6">
          <div className="w-16 h-16 bg-[#0d0e15] border border-gray-850 rounded-2xl flex items-center justify-center text-gray-500 mb-6 shadow-md">
            <WifiOff className="w-8 h-8" />
          </div>
          <h3 className="text-white font-black text-xl mb-2">Nenhum Dispositivo MikroTik</h3>
          <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed">
            Cadastre o seu primeiro MikroTik para começar a gerenciar o Hotspot e monitorar os dados de hardware em tempo real.
          </p>
          <Link
            to={`/admin/${empresaSlug}/mikrotiks`}
            className="flex items-center gap-1.5 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-950/20"
          >
            Configurar MikroTiks
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
          {mikrotiks.map((mk, idx) => (
            <MikrotikMonitorCard 
              key={`${mk.id}-${refreshKey}`} 
              mikrotik={mk} 
              index={idx}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              isDragging={draggedIndex === idx}
            />
          ))}
        </div>
      )}
    </div>
  );
}
