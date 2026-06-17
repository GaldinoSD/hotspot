// frontend/src/pages/admin/Sessoes.jsx
import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import PageHeader from "../../components/admin/PageHeader";

export default function Sessoes() {
  const [sessoes, setSessoes] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarSessoes = async () => {
    try {
      const res = await fetch("/api/radius/sessoes", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar sessões");
      setSessoes(data);
    } catch (err) {
      console.error("Erro ao carregar sessões:", err);
      setSessoes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarSessoes();
  }, []);

  return (
    <AdminLayout>
      <div className="p-6">
        <PageHeader
          title="Sessões RADIUS Ativas"
          subtitle="Monitoramento de conexões ativas em tempo real"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0"/></svg>
          }
        />
        <div className="overflow-auto rounded-lg border border-gray-800 bg-[#1a1d27]">
          <table className="min-w-full text-sm text-white">
            <thead className="bg-[#151821] text-xs uppercase text-gray-400">
              <tr>
                <th className="p-3 text-left">Usuário</th>
                <th className="p-3 text-left">CPF</th>
                <th className="p-3 text-left">MAC</th>
                <th className="p-3 text-left">IP</th>
                <th className="p-3 text-left">NAS (Mikrotik)</th>
                <th className="p-3 text-left">Início da Sessão</th>
              </tr>
            </thead>
            <tbody>
              {sessoes.map((s, idx) => (
                <tr key={idx} className="border-t border-gray-800">
                  <td className="p-3">{s.username}</td>
                  <td className="p-3">{s.cpf || "-"}</td>
                  <td className="p-3">{s.mac || "-"}</td>
                  <td className="p-3">{s.ip || "-"}</td>
                  <td className="p-3">{s.gateway || "-"}</td>
                  <td className="p-3">{new Date(s.acctstarttime).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
              {sessoes.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="p-3 text-center text-gray-500">
                    Nenhuma sessão ativa no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {loading && (
            <div className="text-center p-4 text-gray-500">Carregando sessões...</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

