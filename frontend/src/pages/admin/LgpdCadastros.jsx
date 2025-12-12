import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";

export default function LgpdCadastros() {
  const [registros, setRegistros] = useState([]);
  const [erro, setErro] = useState("");

  const token = localStorage.getItem("admin_token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/lgpd", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message);
        setRegistros(data);
      } catch (err) {
        setErro("Erro ao buscar registros LGPD");
      }
    };

    fetchData();
  }, [token]);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Cadastros LGPD</h1>
      </div>

      <div className="bg-white shadow rounded-xl p-6">
        {erro && <p className="text-red-600 mb-4">{erro}</p>}
        <table className="w-full text-sm text-left">
          <thead className="text-gray-500 border-b">
            <tr>
              <th className="p-2">CPF</th>
              <th className="p-2">MAC</th>
              <th className="p-2">IP</th>
              <th className="p-2">Aceite</th>
              <th className="p-2">Data</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium text-gray-800">{r.cpf}</td>
                <td className="p-2">{r.mac}</td>
                <td className="p-2">{r.ip}</td>
                <td className="p-2">{r.aceite ? "Sim" : "Não"}</td>
                <td className="p-2">{new Date(r.criado_em).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

