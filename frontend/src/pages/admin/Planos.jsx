import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { Send } from "lucide-react";

export default function Planos() {
  const [planos, setPlanos] = useState([]);
  const [mikrotiks, setMikrotiks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    duracao: 1,
    valor: "0,00",
    velocidade_download: 0,
    velocidade_upload: 0,
    mikrotik_id: "",
    address_pool: "default-dhcp",
    shared_users: 10,
    ativo: true,
  });
  const token = localStorage.getItem("admin_token");

  const carregarPlanos = async () => {
    try {
      const res = await fetch("/api/planos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Erro ao carregar planos");
      setPlanos(data);
    } catch (err) {
      alert("Erro ao carregar planos.");
    } finally {
      setLoading(false);
    }
  };

  const carregarMikrotiks = async () => {
    try {
      const res = await fetch("/api/mikrotiks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMikrotiks(data);
    } catch (err) {
      alert("Erro ao carregar Mikrotiks");
    }
  };

  useEffect(() => {
    carregarPlanos();
    carregarMikrotiks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editando ? `/api/planos/${editando}` : "/api/planos";
      const method = editando ? "PUT" : "POST";
      const valorEmCentavos = Math.round(
        parseFloat(form.valor.replace(",", ".") || "0") * 100
      );

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: form.nome,
          descricao: form.descricao,
          valor: valorEmCentavos,
          duracao_minutos: parseInt(form.duracao),
          velocidade_down: parseInt(form.velocidade_download),
          velocidade_up: parseInt(form.velocidade_upload),
          mikrotik_id: parseInt(form.mikrotik_id),
          address_pool: form.address_pool,
          shared_users: parseInt(form.shared_users),
          ativo: form.ativo,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar plano");
      setShowModal(false);
      setEditando(null);
      carregarPlanos();
    } catch (err) {
      alert("Erro ao salvar plano.");
    }
  };

  const handleEditar = (plano) => {
    setForm({
      nome: plano.nome,
      descricao: plano.descricao,
      valor: (plano.valor / 100).toFixed(2).replace(".", ","),
      duracao: plano.duracao_minutos,
      velocidade_download: plano.velocidade_down,
      velocidade_upload: plano.velocidade_up,
      mikrotik_id: plano.mikrotik_id,
      address_pool: plano.address_pool || "default-dhcp",
      shared_users: plano.shared_users || 10,
      ativo: plano.ativo,
    });
    setEditando(plano.id);
    setShowModal(true);
  };

  const handleRemover = async (id) => {
    if (!confirm("Deseja remover este plano?")) return;
    try {
      await fetch(`/api/planos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      carregarPlanos();
    } catch (err) {
      alert("Erro ao remover plano.");
    }
  };

  const enviarParaMikrotik = async (id) => {
    if (!confirm("Deseja realmente enviar esse plano para o Mikrotik?")) return;
    try {
      const res = await fetch(`/api/planos/${id}/enviar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("Plano enviado com sucesso para o Mikrotik!");
    } catch (err) {
      alert("Erro ao enviar plano: " + err.message);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Planos</h1>
        <button
          onClick={() => {
            setForm({
              nome: "",
              descricao: "",
              duracao: 1,
              valor: "0,00",
              velocidade_download: 0,
              velocidade_upload: 0,
              mikrotik_id: "",
              address_pool: "default-dhcp",
              shared_users: 10,
              ativo: true,
            });
            setEditando(null);
            setShowModal(true);
          }}
          className="bg-neutral-900 text-white px-5 py-2 rounded hover:bg-neutral-800"
        >
          + Novo Plano
        </button>
      </div>

      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">📋 Planos Cadastrados</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-gray-500 border-b">
              <tr>
                <th className="p-2">Nome</th>
                <th className="p-2">Duração</th>
                <th className="p-2">Velocidade</th>
                <th className="p-2">Preço</th>
                <th className="p-2">Status</th>
                <th className="p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {planos.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <div className="font-semibold">{p.nome}</div>
                    <div className="text-xs text-gray-500">{p.descricao}</div>
                  </td>
                  <td className="p-2">{p.duracao_minutos} min</td>
                  <td className="p-2">
                    ⬇ {p.velocidade_down} Mbps<br />
                    ⬆ {p.velocidade_up} Mbps
                  </td>
                  <td className="p-2 font-medium">R$ {(p.valor / 100).toFixed(2)}</td>
                  <td className="p-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${p.ativo ? "bg-black text-white" : "bg-gray-200 text-gray-600"}`}>
                      {p.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => handleEditar(p)} className="border p-1 rounded" title="Editar">✏</button>
                    <button onClick={() => handleRemover(p.id)} className="bg-red-500 text-white p-1 rounded" title="Remover">🗑</button>
                    <button onClick={() => enviarParaMikrotik(p.id)} className="border p-1 rounded text-sm flex items-center gap-1" title="Enviar">
                      <Send className="w-4 h-4" /> Enviar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editando ? "Editar Plano" : "Criar Plano"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Nome do Plano</label>
          <input type="text" className="w-full border px-3 py-2 rounded" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Descrição</label>
          <textarea className="w-full border px-3 py-2 rounded" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Duração (minutos)</label> 
            <input type="number" className="w-full border px-3 py-2 rounded" value={form.duracao} onChange={(e) => setForm({ ...form, duracao: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Valor (R$)</label>
            <input type="text" className="w-full border px-3 py-2 rounded" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Download (Mbps)</label>
            <input type="number" className="w-full border px-3 py-2 rounded" value={form.velocidade_download} onChange={(e) => setForm({ ...form, velocidade_download: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Upload (Mbps)</label>
            <input type="number" className="w-full border px-3 py-2 rounded" value={form.velocidade_upload} onChange={(e) => setForm({ ...form, velocidade_upload: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Mikrotik</label>
          <select className="w-full border px-3 py-2 rounded" value={form.mikrotik_id} onChange={(e) => setForm({ ...form, mikrotik_id: e.target.value })}>
            <option value="">Selecione o Mikrotik</option>
            {mikrotiks.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
          <span className="text-sm text-gray-600">Plano ativo</span>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-gray-100">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800">{editando ? "Salvar" : "Criar"}</button>
        </div>
      </form>
	      </div>
        </div>
      )}
    </AdminLayout>
  );
}

