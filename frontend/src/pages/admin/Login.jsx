import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // States para o fluxo 2FA
  const [requires2fa, setRequires2fa] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [code2fa, setCode2fa] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErro(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
      });

      const data = await res.json();

      if (res.ok) {
        if (data.requires_2fa) {
          setRequires2fa(true);
          setTempToken(data.temp_token);
        } else {
          login(data.token, data.user, data.empresas, data.permissoes);
          const slug = data.user?.empresa_slug || "default";
          navigate(`/admin/${slug}`);
        }
      } else {
        setErro(data.error || data.message || "Erro ao fazer login");
      }
    } catch (err) {
      setErro("Erro de conexão com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2fa = async (e) => {
    e.preventDefault();
    if (code2fa.length !== 6) {
      setErro("O código de verificação deve conter 6 dígitos");
      return;
    }
    setIsLoading(true);
    setErro(null);

    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temp_token: tempToken, code: code2fa })
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user, data.empresas, data.permissoes);
        const slug = data.user?.empresa_slug || "default";
        navigate(`/admin/${slug}`);
      } else {
        setErro(data.error || "Código de verificação incorreto ou expirado");
      }
    } catch (err) {
      setErro("Erro de conexão com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f111a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a233a] via-[#0f111a] to-[#0f111a] px-4">
      
      <div className="w-full max-w-md">
        {/* Form Card */}
        <div className="bg-[#1a1d27]/80 backdrop-blur-md border border-gray-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          
          {/* Decorative Top Accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-400"></div>

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <img 
              src="/logo-forum.jpg" 
              alt="Logo" 
              className="h-24 w-auto max-w-[80%] object-contain" 
            />
          </div>

          {erro && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-red-400 text-sm font-medium">{erro}</p>
            </div>
          )}

          {!requires2fa ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-1.5 ml-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0d1117] border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-1.5 ml-1">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full bg-[#0d1117] border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 rounded-lg transition-all duration-300 cursor-pointer font-semibold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <>
                    Entrar
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify2fa} className="space-y-6">
              <div className="text-center">
                <h2 className="text-white font-semibold text-lg">Segurança de Dois Fatores</h2>
                <p className="text-xs text-gray-400 mt-2">
                  Abra o aplicativo autenticador no seu dispositivo (como Google Authenticator ou Authy) e digite o código de 6 dígitos gerado.
                </p>
              </div>

              <div>
                <label className="block text-gray-400 text-center text-sm font-medium mb-3">Código Autenticador</label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    pattern="\d*"
                    maxLength={6}
                    value={code2fa}
                    onChange={(e) => setCode2fa(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-48 bg-[#0d1117] border border-gray-700 text-white rounded-lg py-2.5 text-center text-xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                    placeholder="000000"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white py-3 rounded-lg transition-all duration-300 cursor-pointer font-semibold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                    <>
                      Verificar Código
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequires2fa(false);
                    setCode2fa("");
                    setErro(null);
                  }}
                  className="w-full text-xs text-gray-500 hover:text-white py-1.5 transition-colors"
                >
                  Voltar para login
                </button>
              </div>
            </form>
          )}

          {/* Footer Text */}
          <div className="mt-6 text-center">
            <span className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-gray-400 bg-[#0d1117] border border-gray-700/80 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              Sistema HotSpot B.U Midia
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
