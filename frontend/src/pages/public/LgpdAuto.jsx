// src/pages/LgpdAuto.jsx
import React, { useEffect, useState } from "react";

export default function LgpdAuto() {
  const [dados, setDados] = useState({ cpf: "", mac: "", ip: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cpf = params.get("cpf");
    const mac = params.get("mac");
    const ip = params.get("ip");
    const aceite = params.get("aceite");

    setDados({ cpf, mac, ip });

    const autenticar = async () => {
      try {
        const res = await fetch("/api/lgpd/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf, mac, ip, aceite })
        });

        const data = await res.json();
        if (res.ok && data.gateway) {
          //altera para o IP ou dns do teu hotspot interno
		window.location.href = `http://${data.gateway}/login?username=${cpf}&password=${cpf}`;
        } else {
          alert(data.message || "Erro ao autenticar.");
        }
      } catch {
        alert("Erro de conexão.");
      }
    };

    setTimeout(autenticar, 3000);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
      <div className="bg-white shadow-md rounded-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Autenticando seu acesso...</h1>
        <p className="text-gray-600 mb-4">Aguarde um momento enquanto processamos seu login.</p>
        <div className="text-sm text-gray-700 space-y-1">
          <p><strong>CPF:</strong> {dados.cpf}</p>
          <p><strong>MAC:</strong> {dados.mac}</p>
          <p><strong>IP:</strong> {dados.ip}</p>
        </div>
        <div className="loader mt-6 mx-auto border-4 border-gray-300 border-t-blue-500 rounded-full w-8 h-8 animate-spin" />
      </div>
    </div>
  );
}

