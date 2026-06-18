import React, { useState, useEffect } from "react";
import axios from "axios";

const STEPS = [
  "Selecionar MikroTik",
  "Escanear Rede",
  "Interface e IP",
  "Configurar RADIUS",
  "Deploy",
];

export default function HotspotWizard({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [mikrotiks, setMikrotiks] = useState([]);
  const [selectedMikrotik, setSelectedMikrotik] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState(null);
  const [config, setConfig] = useState({
    interface: "",
    localAddress: "10.5.50.1/24",
    poolName: "hs-pool",
    poolRange: "10.5.50.2-10.5.50.254",
    radiusServerIp: "10.8.0.1",
    radiusPort: 1812,
    radiusSecret: "",
    dnsName: "",
  });

  useEffect(() => {
    if (isOpen) {
      axios.get("/api/mikrotiks").then(res => {
        setMikrotiks(Array.isArray(res.data) ? res.data : res.data.mikrotiks || []);
      }).catch(() => {});
    }
  }, [isOpen]);

  const handleScan = async () => {
    if (!selectedMikrotik) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await axios.get(`/api/mikrotiks/${selectedMikrotik.id}/scan`);
      setScanResult(res.data);
      if (res.data.interfaces?.length > 0) {
        setConfig(c => ({ ...c, interface: res.data.interfaces[0].name || res.data.interfaces[0].defaultName || "ether2" }));
      }
      if (res.data.pools?.length > 0) {
        setConfig(c => ({ ...c, poolName: res.data.pools[0].name, poolRange: res.data.pools[0].ranges }));
      }
    } catch (err) {
      setScanResult({ error: err.response?.data?.message || err.message });
    }
    setScanning(false);
  };

  const handleDeploy = async () => {
    if (!selectedMikrotik) return;
    setDeploying(true);
    setDeployResult(null);
    try {
      const res = await axios.post(`/api/mikrotiks/${selectedMikrotik.id}/enviar-hotspot`, config);
      setDeployResult(res.data);
    } catch (err) {
      setDeployResult({ success: false, error: err.response?.data?.message || err.message });
    }
    setDeploying(false);
  };

  if (!isOpen) return null;

  const canNext = () => {
    if (currentStep === 0) return !!selectedMikrotik;
    if (currentStep === 1) return !!scanResult && !scanResult.error;
    if (currentStep === 2) return !!config.interface;
    return true;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container max-w-2xl">
        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-title">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Wizard de Hotspot
          </h3>
          <button onClick={onClose} className="modal-close-btn" title="Fechar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center px-6 py-4 gap-2 border-b border-gray-800/40 bg-[#10121b]/40 overflow-x-auto shrink-0 custom-scrollbar">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                i === currentStep ? "bg-emerald-600 text-white" :
                i < currentStep ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/30" :
                "bg-gray-950/60 text-gray-500 border border-gray-900/30"
              }`}>
                {i < currentStep ? "\u2713" : i + 1}
              </div>
              <span className={`ml-1.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${i === currentStep ? "text-white" : "text-gray-500"}`}>
                {step}
              </span>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-[#26293c] mx-2 shrink-0" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="modal-body space-y-4">
          {/* Step 0: Select MikroTik */}
          {currentStep === 0 && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Selecione o MikroTik</label>
              <select
                value={selectedMikrotik?.id || ""}
                onChange={(e) => {
                  const mk = mikrotiks.find(m => m.id === Number(e.target.value));
                  setSelectedMikrotik(mk || null);
                  setConfig(c => ({ ...c, radiusSecret: mk?.senha || "" }));
                }}
                className="w-full px-4 py-2.5 text-white rounded-xl focus:outline-none text-xs transition-all cursor-pointer"
              >
                <option value="">-- Selecione --</option>
                {mikrotiks.map(mk => (
                  <option key={mk.id} value={mk.id}>{mk.nome || mk.ip} ({mk.ip})</option>
                ))}
              </select>
              {selectedMikrotik && (
                <div className="mt-3 p-3.5 bg-[#0f1017] rounded-xl border border-gray-800 text-xs text-gray-300 font-mono space-y-1">
                  <p>IP: {selectedMikrotik.ip}</p>
                  <p>Porta: {selectedMikrotik.porta || 8728}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Scan Network */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <button
                onClick={handleScan}
                disabled={scanning}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                {scanning ? "Escaneando..." : "Escanear Rede"}
              </button>
              {scanResult && scanResult.error && (
                <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-red-400 text-xs font-semibold">
                  {scanResult.error}
                </div>
              )}
              {scanResult && !scanResult.error && (
                <div className="space-y-3">
                  <div>
                    <h4 className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Interfaces ({scanResult.interfaces?.length || 0})</h4>
                    <div className="bg-[#0f1017] rounded-xl border border-gray-800 max-h-40 overflow-y-auto custom-scrollbar divide-y divide-gray-800/40">
                      {(scanResult.interfaces || []).map((iface, i) => (
                        <div key={i} className="px-3.5 py-2 text-xs text-gray-300">
                          {iface.name || iface.defaultName} {iface.type ? `(${iface.type})` : ""} {iface.running === "true" ? " - UP" : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pools ({scanResult.pools?.length || 0})</h4>
                    <div className="bg-[#0f1017] rounded-xl border border-gray-800 max-h-40 overflow-y-auto custom-scrollbar divide-y divide-gray-800/40">
                      {(scanResult.pools || []).map((pool, i) => (
                        <div key={i} className="px-3.5 py-2 text-xs text-gray-300">
                          {pool.name}: {pool.ranges}
                        </div>
                      ))}
                      {(!scanResult.pools || scanResult.pools.length === 0) && (
                        <div className="px-3.5 py-2.5 text-xs text-gray-500 italic">Nenhum pool encontrado</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Interface and IP Settings */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Interface</label>
                <select
                  value={config.interface}
                  onChange={(e) => setConfig({ ...config, interface: e.target.value })}
                  className="w-full px-4 py-2.5 text-white rounded-xl focus:outline-none text-xs transition-all cursor-pointer"
                >
                  {(scanResult?.interfaces || []).map((iface, i) => (
                    <option key={i} value={iface.name || iface.defaultName}>
                      {iface.name || iface.defaultName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Endereço Local (CIDR)</label>
                <input
                  type="text"
                  value={config.localAddress}
                  onChange={(e) => setConfig({ ...config, localAddress: e.target.value })}
                  className="w-full px-4 py-2.5 text-white rounded-xl focus:outline-none text-xs transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Nome do Pool</label>
                <input
                  type="text"
                  value={config.poolName}
                  onChange={(e) => setConfig({ ...config, poolName: e.target.value })}
                  className="w-full px-4 py-2.5 text-white rounded-xl focus:outline-none text-xs transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Range do Pool</label>
                <input
                  type="text"
                  value={config.poolRange}
                  onChange={(e) => setConfig({ ...config, poolRange: e.target.value })}
                  className="w-full px-4 py-2.5 text-white rounded-xl focus:outline-none text-xs transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">DNS Name (opcional)</label>
                <input
                  type="text"
                  value={config.dnsName}
                  onChange={(e) => setConfig({ ...config, dnsName: e.target.value })}
                  className="w-full px-4 py-2.5 text-white rounded-xl focus:outline-none text-xs transition-all"
                  placeholder="hotspot.meudominio.com"
                />
              </div>
            </div>
          )}

          {/* Step 3: RADIUS Configuration */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0f1017] rounded-xl border border-gray-800">
                <h4 className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Configuração RADIUS</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-400 text-xs mb-1.5">Servidor RADIUS IP</label>
                    <input
                      type="text"
                      value={config.radiusServerIp}
                      onChange={(e) => setConfig({ ...config, radiusServerIp: e.target.value })}
                      className="w-full px-4 py-2.5 text-white rounded-xl focus:outline-none text-xs transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1.5">Porta</label>
                    <input
                      type="number"
                      value={config.radiusPort}
                      onChange={(e) => setConfig({ ...config, radiusPort: parseInt(e.target.value) || 1812 })}
                      className="w-full px-4 py-2.5 text-white rounded-xl focus:outline-none text-xs transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs mb-1.5">Secret</label>
                    <input
                      type="text"
                      value={config.radiusSecret}
                      onChange={(e) => setConfig({ ...config, radiusSecret: e.target.value })}
                      className="w-full px-4 py-2.5 text-white rounded-xl focus:outline-none text-xs transition-all"
                      placeholder="Senha do MikroTik"
                    />
                  </div>
                </div>
              </div>
              <p className="text-gray-500 text-[10px] leading-relaxed">
                O RADIUS será configurado no MikroTik para apontar para o servidor acima.
                Para VPN, use o IP do túnel (ex: 10.8.0.1).
              </p>
            </div>
          )}

          {/* Step 4: Deploy */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-[#0f1017] rounded-xl border border-gray-800 text-xs text-gray-300 font-mono space-y-1.5">
                <p><strong>MikroTik:</strong> {selectedMikrotik?.nome || selectedMikrotik?.ip}</p>
                <p><strong>Interface:</strong> {config.interface}</p>
                <p><strong>IP:</strong> {config.localAddress}</p>
                <p><strong>Pool:</strong> {config.poolName} ({config.poolRange})</p>
                <p><strong>RADIUS:</strong> {config.radiusServerIp}:{config.radiusPort}</p>
              </div>

              {!deployResult && (
                <button
                  onClick={handleDeploy}
                  disabled={deploying}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 transition-all cursor-pointer"
                >
                  {deploying ? "Deployando..." : "Iniciar Deploy"}
                </button>
              )}

              {deployResult && (
                <div className="space-y-3">
                  <div className={`p-3.5 rounded-xl border text-xs font-semibold ${
                    deployResult.success
                      ? "bg-green-950/20 border-green-900/30 text-green-400"
                      : "bg-red-955/20 border-red-900/30 text-red-400"
                  }`}>
                    {deployResult.success ? "Deploy concluído com sucesso!" : `Erro: ${deployResult.error || "Falha no deploy"}`}
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                    {(deployResult.steps || deployResult.log || []).map((item, i) => {
                      const step = typeof item === "string" ? { message: item, status: "ok" } : item;
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs py-1">
                          <span className={step.status === "ok" ? "text-emerald-400" : "text-red-400 font-bold"}>
                            {step.status === "ok" ? "\u2713" : "\u2717"}
                          </span>
                          <span className="text-gray-300 font-medium">{step.message}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-transparent hover:bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-30 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Voltar
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-transparent hover:bg-gray-900 border border-gray-800 text-gray-400 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Fechar
            </button>
            {currentStep < STEPS.length - 1 && (
              <button
                onClick={() => setCurrentStep(s => s + 1)}
                disabled={!canNext()}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 transition-all cursor-pointer"
              >
                Próximo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
