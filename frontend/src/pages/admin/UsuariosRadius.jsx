// frontend/src/pages/admin/UsuariosRadius.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '@/components/admin/AdminLayout';
import PageHeader from '@/components/admin/PageHeader';

const UsuariosRadius = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [planos, setPlanos] = useState([]);
  const [planoSelecionado, setPlanoSelecionado] = useState('');
  const [status, setStatus] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [busca, setBusca] = useState('');

  const token = localStorage.getItem('admin_token');

  const carregarUsuarios = async () => {
    try {
      const res = await axios.get('/api/radius/usuarios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(res.data);
    } catch {
      setStatus('Erro ao carregar usuários.');
    }
  };

  useEffect(() => {
    axios.get('/api/planos', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setPlanos(res.data))
      .catch(() => setStatus('Erro ao carregar planos.'));

    carregarUsuarios();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setStatus('Usuário e senha são obrigatórios.');
      return;
    }

    try {
      await axios.post('/api/radius/criar-usuario', { username, password }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (planoSelecionado) {
        await axios.post('/api/radius/vincular-plano', {
          username,
          planoId: planoSelecionado
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setStatus('Usuário criado com sucesso!');
      setUsername('');
      setPassword('');
      setPlanoSelecionado('');
      setMostrarModal(false);

      carregarUsuarios();
    } catch (err) {
      setStatus(err.response?.data?.message || 'Erro ao criar usuário.');
    }
  };

  const handleDeletar = async (username) => {
    if (window.confirm(`Tem certeza que deseja remover o usuário ${username}?`)) {
      try {
        await axios.delete(`/api/radius/usuarios/${username}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        carregarUsuarios();
      } catch {
        alert('Erro ao deletar usuário');
      }
    }
  };

  // Filtragem local dos usuários
  const usuariosFiltrados = usuarios.filter(u => 
    (u.username && u.username.toLowerCase().includes(busca.toLowerCase())) ||
    (u.plano && u.plano.toLowerCase().includes(busca.toLowerCase())) ||
    (u.nas && u.nas.toLowerCase().includes(busca.toLowerCase()))
  );

  // Métricas calculadas em tempo real
  const totalUsuarios = usuarios.length;
  const usuariosComPlano = usuarios.filter(u => u.plano && u.plano !== '-').length;
  const nasAtivosUnicos = new Set(usuarios.map(u => u.nas).filter(n => n && n !== '-')).size;

  const cards = [
    {
      title: "Total de Usuários",
      value: totalUsuarios,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
      ),
      color: "text-cyan-400",
      iconBg: "bg-cyan-500/10",
      gradient: "from-[#0c1825] to-[#060c13]",
      border: "border-cyan-900/20 hover:border-cyan-700/30 shadow-[0_0_15px_-3px_rgba(6,182,212,0.1)]",
      glowBg: "bg-cyan-500/5",
      desc: "Contas de acesso cadastradas no RADIUS"
    },
    {
      title: "Planos Vinculados",
      value: usuariosComPlano,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
        </svg>
      ),
      color: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
      gradient: "from-[#0d1e1a] to-[#070e0c]",
      border: "border-emerald-900/20 hover:border-emerald-700/30 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]",
      glowBg: "bg-emerald-500/5",
      desc: "Usuários com perfil de limites associado"
    },
    {
      title: "Roteadores NAS Ativos",
      value: nasAtivosUnicos,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
        </svg>
      ),
      color: "text-amber-400",
      iconBg: "bg-amber-500/10",
      gradient: "from-[#20180c] to-[#110c06]",
      border: "border-amber-900/20 hover:border-amber-700/30 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]",
      glowBg: "bg-amber-500/5",
      desc: "Pontos de acesso ativos com conexões"
    }
  ];

  return (
    <AdminLayout>
      <PageHeader
        title="Usuários Radius"
        subtitle="Gerenciamento de contas e vínculos de planos de acesso no FreeRADIUS"
        icon={
          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 01-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
      >
        <button
          onClick={() => {
            setStatus('');
            setMostrarModal(true);
          }}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Novo Usuário
        </button>
      </PageHeader>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {cards.map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 border ${card.border} shadow-lg relative overflow-hidden group hover:scale-[1.01] transition-all duration-300`}>
            <div className={`absolute top-0 right-0 w-24 h-24 ${card.glowBg} rounded-full blur-2xl transform translate-x-4 -translate-y-4`}></div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{card.title}</span>
              <div className={`p-2.5 ${card.iconBg} ${card.color} rounded-xl`}>
                {card.icon}
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white group-hover:scale-[1.01] transition-transform duration-200">{card.value}</div>
              <div className="text-[10px] text-gray-500 mt-1">{card.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela de Usuários Cadastrados */}
      <div className="bg-[#121420] border border-gray-800/40 rounded-2xl p-5 relative shadow-xl overflow-hidden mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-white">Usuários Cadastrados</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Lista de contas sincronizadas no banco do RADIUS</p>
          </div>

          {/* Barra de Filtro de Busca */}
          <div className="relative max-w-xs w-full">
            <input
              id="buscar-usuarios"
              aria-label="Buscar usuários ou planos"
              type="text"
              placeholder="Buscar por usuário ou plano..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full px-4 py-2 bg-[#171a2a] border border-gray-800/60 text-xs text-white rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all pl-9"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#171a2a] text-gray-400 font-semibold border-b border-gray-800/60">
              <tr>
                <th className="px-5 py-3">Usuário (Username)</th>
                <th className="px-5 py-3">Senha (Password)</th>
                <th className="px-5 py-3">Plano</th>
                <th className="px-5 py-3">NAS (Roteador)</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40 text-gray-300">
              {usuariosFiltrados.length > 0 ? (
                usuariosFiltrados.map((u, idx) => (
                  <tr key={idx} className="hover:bg-[#181c2f] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-white">{u.username}</td>
                    <td className="px-5 py-3.5 text-gray-500 font-mono">{u.senha}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        u.plano && u.plano !== '-'
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                          : 'bg-gray-950/40 text-gray-500 border border-gray-900/30'
                      }`}>
                        {u.plano || '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 font-mono">{u.nas || '-'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDeletar(u.username)}
                        className="px-3 py-1 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-900/30 rounded-lg text-[10px] font-semibold transition-colors"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    Nenhum usuário cadastrado ou encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Novo Usuário RADIUS */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#121420] border border-gray-800/60 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl transform translate-x-4 -translate-y-4"></div>
            
            <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Novo Usuário RADIUS
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="radius-username" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Usuário (Username)</label>
                <input
                  id="radius-username"
                  type="text"
                  placeholder="Ex: CPF ou número de celular"
                  className="w-full px-4 py-2.5 bg-[#0d1117] border border-gray-800/60 text-white rounded-xl focus:outline-none focus:border-emerald-500/50 text-xs transition-all focus:ring-1 focus:ring-emerald-500/30"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="radius-password" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Senha (Password)</label>
                <input
                  id="radius-password"
                  type="password"
                  placeholder="Digite a senha de acesso"
                  className="w-full px-4 py-2.5 bg-[#0d1117] border border-gray-800/60 text-white rounded-xl focus:outline-none focus:border-emerald-500/50 text-xs transition-all focus:ring-1 focus:ring-emerald-500/30"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="radius-plano" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Vincular Plano (Opcional)</label>
                <select
                  id="radius-plano"
                  className="w-full px-4 py-2.5 bg-[#0d1117] border border-gray-800/60 text-white rounded-xl focus:outline-none focus:border-emerald-500/50 text-xs transition-all focus:ring-1 focus:ring-emerald-500/30 cursor-pointer"
                  value={planoSelecionado}
                  onChange={e => setPlanoSelecionado(e.target.value)}
                >
                  <option value="" className="bg-[#121420]">Selecione um plano...</option>
                  {planos.map(plano => (
                    <option key={plano.id} value={plano.id} className="bg-[#121420]">
                      {plano.nome} (Duração: {plano.duracao_minutos} min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-800/40">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 bg-transparent hover:bg-gray-900 border border-gray-800 text-gray-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Salvar Usuário
                </button>
              </div>
            </form>

            {status && (
              <p className={`text-xs mt-3 text-center font-medium ${
                status.includes('sucesso') ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {status}
              </p>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default UsuariosRadius;



