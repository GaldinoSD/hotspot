import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import PageHeader from "../../components/admin/PageHeader";
import { 
  Router as RouterIcon, 
  Users, 
  Activity, 
  Sliders, 
  Play, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Edit, 
  Trash2,
  Cpu,
  Upload
} from "lucide-react";

export default function Mikrotiks() {
  const [mikrotiks, setMikrotiks] = useState([]);
  const [portais, setPortais] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showGerenciarModal, setShowGerenciarModal] = useState(false);
  const [selectedMikrotik, setSelectedMikrotik] = useState(null);
  const [hotspotLog, setHotspotLog] = useState([]);
  const [enviandoHotspot, setEnviandoHotspot] = useState(null);
  const [enviandoLogin, setEnviandoLogin] = useState(null);
  const [enviandoStatus, setEnviandoStatus] = useState(null);
  const [mikrotikInfo, setMikrotikInfo] = useState(null);
  const [form, setForm] = useState({ nome: "", ip: "", usuario: "", senha: "", porta: 8728, end_hotspot: "", portal_id: "" });
  const [erro, setErro] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  const token = localStorage.getItem("admin_token");

  const carregarPortais = async () => {
    try {
      const res = await fetch("/api/portais", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setPortais(data);
    } catch (err) { console.error(err); }
  };

  // Wizard states
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardMikrotikId, setWizardMikrotikId] = useState(null);
  const [scanData, setScanData] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [wizardConfig, setWizardConfig] = useState({
    interface: "", localAddress: "10.5.50.1/24", poolName: "hs-pool", poolRange: "10.5.50.2-10.5.50.254", dnsName: ""
  });

  const abrirWizard = async (id) => {
    setWizardMikrotikId(id);
    setScanning(true);
    setScanData(null);
    setShowWizard(true);
    setWizardStep(0);
    setWizardConfig({ interface: "", localAddress: "10.5.50.1/24", poolName: "hs-pool", poolRange: "10.5.50.2-10.5.50.254", dnsName: "" });

    try {
      const res = await fetch(`/api/mikrotiks/${id}/scan`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message); setShowWizard(false); return; }
      setScanData(data);
      if (data.interfaces?.length > 0) {
        setWizardConfig(c => ({ ...c, interface: data.interfaces[0]?.name || "ether2" }));
      }
      if (data.pools?.length > 0) {
        setWizardConfig(c => ({ ...c, poolName: data.pools[0].name, poolRange: data.pools[0].ranges }));
      }
    } catch (err) {
      alert("Erro ao escanear Mikrotik");
      setShowWizard(false);
    } finally {
      setScanning(false);
    }
  };

  const executarWizard = async () => {
    setEnviandoHotspot(wizardMikrotikId);
    setShowWizard(false);
    setHotspotLog([]);
    setShowLogModal(true);

    try {
      const res = await fetch(`/api/mikrotiks/${wizardMikrotikId}/enviar-hotspot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(wizardConfig),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "step") {
              setHotspotLog(prev => [...prev, `[${event.status}] ${event.message}`]);
            } else if (event.type === "error") {
              setHotspotLog(prev => [...prev, `[erro] ${event.message}`]);
            } else if (event.type === "done") {
              if (event.success) {
                setHotspotLog(prev => [...prev, "--- Configuracao finalizada com sucesso! ---"]);
              }
              carregarMikrotiks();
            }
          } catch (e) { /* parse error, ignora */ }
        }
      }
    } catch (err) {
      setHotspotLog(prev => [...prev, `[erro] Falha de conexao: ${err.message}`]);
    } finally {
      setEnviandoHotspot(null);
    }
  };

  const carregarMikrotiks = async () => {
    try {
      const res = await fetch("/api/mikrotiks", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      // Inicia todos com status "loading"
      const mikrotiksComStatus = data.map(m => ({ ...m, status: "loading" }));
      setMikrotiks(mikrotiksComStatus);

      // Testa conexão de cada Mikrotik
      for (const m of data) {
        try {
          const res = await fetch(`/api/mikrotiks/${m.id}/testar`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          });
          setMikrotiks(prev => prev.map(item =>
            item.id === m.id
              ? { ...item, status: res.ok ? "online" : "offline" }
              : item
          ));
        } catch {
          setMikrotiks(prev => prev.map(item =>
            item.id === m.id
              ? { ...item, status: "offline" }
              : item
          ));
        }
      }
    } catch (err) {
      setErro("Erro ao buscar Mikrotiks");
    }
  };

  useEffect(() => {
    carregarMikrotiks();
    carregarPortais();
  }, []);

  const salvarMikrotik = async (e) => {
    e.preventDefault();
    setErro("");

    const method = editandoId ? "PUT" : "POST";
    const url = editandoId ? `/api/mikrotiks/${editandoId}` : "/api/mikrotiks";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.message || "Erro ao salvar");
      } else {
        setShowModal(false);
        setForm({ nome: "", ip: "", usuario: "", senha: "", porta: 8728, end_hotspot: "", portal_id: "" });
        setEditandoId(null);
        carregarMikrotiks();
      }
    } catch {
      setErro("Erro de conexão");
    }
  };

  const editar = (mikrotik) => {
    setForm({ 
      nome: mikrotik.nome, 
      ip: mikrotik.ip, 
      usuario: mikrotik.usuario, 
      senha: "", // Não trazer senha por segurança
      porta: mikrotik.porta || 8728, 
      end_hotspot: mikrotik.end_hotspot || "", 
      portal_id: mikrotik.portal_id || "" 
    });
    setEditandoId(mikrotik.id);
    setShowModal(true);
  };

  const remover = async (id) => {
    if (!confirm("Deseja realmente remover este Mikrotik?")) return;
    try {
      await fetch(`/api/mikrotiks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      carregarMikrotiks();
    } catch {
      alert("Erro ao deletar Mikrotik");
    }
  };

  const testarConexao = async (id) => {
    try {
      const res = await fetch(`/api/mikrotiks/${id}/testar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        alert("✅ Conexão bem-sucedida com o Mikrotik.");
        carregarMikrotiks();
      } else {
        alert(`❌ Falha: ${data.message}`);
      }
    } catch {
      alert("Erro ao testar conexão");
    }
  };

  const abrirInfo = async (id) => {
    try {
      const res = await fetch(`/api/mikrotiks/${id}/info`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMikrotikInfo(data);
        setShowInfoModal(true);
      } else {
        alert(`Erro ao obter informações: ${data.message}`);
      }
    } catch {
      alert("Erro ao conectar ao Mikrotik");
    }
  };

  const enviarLogin = async (id) => {
    setEnviandoLogin(id);
    try {
      const res = await fetch(`/api/mikrotiks/${id}/enviar-login`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      alert(data.message);
    } catch {
      alert("Erro de conexão ao enviar login.html");
    } finally {
      setEnviandoLogin(null);
    }
  };

  const enviarStatus = async (id) => {
    setEnviandoStatus(id);
    try {
      const res = await fetch(`/api/mikrotiks/${id}/enviar-status`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      alert(data.message);
    } catch {
      alert("Erro de conexão ao enviar status.html");
    } finally {
      setEnviandoStatus(null);
    }
  };

  const abrirGerenciar = (mikrotik) => {
    setSelectedMikrotik(mikrotik);
    setShowGerenciarModal(true);
  };

  const stats = {
    total: mikrotiks.length,
    online: mikrotiks.filter(m => m.status === "online").length,
    offline: mikrotiks.filter(m => m.status === "offline").length,
    ativos: mikrotiks.reduce((acc, m) => acc + (m.usuarios_ativos || 0), 0)
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="MikroTiks Roteadores"
          subtitle="Equipamentos cadastrados e configurações de rede"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg>
          }
        >
          <button
            onClick={() => { 
              setShowModal(true); 
              setForm({ nome: "", ip: "", usuario: "", senha: "", porta: 8728, end_hotspot: "", portal_id: "" }); 
              setEditandoId(null); 
            }}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 text-sm font-medium flex items-center gap-2 transition-all shadow-md animate-duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            Adicionar MikroTik
          </button>
        </PageHeader>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-gradient-to-br from-[#1b1e2c] to-[#121420] rounded-2xl border border-blue-900/25 p-5 shadow-lg relative overflow-hidden group hover:border-blue-700/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl transform translate-x-4 -translate-y-4"></div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total de Equipamentos</span>
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400"><RouterIcon className="w-4 h-4" /></div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-white group-hover:scale-[1.02] transition-transform duration-200">{stats.total}</div>
              <div className="text-[10px] text-gray-500 mt-1">Roteadores na base de dados</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#122220] to-[#0e171b] rounded-2xl border border-emerald-900/25 p-5 shadow-lg relative overflow-hidden group hover:border-emerald-700/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl transform translate-x-4 -translate-y-4"></div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Saúde do Roteador</span>
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400"><Activity className="w-4 h-4" /></div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-emerald-400 group-hover:scale-[1.02] transition-transform duration-200">
                {stats.online} <span className="text-sm font-semibold text-gray-500">online</span>
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                {stats.offline > 0 ? `${stats.offline} roteador(es) offline` : "Todos os dispositivos online"}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#11202c] to-[#0d151f] rounded-2xl border border-cyan-900/25 p-5 shadow-lg relative overflow-hidden group hover:border-cyan-700/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl transform translate-x-4 -translate-y-4"></div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Usuários Ativos</span>
              <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400"><Users className="w-4 h-4" /></div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-cyan-400 group-hover:scale-[1.02] transition-transform duration-200">{stats.ativos}</div>
              <div className="text-[10px] text-gray-500 mt-1">Navegando via RADIUS local</div>
            </div>
          </div>
        </div>

        {/* Equipamentos */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <span className="text-gray-300">📶</span> Equipamentos Configurados
          </h2>
          
          {erro && (
            <div className="bg-red-950/20 border border-red-800/40 text-red-400 rounded-xl p-4 mb-4 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {erro}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#11141e] border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Identificador</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Endereço IP</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Portal Vinculado</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status API</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Ativos</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider pr-8">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-sans">
                {mikrotiks.map((m) => (
                  <tr key={m.id} className="hover:bg-[#1f2330]/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-white">{m.nome}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-400">{m.ip}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {m.portal_nome ? (
                        <span className="text-[10px] px-2 py-0.5 rounded border border-blue-800/50 bg-blue-900/20 text-blue-400 font-semibold">{m.portal_nome}</span>
                      ) : (
                        <span className="text-[10px] text-gray-600">Nenhum</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {m.status === "loading" ? (
                        <span className="text-gray-500 text-xs flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-pulse"></span>
                          Verificando...
                        </span>
                      ) : m.status === "online" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 shadow-[0_0_12px_-3px_rgba(16,185,129,0.2)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-950/40 text-red-400 border border-red-800/40 shadow-[0_0_12px_-3px_rgba(239,68,68,0.2)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                          Offline
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-300">{m.usuarios_ativos}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right pr-6" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => abrirGerenciar(m)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer rounded-xl border border-gray-800 hover:border-gray-700"
                      >
                        Gerenciar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Gerenciar Roteador Modal */}
      {showGerenciarModal && selectedMikrotik && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] rounded-2xl border border-gray-700 w-full max-w-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5 pb-2 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <RouterIcon className="w-5 h-5 text-blue-400" />
                Gerenciar Roteador: {selectedMikrotik.nome}
              </h3>
              <button onClick={() => setShowGerenciarModal(false)} className="text-gray-400 hover:text-white text-lg">×</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed text-gray-400">
              {/* Coluna 1: Instalação */}
              <div className="space-y-3">
                <h6 className="font-bold text-gray-300 uppercase tracking-widest text-[8px] border-b border-gray-800 pb-1 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  Instalação e Carga
                </h6>
                <div className="space-y-2">
                  <div>
                    <button 
                      onClick={() => {
                        setShowGerenciarModal(false);
                        abrirWizard(selectedMikrotik.id);
                      }} 
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      disabled={enviandoHotspot === selectedMikrotik.id}
                    >
                      <Play className="w-3.5 h-3.5" />
                      {enviandoHotspot === selectedMikrotik.id ? "Executando..." : "Assistente Hotspot"}
                    </button>
                    <span className="text-[9px] text-gray-500 block mt-1">Configura RADIUS, Walled Garden e perfis de login.</span>
                  </div>
                  <div>
                    <button 
                      onClick={() => enviarLogin(selectedMikrotik.id)} 
                      className="w-full py-2.5 bg-green-700 hover:bg-green-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                      disabled={enviandoLogin !== null}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {enviandoLogin === selectedMikrotik.id ? "Enviando..." : "Enviar login.html"}
                    </button>
                    <span className="text-[9px] text-gray-500 block mt-1">Carrega a página HTML do login captive para o roteador.</span>
                  </div>
                  <div>
                    <button 
                      onClick={() => enviarStatus(selectedMikrotik.id)} 
                      className="w-full py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                      disabled={enviandoStatus !== null}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {enviandoStatus === selectedMikrotik.id ? "Enviando..." : "Enviar status.html"}
                    </button>
                    <span className="text-[9px] text-gray-500 block mt-1">Carrega a página HTML do status da conexão para o roteador.</span>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Conexão */}
              <div className="space-y-3">
                <h6 className="font-bold text-gray-300 uppercase tracking-widest text-[8px] border-b border-gray-800 pb-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Conectividade & Dados
                </h6>
                <div className="space-y-3">
                  <button 
                    onClick={() => testarConexao(selectedMikrotik.id)} 
                    className="w-full py-2.5 border border-gray-800 hover:border-gray-700 bg-gray-900/40 hover:bg-gray-900/80 text-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    Testar Conexão API
                  </button>
                  <button 
                    onClick={() => {
                      setShowGerenciarModal(false);
                      editar(selectedMikrotik);
                    }} 
                    className="w-full py-2.5 border border-gray-800 hover:border-gray-700 bg-gray-900/40 hover:bg-gray-900/80 text-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5 text-amber-500" />
                    Editar Parâmetros
                  </button>
                </div>
                <div className="bg-black/35 p-3 rounded-xl border border-gray-900 space-y-1.5 mt-2">
                  <p className="text-[9.5px]"><span className="text-gray-500">Credenciais API:</span> <span className="font-mono text-gray-300">{selectedMikrotik.usuario} (porta {selectedMikrotik.porta})</span></p>
                  <p className="text-[9.5px]"><span className="text-gray-500">IP de Conexão:</span> <span className="font-mono text-gray-300">{selectedMikrotik.ip}</span></p>
                  <p className="text-[9.5px]"><span className="text-gray-500">Redirecionamento:</span> <span className="font-mono text-gray-300 break-all">{selectedMikrotik.end_hotspot || "Sem URL cadastrada"}</span></p>
                </div>
              </div>

              {/* Coluna 3: Hardware */}
              <div className="space-y-3">
                <h6 className="font-bold text-gray-300 uppercase tracking-widest text-[8px] border-b border-gray-800 pb-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Monitoramento & Exclusão
                </h6>
                <div className="space-y-4">
                  <div>
                    <button 
                      onClick={() => abrirInfo(selectedMikrotik.id)} 
                      className="w-full py-2.5 border border-gray-800 hover:border-gray-700 bg-gray-900/40 hover:bg-gray-900/80 text-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Info className="w-3.5 h-3.5 text-blue-400" />
                      Consultar Hardware
                    </button>
                    <span className="text-[9px] text-gray-500 block mt-1">Obtém modelo do MikroTik, versão do RouterOS, uptime e uso de CPU.</span>
                  </div>

                  <div className="border-t border-gray-800/80 pt-3">
                    <button 
                      onClick={() => {
                        if (confirm("Deseja realmente remover este Mikrotik?")) {
                          remover(selectedMikrotik.id);
                          setShowGerenciarModal(false);
                        }
                      }} 
                      className="w-full py-2.5 border border-red-900/30 hover:border-red-900/50 bg-red-950/20 hover:bg-red-950/35 text-red-400 hover:text-red-300 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remover Roteador
                    </button>
                    <span className="text-[9px] text-gray-600 block mt-1">Exclui o roteador do painel (não altera configurações físicas no aparelho).</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-800/80 mt-6">
              <button
                type="button"
                onClick={() => setShowGerenciarModal(false)}
                className="px-5 py-2.5 border border-gray-800 hover:bg-[#151821] text-gray-300 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Hardware Modal */}
      {showInfoModal && mikrotikInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] rounded-2xl border border-gray-700 w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5 pb-2 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-400" />
                Informações de Hardware
              </h3>
              <button onClick={() => setShowInfoModal(false)} className="text-gray-400 hover:text-white text-lg">×</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0d1117] p-4 rounded-xl border border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Modelo</p>
                <p className="font-bold text-white mt-1">{mikrotikInfo.modelo}</p>
              </div>
              <div className="bg-[#0d1117] p-4 rounded-xl border border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Versão do RouterOS</p>
                <p className="font-bold text-white mt-1">{mikrotikInfo.versao}</p>
              </div>
              <div className="bg-[#0d1117] p-4 rounded-xl border border-gray-800 col-span-2">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Uptime do Roteador</p>
                <p className="font-bold text-emerald-400 mt-1">{mikrotikInfo.uptime}</p>
              </div>
              <div className="bg-[#0d1117] p-4 rounded-xl border border-gray-800 col-span-2">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Frequência da CPU</p>
                <p className="font-bold text-white mt-1">{mikrotikInfo.cpu}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] rounded-2xl border border-gray-700 w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5 pb-2 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                {editandoId ? "Editar MikroTik" : "Adicionar MikroTik"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white text-lg">×</button>
            </div>

            <form onSubmit={salvarMikrotik} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Identificador do Roteador</label>
                <input
                  placeholder="Ex: MikroTik Principal"
                  className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-all"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Endereço IP Privado Local</label>
                <input
                  placeholder="192.168.88.1"
                  className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-all font-mono"
                  value={form.ip}
                  onChange={(e) => setForm({ ...form, ip: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1.5">Usuário API</label>
                  <input
                    className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-all"
                    value={form.usuario}
                    onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                    required
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs text-gray-400 mb-1.5">Porta API</label>
                  <input
                    type="number"
                    className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-all font-mono"
                    value={form.porta}
                    onChange={(e) => setForm({ ...form, porta: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Senha de API</label>
                <input
                  type="password"
                  placeholder={editandoId ? "Preencha apenas para alterar a senha" : "Senha da API do MikroTik"}
                  className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-all"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  required={!editandoId}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">URL de Login do Hotspot (Interno)</label>
                <input
                  type="text"
                  className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-all font-mono"
                  placeholder="Ex: http://10.5.50.1/login"
                  value={form.end_hotspot}
                  onChange={(e) => setForm({ ...form, end_hotspot: e.target.value })}
                />
                <p className="text-[10px] text-gray-500 mt-1 font-sans">Geralmente http://IP_DO_GATEWAY_HOTSPOT/login ou o nome DNS configurado no Winbox.</p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Portal Captive Vinculado</label>
                <select
                  className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none cursor-pointer"
                  value={form.portal_id}
                  onChange={(e) => setForm({ ...form, portal_id: e.target.value })}
                >
                  <option value="">Nenhum</option>
                  {portais.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome} ({p.tipo.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-800/80">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-800 hover:bg-[#151821] text-gray-300 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 text-xs font-bold uppercase tracking-wider transition-all shadow-md"
                >
                  {editandoId ? "Salvar Alterações" : "Cadastrar Roteador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hotspot Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] rounded-2xl border border-gray-700 w-full max-w-xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5 pb-2 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-400" />
                Assistente de Configuração do Hotspot
              </h3>
              <button onClick={() => setShowWizard(false)} className="text-gray-400 hover:text-white text-lg">×</button>
            </div>

            {scanning ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 border-3 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-4" style={{borderWidth: '3px'}}></div>
                <p className="text-gray-400 text-sm animate-pulse">Escaneando configurações no roteador MikroTik...</p>
              </div>
            ) : scanData && (
              <div className="space-y-4">
                {/* Status Dashboard summary */}
                <div className="bg-[#0d1117] rounded-xl p-4 border border-gray-800 space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block border-b border-gray-800/60 pb-1">Análise do Hardware</span>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500 block">Interfaces</span>
                      <p className="text-white font-bold text-sm">{scanData.interfaces?.length || 0}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Pools Configurados</span>
                      <p className="text-white font-bold text-sm">{scanData.pools?.length || 0}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Hotspot Ativo</span>
                      <p className="text-white font-bold text-sm">{scanData.hotspots?.length ? "Sim" : "Não"}</p>
                    </div>
                  </div>
                </div>

                {/* Interface Selection */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-semibold">Interface de Rede do Hotspot</label>
                  <select
                    className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none cursor-pointer"
                    value={wizardConfig.interface}
                    onChange={(e) => setWizardConfig({ ...wizardConfig, interface: e.target.value })}
                  >
                    {scanData.interfaces?.map(i => (
                      <option key={i.name} value={i.name}>
                        {i.name} ({i.type}){i.disabled === "true" ? " [DESABILITADA]" : ""}
                      </option>
                    ))}
                  </select>
                  {scanData.addresses?.filter(a => a.interface === wizardConfig.interface).map(a => (
                    <p key={a.address} className="text-xs text-emerald-400 font-mono mt-1">IP associado à interface: {a.address}</p>
                  ))}
                </div>

                {/* Local Address */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-semibold">Endereço IP Local (Interface Roteador)</label>
                  <input
                    className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none font-mono"
                    value={wizardConfig.localAddress}
                    onChange={(e) => setWizardConfig({ ...wizardConfig, localAddress: e.target.value })}
                    placeholder="10.5.50.1/24"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">IP que o MikroTik assumirá na rede do hotspot caso a interface não possua um endereço.</p>
                </div>

                {/* Pool */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-semibold">Nome do Pool DHCP</label>
                    <input
                      className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                      value={wizardConfig.poolName}
                      onChange={(e) => setWizardConfig({ ...wizardConfig, poolName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-semibold">Range de IPs do Pool</label>
                    <input
                      className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none font-mono"
                      value={wizardConfig.poolRange}
                      onChange={(e) => setWizardConfig({ ...wizardConfig, poolRange: e.target.value })}
                      placeholder="10.5.50.2-10.5.50.254"
                    />
                  </div>
                </div>

                {/* DNS Name */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-semibold">Nome DNS Local (Ex: hotspot.local)</label>
                  <input
                    className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none font-mono"
                    value={wizardConfig.dnsName}
                    onChange={(e) => setWizardConfig({ ...wizardConfig, dnsName: e.target.value })}
                    placeholder="hotspot.minharede.com"
                  />
                </div>

                {/* Info alert */}
                <div className="bg-[#0d1117] rounded-xl p-3 border border-blue-900/20 text-[10px] text-gray-400 space-y-1">
                  <p className="text-gray-300 font-bold uppercase tracking-wider text-[8px] text-blue-400">Escopo de Configurações Automáticas:</p>
                  <p>• Instalação e Habilitação do serviço RADIUS Client</p>
                  <p>• Liberação do endereço IP do servidor local no Walled Garden</p>
                  <p>• Configuração da URL de login e perfis de login CHAP/PAP</p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => setShowWizard(false)}
                    className="px-4 py-2 border border-gray-800 hover:bg-[#252b3b] text-gray-300 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={executarWizard}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 text-xs font-bold uppercase tracking-wider transition-all shadow-md"
                  >
                    Configurar Hotspot
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terminal Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#11141e] rounded-2xl border border-gray-800 w-full max-w-xl overflow-hidden shadow-2xl">
            {/* Terminal Window Title Bar */}
            <div className="bg-[#181b28] px-4 py-3 border-b border-gray-800/80 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
                </div>
                <span className="text-xs font-mono font-bold text-gray-400">bash - hotspot_setup.sh</span>
              </div>
              {enviandoHotspot ? (
                <div className="w-4 h-4 border-2 border-gray-600 border-t-blue-400 rounded-full animate-spin"></div>
              ) : (
                <button 
                  onClick={() => setShowLogModal(false)} 
                  className="text-gray-400 hover:text-white text-xs font-mono"
                >
                  exit
                </button>
              )}
            </div>

            {/* Terminal Screen */}
            <div className="p-6 space-y-4">
              <div className="bg-black/90 rounded-xl p-4 font-mono text-[11px] h-80 overflow-y-auto space-y-1.5 border border-gray-900 shadow-inner" ref={el => { if (el) el.scrollTop = el.scrollHeight; }}>
                {hotspotLog.length === 0 && enviandoHotspot && (
                  <div className="text-gray-500 animate-pulse font-mono">$ connecting to RouterOS API...</div>
                )}
                {hotspotLog.map((line, i) => (
                  <div key={i} className={`flex items-start gap-2 ${
                    line.includes('[erro]') ? 'text-red-400' :
                    line.includes('[aviso]') ? 'text-yellow-400' :
                    line.startsWith('---') ? 'text-cyan-400 font-bold mt-2' :
                    'text-emerald-400'
                  }`}>
                    <span className="text-gray-600 select-none shrink-0 font-mono">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-mono">{line}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowLogModal(false)}
                  disabled={!!enviandoHotspot}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    enviandoHotspot 
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md'
                  }`}
                >
                  {enviandoHotspot ? "Executando..." : "Fechar Terminal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
