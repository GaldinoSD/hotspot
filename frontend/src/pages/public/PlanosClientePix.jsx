import { useSearchParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PlanosClientePix() {
  const [searchParams] = useSearchParams();
  const mac = searchParams.get("mac");
  const ip = searchParams.get("ip");
  const cpf = searchParams.get("cpf");
  const [planos, setPlanos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const carregarPlanos = async () => {
      try {
        const res = await fetch("/api/planos-publicos");
        const data = await res.json();
        const ativos = data.filter((p) => p.ativo === 1 && p.nome !== "LGPD");
        setPlanos(ativos);
      } catch (err) {
        console.error("Erro ao carregar planos:", err);
      }
    };

    carregarPlanos();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Selecione seu plano
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {planos.map((plano) => (
          <div
            key={plano.id}
            className="bg-white rounded-xl shadow p-6 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                {plano.nome}
              </h2>
              <p className="text-sm text-gray-500 mb-4">{plano.descricao}</p>
              <ul className="text-sm text-gray-700 mb-4 space-y-1">
                <li>⏱️ Duração: {plano.duracao_minutos} min</li>
                <li>⬆️ Upload: {plano.velocidade_up} Mbps</li>
                <li>⬇️ Download: {plano.velocidade_down} Mbps</li>
              </ul>
              <p className="text-lg font-bold text-blue-600">
                R$ {(parseFloat(plano.valor) / 100).toFixed(2)}
              </p>
            </div>

            <button
              onClick={() =>
                navigate(
                  `/pagamentopix/${plano.id}?mac=${encodeURIComponent(
                    mac || ""
                  )}&ip=${encodeURIComponent(ip || "")}&cpf=${encodeURIComponent(
                    cpf || ""
                  )}`
                )
              }
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded"
            >
              Escolher Plano
            </button>
          </div>
        ))}
      </div>

      {(mac || ip || cpf) && (
        <div className="text-sm text-gray-500 mt-8 text-center">
          {mac && (
            <div>
              Dispositivo: <span className="font-mono">{mac}</span>
            </div>
          )}
          {ip && (
            <div>
              IP: <span className="font-mono">{ip}</span>
            </div>
          )}
          {cpf && (
            <div>
              CPF: <span className="font-mono">{cpf}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

