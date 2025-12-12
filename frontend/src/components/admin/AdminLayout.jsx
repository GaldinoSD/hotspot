import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function AdminLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-4 flex flex-col justify-between">
        <div>
          <div className="text-center mb-8">
            <img src="/logo-forum.jpg" alt="Fórum Telecom" className="w-28 mx-auto" />
          </div>
          <nav className="flex flex-col gap-4 font-medium">
            <Link to="/admin" className="hover:text-blue-600">Dashboard</Link>
            <Link to="/admin/mikrotiks" className="hover:text-blue-600">Mikrotiks</Link>
            <Link to="/admin/planos" className="hover:text-blue-600">Planos</Link>
            <Link to="/admin/lgpd" className="hover:text-blue-600">Usuários LGPD</Link>
            <Link to="/admin/radius" className="hover:text-blue-600">Usuários RADIUS</Link>
            <Link to="/admin/pagamentos" className="hover:text-blue-600">Pagamentos</Link>
            <Link to="/admin/sessoes" className="hover:text-blue-600">Sessões</Link>
            <Link to="/admin/configuracoes" className="hover:text-blue-600">Configurações</Link>
            <button onClick={handleLogout} className="text-left hover:text-red-600">Sair</button>
          </nav>
        </div>
        <div className="text-center text-sm text-gray-500 mt-6">
          Desenvolvido por <span className="font-semibold">Fórum Telecom</span>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}

