import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FaBoxes, FaCalendarAlt, FaCashRegister, FaChartBar, FaCog, FaCreditCard, FaCut, FaFileInvoiceDollar, FaHome, FaSignOutAlt, FaStore, FaUsers, FaUserTie } from "react-icons/fa";
import { useConfiguracion } from "../context/ConfiguracionContext";
import { useSucursal } from "../context/SucursalContext";

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant, nombreNegocio, logoUrl, zonaHoraria, cargandoConfiguracion, errorConfiguracion } = useConfiguracion();
  const { sucursales, sucursalId, cargandoSucursales, errorSucursales, seleccionarSucursal } = useSucursal();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const esSuperAdmin = usuario.rol === "SuperAdmin";
  const esPaginaSuscripcion = location.pathname === "/mi-suscripcion";

  const cerrarSesion = () => { localStorage.removeItem("token"); localStorage.removeItem("usuario"); localStorage.removeItem("barberiaSaaS.sucursalSeleccionada"); navigate("/"); };
  const inicialNegocio = nombreNegocio?.charAt(0)?.toUpperCase() || "N";
  const obtenerPartesFecha = (fecha, zona) => { try { const partes = new Intl.DateTimeFormat("en-CA", { timeZone: zona || "America/Costa_Rica", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(fecha); const year = Number(partes.find(p => p.type === "year")?.value); const month = Number(partes.find(p => p.type === "month")?.value); const day = Number(partes.find(p => p.type === "day")?.value); return year && month && day ? { year, month, day } : null; } catch { return null; } };
  const calcularDiasUsandoApp = () => { const base = tenant?.fechaActivacion || tenant?.fechaCreacion; if (!base) return null; const fecha = new Date(base); if (Number.isNaN(fecha.getTime())) return null; const a = obtenerPartesFecha(fecha, zonaHoraria), h = obtenerPartesFecha(new Date(), zonaHoraria); if (!a || !h) return null; const inicio = Date.UTC(a.year, a.month - 1, a.day), hoy = Date.UTC(h.year, h.month - 1, h.day); return Math.max(1, Math.floor((hoy - inicio) / 86400000) + 1); };
  const diasUsandoApp = calcularDiasUsandoApp();
  const diasRestantesPrueba = diasUsandoApp !== null && diasUsandoApp < 31 ? 31 - diasUsandoApp : 0;
  const mostrarAvisoPrueba = location.pathname === "/dashboard" && diasUsandoApp !== null && !esSuperAdmin;
  const activarSuscripcion = () => navigate("/mi-suscripcion");

  if (cargandoConfiguracion || cargandoSucursales) return <div className="app-loading"><div className="spinner-border" role="status" /><div className="mt-3">Cargando negocio...</div></div>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="sidebar-brand">{logoUrl ? <img src={logoUrl} alt={nombreNegocio} className="sidebar-logo-image" /> : <div className="sidebar-logo">{inicialNegocio}</div>}<div className="sidebar-brand-info"><strong>{nombreNegocio}</strong><div className="sidebar-role">{usuario.rol || ""}</div></div></div>
      <nav className="sidebar-menu">
        <NavLink to="/dashboard" className="sidebar-link"><FaHome /><span>Dashboard</span></NavLink>
        <NavLink to="/agenda" className="sidebar-link"><FaCalendarAlt /><span>Agenda</span></NavLink>
        <NavLink to="/clientes" className="sidebar-link"><FaUsers /><span>Clientes</span></NavLink>
        <NavLink to="/servicios" className="sidebar-link"><FaCut /><span>Servicios</span></NavLink>
        <NavLink to="/profesionales" className="sidebar-link"><FaUserTie /><span>Profesionales</span></NavLink>
        <NavLink to="/productos" className="sidebar-link"><FaBoxes /><span>Productos</span></NavLink>
        <NavLink to="/ventas" className="sidebar-link"><FaCashRegister /><span>Ventas / Caja</span></NavLink>
        <NavLink to="/cuentas-por-cobrar" className="sidebar-link"><FaFileInvoiceDollar /><span>Cuentas por cobrar</span></NavLink>
        <NavLink to="/reportes" className="sidebar-link"><FaChartBar /><span>Reportes</span></NavLink>
        <NavLink to="/sucursales" className="sidebar-link"><FaStore /><span>Sucursales</span></NavLink>
        {!esSuperAdmin && <NavLink to="/mi-suscripcion" className="sidebar-link"><FaCreditCard /><span>Mi suscripción</span></NavLink>}
        {esSuperAdmin && <NavLink to="/admin/suscripciones" className="sidebar-link"><FaCreditCard /><span>Suscripciones</span></NavLink>}
        <NavLink to="/configuracion" className="sidebar-link"><FaCog /><span>Configuración</span></NavLink>
      </nav>
      <div className="sidebar-timezone"><small>Zona horaria</small><strong>{zonaHoraria}</strong></div>
      <button className="sidebar-logout" onClick={cerrarSesion}><FaSignOutAlt /><span>Cerrar sesión</span></button>
    </aside>
    <main className="main-content">
      <header className="topbar" style={{ justifyContent: "space-between", gap: 16 }}>
        <div className="d-flex align-items-center" style={{ minWidth: 0, flex: "1 1 auto" }}><div className="d-flex align-items-center" style={{ width: "100%", maxWidth: 360, minWidth: 0, padding: "7px 12px", border: "1px solid var(--border)", borderRadius: 18, background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}><div className="d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, minWidth: 40, borderRadius: 14, background: "var(--soft-pink)", color: "var(--primary)", marginRight: 10 }}><FaStore size={18} /></div><div style={{ minWidth: 0, flex: 1 }}><div className="text-muted" style={{ fontSize: 11, lineHeight: 1.1, marginBottom: 2 }}>Sucursal</div><select aria-label="Sucursal activa" value={sucursalId} onChange={e => seleccionarSucursal(e.target.value)} style={{ width: "100%", border: "none", outline: "none", backgroundColor: "transparent", fontWeight: 700, fontSize: 14, padding: 0 }}><option value="">Todas las sucursales</option>{sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></div></div></div>
        <div className="topbar-user"><div className="topbar-user-text d-none d-md-flex"><strong>{usuario.nombre || "Usuario"}</strong>{usuario.sucursal && <span>{usuario.sucursal}</span>}</div><div className="topbar-avatar">{(usuario.nombre || "U").charAt(0).toUpperCase()}</div></div>
      </header>
      <div className="page-content">
        {!esPaginaSuscripcion && errorConfiguracion && <div className="alert alert-warning">{errorConfiguracion}</div>}
        {!esPaginaSuscripcion && errorSucursales && <div className="alert alert-warning">{errorSucursales}</div>}
        {mostrarAvisoPrueba && <div className="mb-4" style={{ border: "1px solid var(--border)", borderRadius: 20, padding: "18px 20px", background: "linear-gradient(135deg, var(--soft-pink), #ffffff)", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}><div className="d-flex flex-wrap align-items-center justify-content-between gap-3"><div><div className="text-uppercase fw-bold mb-1" style={{ color: "var(--primary)", fontSize: 12, letterSpacing: 1.2 }}>Barberia SaaS</div><div className="fw-bold" style={{ fontSize: 20 }}>Días usando la App: {diasUsandoApp}</div>{diasUsandoApp < 31 && <div className="text-muted mt-1">Te quedan <strong>{diasRestantesPrueba} días</strong> de prueba gratuita. Puedes activar tu suscripción cuando quieras.</div>}</div>{diasUsandoApp < 31 && <button type="button" className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={activarSuscripcion} style={{ borderRadius: 14, padding: "10px 16px", fontWeight: 700 }}><FaCreditCard />Activar suscripción</button>}</div></div>}
        <Outlet />
      </div>
    </main>
  </div>;
}
export default MainLayout;
