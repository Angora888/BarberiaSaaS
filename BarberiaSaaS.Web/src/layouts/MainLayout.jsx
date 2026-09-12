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
    sucursalSeleccionada,
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
        <header className="topbar">
          <div className="d-flex flex-wrap align-items-center gap-3">
            <div>
              <div className="small text-muted">
                Sucursal activa
              </div>

              <select
                className="form-select form-select-sm"
                style={{ minWidth: 220 }}
                value={sucursalId}
                onChange={(e) =>
                  seleccionarSucursal(
                    e.target.value
                  )
                }
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

            {sucursalSeleccionada && (
              <div className="small text-muted d-none d-md-block">
                <FaStore className="me-1" />
                {sucursalSeleccionada.direccion ||
                  "Sucursal seleccionada"}
              </div>
            )}
          </div>

          <div className="topbar-user">
            <div className="topbar-user-text">
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
