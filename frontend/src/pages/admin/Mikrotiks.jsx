import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";

export default function Mikrotiks() {
  const [mikrotiks, setMikrotiks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [mikrotikInfo, setMikrotikInfo] = useState(null);
  const [form, setForm] = useState({ nome: "", ip: "", usuario: "", senha: "", porta: 8728, end_hotspot: "" });
  const [erro, setErro] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  const token = localStorage.getItem("admin_token");

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
        const result = await res.json();
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
        setForm({ nome: "", ip: "", usuario: "", senha: "", porta: 8728 });
        setEditandoId(null);
        carregarMikrotiks();
      }
    } catch {
      setErro("Erro de conexão");
    }
  };

const editar = (mikrotik) => {
  setForm({ ...mikrotik, end_hotspot: mikrotik.end_hotspot || "" });
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

  useEffect(() => {
    carregarMikrotiks();
  }, []);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Mikrotiks</h1>
        <button
          onClick={() => { setShowModal(true); setForm({ nome: "", ip: "", usuario: "", senha: "", porta: 8728 }); setEditandoId(null); }}
          className="bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2 rounded shadow"
        >
          + Adicionar Mikrotik
        </button>
      </div>

      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
          <span className="text-gray-700">📶</span> Equipamentos Cadastrados
        </h2>
        {erro && <p className="text-red-600 mb-4">{erro}</p>}
        <table className="w-full text-left text-sm">
          <thead className="text-gray-500 border-b">
            <tr>
              <th className="p-2">Nome</th>
              <th className="p-2">IP</th>
              <th className="p-2">Porta</th>
              <th className="p-2">Status</th>
              <th className="p-2">Usuários Ativos</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {mikrotiks.map((m) => (
              <tr key={m.id} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium text-gray-800">{m.nome}</td>
                <td className="p-2">{m.ip}</td>
                <td className="p-2">{m.porta}</td>
                <td className="p-2">
  {m.status === "loading" ? (
    <span className="text-gray-500 text-xs">Carregando...</span>
  ) : (
    <span className={`text-xs px-3 py-1 rounded-full text-white ${m.status === "online" ? "bg-green-500" : "bg-red-500"}`}>
      {m.status === "online" ? "Online" : "Offline"}
    </span>
  )}
</td>
		    <td className="p-2">{m.usuarios_ativos}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => testarConexao(m.id)} title="Testar Conexão" className="border px-2 py-1 rounded text-sm">❗</button>
                  <button onClick={() => abrirInfo(m.id)} title="Detalhes" className="border px-2 py-1 rounded text-sm">ℹ</button>
                  <button onClick={() => editar(m)} title="Editar" className="border px-2 py-1 rounded text-sm">✏</button>
                  <button onClick={() => remover(m.id)} title="Remover" className="bg-red-500 text-white px-2 py-1 rounded text-sm">🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInfoModal && mikrotikInfo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Informações do Mikrotik</h3>
              <button onClick={() => setShowInfoModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 p-4 rounded shadow">
                <p className="text-xs text-gray-500">Modelo</p>
                <p className="font-medium">{mikrotikInfo.modelo}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded shadow">
                <p className="text-xs text-gray-500">Versão</p>
                <p className="font-medium">{mikrotikInfo.versao}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded shadow">
                <p className="text-xs text-gray-500">Uptime</p>
                <p className="font-medium">{mikrotikInfo.uptime}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded shadow">
                <p className="text-xs text-gray-500">CPU</p>
                <p className="font-medium">{mikrotikInfo.cpu}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editandoId ? "Editar Mikrotik" : "Adicionar Mikrotik"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={salvarMikrotik} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Nome</label>
                <input
                  placeholder="Ex: Mikrotik Principal"
                  className="w-full border rounded px-3 py-2"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Endereço IP</label>
                <input
                  placeholder="192.168.1.1"
                  className="w-full border rounded px-3 py-2"
                  value={form.ip}
                  onChange={(e) => setForm({ ...form, ip: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm text-gray-600">Usuário</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={form.usuario}
                    onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                    required
                  />
                </div>
                <div className="w-32">
                  <label className="text-sm text-gray-600">Porta API</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={form.porta}
                    onChange={(e) => setForm({ ...form, porta: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Senha</label>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  required
                />
              </div>
	      <div>
  <label className="text-sm text-gray-600">Endereço Hotspot</label>
  <input
    type="text"
    className="w-full border rounded px-3 py-2"
    placeholder="http://192.168.1.1/login"
    value={form.end_hotspot}
    onChange={(e) => setForm({ ...form, end_hotspot: e.target.value })}
  />
</div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded border hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800"
                >
                  {editandoId ? "Atualizar" : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

