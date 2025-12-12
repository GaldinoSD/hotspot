import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Mikrotiks from "./pages/admin/Mikrotiks";
import Planos from "./pages/admin/Planos";
import Configuracoes from "./pages/admin/Configuracoes";
import PlanosCliente from "./pages/public/PlanosCliente";
import Pagamento from "./pages/public/Pagamento";
import Pagamentos from "./pages/admin/Pagamentos";
import UsuariosRadius from "./pages/admin/UsuariosRadius";
import LgpdAuto from "./pages/public/LgpdAuto";
import LgpdCadastros from "./pages/admin/LgpdCadastros";
import CadastroLGPD from "./pages/public/CadastroLGPD";
import PlanosClientePix from "./pages/public/PlanosClientePix";
import PagamentoPix from "./pages/public/PagamentoPix";
import Sessoes from "./pages/admin/Sessoes";

function App() {
  const token = localStorage.getItem("admin_token");

const RotaPrivada = ({ children }) => {
  const token = localStorage.getItem("admin_token");
  return token ? children : <Navigate to="/" />;
};
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin" element={<RotaPrivada><Dashboard /></RotaPrivada>} />
      <Route path="/admin/mikrotiks" element={<RotaPrivada><Mikrotiks /></RotaPrivada>} />
      <Route path="/admin/planos" element={<Planos />} />
      <Route path="/admin/configuracoes" element={<Configuracoes />} />
      <Route path="/planos-cliente" element={<PlanosCliente />} />
      <Route path="/admin/pagamentos" element={<RotaPrivada><Pagamentos /></RotaPrivada>} />
      <Route path="/pagamento/:id" element={<Pagamento />} /> 
      <Route path="/admin/radius" element={<RotaPrivada><UsuariosRadius /></RotaPrivada>} /> 
      <Route path="/lgpd" element={<LgpdAuto />} />
      <Route path="/admin/lgpd" element={<LgpdCadastros />} />
      <Route path="/cadastro" element={<CadastroLGPD />} />
      <Route path="/planos-cliente-pix" element={<PlanosClientePix />} />
      <Route path="/pagamentopix/:id" element={<PagamentoPix />} />
     <Route path="/admin/sessoes" element={<Sessoes />} />
	  </Routes>
  );
}

export default App;
