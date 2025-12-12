import { useParams, useSearchParams } from "react-router-dom";
import React, { useEffect, useState } from "react";

export default function PagamentoPix() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [plano, setPlano] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [copiaCola, setCopiaCola] = useState("");
  const [status, setStatus] = useState("gerando");
  const [copiado, setCopiado] = useState(false);
  const [pagamentoAprovado, setPagamentoAprovado] = useState(false);
  const mac = searchParams.get("mac");
  const ip = searchParams.get("ip");
  const cpf = decodeURIComponent(searchParams.get("cpf") || "");

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
          body: JSON.stringify({ plano_id: id, mac, ip, cpf }),
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
  }, [plano, id, mac, ip, cpf]);

useEffect(() => {
  if (!mac || !ip) return;

  const verificarStatus = async () => {
    try {
      const res = await fetch(`/api/pagamentos/status?mac=${mac}&ip=${ip}`);
      const data = await res.json();

      if (data.status === "approved" && data.gateway) {
        setPagamentoAprovado(true);

        // Limpa o CPF (somente números)
        const username = cpf ? cpf.replace(/\D/g, "") : mac;
        const password = username;

        setTimeout(() => {
          const url = `http://${data.gateway}/login?username=${username}&password=${password}`;
          window.location.href = url;
        }, 2000);
      }
    } catch (err) {
      console.error("Erro ao verificar status do pagamento:", err);
    }
  };

  const interval = setInterval(verificarStatus, 5000);
  return () => clearInterval(interval);
}, [mac, ip, cpf]);


const copiarParaClipboard = async () => {
  try {
    // Copia o código
    await navigator.clipboard.writeText(copiaCola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);

    // Chama a API para gerar acesso temporário
    const res = await fetch("/api/auth/temp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mac, ip, plano_id: id }),
    });

    const data = await res.json();
    if (data.username && data.password && data.gateway) {
      const loginUrl = `http://${data.gateway}/login?username=${data.username}&password=${data.password}`;
      window.location.href = loginUrl;
    }
  } catch (error) {
    console.error("Erro ao copiar ou gerar acesso temporário:", error);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="container max-w-md mx-auto space-y-4">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg border-0">
          <div className="text-center pb-4 pt-6 px-6">
            <div className="flex items-center justify-center gap-2 text-white mb-3">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Status da Conexão
            </div>
          </div>
          <div className="text-center space-y-3 px-6 pb-6">
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364" />
              </svg>
              Sem Internet
            </div>
            <p className="text-sm text-white/90 leading-relaxed">
              Você ainda está sem internet. Caso não consiga pagar pelo QR Code, 
              basta clicar no botão para copiar o PIX copia e cola que iremos 
              liberar por <strong>5 minutos</strong> a internet para você.
            </p>
            <p className="text-xs text-white/80">
              Basta efetuar o pagamento nesse tempo e você vai receber pelo 
              WhatsApp o seu usuário e senha.
            </p>
          </div>
        </div>

        {/* Device Info */}
        {(mac || ip || cpf) && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-4">
              <div className="grid grid-cols-1 gap-2 text-xs">
                {mac && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Dispositivo:</span>
                    <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">{mac}</code>
                  </div>
                )}
                {ip && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">IP:</span>
                    <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">{ip}</code>
                  </div>
                )}
                {cpf && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">CPF:</span>
                    <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">{cpf}</code>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Plan Info */}
        {plano && (
          <div className="bg-white rounded-lg shadow-sm border border-blue-200">
            <div className="pb-3 pt-4 px-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Plano Selecionado
              </div>
            </div>
            <div className="space-y-2 px-4 pb-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-800">{plano.nome}</span>
                <div className="text-lg font-bold bg-slate-100 text-slate-800 px-2 py-1 rounded">
                  R$ {(plano.valor / 100).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-4">
            <div className="flex items-center justify-center gap-2">
              {status === "gerando" && (
                <>
                  <svg className="h-4 w-4 text-yellow-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                  </svg>
                  <span className="text-sm text-slate-600">Gerando pagamento...</span>
                </>
              )}
              {status === "erro" && (
                <span className="text-sm text-red-500">Erro ao gerar pagamento.</span>
              )}
              {status === "gerado" && !pagamentoAprovado && (
                <>
                  <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                  </svg>
                  <span className="text-sm text-slate-600">Aguardando pagamento...</span>
                </>
              )}
              {pagamentoAprovado && (
                <>
                  <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-green-600">Pagamento aprovado!</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* QR Code and Payment */}
        {qrCode && (
          <>
            {/* QR Code Card */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="pb-3 pt-4 px-4">
                <div className="flex items-center gap-2 text-center justify-center text-lg font-semibold text-slate-800">
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11a2 2 0 11-4 0 2 2 0 014 0zM3 17a2 2 0 104 0 2 2 0 00-4 0zM13 6a2 2 0 104 0 2 2 0 00-4 0z" />
                  </svg>
                  QR Code PIX
                </div>
              </div>
              <div className="space-y-4 px-4 pb-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg shadow-inner border">
                    <img
                      src={`data:image/png;base64,${qrCode}`}
                      alt="QR Code PIX"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
                <p className="text-xs text-center text-slate-500">
                  Escaneie o código acima com o app do seu banco
                </p>
              </div>
            </div>

            {/* Copy Paste Card */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="pb-3 pt-4 px-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                  <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Código PIX
                </div>
              </div>
              <div className="space-y-4 px-4 pb-4">
                <div className="relative">
                  <textarea
                    readOnly
                    value={copiaCola}
                    className="w-full p-3 border border-slate-200 rounded-md bg-slate-50 text-xs resize-none font-mono leading-tight"
                    rows={3}
                  />
                </div>
                
                <button
                  onClick={copiarParaClipboard}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copiado ? "Código Copiado!" : "Copiar Código PIX"}
                </button>

                <div className="border-t border-slate-200 my-4"></div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800 text-center leading-relaxed">
                    💡 <strong>Dica:</strong> Copie o código acima e cole no seu app bancário 
                    para efetuar o pagamento via PIX de forma rápida e segura.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
