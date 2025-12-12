import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";

export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");

  const token = localStorage.getItem("admin_token");

  const carregarDados = async () => {
    if (!token) {
      setErro("Token não fornecido. Faça login.");
      return;
    }

    try {
      const res = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const errJson = await res.json();
        setErro(errJson.error || "Erro ao carregar dashboard");
        return;
      }

      const json = await res.json();
      setDados(json);
    } catch (err) {
      setErro("Erro ao carregar dashboard");
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-6">📊 Dashboard</h1>

      {erro && <p className="text-red-600">{erro}</p>}

      {!dados ? (
        <p>Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow p-4 rounded-xl">
            <p className="text-sm text-gray-500">Pagamentos (24h)</p>
            <p className="text-2xl font-bold">{dados?.pagamentos?.ultimas_24h || 0}</p>
          </div>
          <div className="bg-white shadow p-4 rounded-xl">
            <p className="text-sm text-gray-500">Pagamentos (total)</p>
            <p className="text-2xl font-bold">{dados?.pagamentos?.total || 0}</p>
          </div>
          <div className="bg-white shadow p-4 rounded-xl">
            <p className="text-sm text-gray-500">Usuários Radius</p>
            <p className="text-2xl font-bold">{dados?.radius?.total_usuarios || 0}</p>
          </div>
          <div className="bg-white shadow p-4 rounded-xl">
            <p className="text-sm text-gray-500">Mikrotiks Online</p>
            <p className="text-2xl font-bold">
              {dados?.mikrotiks?.online || 0} / {dados?.mikrotiks?.total || 0}
            </p>
          </div>
        </div>
      )}

      {dados?.sessoes && dados.sessoes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">👥 Sessões Ativas por Mikrotik</h2>
          <ul className="bg-white shadow rounded-xl p-4 space-y-2">
            {dados.sessoes.map((s, i) => (
              <li key={i} className="flex justify-between border-b pb-2">
                <span>{s.nome}</span>
                <span className="font-bold">{s.conectados}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AdminLayout>
  );
}
