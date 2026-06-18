import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";

const defaultConfigs = {
  lgpd: {
    titulo: "Cadastro",
    subtitulo: "Seus dados protegidos pela Lei Geral de Proteção de Dados",
    texto_botao: "Cadastrar e Continuar",
    texto_rodape: "Seus dados estão protegidos e serão utilizados apenas para os fins estabelecidos em nossa política de privacidade.",
    texto_lgpd: "Aceito os termos da Lei Geral de Proteção de Dados (LGPD) e autorizo o tratamento dos meus dados pessoais. *",
    cor_fundo_1: "#075985",
    cor_fundo_2: "#172554",
    cor_botao: "#3B82F6",
    logo_url: "",
  },
  lead: {
    titulo: "WiFi Grátis",
    subtitulo: "Preencha seus dados para acessar a internet",
    texto_botao: "Conectar à Internet",
    texto_rodape: "Ao conectar você concorda com os termos de uso da rede WiFi.",
    cor_fundo_1: "#065f46",
    cor_fundo_2: "#083344",
    cor_botao: "#059669",
    logo_url: "",
  },
  lead_passivo: {
    titulo: "Receber Novidades",
    subtitulo: "Cadastre-se para entrarmos em contato",
    texto_botao: "Me Cadastrar",
    texto_rodape: "Seus dados estão seguros conosco e não serão compartilhados.",
    texto_sucesso_titulo: "Obrigado!",
    texto_sucesso_mensagem: "Recebemos seus dados em breve entraremos em contato.",
    cor_fundo_1: "#431407",
    cor_fundo_2: "#7c2d12",
    cor_botao: "#ea580c",
    logo_url: "",
  },
  planos: {
    titulo: "Escolha seu Plano",
    subtitulo: "Selecione o melhor plano para navegar",
    texto_botao: "Continuar",
    texto_rodape: "Pagamento seguro e rápido.",
    cor_fundo_1: "#065f46",
    cor_fundo_2: "#083344",
    cor_botao: "#059669",
    logo_url: "",
  },
  login: {
    titulo: "Acesso Wi-Fi",
    subtitulo: "Faça login com seu usuário e senha para acessar a internet",
    texto_botao: "Conectar",
    texto_rodape: "Ao conectar você concorda com os termos de uso da rede.",
    link_texto_antes: "Não tem um plano? ",
    link_texto_link: "Clique aqui",
    link_texto_depois: " para adquirir o seu.",
    link_portal_url: "",
    cor_fundo_1: "#1f2937",
    cor_fundo_2: "#111827",
    cor_botao: "#3b82f6",
    logo_url: "",
  },
  status: {
    status_title: "Conectado à Internet",
    status_subtitle: "Sua sessão está activa e segura",
    status_blur: 8,
    status_card_opacity: 0.9,
    status_custom_css: "",
    cor_fundo_1: "#0f111a",
    cor_fundo_2: "#060814",
    cor_botao: "#3b82f6",
    logo_url: "",
  },
};

const iconPaths = {
  lgpd: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  lead: "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0",
  lead_passivo: "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0",
  planos: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  login: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
};

export default function PortalEditor() {
  const { empresaSlug, portalId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token");

  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  
  // Navigation & Control tabs
  const [activeTab, setActiveTab] = useState("branding"); // "branding" | "content" | "settings" | "whatsapp"
  const [editingField, setEditingField] = useState(null);
  const [previewMode, setPreviewMode] = useState("mobile"); // "mobile" | "desktop"

  const [outrosPortais, setOutrosPortais] = useState([]);
  const [campanhasDisponiveis, setCampanhasDisponiveis] = useState([]);
  const [campanhaAtivaId, setCampanhaAtivaId] = useState(null);

  const [config, setConfig] = useState({});
  const [whatsEnabled, setWhatsEnabled] = useState(false);
  const [whatsTemplate, setWhatsTemplate] = useState("");
  const [whatsPreview, setWhatsPreview] = useState("");
  const [whatsTesteTel, setWhatsTesteTel] = useState("");
  const [whatsTesteMsg, setWhatsTesteMsg] = useState(null);
  const whatsTextareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Router synchronization state
  const [openSyncModal, setOpenSyncModal] = useState(false);
  const [mikrotiks, setMikrotiks] = useState([]);
  const [loadingMikrotiks, setLoadingMikrotiks] = useState(false);
  const [syncStatus, setSyncStatus] = useState({});
  const [syncMessage, setSyncMessage] = useState({});

  const loadMikrotiksForSync = async () => {
    setLoadingMikrotiks(true);
    try {
      const res = await fetch("/api/mikrotiks", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMikrotiks(data);
      }
    } catch (err) {
      console.error("Erro ao buscar mikrotiks para sincronismo:", err);
    } finally {
      setLoadingMikrotiks(false);
    }
  };

  const handleSyncMikrotik = async (mtkId) => {
    setSyncStatus(prev => ({ ...prev, [mtkId]: 'syncing' }));
    setSyncMessage(prev => ({ ...prev, [mtkId]: 'Enviando arquivos...' }));
    try {
      const endpoint = portal.tipo === "status"
        ? `/api/mikrotiks/${mtkId}/enviar-status`
        : `/api/mikrotiks/${mtkId}/enviar-login`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setSyncStatus(prev => ({ ...prev, [mtkId]: 'success' }));
        setSyncMessage(prev => ({ ...prev, [mtkId]: data.message || "Sincronizado com sucesso!" }));
      } else {
        setSyncStatus(prev => ({ ...prev, [mtkId]: 'error' }));
        setSyncMessage(prev => ({ ...prev, [mtkId]: data.message || "Erro ao enviar arquivo." }));
      }
    } catch (err) {
      console.error("Erro ao sincronizar com MikroTik:", err);
      setSyncStatus(prev => ({ ...prev, [mtkId]: 'error' }));
      setSyncMessage(prev => ({ ...prev, [mtkId]: "Erro de conexão." }));
    }
  };

  useEffect(() => {
    if (openSyncModal) {
      loadMikrotiksForSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSyncModal]);

  const WHATS_VARS = ["nome", "username", "password", "plano", "duracao", "velocidade", "valor", "empresa", "login_url", "expira_em", "cpf"];

  useEffect(() => {
    loadPortal();
    loadCampanhas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Monitor editing field click to auto-focus sidebar input and change tabs
  useEffect(() => {
    if (editingField) {
      if (["cor_fundo_1", "cor_fundo_2", "cor_botao", "logo_url"].includes(editingField)) {
        setActiveTab("branding");
      } else if (["titulo", "subtitulo", "texto_botao", "texto_rodape", "texto_lgpd", "texto_sucesso_titulo", "texto_sucesso_mensagem", "status_title", "status_subtitle"].includes(editingField)) {
        setActiveTab(portal?.tipo === "status" ? "settings" : "content");
      } else if (["campanha_ativa_id", "exibir_cpf", "pagamento_pix_ativo", "pagamento_cartao_ativo", "pix_trial_enabled"].includes(editingField)) {
        setActiveTab("settings");
      }

      setTimeout(() => {
        const el = document.getElementById(`input-${editingField}`);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 80);
    }
  }, [editingField]);

  const loadPortal = async () => {
    try {
      const res = await fetch(`/api/portais`, { headers: { Authorization: `Bearer ${token}` } });
      const portais = await res.json();
      const p = portais.find((x) => String(x.id) === String(portalId));
      if (p) {
        setPortal(p);
        setOutrosPortais(portais.filter((x) => String(x.id) !== String(portalId)));
        setCampanhaAtivaId(p.campanha_ativa_id || null);
        const defaults = defaultConfigs[p.tipo] || defaultConfigs.lgpd;
        let saved = {};
        if (p.configuracoes) {
          try { saved = JSON.parse(p.configuracoes); } catch { /* ignore */ }
        }
        setConfig({ ...defaults, ...saved });
        setWhatsEnabled(!!p.whatsapp_enabled);
        setWhatsTemplate(p.whatsapp_template || "");
      }
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCampanhas = async () => {
    try {
      const res = await fetch(`/api/campanhas`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setCampanhasDisponiveis(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (err) {
      console.error("Erro ao carregar campanhas:", err);
    }
  };

  const salvarCampanha = async (valor) => {
    const novoId = valor === "" ? null : parseInt(valor, 10);
    try {
      const res = await fetch(`/api/portais/${portalId}/campanha`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ campanha_ativa_id: novoId }),
      });
      if (!res.ok) throw new Error("Erro ao salvar campanha");
      setCampanhaAtivaId(novoId);
      setMsg("Campanha vinculada!");
      setTimeout(() => setMsg(""), 2000);
    } catch (err) {
      alert("Erro ao salvar campanha: " + err.message);
    }
  };

  const inserirVariavel = (nome) => {
    const textarea = whatsTextareaRef.current;
    const tag = `{{${nome}}}`;
    if (!textarea) {
      setWhatsTemplate((t) => (t || "") + tag);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const antes = (whatsTemplate || "").slice(0, start);
    const depois = (whatsTemplate || "").slice(end);
    const novo = antes + tag + depois;
    setWhatsTemplate(novo);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + tag.length;
    }, 0);
  };

  const gerarPreviewWhats = async () => {
    try {
      const res = await fetch(`/api/portais/${portalId}/whatsapp-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ template: whatsTemplate }),
      });
      const data = await res.json();
      if (res.ok) setWhatsPreview(data.preview || "");
    } catch {
      setWhatsPreview("Erro ao gerar preview");
    }
  };

  const enviarTesteWhats = async () => {
    if (!whatsTesteTel.trim()) {
      setWhatsTesteMsg({ ok: false, msg: "Informe um telefone" });
      return;
    }
    setWhatsTesteMsg({ ok: null, msg: "Enviando..." });
    try {
      const res = await fetch(`/api/portais/${portalId}/whatsapp-teste`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ telefone: whatsTesteTel, template: whatsTemplate }),
      });
      const data = await res.json();
      if (res.ok) setWhatsTesteMsg({ ok: true, msg: "Mensagem enviada!" });
      else setWhatsTesteMsg({ ok: false, msg: data.message || "Erro ao enviar" });
    } catch {
      setWhatsTesteMsg({ ok: false, msg: "Erro de conexão" });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/portais/${portalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          configuracoes: config,
          cor_primaria: config.cor_botao,
          cor_fundo: config.cor_fundo_1,
          logo_url: config.logo_url,
          whatsapp_enabled: whatsEnabled,
          whatsapp_template: whatsTemplate,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      setMsg("Salvo!");
      setTimeout(() => setMsg(""), 2000);
    } catch {
      setMsg("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };
  
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);
    
    setMsg("Enviando logo...");
    try {
      const res = await fetch(`/api/portais/${portalId}/logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro no upload");
      setConfig({ ...config, logo_url: data.logo_url });
      setMsg("Logo atualizada!");
      setTimeout(() => setMsg(""), 2000);
    } catch (err) {
      setMsg("Erro no upload");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-gray-500">Carregando...</div>
      </AdminLayout>
    );
  }

  if (!portal) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64 text-red-400">Portal não encontrado</div>
      </AdminLayout>
    );
  }

  const tipoBadge = {
    lgpd: { label: "LGPD", cls: "bg-cyan-900/30 text-cyan-400 border-cyan-800/50" },
    planos: { label: "Planos", cls: "bg-emerald-900/30 text-emerald-400 border-emerald-800/50" },
    lead: { label: "Lead", cls: "bg-yellow-900/30 text-yellow-400 border-yellow-800/50" },
    lead_passivo: { label: "Lead (Sem Internet)", cls: "bg-orange-900/30 text-orange-400 border-orange-800/50" },
    login: { label: "Login", cls: "bg-blue-900/30 text-blue-400 border-blue-800/50" },
    status: { label: "Página de Status", cls: "bg-pink-900/30 text-pink-400 border-pink-800/50" },
  };

  const badge = tipoBadge[portal.tipo] || { label: portal.tipo, cls: "bg-gray-900/30 text-gray-400 border-gray-800/50" };
  const iconPath = iconPaths[portal.tipo] || iconPaths.lgpd;

  return (
    <AdminLayout>
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
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/admin/${empresaSlug}/portais`)}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#252b3b] rounded-lg cursor-pointer transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">Editor Visual de Portal</h1>
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${badge.cls}`}>{badge.label}</span>
            </div>
            <p className="text-xs text-gray-500">/{portal.slug} • Configure a identidade visual e o fluxo do portal</p>
          </div>
        </div>

        {/* Global Save Controls */}
        <div className="flex items-center gap-3">
          {msg && (
            <span className={`text-xs px-2.5 py-1 rounded border ${
              msg.includes("Erro") || msg.includes("não")
                ? "bg-red-950/30 text-red-400 border-red-900/50"
                : "bg-emerald-950/30 text-emerald-400 border-emerald-900/50"
            } transition-all duration-300 animate-pulse`}>
              {msg}
            </span>
          )}
          <button
            onClick={() => navigate(`/admin/${empresaSlug}/portais`)}
            className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-[#252b3b] cursor-pointer text-xs font-medium transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={() => setOpenSyncModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
          >
            🔄 Sincronizar MikroTiks
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer text-xs font-medium disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98]"
          >
            {saving ? "Salvando..." : "💾 Salvar Configurações"}
          </button>
        </div>
      </div>

      {/* Main Split-Pane Workspace */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* LEFT COLUMN: Sidebar Form Controls */}
        <div className="w-full lg:w-[420px] bg-[#171a24] border border-gray-800 rounded-2xl flex flex-col shadow-xl shrink-0 overflow-hidden">
          
          {/* Sidebar Tab Header */}
          <div className="flex bg-[#12141c] border-b border-gray-800 p-1">
            <button
              onClick={() => setActiveTab("branding")}
              className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "branding" ? "bg-[#1d212d] text-emerald-400 shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              🎨 Aparência
            </button>
            {portal?.tipo !== "status" && (
              <button
                onClick={() => setActiveTab("content")}
                className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "content" ? "bg-[#1d212d] text-emerald-400 shadow-sm" : "text-gray-400 hover:text-white"
                }`}
              >
                📝 Textos
              </button>
            )}
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "settings" ? "bg-[#1d212d] text-emerald-400 shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              ⚙️ Opções
            </button>
            {portal?.tipo !== "status" && (
              <button
                onClick={() => setActiveTab("whatsapp")}
                className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "whatsapp" ? "bg-[#1d212d] text-emerald-400 shadow-sm" : "text-gray-400 hover:text-white"
                }`}
              >
                💬 WhatsApp
              </button>
            )}
          </div>

          {/* Sidebar Tab Panels */}
          <div className="flex-1 p-5 overflow-y-auto max-h-[calc(100vh-280px)] space-y-5 custom-scroll">
            
            {/* BRANDING TAB */}
            {activeTab === "branding" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white mb-2">Identidade Visual & Cores</h3>
                
                {/* Logo Area */}
                <div className="bg-[#12141c] p-4 rounded-xl border border-gray-800 space-y-3">
                  <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Logotipo do Portal</span>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    id="input-logo_url"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />

                  {config.logo_url ? (
                    <div className="relative group w-fit mx-auto bg-black/40 p-3 rounded-lg border border-gray-800">
                      <img src={config.logo_url} alt="Logo" className="max-h-12 object-contain" />
                      <button
                        onClick={() => setConfig({ ...config, logo_url: "" })}
                        className="absolute -top-2 -right-2 bg-red-900 border border-red-700 text-red-200 w-5 h-5 rounded-full text-xs flex items-center justify-center hover:bg-red-700 transition-colors"
                        title="Remover Logo"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="w-full py-4 border-2 border-dashed border-gray-700 hover:border-emerald-500 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-emerald-400 transition-all bg-[#0a0c10] cursor-pointer"
                    >
                      <svg className="w-6 h-6 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-medium">Fazer Upload da Logo</span>
                    </button>
                  )}
                  <p className="text-[10px] text-gray-500 text-center">Tamanho ideal: horizontal, fundo transparente.</p>
                </div>

                {/* Colors */}
                <div className="space-y-4 bg-[#12141c] p-4 rounded-xl border border-gray-800">
                  <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Paleta de Cores</span>
                  
                  {/* Cor de Fundo 1 */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1" htmlFor="input-cor_fundo_1">Cor de Fundo (Topo / Início Gradiente):</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.cor_fundo_1 || "#0f111a"}
                        onChange={(e) => setConfig({ ...config, cor_fundo_1: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                      />
                      <input
                        type="text"
                        id="input-cor_fundo_1"
                        value={config.cor_fundo_1 || ""}
                        onChange={(e) => setConfig({ ...config, cor_fundo_1: e.target.value })}
                        placeholder="#000000"
                        className="flex-1 bg-[#0d1117] border border-gray-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Cor de Fundo 2 */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1" htmlFor="input-cor_fundo_2">Cor de Fundo (Base / Fim Gradiente):</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.cor_fundo_2 || "#0f111a"}
                        onChange={(e) => setConfig({ ...config, cor_fundo_2: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                      />
                      <input
                        type="text"
                        id="input-cor_fundo_2"
                        value={config.cor_fundo_2 || ""}
                        onChange={(e) => setConfig({ ...config, cor_fundo_2: e.target.value })}
                        placeholder="#000000"
                        className="flex-1 bg-[#0d1117] border border-gray-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Cor do Botão */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1" htmlFor="input-cor_botao">Cor Principal do Botão:</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.cor_botao || "#10b981"}
                        onChange={(e) => setConfig({ ...config, cor_botao: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                      />
                      <input
                        type="text"
                        id="input-cor_botao"
                        value={config.cor_botao || ""}
                        onChange={(e) => setConfig({ ...config, cor_botao: e.target.value })}
                        placeholder="#000000"
                        className="flex-1 bg-[#0d1117] border border-gray-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>


                </div>
              </div>
            )}

            {/* CONTENT TAB */}
            {activeTab === "content" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white mb-2">Conteúdo e Textos</h3>

                {/* Título */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1" htmlFor="input-titulo">Título Principal:</label>
                  <input
                    type="text"
                    id="input-titulo"
                    value={config.titulo || ""}
                    onChange={(e) => setConfig({ ...config, titulo: e.target.value })}
                    className="w-full bg-[#12141c] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Subtítulo */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1" htmlFor="input-subtitulo">Subtítulo / Descrição:</label>
                  <textarea
                    id="input-subtitulo"
                    value={config.subtitulo || ""}
                    onChange={(e) => setConfig({ ...config, subtitulo: e.target.value })}
                    rows={3}
                    className="w-full bg-[#12141c] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Texto do Botão */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1" htmlFor="input-texto_botao">Texto do Botão de Ação:</label>
                  <input
                    type="text"
                    id="input-texto_botao"
                    value={config.texto_botao || ""}
                    onChange={(e) => setConfig({ ...config, texto_botao: e.target.value })}
                    className="w-full bg-[#12141c] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Texto Rodapé */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1" htmlFor="input-texto_rodape">Texto do Rodapé (Diretrizes/Privacidade):</label>
                  <textarea
                    id="input-texto_rodape"
                    value={config.texto_rodape || ""}
                    onChange={(e) => setConfig({ ...config, texto_rodape: e.target.value })}
                    rows={3}
                    className="w-full bg-[#12141c] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none"
                  />
                </div>

                {/* PORTAL SPECIFIC FIELDS */}

                {/* LGPD Terms Text */}
                {portal.tipo === "lgpd" && (
                  <div className="pt-3 border-t border-gray-800">
                    <label className="block text-xs text-gray-400 mb-1" htmlFor="input-texto_lgpd">Termo de Aceite LGPD:</label>
                    <textarea
                      id="input-texto_lgpd"
                      value={config.texto_lgpd || ""}
                      onChange={(e) => setConfig({ ...config, texto_lgpd: e.target.value })}
                      rows={3}
                      className="w-full bg-[#12141c] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none"
                    />
                  </div>
                )}

                {/* Redirect Portal options (Lead Passivo) */}
                {portal.tipo === "lead_passivo" && (
                  <div className="pt-3 border-t border-gray-800 space-y-4">
                    <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Tela de Confirmação</span>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1" htmlFor="input-texto_sucesso_titulo">Título de Sucesso:</label>
                      <input
                        type="text"
                        id="input-texto_sucesso_titulo"
                        value={config.texto_sucesso_titulo || ""}
                        onChange={(e) => setConfig({ ...config, texto_sucesso_titulo: e.target.value })}
                        className="w-full bg-[#12141c] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1" htmlFor="input-texto_sucesso_mensagem">Mensagem de Sucesso:</label>
                      <textarea
                        id="input-texto_sucesso_mensagem"
                        value={config.texto_sucesso_mensagem || ""}
                        onChange={(e) => setConfig({ ...config, texto_sucesso_mensagem: e.target.value })}
                        rows={3}
                        className="w-full bg-[#12141c] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none"
                      />
                    </div>

                     <div className="p-3 bg-[#12141c] rounded-xl border border-gray-800 space-y-3">
                      <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Encaminhamento Automático</span>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Redirecionar para:</label>
                        <select
                          value={config.redirect_portal_url || ""}
                          onChange={(e) => setConfig({ ...config, redirect_portal_url: e.target.value })}
                          className="w-full bg-[#0d1117] border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                        >
                          <option value="">Nenhum (Permanecer na tela de sucesso)</option>
                          {outrosPortais.map((op) => (
                            <option key={op.id} value={op.url_redirect}>
                              {op.nome} (Tipo: {tipoBadge[op.tipo]?.label || op.tipo})
                            </option>
                          ))}
                        </select>
                      </div>

                      {config.redirect_portal_url && (
                        <div className="space-y-3">
                          <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-[11.5px] text-emerald-400 flex items-center gap-1.5 animate-fade-in">
                            <span className="shrink-0 text-emerald-500 font-bold">➜</span>
                            <span className="leading-tight">
                              Redirecionará o cliente após o cadastro para o portal: <strong className="font-semibold text-white">{outrosPortais.find(o => o.url_redirect === config.redirect_portal_url)?.nome || config.redirect_portal_url}</strong>
                            </span>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Tempo de espera (segundos):</label>
                            <input
                              type="number"
                              min="1"
                              max="30"
                              value={config.redirect_delay || 3}
                              onChange={(e) => setConfig({ ...config, redirect_delay: parseInt(e.target.value, 10) || 3 })}
                              className="w-20 bg-[#0d1117] border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Redirect Link options (Login Portal) */}
                {portal.tipo === "login" && (
                  <div className="pt-3 border-t border-gray-800 space-y-4">
                    <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Atalho de Redirecionamento</span>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Vincular a outro portal:</label>
                      <select
                        value={config.link_portal_url || ""}
                        onChange={(e) => {
                          const url = e.target.value;
                          const portalDestino = outrosPortais.find((op) => op.url_redirect === url);
                          setConfig({
                            ...config,
                            link_portal_url: url,
                            link_portal_id: portalDestino ? portalDestino.id : null,
                          });
                        }}
                        className="w-full bg-[#12141c] border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                      >
                        <option value="">Nenhum (Sem link)</option>
                        {outrosPortais.map((op) => (
                          <option key={op.id} value={op.url_redirect}>
                            {op.nome} (Tipo: {tipoBadge[op.tipo]?.label || op.tipo})
                          </option>
                        ))}
                      </select>
                      
                      {config.link_portal_url && (
                        <div className="mt-2 p-2 rounded-lg bg-blue-950/20 border border-blue-900/30 text-[11.5px] text-blue-400 flex items-center gap-1.5 animate-fade-in">
                          <span className="shrink-0 text-blue-500 font-bold">🔗</span>
                          <span className="leading-tight">
                            Exibirá um atalho direcionando para o portal: <strong className="font-semibold text-white">{outrosPortais.find(o => o.url_redirect === config.link_portal_url)?.nome || config.link_portal_url}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {config.link_portal_url && (
                      <div className="space-y-3 bg-[#12141c] p-3 rounded-xl border border-gray-800">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Texto anterior ao link:</label>
                          <input
                            type="text"
                            value={config.link_texto_antes || ""}
                            onChange={(e) => setConfig({ ...config, link_texto_antes: e.target.value })}
                            className="w-full bg-[#0d1117] border border-gray-700 text-white rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                            placeholder="Não tem um plano? "
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Texto clicável do link:</label>
                          <input
                            type="text"
                            value={config.link_texto_link || ""}
                            onChange={(e) => setConfig({ ...config, link_texto_link: e.target.value })}
                            className="w-full bg-[#0d1117] border border-gray-700 text-white rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                            placeholder="Clique aqui"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Texto após o link:</label>
                          <input
                            type="text"
                            value={config.link_texto_depois || ""}
                            onChange={(e) => setConfig({ ...config, link_texto_depois: e.target.value })}
                            className="w-full bg-[#0d1117] border border-gray-700 text-white rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                            placeholder=" para adquirir o seu."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="space-y-5">
                <h3 className="text-sm font-semibold text-white mb-2">Opções & Configurações de Fluxo</h3>

                {portal?.tipo === "status" ? (
                  /* CONFIGURAÇÕES EXCLUSIVAS DA PÁGINA DE STATUS */
                  <div className="space-y-4">
                    <div className="bg-[#12141c] p-4 rounded-xl border border-gray-800 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">🚀</span>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Configurações da Página de Status</span>
                      </div>
                      <p className="text-[10px] text-gray-500">Configure os textos e propriedades visuais do card de status pós-conexão.</p>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1" htmlFor="input-status_title">Título da Página:</label>
                        <input
                          type="text"
                          id="input-status_title"
                          value={config.status_title || ""}
                          onChange={(e) => setConfig({ ...config, status_title: e.target.value })}
                          placeholder="Padrão: Conectado à Internet"
                          className="w-full bg-[#0d1117] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1" htmlFor="input-status_subtitle">Subtítulo da Página:</label>
                        <input
                          type="text"
                          id="input-status_subtitle"
                          value={config.status_subtitle || ""}
                          onChange={(e) => setConfig({ ...config, status_subtitle: e.target.value })}
                          placeholder="Padrão: Sua sessão está ativa e segura"
                          className="w-full bg-[#0d1117] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs text-gray-400" htmlFor="input-status_blur">Desfoque do Fundo:</label>
                            <span className="text-[10px] text-gray-500">{config.status_blur !== undefined ? config.status_blur : 8}px</span>
                          </div>
                          <input
                            type="range"
                            id="input-status_blur"
                            min="0"
                            max="20"
                            value={config.status_blur !== undefined ? config.status_blur : 8}
                            onChange={(e) => setConfig({ ...config, status_blur: parseInt(e.target.value, 10) })}
                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs text-gray-400" htmlFor="input-status_card_opacity">Opacidade do Painel:</label>
                            <span className="text-[10px] text-gray-500">{Math.round((config.status_card_opacity !== undefined ? config.status_card_opacity : 0.9) * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            id="input-status_card_opacity"
                            min="50"
                            max="100"
                            value={(config.status_card_opacity !== undefined ? config.status_card_opacity : 0.9) * 100}
                            onChange={(e) => setConfig({ ...config, status_card_opacity: parseFloat(e.target.value) / 100 })}
                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1" htmlFor="input-status_custom_css">CSS Customizado (Opcional):</label>
                        <textarea
                          id="input-status_custom_css"
                          value={config.status_custom_css || ""}
                          onChange={(e) => setConfig({ ...config, status_custom_css: e.target.value })}
                          placeholder="Ex: .card { border-radius: 12px; } #btn-logout { background: blue; }"
                          rows={4}
                          className="w-full bg-[#0d1117] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-y"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* CONFIGURAÇÕES DOS PORTAIS DE LOGIN */
                  <>
                    {/* Pre-portal Campaigns */}
                    <div className="bg-[#12141c] p-4 rounded-xl border border-gray-800 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">📢</span>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pré-Portal (Campanha Ativa)</span>
                      </div>
                      <p className="text-[10px] text-gray-500">Adicione stories ou vídeos publicitários obrigatórios antes da autenticação.</p>
                      
                      <select
                        id="input-campanha_ativa_id"
                        value={campanhaAtivaId === null ? "" : String(campanhaAtivaId)}
                        onChange={(e) => salvarCampanha(e.target.value)}
                        className="w-full bg-[#0d1117] border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="">— Nenhuma Campanha —</option>
                        {campanhasDisponiveis.map((c) => (
                          <option key={c.id} value={String(c.id)}>
                            {c.nome} ({c.total_itens} {c.total_itens === 1 ? "item" : "itens"})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* CPF toggler for Lead types */}
                    {["lead", "lead_passivo"].includes(portal.tipo) && (
                      <div className="bg-[#12141c] p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="block text-xs font-semibold text-white">Solicitar Campo CPF</span>
                          <p className="text-[10px] text-gray-500">Exige digitação de CPF para conectar</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            id="input-exibir_cpf"
                            checked={config.exibir_cpf !== false}
                            onChange={(e) => setConfig({ ...config, exibir_cpf: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                    )}

                    {/* Plan settings / payment methods */}
                    {portal.tipo === "planos" && (
                      <div className="space-y-4 bg-[#12141c] p-4 rounded-xl border border-gray-800">
                        <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Métodos de Pagamento Ativos</span>
                        
                        {/* Pix Toggle */}
                        <div className="flex items-center justify-between pb-3 border-b border-gray-850">
                          <div className="space-y-0.5">
                            <span className="text-xs font-medium text-white">PIX</span>
                            <p className="text-[9px] text-gray-500">Liberação via QR Code dinâmico</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              id="input-pagamento_pix_ativo"
                              checked={config.pagamento_pix_ativo !== false}
                              onChange={(e) => {
                                const val = e.target.checked;
                                if (!val && config.pagamento_cartao_ativo === false) {
                                  alert("Ao menos um método de pagamento precisa estar ativo.");
                                  return;
                                }
                                setConfig({ ...config, pagamento_pix_ativo: val });
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-700 peer-checked:bg-emerald-500 rounded-full peer transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                          </label>
                        </div>

                        {/* Card Toggle */}
                        <div className="flex items-center justify-between pb-3 border-b border-gray-850">
                          <div className="space-y-0.5">
                            <span className="text-xs font-medium text-white">Cartão de Crédito</span>
                            <p className="text-[9px] text-gray-500">Processado via gateway integrado</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              id="input-pagamento_cartao_ativo"
                              checked={config.pagamento_cartao_ativo !== false}
                              onChange={(e) => {
                                const val = e.target.checked;
                                if (!val && config.pagamento_pix_ativo === false) {
                                  alert("Ao menos um método de pagamento precisa estar ativo.");
                                  return;
                                }
                                setConfig({ ...config, pagamento_cartao_ativo: val });
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-700 peer-checked:bg-emerald-500 rounded-full peer transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                          </label>
                        </div>

                        {/* Temp trial access while paying */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-2">
                            <div className="space-y-0.5">
                              <span className="text-xs font-medium text-white">Internet Provisória (Trial Pix)</span>
                              <p className="text-[9px] text-gray-500">Libera acesso temporário para abrir o app do banco</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                id="input-pix_trial_enabled"
                                checked={config.pix_trial_enabled === true}
                                onChange={(e) => setConfig({ ...config, pix_trial_enabled: e.target.checked })}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-700 peer-checked:bg-emerald-500 rounded-full peer transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                            </label>
                          </div>

                          {config.pix_trial_enabled && (
                            <div className="flex items-center gap-2 pl-1.5 mt-2 bg-[#0d1117] p-2 rounded-lg border border-gray-800">
                              <label className="text-[10px] text-gray-400">Tempo de liberação:</label>
                              <input
                                type="number"
                                min="1"
                                max="30"
                                value={config.pix_trial_duracao_minutos || 5}
                                onChange={(e) => setConfig({ ...config, pix_trial_duracao_minutos: parseInt(e.target.value, 10) || 5 })}
                                className="w-16 bg-[#12141c] border border-gray-700 text-gray-200 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                              />
                              <span className="text-[10px] text-gray-400">minutos</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Fluxo Pós-Acesso */}
                    <div className="bg-[#12141c] p-4 rounded-xl border border-gray-800 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">🚀</span>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Fluxo Pós-Acesso</span>
                      </div>
                      <p className="text-[10px] text-gray-500">Escolha o que acontece após o cliente se conectar com sucesso.</p>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1" htmlFor="input-post_login_action">Ação Pós-Conexão:</label>
                        <select
                          id="input-post_login_action"
                          value={config.post_login_action || "status"}
                          onChange={(e) => setConfig({ ...config, post_login_action: e.target.value })}
                          className="w-full bg-[#0d1117] border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                        >
                          <option value="status" className="bg-[#121420]">Mostrar Página de Status</option>
                          <option value="redirect" className="bg-[#121420]">Redirecionar para um Site</option>
                        </select>
                      </div>

                      {config.post_login_action === "redirect" && (
                        <div className="animate-fade-in">
                          <label className="block text-xs text-gray-400 mb-1" htmlFor="input-post_login_redirect_url">Site para Redirecionamento:</label>
                          <input
                            type="text"
                            id="input-post_login_redirect_url"
                            value={config.post_login_redirect_url || ""}
                            onChange={(e) => setConfig({ ...config, post_login_redirect_url: e.target.value })}
                            placeholder="Ex: www.suaempresa.com.br"
                            className="w-full bg-[#0d1117] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* WHATSAPP TAB */}
            {activeTab === "whatsapp" && (
              <div className="space-y-4">
                
                {/* Active Toggle */}
                <div className="flex items-center justify-between bg-[#12141c] p-4 rounded-xl border border-gray-800">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-white">Notificações por WhatsApp</span>
                    <p className="text-[9px] text-gray-500">Envia comprovante ao liberar conexões</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsEnabled}
                      onChange={(e) => setWhatsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-700 peer-checked:bg-emerald-500 rounded-full peer transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                  </label>
                </div>

                <div className={`space-y-4 ${!whatsEnabled ? "opacity-45 pointer-events-none select-none transition-opacity" : "transition-opacity"}`}>
                  
                  {/* Variables */}
                  <div className="bg-[#12141c] p-3 rounded-xl border border-gray-800">
                    <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Variáveis Úteis (Clique para inserir)</span>
                    <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                      {WHATS_VARS.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => inserirVariavel(v)}
                          className="px-2 py-1 text-[10px] font-mono bg-[#0d1117] border border-gray-750 text-emerald-400 rounded hover:bg-emerald-950/20 hover:border-emerald-700 transition-colors cursor-pointer"
                        >
                          {`{{${v}}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Template Textarea */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Corpo da Mensagem:</label>
                    <textarea
                      ref={whatsTextareaRef}
                      id="input-whatsapp_template"
                      value={whatsTemplate}
                      onChange={(e) => setWhatsTemplate(e.target.value)}
                      rows={6}
                      placeholder="Olá {{nome}}! Acesso à rede Wi-Fi liberado com sucesso..."
                      className="w-full bg-[#12141c] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono resize-none"
                    />
                  </div>

                  {/* Preview Whatsapp Box */}
                  <div className="bg-[#12141c] p-3.5 rounded-xl border border-gray-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Simulador da Mensagem</span>
                      <button
                        type="button"
                        onClick={gerarPreviewWhats}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer transition-colors"
                      >
                        🔄 Atualizar
                      </button>
                    </div>
                    <div className="bg-[#0b0c11] border border-gray-850 rounded-lg p-3 text-xs text-gray-300 whitespace-pre-wrap min-h-[120px] max-h-[200px] overflow-y-auto font-mono">
                      {whatsPreview || <span className="text-gray-600 italic">Clique em "Atualizar" para renderizar com dados fictícios.</span>}
                    </div>
                  </div>

                  {/* Teste real */}
                  <div className="bg-[#12141c] p-3.5 rounded-xl border border-gray-800 space-y-2.5">
                    <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Envio de Teste Instantâneo</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={whatsTesteTel}
                        onChange={(e) => setWhatsTesteTel(e.target.value)}
                        placeholder="(DD) 99999-9999"
                        className="flex-1 bg-[#0d1117] border border-gray-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={enviarTesteWhats}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors active:scale-[0.97]"
                      >
                        Enviar
                      </button>
                    </div>
                    {whatsTesteMsg && (
                      <p className={`text-[10px] ${whatsTesteMsg.ok ? "text-emerald-400" : whatsTesteMsg.ok === false ? "text-red-400" : "text-gray-400"}`}>
                        {whatsTesteMsg.msg}
                      </p>
                    )}
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Responsive Live Preview Canvas */}
        <div className="flex-1 bg-[#171a24] border border-gray-800 rounded-2xl p-5 flex flex-col shadow-xl min-h-[650px]">
          
          {/* Canvas Sub-Header / Device Control */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-6 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs font-semibold text-white">Simulador em Tempo Real</span>
            </div>
            
            {/* Viewport Frame Switcher */}
            <div className="flex bg-[#12141c] p-1 rounded-lg border border-gray-850">
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  previewMode === "mobile"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                📱 Celular
              </button>
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  previewMode === "desktop"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                💻 Modo PC
              </button>
            </div>
          </div>

          {/* Simulated Device Frame Container */}
          <div className="flex-1 flex items-center justify-center bg-[#0a0c10] border border-gray-850 rounded-xl p-6 overflow-auto max-h-[calc(100vh-280px)] no-scrollbar">
            
            {previewMode === "mobile" ? (
              
              /* SMARTPHONE FRAME CONTAINER (iPhone style) */
              <div className="relative w-[310px] h-[560px] rounded-[46px] border-[12px] border-zinc-900 ring-4 ring-zinc-800 bg-[#0d1117] flex flex-col shadow-2xl shrink-0 overflow-hidden transition-all duration-300">
                {/* Dynamic Island */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[90px] h-[20px] bg-black rounded-full z-20 flex items-center justify-between px-2.5 select-none pointer-events-none">
                  <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
                  <div className="w-2 h-0.5 bg-gray-900 rounded-full"></div>
                </div>

                {/* Status Bar */}
                <div className="h-8 bg-[#0a0c10] flex items-center justify-between px-5 shrink-0 z-10 select-none text-white text-[9px] font-semibold border-b border-white/5">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <span>📶</span>
                    <span>🔋</span>
                  </div>
                </div>
                
                {/* Internal Canvas Container */}
                <div className="flex-1 overflow-y-auto relative pb-8 custom-scroll">
                  {renderPortalPreviewContent()}
                </div>

                {/* Home Indicator Bar */}
                <div className="absolute bottom-1.5 inset-x-0 h-1 flex justify-center z-20 pointer-events-none">
                  <div className="w-20 h-1 bg-white/20 rounded-full"></div>
                </div>
              </div>

            ) : (

              /* BROWSER/DESKTOP FRAME CONTAINER */
              <div className="w-full max-w-5xl h-[640px] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl bg-[#0d1117] flex flex-col transition-all duration-300">
                
                {/* Browser top tabs bar mockup */}
                <div className="bg-[#181b26] px-4 py-2 flex items-center justify-between border-b border-gray-850 shrink-0 select-none">
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
                  <div className="bg-[#0b0c11] border border-gray-800 rounded text-[10px] text-gray-500 px-4 py-1.5 font-mono flex-1 text-center max-w-xl mx-auto truncate select-none flex items-center justify-center gap-1.5">
                    <span className="text-emerald-500 text-[9px]">🔒</span>
                    https://hotspot.local/portal/{portal.slug}
                  </div>
                  <div className="w-16"></div>
                </div>

                {/* Internal Canvas Container */}
                <div className="flex-1 overflow-y-auto custom-scroll">
                  {renderPortalPreviewContent()}
                </div>
              </div>

            )}

          </div>
        </div>
      </div>

      {openSyncModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#1a1d27] rounded-2xl border border-gray-700 w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-5 pb-2 border-b border-gray-800 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🔄</span> Sincronizar Portal com MikroTiks
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Envia o arquivo {portal.tipo === "status" ? "status.html" : "login.html"} gerado para o roteador
                </p>
              </div>
              <button
                onClick={() => setOpenSyncModal(false)}
                className="text-gray-400 hover:text-white text-lg transition-colors cursor-pointer font-sans"
                title="Fechar"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll py-2">
              {loadingMikrotiks ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-gray-700 border-t-emerald-500 rounded-full animate-spin mb-3"></div>
                  <p className="text-xs text-gray-400 font-mono">Buscando equipamentos...</p>
                </div>
              ) : mikrotiks.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  Nenhum roteador cadastrado na empresa.
                </div>
              ) : (
                <div className="space-y-3">
                  {mikrotiks.map((mtk) => {
                    const status = syncStatus[mtk.id] || 'idle';
                    const message = syncMessage[mtk.id] || '';
                    const isLinked = String(mtk.portal_id) === String(portal.id);

                    return (
                      <div
                        key={mtk.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          isLinked
                            ? "bg-emerald-950/10 border-emerald-900/30 hover:border-emerald-800/40"
                            : "bg-[#12141c] border-gray-800 hover:border-gray-700"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{mtk.nome}</span>
                            {isLinked && (
                              <span className="bg-emerald-900/40 border border-emerald-800/50 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-semibold">
                                Vinculado
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
                            <span>IP: {mtk.ip}</span>
                            {mtk.portal_nome && (
                              <span className="text-[10px] text-gray-500 font-sans">
                                Portal ativo: {mtk.portal_nome}
                              </span>
                            )}
                          </div>

                          {message && (
                            <p
                              className={`text-[10px] font-mono mt-1 ${
                                status === 'success'
                                  ? 'text-emerald-400'
                                  : status === 'error'
                                  ? 'text-red-400 animate-pulse'
                                  : 'text-blue-400'
                              }`}
                            >
                              {status === 'success' ? '✅ ' : status === 'error' ? '❌ ' : '⏳ '}
                              {message}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          <button
                            onClick={() => handleSyncMikrotik(mtk.id)}
                            disabled={status === 'syncing'}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer select-none active:scale-[0.98] ${
                              status === 'syncing'
                                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/10"
                            }`}
                          >
                            {status === 'syncing' ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-gray-600 border-t-white rounded-full animate-spin"></span>
                                Enviando...
                              </>
                            ) : (
                              "Sincronizar"
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-800 mt-5 shrink-0">
              <button
                onClick={() => setOpenSyncModal(false)}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );

  // Modular helper to render the simulated portal layout reactively
  function renderPortalPreviewContent() {
    if (portal?.tipo === "status") {
      const backgroundGradient = `linear-gradient(135deg, ${config.cor_fundo_1 || "#0f111a"}, ${config.cor_fundo_2 || "#060814"})`;
      const cardBg = `rgba(26, 29, 39, ${config.status_card_opacity !== undefined ? config.status_card_opacity : 0.9})`;
      const backdropBlur = `${config.status_blur !== undefined ? config.status_blur : 8}px`;

      return (
        <div
          className="min-h-full w-full flex items-center justify-center px-4 py-8 transition-all duration-300 flex-1"
          style={{ background: backgroundGradient }}
        >
          <div 
            className="w-full max-w-sm rounded-3xl p-6 border border-white/5 text-center shadow-2xl relative"
            style={{ 
              backgroundColor: cardBg,
              backdropFilter: `blur(${backdropBlur})`,
              WebkitBackdropFilter: `blur(${backdropBlur})`
            }}
          >
            <div className="mb-4">
              <div
                className={`group relative inline-block mb-3 cursor-pointer rounded-lg p-1 transition-all ${
                  editingField === "logo_url" ? "outline outline-2 outline-emerald-500" : "hover:outline hover:outline-2 hover:outline-emerald-500/50"
                }`}
                onClick={() => setEditingField("logo_url")}
              >
                {config.logo_url ? (
                  <img src={config.logo_url} alt="Logo" className="max-h-12 mx-auto" />
                ) : (
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl text-white text-xl font-bold" style={{ backgroundColor: config.cor_botao || "#3B82F6" }}>
                    📶
                  </div>
                )}
              </div>

              <div
                className={`group relative mb-1 py-0.5 px-1 rounded cursor-pointer transition-all ${
                  editingField === "status_title" ? "outline outline-2 outline-emerald-500" : "hover:outline hover:outline-2 hover:outline-emerald-500/50"
                }`}
                onClick={() => setEditingField("status_title")}
              >
                <h1 className="text-lg font-bold text-white leading-tight">
                  {config.status_title || "Conectado à Internet"}
                </h1>
              </div>

              <div
                className={`group relative py-0.5 px-1 rounded cursor-pointer transition-all ${
                  editingField === "status_subtitle" ? "outline outline-2 outline-emerald-500" : "hover:outline hover:outline-2 hover:outline-emerald-500/50"
                }`}
                onClick={() => setEditingField("status_subtitle")}
              >
                <p className="text-xs text-gray-400">
                  {config.status_subtitle || "Sua sessão está ativa e segura"}
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-semibold mt-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Dispositivo Autorizado
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="bg-black/40 border border-white/5 rounded-2xl p-3">
                <span className="text-[9px] text-gray-500 block uppercase font-semibold">Tempo Online</span>
                <span className="text-sm font-bold text-white" style={{ color: config.cor_botao || "#3B82F6" }}>01:23:45</span>
              </div>
              <div className="bg-black/40 border border-white/5 rounded-2xl p-3">
                <span className="text-[9px] text-gray-500 block uppercase font-semibold">Identificação</span>
                <span className="text-sm font-bold text-white">visitante_demo</span>
              </div>
            </div>

            <button 
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold tracking-wide"
              onClick={(e) => { e.preventDefault(); alert("Simulação de desconexão."); }}
            >
              Desconectar da Rede
            </button>

            <p className="text-[9px] text-gray-500 mt-4">Powered by Hotspot WiFi</p>
          </div>
        </div>
      );
    }

    const backgroundGradient = `linear-gradient(135deg, ${config.cor_fundo_1 || "#0f111a"}, ${config.cor_fundo_2 || "#0f111a"})`;
    
    return (
      <div
        className="min-h-full flex items-center justify-center px-4 py-12 transition-all duration-300 flex-1"
        style={{ background: backgroundGradient }}
      >
        <div className="w-full max-w-md">
          {/* Top Header Section inside mock */}
          <div className="text-center mb-8">
            
            {/* Logo container */}
            <div
              className={`group relative inline-block mb-4 cursor-pointer rounded-lg p-1 transition-all ${
                editingField === "logo_url"
                  ? "outline outline-2 outline-emerald-500 outline-offset-2"
                  : "hover:outline hover:outline-2 hover:outline-emerald-500/50 hover:outline-offset-2"
              }`}
              onClick={() => setEditingField("logo_url")}
            >
              {config.logo_url ? (
                <img src={config.logo_url} alt="Logo" className="max-h-16 mx-auto group-hover:opacity-75 transition-opacity" />
              ) : (
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                  </svg>
                </div>
              )}
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                🖼️ Alterar Logo
              </span>
            </div>

            {/* Title container */}
            <div
              className={`group relative mb-2 py-0.5 px-1 rounded cursor-pointer transition-all ${
                editingField === "titulo"
                  ? "outline outline-2 outline-emerald-500 outline-offset-2"
                  : "hover:outline hover:outline-2 hover:outline-emerald-500/50 hover:outline-offset-2"
              }`}
              onClick={() => setEditingField("titulo")}
            >
              <h1 className="text-2xl font-bold text-white break-words leading-tight">
                {config.titulo || "Sem Título"}
              </h1>
              <span className="absolute -top-5 left-0 text-[8px] bg-emerald-600 text-white px-1.5 py-0.2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                ✏️ Editar Título
              </span>
            </div>

            {/* Subtitle container */}
            <div
              className={`group relative py-0.5 px-1 rounded cursor-pointer transition-all ${
                editingField === "subtitulo"
                  ? "outline outline-2 outline-emerald-500 outline-offset-2"
                  : "hover:outline hover:outline-2 hover:outline-emerald-500/50 hover:outline-offset-2"
              }`}
              onClick={() => setEditingField("subtitulo")}
            >
              <p
                className="text-xs break-words"
                style={{ color: lightenColor(config.cor_fundo_1 || "#000000", 60) }}
              >
                {config.subtitulo || "Clique para preencher uma descrição."}
              </p>
              <span className="absolute -top-5 left-0 text-[8px] bg-emerald-600 text-white px-1.5 py-0.2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                ✏️ Editar Descrição
              </span>
            </div>

          </div>

          {/* Form Card Mockup */}
          <div className="bg-white text-gray-800 p-6 rounded-2xl shadow-xl space-y-4">
            
            {/* LGPD type fields */}
            {portal.tipo === "lgpd" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">CPF *</label>
                  <div className="flex items-center border border-gray-300 rounded-lg px-2.5 py-2.5 bg-gray-50 text-gray-400 text-xs select-none">
                    <span className="mr-1.5">🆔</span> 000.000.000-00
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Nome Completo *</label>
                  <div className="flex items-center border border-gray-300 rounded-lg px-2.5 py-2.5 bg-gray-50 text-gray-400 text-xs select-none">
                    <span className="mr-1.5">👤</span> Seu nome completo
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Telefone *</label>
                  <div className="flex items-center border border-gray-300 rounded-lg px-2.5 py-2.5 bg-gray-50 text-gray-400 text-xs select-none">
                    <span className="mr-1.5">📞</span> (00) 00000-0000
                  </div>
                </div>
              </div>
            )}

            {/* Lead type fields */}
            {["lead", "lead_passivo"].includes(portal.tipo) && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Nome *</label>
                  <div className="flex items-center border border-gray-300 rounded-lg px-2.5 py-2.5 bg-gray-50 text-gray-400 text-xs select-none">
                    <span className="mr-1.5">👤</span> Seu nome
                  </div>
                </div>

                {config.exibir_cpf !== false && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">CPF *</label>
                    <div className="flex items-center border border-gray-300 rounded-lg px-2.5 py-2.5 bg-gray-50 text-gray-400 text-xs select-none">
                      <span className="mr-1.5">🪪</span> 000.000.000-00
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">E-mail *</label>
                  <div className="flex items-center border border-gray-300 rounded-lg px-2.5 py-2.5 bg-gray-50 text-gray-400 text-xs select-none">
                    <span className="mr-1.5">✉️</span> seu@email.com
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Telefone *</label>
                  <div className="flex items-center border border-gray-300 rounded-lg px-2.5 py-2.5 bg-gray-50 text-gray-400 text-xs select-none">
                    <span className="mr-1.5">📞</span> (00) 00000-0000
                  </div>
                </div>
              </div>
            )}

            {/* Plans mock layout */}
            {portal.tipo === "planos" && (
              <div className="space-y-3 py-1 text-center border-t border-b border-gray-150">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded tracking-wide uppercase">PIX ou Cartão</span>
                <p className="text-[11px] text-gray-500">Fluxo interativo exibindo opções de planos configurados na plataforma.</p>
              </div>
            )}

            {/* Login mock layout */}
            {portal.tipo === "login" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Usuário</label>
                  <div className="flex items-center border border-gray-300 rounded-lg px-2.5 py-2.5 bg-gray-50 text-gray-400 text-xs select-none">
                    <span className="mr-1.5">👤</span> Seu usuário
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Senha</label>
                  <div className="flex items-center border border-gray-300 rounded-lg px-2.5 py-2.5 bg-gray-50 text-gray-400 text-xs select-none">
                    <span className="mr-1.5">🔒</span> Sua senha secreta
                  </div>
                </div>
              </div>
            )}

            {/* Devices MAC and IP row simulation */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] text-gray-400 select-none">
              <div>
                <span className="block text-gray-400 font-semibold mb-0.5 text-[9px] uppercase tracking-wide">MAC (Automático)</span>
                <div className="border border-gray-200 rounded px-2.5 py-1.5 bg-gray-50 truncate">AA:BB:CC:DD:EE:FF</div>
              </div>
              <div>
                <span className="block text-gray-400 font-semibold mb-0.5 text-[9px] uppercase tracking-wide">IP (Automático)</span>
                <div className="border border-gray-200 rounded px-2.5 py-1.5 bg-gray-50 truncate">192.168.1.100</div>
              </div>
            </div>

            {/* LGPD Terms checkmock */}
            {portal.tipo === "lgpd" && (
              <div
                className={`group relative flex items-start gap-2.5 p-2 rounded cursor-pointer transition-all ${
                  editingField === "texto_lgpd"
                    ? "outline outline-2 outline-emerald-500"
                    : "hover:outline hover:outline-2 hover:outline-emerald-500/50"
                }`}
                onClick={() => setEditingField("texto_lgpd")}
              >
                <div className="w-3.5 h-3.5 mt-0.5 border border-gray-300 rounded bg-gray-50 shrink-0" />
                <span className="text-[10px] text-gray-600 leading-tight">
                  {config.texto_lgpd || "Termo de privacidade da LGPD."}
                </span>
                <span className="absolute -top-5 left-0 text-[8px] bg-emerald-600 text-white px-1.5 py-0.2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  ✏️ Editar Termos
                </span>
              </div>
            )}

            {/* Login destination redirect mockup (Link) */}
            {portal.tipo === "login" && config.link_portal_url && (
              <div className="text-center text-xs py-1">
                <span className="text-gray-500">{config.link_texto_antes}</span>
                <span className="text-emerald-600 hover:text-emerald-500 underline font-semibold transition-colors cursor-pointer ml-1 select-none">
                  {config.link_texto_link}
                </span>
                <span className="text-gray-500 ml-1">{config.link_texto_depois}</span>
              </div>
            )}

            {/* Action Button Container */}
            <div
              className={`group relative rounded-xl transition-all ${
                editingField === "texto_botao"
                  ? "outline outline-2 outline-emerald-500 outline-offset-2"
                  : "hover:outline hover:outline-2 hover:outline-emerald-500/50 hover:outline-offset-2"
              }`}
              onClick={() => setEditingField("texto_botao")}
            >
              <button
                type="button"
                className="w-full py-2.5 rounded-lg text-xs font-bold text-white shadow-md cursor-pointer transition-all active:scale-[0.99] select-none"
                style={{ backgroundColor: config.cor_botao || "#10b981" }}
              >
                {config.texto_botao || "Acessar"}
              </button>
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] bg-emerald-600 text-white px-1.5 py-0.2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                ✏️ Editar Texto do Botão
              </span>
            </div>

            {/* Lead Passivo redirect review mockup */}
            {portal.tipo === "lead_passivo" && (
              <div className="p-3 bg-[#f8fafc] border border-gray-250 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Após Enviar (Tela Sucesso)</span>
                </div>
                
                <div
                  className={`group relative p-1 rounded cursor-pointer transition-all ${
                    editingField === "texto_sucesso_titulo"
                      ? "outline outline-2 outline-emerald-500"
                      : "hover:outline hover:outline-2 hover:outline-emerald-500/50"
                  }`}
                  onClick={() => setEditingField("texto_sucesso_titulo")}
                >
                  <h4 className="text-xs font-bold text-gray-800">{config.texto_sucesso_titulo}</h4>
                  <span className="absolute -top-5 left-0 text-[8px] bg-emerald-600 text-white px-1.5 py-0.2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    ✏️ Editar Título Sucesso
                  </span>
                </div>

                <div
                  className={`group relative p-1 rounded cursor-pointer transition-all ${
                    editingField === "texto_sucesso_mensagem"
                      ? "outline outline-2 outline-emerald-500"
                      : "hover:outline hover:outline-2 hover:outline-emerald-500/50"
                  }`}
                  onClick={() => setEditingField("texto_sucesso_mensagem")}
                >
                  <p className="text-[10px] text-gray-600">{config.texto_sucesso_mensagem}</p>
                  <span className="absolute -top-5 left-0 text-[8px] bg-emerald-600 text-white px-1.5 py-0.2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    ✏️ Editar Mensagem Sucesso
                  </span>
                </div>

                {config.redirect_portal_url && (
                  <div className="mt-2 p-2 rounded-lg bg-emerald-50 text-[9px] text-emerald-700 border border-emerald-200 flex items-center justify-between animate-fade-in">
                    <span className="flex items-center gap-1 font-medium">
                      <span>➜</span>
                      <span>Redirecionará para: <strong>{outrosPortais.find(o => o.url_redirect === config.redirect_portal_url)?.nome || config.redirect_portal_url}</strong></span>
                    </span>
                    <span className="font-bold bg-emerald-100 px-1 py-0.5 rounded">{config.redirect_delay || 3}s</span>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer Text Container */}
          <div
            className={`group relative mt-6 py-1 px-1.5 rounded cursor-pointer text-center transition-all ${
              editingField === "texto_rodape"
                ? "outline outline-2 outline-emerald-500"
                : "hover:outline hover:outline-2 hover:outline-emerald-500/50"
            }`}
            onClick={() => setEditingField("texto_rodape")}
          >
            <p className="text-[10px] text-gray-400/80 leading-relaxed font-medium">
              {config.texto_rodape || "Termos de uso da rede hotspot."}
            </p>
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] bg-emerald-600 text-white px-1.5 py-0.2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              ✏️ Editar Rodapé
            </span>
          </div>

        </div>
      </div>
    );
  }
}

// Lightens hex color to make subtitle text visible on dark/colored background gradient
function lightenColor(hex, percent) {
  try {
    const cleanHex = hex.replace('#', '');
    const num = parseInt(cleanHex, 16);
    const r = Math.min(255, (num >> 16) + Math.round(255 * percent / 100));
    const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(255 * percent / 100));
    const b = Math.min(255, (num & 0x0000FF) + Math.round(255 * percent / 100));
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return '#93c5fd';
  }
}
