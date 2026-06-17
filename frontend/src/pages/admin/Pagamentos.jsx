import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import PageHeader from "../../components/admin/PageHeader";
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  Unlock,
  AlertCircle
} from "lucide-react";

export default function Pagamentos() {
  const [pagamentos, setPagamentos] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [ordenarPor, setOrdenarPor] = useState("id");
  const [ordemAsc, setOrdemAsc] = useState(false); // Padrão: mais novos primeiro
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  const token = localStorage.getItem("admin_token");

  const fetchPagamentos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pagamentos/todos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setPagamentos(data);
    } catch (err) {
      console.error("Erro ao buscar pagamentos:", err);
      setErro("Erro ao carregar pagamentos");
    } finally {
      setLoading(false);
    }
  };

  const liberarManual = async (id) => {
    if (!window.confirm("Deseja liberar este cliente manualmente?")) return;
    try {
      await fetch(`/api/pagamentos/liberar/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Usuário liberado com sucesso!");
      fetchPagamentos(); // Recarrega a lista
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

  const handleFiltroChange = (novoFiltro) => {
    setFiltro(novoFiltro);
    setPaginaAtual(1);
  };

  const handleBuscaChange = (e) => {
    setBusca(e.target.value);
    setPaginaAtual(1);
  };

  const pagamentosFiltrados = pagamentos.filter((p) => {
    // Filtro por status
    let matchStatus = true;
    if (filtro === "aprovados") matchStatus = p.status.toLowerCase() === "approved";
    else if (filtro === "pendentes") matchStatus = p.status.toLowerCase() === "aguardando";

    if (!matchStatus) return false;

    // Filtro por busca textual (ID, Plano, MAC, IP, ID Mercado Pago)
    if (!busca) return true;
    const term = busca.toLowerCase();
    const idMatch = p.id.toString().includes(term);
    const planoMatch = (p.nome_plano || "").toLowerCase().includes(term);
    const macMatch = (p.mac || "").toLowerCase().includes(term);
    const ipMatch = (p.ip || "").toLowerCase().includes(term);
    const mpMatch = (p.mp_pagamento_id || "").toString().toLowerCase().includes(term);

    return idMatch || planoMatch || macMatch || ipMatch || mpMatch;
  });

  const pagamentosOrdenados = [...pagamentosFiltrados].sort((a, b) => {
    const valA = a[ordenarPor];
    const valB = b[ordenarPor];
    if (valA === valB) return 0;
    if (ordemAsc) return valA > valB ? 1 : -1;
    else return valA < valB ? 1 : -1;
  });

  // Paginação
  const totalItens = pagamentosOrdenados.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina) || 1;
  const pagamentosPaginados = pagamentosOrdenados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const badgeStatus = (status) => {
    const lower = status.toLowerCase();
    if (lower === "approved") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 shadow-[0_0_12px_-3px_rgba(16,185,129,0.2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Aprovado
        </span>
      );
    }
    if (lower === "aguardando") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/40 text-amber-400 border border-amber-800/40 shadow-[0_0_12px_-3px_rgba(245,158,11,0.2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          Aguardando
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-900/60 text-gray-400 border border-gray-800">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
        {status}
      </span>
    );
  };

  const stats = {
    total: pagamentos.length,
    aprovados: pagamentos.filter((p) => p.status.toLowerCase() === "approved").length,
    pendentes: pagamentos.filter((p) => p.status.toLowerCase() === "aguardando").length,
    totalValor: pagamentos
      .filter((p) => p.status.toLowerCase() === "approved")
      .reduce((acc, p) => acc + (p.valor || 0), 0) / 100
  };

  const SortIcon = ({ campo }) => {
    if (ordenarPor !== campo) return null;
    return ordemAsc ? (
      <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Transações e Cobranças"
          subtitle="Acompanhe pagamentos em tempo real e libere acessos manualmente"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
          }
        />

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gradient-to-br from-[#1b1e2c] to-[#121420] rounded-2xl border border-blue-900/25 p-5 shadow-lg relative overflow-hidden group hover:border-blue-700/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl transform translate-x-4 -translate-y-4"></div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Transações</span>
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400"><CreditCard className="w-4 h-4" /></div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-white group-hover:scale-[1.02] transition-transform duration-200">{stats.total}</div>
              <div className="text-[10px] text-gray-500 mt-1">Registros totais na base</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#122220] to-[#0e171b] rounded-2xl border border-emerald-900/25 p-5 shadow-lg relative overflow-hidden group hover:border-emerald-700/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl transform translate-x-4 -translate-y-4"></div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Aprovados</span>
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400"><CheckCircle2 className="w-4 h-4" /></div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-emerald-400 group-hover:scale-[1.02] transition-transform duration-200">{stats.aprovados}</div>
              <div className="text-[10px] text-gray-500 mt-1">
                {stats.total > 0 ? `${((stats.aprovados / stats.total) * 100).toFixed(0)}%` : "0%"} de taxa de conversão
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#24221b] to-[#141416] rounded-2xl border border-amber-900/25 p-5 shadow-lg relative overflow-hidden group hover:border-amber-700/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl transform translate-x-4 -translate-y-4"></div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Aguardando Pix</span>
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400"><Clock className="w-4 h-4" /></div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-amber-400 group-hover:scale-[1.02] transition-transform duration-200">{stats.pendentes}</div>
              <div className="text-[10px] text-gray-500 mt-1">Clientes na tela de pagamento</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#122220] to-[#0e171b] rounded-2xl border border-teal-900/25 p-5 shadow-lg relative overflow-hidden group hover:border-teal-700/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl transform translate-x-4 -translate-y-4"></div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Faturamento</span>
              <div className="p-2 bg-teal-500/10 rounded-xl text-teal-400"><DollarSign className="w-4 h-4" /></div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-bold text-teal-400 group-hover:scale-[1.02] transition-transform duration-200">
                R$ {stats.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">Saldo total faturado</div>
            </div>
          </div>
        </div>

        {/* HUD de Busca e Filtros */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por ID, plano, MAC, IP ou MP ID..."
              value={busca}
              onChange={handleBuscaChange}
              className="w-full bg-[#0d1117] border border-gray-800 focus:border-blue-500/60 text-gray-200 placeholder-gray-500 pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none"
            />
            {busca && (
              <button 
                onClick={() => { setBusca(""); setPaginaAtual(1); }} 
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="flex bg-[#0d1117] p-1 rounded-xl border border-gray-800 gap-1 self-start md:self-auto">
            <button
              onClick={() => handleFiltroChange("todos")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                filtro === "todos" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => handleFiltroChange("aprovados")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                filtro === "aprovados" 
                  ? "bg-emerald-600 text-white shadow-md" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Aprovados
            </button>
            <button
              onClick={() => handleFiltroChange("pendentes")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                filtro === "pendentes" 
                  ? "bg-amber-500 text-white shadow-md" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Pendentes
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {erro && (
          <div className="bg-red-950/20 border border-red-800/40 text-red-400 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium">{erro}</span>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-[#1a1d27] border border-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            /* Skeleton Loaders */
            <div className="p-6 space-y-4">
              <div className="flex gap-4 border-b border-gray-800 pb-3">
                <div className="h-4 bg-gray-800 rounded w-16 animate-pulse"></div>
                <div className="h-4 bg-gray-800 rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-gray-800 rounded w-28 animate-pulse"></div>
                <div className="h-4 bg-gray-800 rounded w-20 animate-pulse"></div>
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center justify-between py-2 border-b border-gray-800/30">
                  <div className="h-5 bg-gray-800 rounded w-12 animate-pulse"></div>
                  <div className="h-5 bg-gray-800 rounded w-32 animate-pulse"></div>
                  <div className="h-5 bg-gray-800 rounded w-24 animate-pulse"></div>
                  <div className="h-5 bg-gray-800 rounded w-16 animate-pulse"></div>
                  <div className="h-6 bg-gray-800 rounded-full w-20 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : pagamentosPaginados.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-full text-gray-500 mb-4 animate-bounce">
                <CreditCard className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Nenhum pagamento localizado</h3>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                {busca || filtro !== "todos" 
                  ? "Não encontramos transações com os parâmetros de pesquisa aplicados." 
                  : "Ainda não existem transações registradas no banco de dados."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#11141e] border-b border-gray-800">
                  <tr>
                    <th 
                      className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-[#1a1d27]/70 transition-colors"
                      onClick={() => toggleOrdenacao("id")}
                    >
                      <div className="flex items-center gap-1.5">
                        ID
                        <SortIcon campo="id" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-[#1a1d27]/70 transition-colors"
                      onClick={() => toggleOrdenacao("nome_plano")}
                    >
                      <div className="flex items-center gap-1.5">
                        Plano contratado
                        <SortIcon campo="nome_plano" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Dispositivo (MAC)</th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-[#1a1d27]/70 transition-colors"
                      onClick={() => toggleOrdenacao("valor")}
                    >
                      <div className="flex items-center gap-1.5">
                        Valor
                        <SortIcon campo="valor" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-[#1a1d27]/70 transition-colors"
                      onClick={() => toggleOrdenacao("status")}
                    >
                      <div className="flex items-center gap-1.5">
                        Status
                        <SortIcon campo="status" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-[#1a1d27]/70 transition-colors"
                      onClick={() => toggleOrdenacao("criado_em")}
                    >
                      <div className="flex items-center gap-1.5">
                        Criado Em
                        <SortIcon campo="criado_em" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider pr-8">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-[#1a1d27] divide-y divide-gray-800/60">
                  {pagamentosPaginados.map((p) => {
                    const isExpanded = expandedRowId === p.id;
                    const isApproved = p.status.toLowerCase() === "approved";
                    return (
                      <React.Fragment key={p.id}>
                        {/* Normal Row */}
                        <tr 
                          onClick={() => setExpandedRowId(isExpanded ? null : p.id)}
                          className={`hover:bg-[#1f2330]/50 transition-colors cursor-pointer ${
                            isExpanded ? "bg-[#181a24]" : ""
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-300">#{p.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-white font-semibold">{p.nome_plano}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-400">{p.mac || "-"}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-white">
                            R$ {(p.valor / 100).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{badgeStatus(p.status)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                            {new Date(p.criado_em).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right pr-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              {!isApproved && (
                                <button
                                  onClick={() => liberarManual(p.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                                  title="Liberar Acesso Manualmente"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                  Liberar
                                </button>
                              )}
                              <button 
                                onClick={() => setExpandedRowId(isExpanded ? null : p.id)}
                                className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Details Row */}
                        {isExpanded && (
                          <tr className="bg-[#13151f]/80">
                            <td colSpan="7" className="px-8 py-5 border-t border-gray-800/40">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed text-gray-400">
                                <div className="space-y-2.5">
                                  <h6 className="font-bold text-gray-300 uppercase tracking-widest text-[8px] border-b border-gray-800 pb-1">Conexão Cliente</h6>
                                  <p><span className="text-gray-500 block text-[9px] uppercase">Endereço IP</span> <span className="font-mono text-gray-200">{p.ip || "Não capturado"}</span></p>
                                  <p><span className="text-gray-500 block text-[9px] uppercase">Endereço MAC</span> <span className="font-mono text-gray-200">{p.mac || "Não capturado"}</span></p>
                                </div>
                                <div className="space-y-2.5">
                                  <h6 className="font-bold text-gray-300 uppercase tracking-widest text-[8px] border-b border-gray-800 pb-1">Integração Mercado Pago</h6>
                                  <p><span className="text-gray-500 block text-[9px] uppercase">ID de Pagamento MP</span> <span className="font-mono text-gray-200">{p.mp_pagamento_id || "Aguardando geração"}</span></p>
                                  <p><span className="text-gray-500 block text-[9px] uppercase">Data de Criação</span> <span className="text-gray-200">{new Date(p.criado_em).toLocaleString("pt-BR")}</span></p>
                                </div>
                                <div className="space-y-2.5">
                                  <h6 className="font-bold text-gray-300 uppercase tracking-widest text-[8px] border-b border-gray-800 pb-1">Ação de Auditoria</h6>
                                  {isApproved ? (
                                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mt-1">
                                      <span className="p-1 bg-emerald-500/10 rounded-lg"><CheckCircle2 className="w-4 h-4" /></span>
                                      Acesso Liberado Automaticamente
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="text-[10px] text-gray-500 mb-2">Este pagamento ainda não foi processado pelo webhook do Mercado Pago. Você pode forçar a liberação do acesso:</p>
                                      <button
                                        onClick={() => liberarManual(p.id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all shadow-md"
                                      >
                                        <Unlock className="w-3.5 h-3.5" />
                                        Liberar Cliente
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer with Pagination */}
          {!loading && totalItens > 0 && (
            <div className="bg-[#11141e] border-t border-gray-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-gray-400">
                Exibindo <span className="font-bold text-white">{Math.min(totalItens, (paginaAtual - 1) * itensPorPagina + 1)}-{Math.min(totalItens, paginaAtual * itensPorPagina)}</span> de <span className="font-bold text-white">{totalItens}</span> transações
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                  disabled={paginaAtual === 1}
                  className="px-3 py-1.5 bg-[#1a1d27] border border-gray-800 rounded-lg text-xs font-semibold text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Anterior
                </button>
                <div className="text-xs font-semibold text-gray-400 px-2">
                  Página <span className="text-white">{paginaAtual}</span> de <span className="text-white">{totalPaginas}</span>
                </div>
                <button
                  onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="px-3 py-1.5 bg-[#1a1d27] border border-gray-800 rounded-lg text-xs font-semibold text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
