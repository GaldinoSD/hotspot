import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import PageHeader from "../../components/admin/PageHeader";
import { Activity, Settings, Plus, Key, Copy, Check, Trash2, Code, Shield, Network, Server, AlertTriangle, HelpCircle } from "lucide-react";

export default function Wireguard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newPeerName, setNewPeerName] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptData, setScriptData] = useState("");
  const [copied, setCopied] = useState(false);
  const [serverSettings, setServerSettings] = useState({ wgPort: '51820', wgHost: '92.113.34.197' });
  const [editSettings, setEditSettings] = useState({ wgPort: '', wgHost: '' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const token = localStorage.getItem("admin_token");

  const loadStatus = async () => {
    try {
      // In a real scenario we use the token, here the proxy is unprotected for now but we send it anyway
      const res = await fetch("/api/wireguard/status", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Erro ao carregar VPN:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/wireguard/settings", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setServerSettings(data);
      setEditSettings({ wgPort: data.wgPort, wgHost: data.wgHost });
    } catch (err) {
      console.error("Erro ao carregar settings:", err);
    }
  };

  useEffect(() => {
    loadStatus();
    loadSettings();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAddPeer = async (e) => {
    e.preventDefault();
    if (!newPeerName) return;
    try {
      const res = await fetch("/api/wireguard/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newPeerName })
      });
      
      // wg-easy doesn't return the new client ID, we must fetch it from the list
      const statusRes = await fetch("/api/wireguard/status", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statusData = await statusRes.json();
      const createdClient = statusData.clients.find(c => c.name === newPeerName);

      if (!createdClient) throw new Error("Cliente não encontrado");

      const scriptRes = await fetch(`/api/wireguard/clients/${createdClient.id}/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const scriptJson = await scriptRes.json();
      
      setShowAddModal(false);
      setNewPeerName("");
      setScriptData(scriptJson.routerOsScript);
      setShowScriptModal(true);
      loadStatus();
    } catch (err) {
      alert("Erro ao criar peer");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deseja deletar este peer? Isso derrubará a VPN do Mikrotik!")) return;
    try {
      await fetch(`/api/wireguard/clients/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      loadStatus();
    } catch (err) {
      alert("Erro ao deletar");
    }
  };

  const showScript = async (id) => {
    try {
      const scriptRes = await fetch(`/api/wireguard/clients/${id}/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const scriptJson = await scriptRes.json();
      setScriptData(scriptJson.routerOsScript);
      setShowScriptModal(true);
    } catch (err) {
      alert("Erro ao carregar script");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptData);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading && !status) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center p-12 bg-[#07090e] min-h-screen text-slate-400">
          <div className="inline-block w-8 h-8 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-mono uppercase tracking-widest">Carregando túneis VPN...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        <PageHeader
          title="VPN WireGuard"
          subtitle="Gerenciamento de túneis VPN para Mikrotiks"
          icon={
            <Shield className="w-5 h-5 text-blue-400" />
          }
        >
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2.5 bg-[#111420] border border-slate-800 text-slate-300 hover:text-white rounded-sm hover:bg-slate-900 hover:border-slate-700 transition-colors text-xs uppercase tracking-wider font-bold flex items-center gap-2 cursor-pointer animate-fade-in"
            >
              <Settings className="w-4 h-4" />
              Configurações
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-sm hover:bg-blue-500 text-xs uppercase tracking-wider font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 animate-fade-in"
            >
              <Plus className="w-4 h-4" />
              Adicionar Peer
            </button>
          </div>
        </PageHeader>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-[#111420] rounded-sm p-5 border border-slate-800/80 mb-4 shadow-md animate-fade-in-up">
            <h3 className="text-xs font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2 pb-2 border-b border-slate-800/60">
              <Settings className="w-4 h-4 text-blue-500" />
              Configurações do Servidor VPN
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1.5">IP Público / Domínio</label>
                <input
                  className="w-full bg-[#07090e] border border-slate-800 text-slate-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/50 transition-all font-mono"
                  value={editSettings.wgHost}
                  onChange={(e) => setEditSettings({...editSettings, wgHost: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1.5">Porta UDP do WireGuard</label>
                <input
                  type="number"
                  className="w-full bg-[#07090e] border border-slate-800 text-slate-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/50 transition-all font-mono"
                  value={editSettings.wgPort}
                  onChange={(e) => setEditSettings({...editSettings, wgPort: e.target.value})}
                  min="1024"
                  max="65535"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-800/60">
              <button
                disabled={savingSettings}
                onClick={async () => {
                  setSavingSettings(true);
                  try {
                    const res = await fetch("/api/wireguard/settings", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify(editSettings)
                    });
                    const data = await res.json();
                    if (data.success) {
                      setServerSettings(data.settings);
                      alert("Configurações salvas! O servidor WireGuard foi reiniciado.");
                      loadStatus();
                    } else {
                      alert("Erro: " + (data.message || "Falha ao salvar"));
                    }
                  } catch (err) {
                    alert("Erro ao salvar configurações");
                  } finally {
                    setSavingSettings(false);
                  }
                }}
                className="px-4 py-2.5 bg-blue-600 text-white text-xs uppercase tracking-wider font-bold rounded-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer transition-colors"
              >
                {savingSettings ? (
                  <>
                    <div className="w-3 h-3 border border-slate-700 border-t-white rounded-full animate-spin"></div>
                    Reiniciando VPN...
                  </>
                ) : 'Salvar e Reiniciar VPN'}
              </button>
              <p className="text-[10px] text-amber-500 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> Alterar a porta desconectará os peers ativos temporariamente.
              </p>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-[#111420] border border-slate-800/80 rounded-sm p-5 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-500 block mb-1">Sub-rede VPN</span>
              <span className="text-xl font-mono font-bold text-white">{status?.server?.subNet}</span>
            </div>
            <div className="w-10 h-10 rounded-sm bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Network className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#111420] border border-slate-800/80 rounded-sm p-5 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-500 block mb-1">Endpoint de Conexão</span>
              <span className="text-xl font-mono font-bold text-blue-400">{status?.server?.endpoint}</span>
            </div>
            <div className="w-10 h-10 rounded-sm bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Server className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#111420] border border-slate-800/80 rounded-sm p-5 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-500 block mb-1">IP do Servidor / Peers</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl font-mono font-bold text-white">{status?.server?.address}</span>
                <span className="text-[10px] text-slate-500 font-bold select-none">
                  ({status?.clients?.filter(c => c.latestHandshakeAt && (new Date() - new Date(c.latestHandshakeAt)) < 180000).length} / {status?.clients?.length} Online)
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Public Key Bar */}
        <div className="bg-[#111420] border border-slate-800/80 rounded-sm p-4 mb-6 shadow-md flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[9px] uppercase font-black tracking-widest text-slate-500 mb-0.5">Chave Pública do Servidor (wg0.pub)</h3>
            <p className="text-xs font-mono text-slate-300 truncate select-all">{status?.server?.publicKey}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111420] border border-slate-800/80 rounded-sm overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-950/40 text-slate-500 border-b border-slate-800 text-[9px] uppercase tracking-widest font-bold">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Identificação</th>
                  <th className="px-6 py-4">IP VPN</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Último Handshake</th>
                  <th className="px-6 py-4">Tráfego</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {status?.clients?.map((client) => {
                  const isOnline = client.latestHandshakeAt && (new Date() - new Date(client.latestHandshakeAt)) < 180000; // 3 min
                  return (
                    <tr key={client.id} className="border-b border-slate-800/30 odd:bg-[#111420] even:bg-[#141724] hover:bg-[#191e30] transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            {isOnline && (
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            )}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-white text-sm tracking-tight">{client.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">{client.address}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 text-[9px] uppercase font-bold rounded-sm select-none">
                          MikroTik
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {client.latestHandshakeAt ? new Date(client.latestHandshakeAt).toLocaleString('pt-BR') : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        <span className="text-emerald-400 font-semibold">⬇ {formatBytes(client.transferRx)}</span>
                        <span className="text-slate-600 mx-1.5">•</span>
                        <span className="text-blue-400 font-semibold">⬆ {formatBytes(client.transferTx)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => showScript(client.id)} 
                            className="p-1.5 text-blue-400 hover:text-blue-300 bg-blue-950/30 border border-blue-900/50 hover:bg-blue-950/60 hover:border-blue-700 rounded-sm cursor-pointer transition-all duration-150" 
                            title="Script de Conexão Mikrotik"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(client.id)} 
                            className="p-1.5 text-red-400 hover:text-red-300 bg-red-950/30 border border-red-900/50 hover:bg-red-950/60 hover:border-red-700 rounded-sm cursor-pointer transition-all duration-150" 
                            title="Deletar Peer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {(!status?.clients || status.clients.length === 0) && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500 font-mono text-xs bg-[#111420]">
                      Nenhum Mikrotik (peer) conectado à VPN.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-[#0f131f] border border-slate-800 w-full max-w-md p-6 rounded-sm shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800/60 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Adicionar Novo Peer</h3>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-slate-400 hover:text-white transition-colors text-lg"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddPeer} className="space-y-4">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1.5">Identificação (Nome do Mikrotik)</label>
                <input
                  autoFocus
                  placeholder="Ex: RB-Torre-Centro"
                  className="w-full bg-[#07090e] border border-slate-800 text-slate-200 px-3 py-2.5 rounded-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/50 transition-all text-sm font-semibold"
                  value={newPeerName}
                  onChange={(e) => setNewPeerName(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800/60 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="px-4 py-2.5 border border-slate-800 text-slate-400 rounded-sm hover:bg-slate-900 hover:text-slate-200 transition-colors text-xs uppercase tracking-wider font-bold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-500 rounded-sm transition-colors text-xs uppercase tracking-wider font-bold"
                >
                  Criar e Gerar Script
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Script Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-[#0f131f] border border-slate-800 w-full max-w-2xl p-6 rounded-sm shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800/60 pb-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Script de Instalação Rápida</h3>
              <button 
                onClick={() => setShowScriptModal(false)} 
                className="text-slate-400 hover:text-white transition-colors text-lg"
              >
                ×
              </button>
            </div>
            
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Copie o código abaixo e cole no console (<strong className="text-white">New Terminal</strong>) do seu Mikrotik. Ele criará as interfaces e conectará a VPN automaticamente.
            </p>
            
            <div className="bg-[#07090e] border border-slate-800/60 rounded-sm p-4 relative group">
              <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap overflow-y-auto max-h-80 select-all leading-relaxed pr-10">
                {scriptData}
              </pre>
              
              <button 
                onClick={copyToClipboard}
                className="absolute top-3 right-3 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-sm shadow-md transition-all active:scale-95 flex items-center justify-center"
                title="Copiar Script"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-800/60 mt-6">
              <button 
                onClick={() => setShowScriptModal(false)} 
                className="px-5 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors rounded-sm text-xs uppercase tracking-wider font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
