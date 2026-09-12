import {
  NavLink,
  Outlet,
  useNavigate
} from "react-router-dom";

import {
  FaBoxes,
  FaCalendarAlt,
  FaCashRegister,
  FaChartBar,
  FaCog,
  FaCut,
  FaHome,
  FaSignOutAlt,
  FaStore,
  FaUsers,
  FaUserTie
} from "react-icons/fa";

import {
  useConfiguracion
} from "../context/ConfiguracionContext";

import {
  useSucursal
} from "../context/SucursalContext";

function MainLayout() {
  const navigate =
    useNavigate();

  const {
    nombreNegocio,
    logoUrl,
    zonaHoraria,
    cargandoConfiguracion,
    errorConfiguracion
  } = useConfiguracion();

  const {
    sucursales,
    sucursalId,
    cargandoSucursales,
    errorSucursales,
    seleccionarSucursal
  } = useSucursal();

  const usuario =
    JSON.parse(
      localStorage.getItem(
        "usuario"
      ) || "{}"
    );

  const cerrarSesion = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "usuario"
    );

    localStorage.removeItem(
      "barberiaSaaS.sucursalSeleccionada"
    );

    navigate("/");
  };

  const inicialNegocio =
    nombreNegocio
      ?.charAt(0)
      ?.toUpperCase() || "N";

  if (
    cargandoConfiguracion ||
    cargandoSucursales
  ) {
    return (
      <div className="app-loading">
        <div
          className="spinner-border"
          role="status"
        />

        <div className="mt-3">
          Cargando negocio...
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={nombreNegocio}
              className="sidebar-logo-image"
            />
          ) : (
            <div className="sidebar-logo">
              {inicialNegocio}
            </div>
          )}

          <div className="sidebar-brand-info">
            <strong>
              {nombreNegocio}
            </strong>

            <div className="sidebar-role">
              {usuario.rol || ""}
            </div>
          </div>
        </div>

        <nav className="sidebar-menu">
          <NavLink
            to="/dashboard"
            className="sidebar-link"
          >
            <FaHome />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/agenda"
            className="sidebar-link"
          >
            <FaCalendarAlt />
            <span>Agenda</span>
          </NavLink>

          <NavLink
            to="/clientes"
            className="sidebar-link"
          >
            <FaUsers />
            <span>Clientes</span>
          </NavLink>

          <NavLink
            to="/servicios"
            className="sidebar-link"
          >
            <FaCut />
            <span>Servicios</span>
          </NavLink>

          <NavLink
            to="/profesionales"
            className="sidebar-link"
          >
            <FaUserTie />
            <span>Profesionales</span>
          </NavLink>

          <NavLink
            to="/productos"
            className="sidebar-link"
          >
            <FaBoxes />
            <span>Productos</span>
          </NavLink>

          <NavLink
            to="/ventas"
            className="sidebar-link"
          >
            <FaCashRegister />
            <span>Ventas / Caja</span>
          </NavLink>

          <NavLink
            to="/reportes"
            className="sidebar-link"
          >
            <FaChartBar />
            <span>Reportes</span>
          </NavLink>

          <NavLink
            to="/sucursales"
            className="sidebar-link"
          >
            <FaStore />
            <span>Sucursales</span>
          </NavLink>

          <NavLink
            to="/configuracion"
            className="sidebar-link"
          >
            <FaCog />
            <span>Configuración</span>
          </NavLink>
        </nav>

        <div className="sidebar-timezone">
          <small>
            Zona horaria
          </small>

          <strong>
            {zonaHoraria}
          </strong>
        </div>

        <button
          className="sidebar-logout"
          onClick={cerrarSesion}
        >
          <FaSignOutAlt />
          <span>Cerrar sesión</span>
        </button>
      </aside>

      <main className="main-content">
        <header
          className="topbar"
          style={{
            justifyContent: "space-between",
            gap: 16
          }}
        >
          <div
            className="d-flex align-items-center"
            style={{
              minWidth: 0,
              flex: "1 1 auto"
            }}
          >
            <div
              className="d-flex align-items-center"
              style={{
                width: "100%",
                maxWidth: 360,
                minWidth: 0,
                padding: "7px 12px",
                border: "1px solid var(--border)",
                borderRadius: 18,
                background: "#fff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center"
                style={{
                  width: 40,
                  height: 40,
                  minWidth: 40,
                  borderRadius: 14,
                  background: "var(--soft-pink)",
                  color: "var(--primary)",
                  marginRight: 10
                }}
              >
                <FaStore size={18} />
              </div>

              <div
                style={{
                  minWidth: 0,
                  flex: 1
                }}
              >
                <div
                  className="text-muted"
                  style={{
                    fontSize: 11,
                    lineHeight: 1.1,
                    marginBottom: 2
                  }}
                >
                  Sucursal
                </div>

                <select
                  aria-label="Sucursal activa"
                  value={sucursalId}
                  onChange={(e) =>
                    seleccionarSucursal(
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    minWidth: 0,
                    border: "none",
                    outline: "none",
                    boxShadow: "none",
                    backgroundColor: "transparent",
                    color: "#29252a",
                    fontWeight: 700,
                    fontSize: 14,
                    padding: 0,
                    cursor: "pointer"
                  }}
                >
                  <option value="">
                    Todas las sucursales
                  </option>

                  {sucursales.map(
                    (sucursal) => (
                      <option
                        key={sucursal.id}
                        value={sucursal.id}
                      >
                        {sucursal.nombre}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="topbar-user">
            <div className="topbar-user-text d-none d-md-flex">
              <strong>
                {usuario.nombre ||
                  "Usuario"}
              </strong>

              {usuario.sucursal && (
                <span>
                  {usuario.sucursal}
                </span>
              )}
            </div>

            <div className="topbar-avatar">
              {(usuario.nombre ||
                "U")
                .charAt(0)
                .toUpperCase()}
            </div>
          </div>
        </header>

        <div className="page-content">
          {errorConfiguracion && (
            <div className="alert alert-warning">
              {errorConfiguracion}
            </div>
          )}

          {errorSucursales && (
            <div className="alert alert-warning">
              {errorSucursales}
            </div>
          )}

          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
