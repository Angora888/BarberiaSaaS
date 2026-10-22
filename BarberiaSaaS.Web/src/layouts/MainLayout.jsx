import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FaBoxes, FaCalendarAlt, FaCashRegister, FaChartBar, FaCog, FaCreditCard, FaCut, FaFileInvoiceDollar, FaHome, FaMoon, FaSignOutAlt, FaStore, FaSun, FaUsers, FaUserTie } from "react-icons/fa";
import { useConfiguracion } from "../context/ConfiguracionContext";
import api from "../services/api";
import { useSucursal } from "../context/SucursalContext";

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tenant, nombreNegocio, logoUrl, zonaHoraria, cargandoConfiguracion, errorConfiguracion } = useConfiguracion();
  const { sucursales, sucursalId, cargandoSucursales, errorSucursales, seleccionarSucursal } = useSucursal();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const esSuperAdmin = usuario.rol === "SuperAdmin";
  const esProfesional = usuario.rol === "Profesional";
  const esPaginaSuscripcion = location.pathname === "/mi-suscripcion";
  const [tema, setTema] = useState(() => localStorage.getItem("barberiaSaaS.tema") || "light");
  const [progresoInicio, setProgresoInicio] = useState(null);
  const [cargandoProgresoInicio, setCargandoProgresoInicio] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
    localStorage.setItem("barberiaSaaS.tema", tema);
  }, [tema]);

  const alternarTema = () => setTema(actual => actual === "dark" ? "light" : "dark");

  const cerrarSesion = () => { localStorage.removeItem("token"); localStorage.removeItem("usuario"); localStorage.removeItem("barberiaSaaS.sucursalSeleccionada"); navigate("/"); };
  const inicialNegocio = nombreNegocio?.charAt(0)?.toUpperCase() || "N";
  const obtenerPartesFecha = (fecha, zona) => { try { const partes = new Intl.DateTimeFormat("en-CA", { timeZone: zona || "America/Costa_Rica", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(fecha); const year = Number(partes.find(p => p.type === "year")?.value); const month = Number(partes.find(p => p.type === "month")?.value); const day = Number(partes.find(p => p.type === "day")?.value); return year && month && day ? { year, month, day } : null; } catch { return null; } };
  const calcularDiasUsandoApp = () => { const base = tenant?.fechaActivacion || tenant?.fechaCreacion; if (!base) return null; const fecha = new Date(base); if (Number.isNaN(fecha.getTime())) return null; const a = obtenerPartesFecha(fecha, zonaHoraria), h = obtenerPartesFecha(new Date(), zonaHoraria); if (!a || !h) return null; const inicio = Date.UTC(a.year, a.month - 1, a.day), hoy = Date.UTC(h.year, h.month - 1, h.day); return Math.max(1, Math.floor((hoy - inicio) / 86400000) + 1); };
  const diasUsandoApp = calcularDiasUsandoApp();
  const diasRestantesPrueba = diasUsandoApp !== null && diasUsandoApp < 31 ? 31 - diasUsandoApp : 0;
  const mostrarAvisoPrueba = location.pathname === "/dashboard" && diasUsandoApp !== null && !esSuperAdmin;
  const activarSuscripcion = () => navigate("/mi-suscripcion");

  useEffect(() => {
    if (location.pathname !== "/dashboard" || esSuperAdmin || esProfesional) {
      setProgresoInicio(null);
      return;
    }

    let vigente = true;
    setCargandoProgresoInicio(true);

    const lista = (data) => {
      if (Array.isArray(data)) return data;
      for (const key of ["items", "data", "resultados", "clientes", "servicios", "profesionales", "citas"]) {
        if (Array.isArray(data?.[key])) return data[key];
      }
      return [];
    };

    Promise.all([
      api.get("/Servicios"),
      api.get("/Profesionales"),
      api.get("/Clientes"),
      api.get("/Citas")
    ]).then(([servicios, profesionales, clientes, citas]) => {
      if (!vigente) return;
      setProgresoInicio({
        servicios: lista(servicios.data).length > 0,
        profesionales: lista(profesionales.data).length > 0,
        clientes: lista(clientes.data).length > 0,
        citas: lista(citas.data).length > 0,
        totalCitas: lista(citas.data).length
      });
    }).catch((error) => {
      console.error("No fue posible cargar la guía de inicio:", error);
      if (vigente) setProgresoInicio(null);
    }).finally(() => {
      if (vigente) setCargandoProgresoInicio(false);
    });

    return () => { vigente = false; };
  }, [location.pathname, tenant?.id, esSuperAdmin, esProfesional, sucursalId]);

  const pasosInicio = [
    { key: "servicios", titulo: "Agrega tus servicios", detalle: "Define los servicios y sus precios.", ruta: "/servicios" },
    { key: "profesionales", titulo: "Registra a tus profesionales", detalle: "Agrega a las personas que atenderán a tus clientes.", ruta: "/profesionales" },
    { key: "clientes", titulo: "Agrega tu primer cliente", detalle: "Registra los datos de tus clientes.", ruta: "/clientes" },
    { key: "citas", titulo: "Crea tu primera cita", detalle: "Agenda tu primera atención.", ruta: "/agenda" }
  ];
  const pasosCompletados = progresoInicio ? pasosInicio.filter(paso => progresoInicio[paso.key]).length : 0;
  const siguientePaso = pasosInicio.find(paso => progresoInicio && !progresoInicio[paso.key]);


  if (cargandoConfiguracion || cargandoSucursales) return <div className="app-loading"><div className="spinner-border" role="status" /><div className="mt-3">Cargando negocio...</div></div>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="sidebar-brand">{logoUrl ? <img src={logoUrl} alt={nombreNegocio} className="sidebar-logo-image" /> : <div className="sidebar-logo">{inicialNegocio}</div>}<div className="sidebar-brand-info"><strong>{nombreNegocio}</strong><div className="sidebar-role">{usuario.rol || ""}</div></div></div>
      <nav className="sidebar-menu">
        {esProfesional ? (
          <>
            <NavLink to="/agenda" className="sidebar-link"><FaCalendarAlt /><span>Agenda</span></NavLink>
            <NavLink to="/clientes" className="sidebar-link"><FaUsers /><span>Clientes</span></NavLink>
            <NavLink to="/servicios" className="sidebar-link"><FaCut /><span>Servicios</span></NavLink>
            <NavLink to="/profesionales" className="sidebar-link"><FaUserTie /><span>Profesionales</span></NavLink>
          </>
        ) : (
          <>
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
          </>
        )}
      </nav>
      <div className="sidebar-timezone"><small>Zona horaria</small><strong>{zonaHoraria}</strong></div>
      <button className="sidebar-logout" onClick={cerrarSesion}><FaSignOutAlt /><span>Cerrar sesión</span></button>
    </aside>
    <main className="main-content">
      <header className="topbar" style={{ justifyContent: "space-between", gap: 16 }}>
        <div className="d-flex align-items-center" style={{ minWidth: 0, flex: "1 1 auto" }}><div className="d-flex align-items-center" style={{ width: "100%", maxWidth: 360, minWidth: 0, padding: "7px 12px", border: "1px solid var(--border)", borderRadius: 18, background: "var(--surface)", boxShadow: "var(--surface-shadow)" }}><div className="d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, minWidth: 40, borderRadius: 14, background: "var(--soft-pink)", color: "var(--primary)", marginRight: 10 }}><FaStore size={18} /></div><div style={{ minWidth: 0, flex: 1 }}><div className="text-muted" style={{ fontSize: 11, lineHeight: 1.1, marginBottom: 2 }}>Sucursal</div><select aria-label="Sucursal activa" value={sucursalId} onChange={e => seleccionarSucursal(e.target.value)} style={{ width: "100%", border: "none", outline: "none", backgroundColor: "transparent", fontWeight: 700, fontSize: 14, padding: 0 }}><option value="">Todas las sucursales</option>{sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></div></div></div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="theme-toggle"
            onClick={alternarTema}
            aria-label={tema === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
            title={tema === "dark" ? "Modo claro" : "Modo oscuro"}
          >
            {tema === "dark" ? <FaSun /> : <FaMoon />}
          </button>
          <div className="topbar-user"><div className="topbar-user-text d-none d-md-flex"><strong>{usuario.nombre || "Usuario"}</strong>{usuario.sucursal && <span>{usuario.sucursal}</span>}</div><div className="topbar-avatar">{(usuario.nombre || "U").charAt(0).toUpperCase()}</div></div>
        </div>
      </header>
      <div className="page-content">
        {!esPaginaSuscripcion && errorConfiguracion && <div className="alert alert-warning">{errorConfiguracion}</div>}
        {!esPaginaSuscripcion && errorSucursales && <div className="alert alert-warning">{errorSucursales}</div>}
        {mostrarAvisoPrueba && <div className="mb-4" style={{ border: "1px solid var(--border)", borderRadius: 20, padding: "18px 20px", background: "linear-gradient(135deg, var(--soft-pink), var(--surface))", boxShadow: "var(--surface-shadow)" }}><div className="d-flex flex-wrap align-items-center justify-content-between gap-3"><div><div className="text-uppercase fw-bold mb-1" style={{ color: "var(--primary)", fontSize: 12, letterSpacing: 1.2 }}>Barberia SaaS</div><div className="fw-bold" style={{ fontSize: 20 }}>Días usando la App: {diasUsandoApp}</div>{diasUsandoApp < 31 && <div className="text-muted mt-1">Te quedan <strong>{diasRestantesPrueba} días</strong> de prueba gratuita. Puedes activar tu suscripción cuando quieras.</div>}</div>{diasUsandoApp < 31 && <button type="button" className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={activarSuscripcion} style={{ borderRadius: 14, padding: "10px 16px", fontWeight: 700 }}><FaCreditCard />Activar suscripción</button>}</div></div>}
        {mostrarAvisoPrueba && !cargandoProgresoInicio && progresoInicio && progresoInicio.totalCitas < 10 && pasosCompletados < 4 && <section className="mb-4" aria-label="Guía de configuración inicial" style={{ border: "1px solid var(--border)", borderRadius: 20, padding: "20px", background: "var(--surface)", boxShadow: "var(--surface-shadow)" }}>
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
            <div><div className="text-uppercase fw-bold mb-1" style={{ color: "var(--primary)", fontSize: 11, letterSpacing: 1.1 }}>Tu negocio · primeros pasos</div><h2 className="h5 fw-bold mb-1">{pasosCompletados === 4 ? "¡Felicitaciones! Ya completaste la configuración inicial" : "¡Vamos a preparar tu negocio!"}</h2><p className="text-muted mb-0 small">{pasosCompletados === 4 ? "Ya tienes lo básico para empezar a gestionar tu negocio." : "Completa estos pasos para comenzar a aprovechar Barbería SaaS."}</p></div>
            <div className="text-end"><div className="fw-bold" style={{ color: "var(--primary)", fontSize: 22 }}>{Math.round(pasosCompletados / 4 * 100)}%</div><div className="text-muted small">{pasosCompletados} de 4 pasos</div></div>
          </div>
          <div style={{ height: 7, borderRadius: 20, background: "var(--border)", overflow: "hidden", marginBottom: 20 }}><div style={{ width: `${pasosCompletados / 4 * 100}%`, height: "100%", borderRadius: 20, background: "#16a34a", transition: "width .25s ease" }} /></div>
          <div className="row g-3">
            {pasosInicio.map((paso, indice) => {
              const completado = progresoInicio[paso.key];
              const esSiguiente = siguientePaso?.key === paso.key;
              return <div className="col-12 col-md-6 col-xl-3" key={paso.key}><div style={{ height: "100%", border: `1px solid ${completado ? "#86c99a" : esSiguiente ? "var(--primary)" : "var(--border)"}`, borderRadius: 15, padding: 14, background: completado ? "rgba(22,163,74,.07)" : esSiguiente ? "var(--soft-pink)" : "var(--surface)" }}>
                <div className="d-flex align-items-center gap-2 mb-2"><div style={{ width: 32, height: 32, minWidth: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: completado ? "#16a34a" : "var(--border)", color: completado ? "#fff" : "var(--text)", fontWeight: 800 }}>{completado ? "✓" : indice + 1}</div><span className="small fw-semibold" style={{ color: completado ? "#16a34a" : "var(--text-muted, var(--primary))" }}>{completado ? "Completado" : esSiguiente ? "Siguiente paso" : "Pendiente"}</span></div>
                <div className="fw-bold mb-1">{paso.titulo}</div><div className="text-muted small mb-3">{completado ? "¡Muy bien! Este paso ya está listo." : paso.detalle}</div>
                {!completado && <button type="button" className={esSiguiente ? "btn btn-primary btn-sm w-100" : "btn btn-outline-secondary btn-sm w-100"} onClick={() => navigate(paso.ruta)}>{esSiguiente ? "Continuar" : "Ir al paso"} <span aria-hidden="true">→</span></button>}
              </div></div>;
            })}
          </div>
          {siguientePaso && <div className="mt-3 p-3 rounded-3 d-flex align-items-start gap-2" style={{ background: "var(--soft-pink)" }}><span aria-hidden="true">💡</span><div className="small"><strong>Te recomendamos:</strong> {siguientePaso.key === "servicios" ? "Comienza agregando tus servicios y sus precios." : siguientePaso.key === "profesionales" ? "Ya tienes servicios. Ahora registra a tus profesionales." : siguientePaso.key === "clientes" ? "Ya tienes servicios y profesionales. Ahora agrega tu primer cliente." : "¡Excelente! Ya tienes clientes. Ahora agenda tu primera cita."}</div></div>}
        </section>}
        <Outlet />
      </div>
    </main>
  </div>;
}
export default MainLayout;
