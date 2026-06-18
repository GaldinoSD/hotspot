import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { empresaSlug } = useParams();
  const { user, logout, isSuperAdmin, empresas, switchEmpresa, hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    localStorage.removeItem("theme");
    document.documentElement.classList.remove("theme-light");
  }, []);
  const [switchingEmpresa, setSwitchingEmpresa] = useState(false);
  const [empresaLogo, setEmpresaLogo] = useState(null);
  const [openMenus, setOpenMenus] = useState({});
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [whatsappAvisoFechado, setWhatsappAvisoFechado] = useState(false);

  const toggleMenu = (key) => setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));

  const slug = empresaSlug || user?.empresa_slug || 'default';
  const basePath = `/admin/${slug}`;

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const res = await fetch(`/api/empresas/by-slug/${slug}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEmpresaLogo(data.logo_url);
        }
      } catch (e) { /* silencioso */ }
    };
    if (slug) fetchLogo();
  }, [slug]);

  useEffect(() => {
    const fetchWhatsappStatus = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const res = await fetch('/api/whatsapp/instance/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setWhatsappStatus(data);
        }
      } catch (e) { /* silencioso */ }
    };
    setWhatsappAvisoFechado(sessionStorage.getItem(`wa_aviso_fechado_${slug}`) === '1');
    if (slug) fetchWhatsappStatus();
  }, [slug]);

  const fecharAvisoWhatsapp = () => {
    setWhatsappAvisoFechado(true);
    sessionStorage.setItem(`wa_aviso_fechado_${slug}`, '1');
  };

  const whatsappDesconectado = whatsappStatus && (!whatsappStatus.exists || whatsappStatus.state !== 'open');
  const mostrarAvisoWhatsapp = whatsappDesconectado && !whatsappAvisoFechado && !location.pathname.includes('/whatsapp');

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuItems = [
    {
      key: "dashboard",
      title: "Dashboard",
      path: basePath,
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg>
      )
    },
    ...(isSuperAdmin ? [{
      key: "empresas",
      title: "Empresas",
      path: `${basePath}/empresas`,
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
      )
    }] : []),
    {
      key: "mikrotik_group",
      title: "Mikrotik",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/>
        </svg>
      ),
      children: [
        { key: "mikrotiks", title: "Cadastro mikrotik", path: `${basePath}/mikrotiks` },
        { key: "vpn", title: "VPN Wireguard", path: `${basePath}/vpn` },
        { key: "monitoramento", title: "Monitoramento", path: `${basePath}/monitoramento` },
      ]
    },
    {
      key: "portais",
      title: "Portais",
      path: `${basePath}/portais`,
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
        </svg>
      )
    },
    {
      key: "campanhas",
      title: "Campanhas",
      path: `${basePath}/campanhas`,
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
        </svg>
      )
    },
    {
      key: "planos",
      title: "Planos",
      path: `${basePath}/planos`,
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
        </svg>
      )
    },
    {
      key: "pagamentos",
      title: "Pagamentos",
      path: `${basePath}/pagamentos`,
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h2m3 0h2m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
      )
    },
    {
      key: "financeiro",
      permission: "pagamentos",
      title: "Financeiro",
      path: `${basePath}/financeiro`,
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      )
    },
    {
      key: "clientes_group",
      title: "Clientes",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
      ),
      children: [
        { key: "clientes", title: "Cadastro LGPD", path: `${basePath}/lgpd` },
        { key: "leads", title: "Leads", path: `${basePath}/leads` },
      ]
    },
    {
      key: "radius_group",
      title: "Radius",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
      ),
      children: [
        { key: "radius", title: "Usuários Radius", path: `${basePath}/radius` },
        { key: "sessoes", title: "Sessões Ativas", path: `${basePath}/sessoes` },
        { key: "sessoeslog", title: "Log Radius", path: `${basePath}/sessoeslog` },
        { key: "compliance", title: "Marco Civil", path: `${basePath}/compliance` },
      ]
    },
    {
      key: "whatsapp",
      title: "WhatsApp",
      path: `${basePath}/whatsapp`,
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 20l1.3-3.9A9 9 0 113.9 18.7L3 20zm9-14a7 7 0 00-5.9 10.7l.3.5-.8 2.3 2.4-.8.5.3A7 7 0 1012 6z"/>
        </svg>
      )
    },
    ...(isSuperAdmin ? [{
      key: "logs",
      title: "Logs do Sistema",
      path: `${basePath}/logs`,
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      )
    }] : []),
    {
      key: "configuracoes_group",
      title: "Configurações",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      ),
      children: [
        { key: "configuracoes", title: "Configurações", path: `${basePath}/configuracoes` },
        { key: "usuarios", title: "Usuários", path: `${basePath}/usuarios` },
        ...(isSuperAdmin ? [{ key: "grupos-permissao", title: "Permissões", path: `${basePath}/grupos-permissao` }] : []),
      ]
    },
  ];

  const filteredMenuItems = menuItems.map(item => {
    if (item.children) {
      const filteredChildren = item.children.filter(child => {
        if (!child.key || child.key === 'dashboard') return true;
        if (isSuperAdmin) return true;
        if (child.key === 'empresas' || child.key === 'grupos-permissao' || child.key === 'logs') return false;
        return hasPermission(child.permission || child.key, 'ver');
      });
      return filteredChildren.length > 0 ? { ...item, children: filteredChildren } : null;
    }
    if (!item.key || item.key === 'dashboard') return item;
    if (isSuperAdmin) return item;
    if (item.key === 'empresas' || item.key === 'grupos-permissao' || item.key === 'logs') return null;
    return hasPermission(item.permission || item.key, 'ver') ? item : null;
  }).filter(Boolean);

  const isActive = (path) => {
    if (path === basePath) {
      return location.pathname === basePath;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen overflow-hidden flex bg-[#0f111a]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-20' : 'w-72'} bg-[#1a1d27] border-r border-gray-800 flex flex-col
          shadow-2xl lg:shadow-none
        `}
      >
        {/* Logo Area - Centered, matching the top header bar size */}
        <div className={`sidebar-logo-area border-b border-gray-800 !py-3 h-[65px] flex items-center justify-center ${isCollapsed ? '!p-3' : ''}`}>
          {!isCollapsed ? (
            <img src={empresaLogo || '/logo-forum.jpg'} alt="Logo" className="h-10 w-auto max-w-[160px] object-contain" />
          ) : (
            <img src={empresaLogo || '/logo-forum.jpg'} alt="Logo" className="h-9 w-9 object-contain rounded-lg" />
          )}
          {/* Mobile close button only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* User Info Card removed from sidebar as it was moved to the header */}

        <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="space-y-1">
            {filteredMenuItems.map((item) => {
              if (item.children) {
                return (
                  <div key={item.key} className="mb-4">
                    {!isCollapsed ? (
                      <div className="px-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4">
                        {item.title}
                      </div>
                    ) : (
                      <div className="h-px bg-gray-800 my-4 mx-4"></div>
                    )}
                    <div className="flex flex-col gap-1">
                      {item.children.map(child => (
                        <Link
                          key={child.path}
                          to={child.path}
                          title={isCollapsed ? child.title : ""}
                          className={`
                            flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
                            ${isActive(child.path)
                              ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50'
                              : 'text-gray-400 hover:bg-[#252b3b] hover:text-gray-200'
                            }
                            ${isCollapsed ? 'justify-center px-0' : ''}
                          `}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <span className={isActive(child.path) ? 'text-blue-400' : 'text-gray-500'}>
                            {child.icon || item.icon}
                          </span>
                          {!isCollapsed && <span>{child.title}</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.title : ""}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 cursor-pointer mb-1
                    ${isActive(item.path)
                      ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50'
                      : 'text-gray-400 hover:bg-[#252b3b] hover:text-gray-200'
                    }
                    ${isCollapsed ? 'justify-center px-0' : ''}
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className={isActive(item.path) ? 'text-blue-400' : 'text-gray-500'}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="text-sm">{item.title}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Painel Super Admin - fixed bottom */}
        {isSuperAdmin && (
          <div className="p-3 border-t border-gray-800/40 bg-[#141720]">
            <Link
              to="/super"
              title={isCollapsed ? "Painel Super Admin" : ""}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-yellow-400 hover:bg-yellow-950/20 transition-all duration-200 border border-yellow-800/20 ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              {!isCollapsed && <span className="text-sm">Painel Super Admin</span>}
            </Link>
          </div>
        )}

        {/* Unified bottom bar - Collapse toggle & Credits */}
        <div className={`border-t border-gray-800/40 p-2.5 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2 bg-[#12151e]`}>
          {!isCollapsed && (
            <span className="text-[10px] text-gray-500 truncate">
              Desenvolvido por <span className="font-semibold text-gray-400">Jonatas A. Galdino</span>
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center p-1 rounded-md text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-all duration-200 cursor-pointer"
            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isCollapsed
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
              }
            </svg>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
        <header className="bg-[#1a1d27] border-b border-gray-800 px-6 py-3 sticky top-0 z-10 flex-shrink-0">
          <div className="flex items-center justify-between relative">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 cursor-pointer lg:hidden"
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            
            <img src="/logo-forum.jpg" alt="Logo" className="h-10 object-contain lg:hidden" />
            
            <div className="hidden lg:block" />

            <div className="flex items-center gap-3">
              <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-gray-800/50 transition-all duration-200 cursor-pointer select-none"
              >
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-gray-200 truncate max-w-[150px]">
                    {user?.nome || user?.email}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {user?.empresa_nome || 'Empresa'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white uppercase select-none">
                  {(user?.nome || user?.email || '?').substring(0, 2)}
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-[#1a1d27] border border-gray-800 rounded-lg shadow-2xl p-4 z-50 animate-fade-in">
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-800/60">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white uppercase">
                        {(user?.nome || user?.email || '?').substring(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-gray-200 truncate max-w-[120px]">{user?.nome || user?.email}</span>
                          {user?.role && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-blue-900/40 text-blue-400 border border-blue-800/30">
                              {user.role}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 truncate block">{user?.email}</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Empresa activa</label>
                      {empresas.length > 1 ? (
                        <select
                          value={user?.empresa_id || ''}
                          disabled={switchingEmpresa}
                          onChange={async (e) => {
                            const newId = parseInt(e.target.value);
                            if (newId === user?.empresa_id) return;
                            setSwitchingEmpresa(true);
                            try {
                              const emp = await switchEmpresa(newId);
                              window.location.href = `/admin/${emp.slug}`;
                            } catch (err) {
                              alert('Erro ao trocar empresa');
                            } finally {
                              setSwitchingEmpresa(false);
                            }
                          }}
                          className="w-full bg-[#0f172a] border border-gray-800 text-gray-300 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500 transition-colors"
                        >
                          {empresas.map(e => (
                            <option key={e.id} value={e.id}>{e.nome}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 px-1 py-0.5">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          <span className="font-medium">{user?.empresa_nome || 'Empresa'}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-800/60 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:bg-red-900/20 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sair da conta
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 text-gray-300">
          {mostrarAvisoWhatsapp && (
            <div className="mb-4 bg-yellow-900/30 border border-yellow-700/50 text-yellow-200 rounded-lg px-4 py-3 flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <div className="flex-1 text-sm">
                <strong className="font-semibold">WhatsApp desconectado.</strong>{" "}
                {whatsappStatus?.exists
                  ? "A instância não está conectada. Mensagens automáticas não serão enviadas."
                  : "Nenhuma instância configurada para esta empresa."}{" "}
                <Link to={`${basePath}/whatsapp`} className="underline font-medium hover:text-yellow-100">
                  Configurar agora
                </Link>
              </div>
              <button
                onClick={fecharAvisoWhatsapp}
                className="text-yellow-400 hover:text-yellow-200 flex-shrink-0"
                aria-label="Fechar aviso"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
