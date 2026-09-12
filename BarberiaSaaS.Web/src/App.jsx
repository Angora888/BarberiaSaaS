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

import MainLayout from "./layouts/MainLayout";

import {
  ConfiguracionProvider
} from "./context/ConfiguracionContext";

function RutaProtegida({
  children
}) {
  const token =
    localStorage.getItem("token");

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
              <MainLayout />
            </ConfiguracionProvider>
          </RutaProtegida>
        }
      >
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/clientes"
          element={<Clientes />}
        />

        <Route
          path="/servicios"
          element={<Servicios />}
        />

        <Route
          path="/profesionales"
          element={<Profesionales />}
        />

        <Route
          path="/agenda"
          element={<Agenda />}
        />

        <Route
          path="/productos"
          element={<Productos />}
        />

        <Route
          path="/ventas"
          element={<Ventas />}
        />

        <Route
          path="/reportes"
          element={<Reportes />}
        />

        <Route
          path="/configuracion"
          element={<Configuracion />}
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
