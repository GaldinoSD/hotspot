// src/pages/admin/Pagamentos.jsx
import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { ArrowDownAZ, ArrowDownZA } from "lucide-react";

export default function Pagamentos() {
  const [pagamentos, setPagamentos] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [ordenarPor, setOrdenarPor] = useState("id");
  const [ordemAsc, setOrdemAsc] = useState(true);

  const fetchPagamentos = async () => {
    try {
      const res = await fetch("/api/pagamentos/todos", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });
      const data = await res.json();
      setPagamentos(data);
    } catch (err) {
      console.error("Erro ao buscar pagamentos:", err);
    }
  };

  const liberarManual = async (id) => {
    if (!window.confirm("Deseja liberar este cliente manualmente?")) return;
    try {
      await fetch(`/api/pagamentos/liberar/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      });
      alert("Usuário liberado com sucesso!");
    } catch (err) {
      console.error("Erro ao liberar manualmente:", err);
      alert("Erro ao liberar.");
    }
  };

  useEffect(() => {
    fetchPagamentos();
  }, []);

  const toggleOrdenacao = (campo) => {
    if (ordenarPor === campo) {
      setOrdemAsc(!ordemAsc);
    } else {
      setOrdenarPor(campo);
      setOrdemAsc(true);
    }
  };

  const pagamentosFiltrados = pagamentos.filter((p) => {
    if (filtro === "todos") return true;
    if (filtro === "aprovados") return p.status.toLowerCase() === "approved";
    if (filtro === "pendentes") return p.status.toLowerCase() === "aguardando";
    return true;
  });

  const badgeStatus = (status) => {
    const lower = status.toLowerCase();
    if (lower === "approved") return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">✅ Aprovado</span>;
    if (lower === "aguardando") return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">⏳ Aguardando</span>;
    return <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-600">{status}</span>;
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Pagamentos</h1>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setFiltro("todos")}
            className={`px-4 py-1 rounded ${filtro === "todos" ? "bg-neutral-900 text-white" : "bg-gray-200"}`}
          >
            🔁 Todos
          </button>
          <button
            onClick={() => setFiltro("aprovados")}
            className={`px-4 py-1 rounded ${filtro === "aprovados" ? "bg-green-600 text-white" : "bg-gray-200"}`}
          >
            🟢 Aprovados
          </button>
          <button
            onClick={() => setFiltro("pendentes")}
            className={`px-4 py-1 rounded ${filtro === "pendentes" ? "bg-yellow-500 text-white" : "bg-gray-200"}`}
          >
            ⏳ Pendentes
          </button>
        </div>

        <div className="overflow-auto rounded-lg shadow border">
          <table className="min-w-full text-sm text-gray-700">
	  <thead className="bg-gray-100 text-left text-xs font-semibold uppercase">
  <tr>
    <th className="p-3 cursor-pointer" onClick={() => toggleOrdenacao("id")}>
      <div className="flex items-center gap-1">
        ID
        {ordenarPor === "id" && (ordemAsc ? <ArrowDownAZ className="w-4 h-4" /> : <ArrowDownZA className="w-4 h-4" />)}
      </div>
    </th>
    <th className="p-3 cursor-pointer" onClick={() => toggleOrdenacao("nome_plano")}>
      <div className="flex items-center gap-1">
        Plano
        {ordenarPor === "nome_plano" && (ordemAsc ? <ArrowDownAZ className="w-4 h-4" /> : <ArrowDownZA className="w-4 h-4" />)}
      </div>
    </th>
    <th className="p-3">MAC</th>
    <th className="p-3">IP</th>
    <th className="p-3 cursor-pointer" onClick={() => toggleOrdenacao("valor")}>
      <div className="flex items-center gap-1">
        Valor
        {ordenarPor === "valor" && (ordemAsc ? <ArrowDownAZ className="w-4 h-4" /> : <ArrowDownZA className="w-4 h-4" />)}
      </div>
    </th>
    <th className="p-3 cursor-pointer" onClick={() => toggleOrdenacao("status")}>
      <div className="flex items-center gap-1">
        Status
        {ordenarPor === "status" && (ordemAsc ? <ArrowDownAZ className="w-4 h-4" /> : <ArrowDownZA className="w-4 h-4" />)}
      </div>
    </th>
    <th className="p-3 cursor-pointer" onClick={() => toggleOrdenacao("criado_em")}>
      <div className="flex items-center gap-1">
        Data
        {ordenarPor === "criado_em" && (ordemAsc ? <ArrowDownAZ className="w-4 h-4" /> : <ArrowDownZA className="w-4 h-4" />)}
      </div>
    </th>
    <th className="p-3">Ação</th>
  </tr>
</thead>
<tbody>
  {[...pagamentosFiltrados].sort((a, b) => {
    if (ordemAsc) return a[ordenarPor] > b[ordenarPor] ? 1 : -1;
    else return a[ordenarPor] < b[ordenarPor] ? 1 : -1;
  }).map((p) => (
    <tr key={p.id} className="border-t">
      <td className="p-3">{p.id}</td>
      <td className="p-3">{p.nome_plano}</td>
      <td className="p-3">{p.mac || "-"}</td>
      <td className="p-3">{p.ip || "-"}</td>
      <td className="p-3">R$ {(p.valor / 100).toFixed(2)}</td>
      <td className="p-3">{badgeStatus(p.status)}</td>
      <td className="p-3">{new Date(p.criado_em).toLocaleString("pt-BR")}</td>
      <td className="p-3">
        <button
          onClick={() => liberarManual(p.id)}
          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"
        >
          Liberar
        </button>
      </td>
    </tr>
  ))}
</tbody>
	  </table>
        </div>
      </div>
    </AdminLayout>
  );
}

