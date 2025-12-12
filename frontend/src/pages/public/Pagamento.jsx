import { useParams, useSearchParams } from "react-router-dom";
import React, { useEffect, useState } from "react";

export default function Pagamento() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [plano, setPlano] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [copiaCola, setCopiaCola] = useState("");
  const [status, setStatus] = useState("gerando");
  const [copiado, setCopiado] = useState(false);
  const [gateway, setGateway] = useState(null);
  const [pagamentoAprovado, setPagamentoAprovado] = useState(false);
  const mac = searchParams.get("mac");
  const ip = searchParams.get("ip");

  useEffect(() => {
    const buscarPlano = async () => {
      try {
        const res = await fetch(`/api/planos-publicos/${id}`);
        const data = await res.json();
        setPlano(data);
      } catch (err) {
        console.error("Erro ao carregar plano:", err);
      }
    };
    buscarPlano();
  }, [id]);

  useEffect(() => {
    const gerarPagamento = async () => {
      try {
        const res = await fetch("/api/pagamentos/gerar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plano_id: id, mac, ip }),
        });
        const data = await res.json();
        setQrCode(data.qr_code_base64);
        setCopiaCola(data.copia_cola);
        setStatus("gerado");
      } catch (err) {
        console.error("Erro ao gerar pagamento:", err);
        setStatus("erro");
      }
    };
    if (plano) gerarPagamento();
  }, [plano, id, mac]);


useEffect(() => {
  if (!mac || !ip) return;

  const verificarStatus = async () => {
    try {
      console.log("🔄 Verificando status para:", mac, ip);
      const res = await fetch(`/api/pagamentos/status?mac=${mac}&ip=${ip}`);
      const data = await res.json();

      if (data.status === "approved" && data.gateway) {
        console.log("✅ Pagamento aprovado. Redirecionando para login automático no Mikrotik...");

        setPagamentoAprovado(true);

        setTimeout(() => {
          const url = `http://${data.gateway}/login?username=${mac}&password=${mac}`;
		console.log("🔁 Redirecionando para:", url);
          window.location.href = url;
        }, 2000); // tempo menor, já que é automático
      }
    } catch (err) {
      console.error("❌ Erro ao verificar status do pagamento:", err);
    }
  };

  const interval = setInterval(verificarStatus, 5000);
  return () => clearInterval(interval);
}, [mac, ip]);

const copiarParaClipboard = () => {
    navigator.clipboard.writeText(copiaCola).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">
        Pagamento do Plano
      </h1>

      {mac && (
        <p className="mb-2 text-sm text-gray-500">
          Dispositivo: <span className="font-mono">{mac}</span> IP: <span className="font-mono">{ip}</span>
        </p>
      )}
      {plano && (
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold">{plano.nome}</h2>
          <p className="text-gray-600">R$ {(plano.valor / 100).toFixed(2)}</p>
        </div>
      )}

      {status === "gerando" && <p>Gerando pagamento...</p>}
      {status === "erro" && <p className="text-red-500">Erro ao gerar pagamento.</p>}
      {status === "gerado" && !pagamentoAprovado && <p className="text-sm text-gray-600 mb-4">Aguardando pagamento...</p>}

      {qrCode && (
        <>
          <img
            src={`data:image/png;base64,${qrCode}`}
            alt="QR Code"
            className="mb-4 w-64 h-64 shadow-lg border border-gray-300"
          />

          <div className="w-full max-w-md mb-4">
            <textarea
              readOnly
              value={copiaCola}
              className="w-full p-3 border border-gray-300 rounded mb-2 resize-none"
              rows={4}
            />
            <button
              onClick={copiarParaClipboard}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
            >
              {copiado ? "Copiado!" : "Copiar código Pix"}
            </button>
          </div>

          <p className="text-sm text-gray-600 text-center">
            Escaneie o QR Code ou copie o código acima para pagar via Pix.
          </p>
        </>
      )}
    </div>
  );
}


