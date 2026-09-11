import {
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Servicios from "./pages/Servicios";
import Profesionales from "./pages/Profesionales";
import Agenda from "./pages/Agenda";

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
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

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

      </Route>

      {/* RUTA DESCONOCIDA */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;