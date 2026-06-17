import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { ArrowLeft, Megaphone, Eye, Plus, Trash2, ArrowUp, ArrowDown, FileVideo, FileImage, ExternalLink, Loader2, UploadCloud } from "lucide-react";

export default function CampanhaEditor() {
  const { empresaSlug, id } = useParams();
  const [campanha, setCampanha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const token = localStorage.getItem("admin_token");

  const carregar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/campanhas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar campanha");
      setCampanha(data.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [id]);

  const handleToggleAtivo = async () => {
    if (!campanha) return;
    try {
      const res = await fetch(`/api/campanhas/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ativo: !campanha.ativo }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar campanha");
      carregar();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    const formData = new FormData();
    formData.append("arquivo", file);

    setUploading(true);
    try {
      const res = await fetch(`/api/campanhas/${id}/itens`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enviar arquivo");
      carregar();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletarItem = async (itemId) => {
    if (!confirm("Deseja remover este item?")) return;
    try {
      const res = await fetch(`/api/campanhas/${id}/itens/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao remover item");
      carregar();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReordenar = async (itens) => {
    const ordens = itens.map((item, idx) => ({ id: item.id, ordem: idx + 1 }));
    try {
      const res = await fetch(`/api/campanhas/${id}/itens/reordenar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ordens }),
      });
      if (!res.ok) throw new Error("Erro ao reordenar itens");
      carregar();
    } catch (err) {
      alert(err.message);
    }
  };

  const moverItem = (index, direcao) => {
    if (!campanha) return;
    const itens = [...campanha.itens];
    const novoIndex = index + direcao;
    if (novoIndex < 0 || novoIndex >= itens.length) return;
    [itens[index], itens[novoIndex]] = [itens[novoIndex], itens[index]];
    handleReordenar(itens);
  };

  const formatarDuracao = (segundos) => {
    if (!segundos) return "—";
    if (segundos < 60) return `${segundos}s`;
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </AdminLayout>
    );
  }

  if (!campanha) {
    return (
      <AdminLayout>
        <div className="bg-[#131722] border border-slate-800 rounded-xl p-8 text-center text-red-500 animate-fadeIn">
          Campanha não encontrada.
        </div>
      </AdminLayout>
    );
  }

  const itens = campanha.itens || [];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 animate-fadeIn">
        <div className="flex items-center gap-3">
          <Link
            to={`/admin/${empresaSlug}/campanhas`}
            className="p-2 border border-slate-800 text-slate-400 rounded-xl hover:bg-slate-850 hover:text-white transition-all active:scale-95 inline-flex items-center gap-1.5 text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-500">
            <Megaphone className="w-5 h-5" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-100 flex-1 truncate" title={campanha.nome}>
          {campanha.nome}
        </h1>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-xs font-mono">
            <Eye className="w-4 h-4 text-slate-500" />
            {campanha.views ?? 0} views
          </span>

          <button
            onClick={handleToggleAtivo}
            className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95 ${
              campanha.ativo
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-red-500/10 text-red-500"
            }`}
            title="Clique para alternar status"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${campanha.ativo ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
            {campanha.ativo ? "Campanha Ativa" : "Campanha Inativa"}
          </button>
        </div>
      </div>

      {campanha.descricao && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 mb-6 text-slate-350 text-sm animate-fadeIn">
          {campanha.descricao}
        </div>
      )}

      {/* Upload Zone */}
      <div className="bg-[#131722] border border-slate-800 rounded-xl p-6 mb-6 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-slate-800/60 pb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Itens de Mídia da Campanha</h2>
            <p className="text-slate-500 text-xs mt-1">
              Adicione imagens (JPG, PNG, WEBP até 10MB) ou vídeos (MP4, WEBM até 50MB) para exibição.
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <button
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              disabled={uploading}
              className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-orange-600/10 active:scale-95"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Upload de Mídia
                </>
              )}
            </button>
          </div>
        </div>

        {itens.length === 0 ? (
          <div 
            onClick={() => !uploading && fileInputRef.current && fileInputRef.current.click()}
            className={`border-2 border-dashed border-slate-800 rounded-xl p-10 text-center flex flex-col items-center justify-center transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-orange-500/50 cursor-pointer'}`}
          >
            <UploadCloud className="w-10 h-10 text-slate-600 mb-3 group-hover:text-orange-500" />
            <p className="text-slate-400 text-sm font-semibold">Nenhum item adicionado ainda</p>
            <p className="text-slate-550 text-xs mt-1">Clique para selecionar e enviar seu primeiro arquivo de mídia</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {itens.map((item, index) => (
              <div
                key={item.id}
                className="bg-[#090b11] border border-slate-800/80 rounded-xl overflow-hidden shadow-lg group hover:border-slate-700 transition-all flex flex-col"
              >
                {/* Preview Thumbnail */}
                <div className="w-full h-44 bg-slate-950 flex items-center justify-center overflow-hidden relative border-b border-slate-850">
                  {item.tipo === "video" ? (
                    <video
                      src={item.arquivo_url}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={item.arquivo_url}
                      alt={item.titulo || `Item ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* Badge de tipo de mídia */}
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-black/60 backdrop-blur-sm border border-slate-800 text-slate-300">
                    {item.tipo === "video" ? (
                      <>
                        <FileVideo className="w-3 h-3 text-orange-500" />
                        Vídeo
                      </>
                    ) : (
                      <>
                        <FileImage className="w-3 h-3 text-emerald-500" />
                        Imagem
                      </>
                    )}
                  </span>
                  {/* Badge de tempo de duração */}
                  <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-black/60 backdrop-blur-sm border border-slate-800 text-slate-400">
                    {formatarDuracao(item.duracao_segundos)}
                  </span>
                </div>

                {/* Card Info details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    {item.titulo ? (
                      <h4 className="text-slate-200 text-sm font-semibold truncate group-hover:text-white transition-colors" title={item.titulo}>
                        {item.titulo}
                      </h4>
                    ) : (
                      <h4 className="text-slate-500 text-sm italic font-normal">
                        Sem título
                      </h4>
                    )}
                    {item.link_destino && (
                      <a
                        href={item.link_destino}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-1 truncate max-w-full"
                        title={item.link_destino}
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{item.link_destino}</span>
                      </a>
                    )}
                  </div>

                  {/* Actions (Reordering & Deletion) */}
                  <div className="flex items-center gap-2 mt-4 border-t border-slate-850/60 pt-3">
                    <button
                      onClick={() => moverItem(index, -1)}
                      disabled={index === 0}
                      className="p-1.5 border border-slate-800 text-slate-400 rounded-lg hover:bg-slate-850 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
                      title="Mover para cima"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moverItem(index, 1)}
                      disabled={index === itens.length - 1}
                      className="p-1.5 border border-slate-800 text-slate-400 rounded-lg hover:bg-slate-850 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
                      title="Mover para baixo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    
                    <span className="text-xs font-mono font-bold text-slate-600 pl-1">
                      #{index + 1}
                    </span>

                    <div className="flex-1" />

                    <button
                      onClick={() => handleDeletarItem(item.id)}
                      className="p-1.5 border border-slate-800 text-slate-400 rounded-lg hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all active:scale-95"
                      title="Remover mídia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
