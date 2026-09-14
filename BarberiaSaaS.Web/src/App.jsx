import {
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Servicios from "./pages/Servicios";
import Profesionales from "./pages/Profesionales";
import Agenda from "./pages/Agenda";
import Productos from "./pages/Productos";
import Ventas from "./pages/Ventas";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";
import Sucursales from "./pages/Sucursales";
import CuentasPorCobrar from "./pages/CuentasPorCobrar";
import LandingPublica from "./pages/LandingPublica";
import ManualPublico from "./pages/ManualPublico";
import Prueba from "./pages/Prueba";

import AgendaAvailabilityFeedback from "./components/AgendaAvailabilityFeedback";
import AgendaQuickTimeSelection from "./components/AgendaQuickTimeSelection";
import AgendaCobroCompletada from "./components/AgendaCobroCompletada";
import AgendaWhatsAppFormato12 from "./components/AgendaWhatsAppFormato12";
import VentaCobroCompletada from "./components/VentaCobroCompletada";
import HorariosProfesionalEditor from "./components/HorariosProfesionalEditor";
import EnviarDisponibilidadClientes from "./components/EnviarDisponibilidadClientes";
import ClienteContactPicker from "./components/ClienteContactPicker";
import PaginaPublicaCard from "./components/PaginaPublicaCard";
import FormatoHora12 from "./components/FormatoHora12";

import MainLayout from "./layouts/MainLayout";

import {
  ConfiguracionProvider
} from "./context/ConfiguracionContext";

import {
  SucursalProvider
} from "./context/SucursalContext";

function RutaProtegida({
  children
}) {
  const token =
    localStorage.getItem(
      "token"
    );

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* HOME PÚBLICO */}

      <Route
        path="/"
        element={<Home />}
      />

      {/* MANUAL PÚBLICO */}

      <Route
        path="/manual"
        element={<ManualPublico />}
      />

      {/* PRUEBA / REGISTRO PÚBLICO */}

      <Route
        path="/prueba"
        element={<Prueba />}
      />

      {/* LANDING PÚBLICA POR NEGOCIO */}

      <Route
        path="/negocio/:slug"
        element={
          <LandingPublica />
        }
      />

      {/* LOGIN */}

      <Route
        path="/login"
        element={<Login />}
      />

      {/* ÁREA PROTEGIDA */}

      <Route
        element={
          <RutaProtegida>
            <ConfiguracionProvider>
              <SucursalProvider>
                <FormatoHora12 />
                <MainLayout />
              </SucursalProvider>
            </ConfiguracionProvider>
          </RutaProtegida>
        }
      >
        <Route
          path="/dashboard"
          element={
            <>
              <Dashboard />

              <PaginaPublicaCard modo="dashboard" />
            </>
          }
        />

        <Route
          path="/clientes"
          element={
            <>
              <Clientes />

              <ClienteContactPicker />

              <EnviarDisponibilidadClientes />
            </>
          }
        />

        <Route
          path="/servicios"
          element={
            <Servicios />
          }
        />

        <Route
          path="/profesionales"
          element={
            <>
              <Profesionales />

              <HorariosProfesionalEditor />
            </>
          }
        />

        <Route
          path="/agenda"
          element={
            <>
              <Agenda />

              <AgendaAvailabilityFeedback />

              <AgendaQuickTimeSelection />

              <AgendaCobroCompletada />

              <AgendaWhatsAppFormato12 />
            </>
          }
        />

        <Route
          path="/productos"
          element={
            <Productos />
          }
        />

        <Route
          path="/ventas"
          element={
            <>
              <Ventas />

              <VentaCobroCompletada />
            </>
          }
        />

        <Route
          path="/cuentas-por-cobrar"
          element={
            <CuentasPorCobrar />
          }
        />

        <Route
          path="/reportes"
          element={
            <Reportes />
          }
        />

        <Route
          path="/sucursales"
          element={
            <Sucursales />
          }
        />

        <Route
          path="/configuracion"
          element={
            <>
              <Configuracion />

              <PaginaPublicaCard modo="configuracion" />
            </>
          }
        />
      </Route>

      {/* RUTA DESCONOCIDA */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;
