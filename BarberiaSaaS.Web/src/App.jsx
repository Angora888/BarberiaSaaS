import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Servicios from "./pages/Servicios";
import Profesionales from "./pages/Profesionales";
import Agenda from "./pages/Agenda";
import ImportarCitas from "./pages/ImportarCitas";
import Productos from "./pages/Productos";
import Ventas from "./pages/Ventas";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";
import Sucursales from "./pages/Sucursales";
import CuentasPorCobrar from "./pages/CuentasPorCobrar";
import MiSuscripcion from "./pages/MiSuscripcion";
import AdminSuscripciones from "./pages/AdminSuscripciones";
import LandingPublica from "./pages/LandingPublica";
import ManualPublico from "./pages/ManualPublico";
import Prueba from "./pages/Prueba";
import ConfirmarRegistro from "./pages/ConfirmarRegistro";
import OlvidePassword from "./pages/OlvidePassword";
import RestablecerPassword from "./pages/RestablecerPassword";
import AgendaAvailabilityFeedback from "./components/AgendaAvailabilityFeedback";
import AgendaQuickTimeSelection from "./components/AgendaQuickTimeSelection";
import AgendaCobroCompletada from "./components/AgendaCobroCompletada";
import AgendaWhatsAppFormato12 from "./components/AgendaWhatsAppFormato12";
import EditarCitaSidecar from "./components/EditarCitaSidecar";
import ReservaPublicaSidecar from "./components/ReservaPublicaSidecar";
import VentaCobroCompletada from "./components/VentaCobroCompletada";
import HorariosProfesionalEditor from "./components/HorariosProfesionalEditor";
import EnviarDisponibilidadClientes from "./components/EnviarDisponibilidadClientes";
import ClienteContactPicker from "./components/ClienteContactPicker";
import PaginaPublicaCard from "./components/PaginaPublicaCard";
import FormatoHora12 from "./components/FormatoHora12";
import TurnstileRegistro from "./components/TurnstileRegistro";
import MainLayout from "./layouts/MainLayout";
import { ConfiguracionProvider } from "./context/ConfiguracionContext";
import { SucursalProvider } from "./context/SucursalContext";
import api from "./services/api";

function RutaProtegida({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();
  const [estadoAcceso, setEstadoAcceso] = useState("cargando");
  useEffect(() => {
    let activo = true;
    if (!token) { setEstadoAcceso("sin-token"); return () => { activo = false; }; }
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    if (usuario.rol === "SuperAdmin" || location.pathname === "/mi-suscripcion") { setEstadoAcceso("permitido"); return () => { activo = false; }; }
    setEstadoAcceso("cargando");
    api.get("/paypal/subscription-current")
      .then(({ data }) => { if (activo) setEstadoAcceso(data?.accessAllowed ? "permitido" : "bloqueado"); })
      .catch(() => { if (activo) setEstadoAcceso("permitido"); });
    return () => { activo = false; };
  }, [token, location.pathname]);
  if (!token || estadoAcceso === "sin-token") return <Navigate to="/login" replace />;
  if (estadoAcceso === "cargando") return <div className="app-loading"><div className="spinner-border" role="status" /><div className="mt-3">Validando acceso...</div></div>;
  if (estadoAcceso === "bloqueado") return <Navigate to="/mi-suscripcion" replace />;
  return children;
}

function SoloSuperAdmin({ children }) {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  return usuario.rol === "SuperAdmin" ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/manual" element={<ManualPublico />} />
      <Route path="/prueba" element={<><Prueba /><TurnstileRegistro /></>} />
      <Route path="/confirmarcreacion/:token" element={<ConfirmarRegistro />} />
      <Route path="/negocio/:slug" element={<><LandingPublica /><ReservaPublicaSidecar /></>} />
      <Route path="/login" element={<Login />} />
      <Route path="/olvide-password" element={<OlvidePassword />} />
      <Route path="/restablecer-password/:token" element={<RestablecerPassword />} />
      <Route element={<RutaProtegida><ConfiguracionProvider><SucursalProvider><FormatoHora12 /><MainLayout /></SucursalProvider></ConfiguracionProvider></RutaProtegida>}>
        <Route path="/dashboard" element={<><Dashboard /><PaginaPublicaCard modo="dashboard" /></>} />
        <Route path="/clientes" element={<><Clientes /><ClienteContactPicker /><EnviarDisponibilidadClientes /></>} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/profesionales" element={<><Profesionales /><HorariosProfesionalEditor /></>} />
        <Route path="/agenda" element={<><Agenda /><AgendaAvailabilityFeedback /><AgendaQuickTimeSelection /><AgendaCobroCompletada /><AgendaWhatsAppFormato12 /><EditarCitaSidecar /></>} />
        <Route path="/agenda/importar" element={<ImportarCitas />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/ventas" element={<><Ventas /><VentaCobroCompletada /></>} />
        <Route path="/cuentas-por-cobrar" element={<CuentasPorCobrar />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/sucursales" element={<Sucursales />} />
        <Route path="/mi-suscripcion" element={<MiSuscripcion />} />
        <Route path="/admin/suscripciones" element={<SoloSuperAdmin><AdminSuscripciones /></SoloSuperAdmin>} />
        <Route path="/configuracion" element={<><Configuracion /><PaginaPublicaCard modo="configuracion" /></>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
export default App;
