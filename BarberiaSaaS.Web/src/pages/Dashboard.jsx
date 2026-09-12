import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaMoneyBillWave,
  FaShoppingBag,
  FaUserCheck,
  FaUsers,
  FaUserTie
} from "react-icons/fa";

import api from "../services/api";

import {
  useConfiguracion
} from "../context/ConfiguracionContext";

function Dashboard() {
  const {
    nombreNegocio,
    zonaHoraria,
    moneda,
    formatearMoneda
  } = useConfiguracion();

  const [citasHoy, setCitasHoy] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [resumenFinanciero, setResumenFinanciero] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const fechaHoy = useMemo(
    () => obtenerFechaActualTenant(zonaHoraria),
    [zonaHoraria]
  );

  useEffect(() => {
    cargarDashboard();
  }, [fechaHoy]);

  const cargarDashboard = async () => {
    try {
      setCargando(true);
      setError("");

      const desde = `${fechaHoy}T00:00:00`;
      const hasta = `${fechaHoy}T23:59:59`;

      const [
        respuestaCitas,
        respuestaClientes,
        respuestaProfesionales,
        respuestaResumen
      ] = await Promise.all([
        api.get("/Citas", {
          params: { desde, hasta }
        }),
        api.get("/Clientes"),
        api.get("/Profesionales"),
        api.get("/ResumenFinanciero/diario", {
          params: { fecha: fechaHoy }
        })
      ]);

      setCitasHoy(normalizarLista(respuestaCitas.data));
      setClientes(normalizarLista(respuestaClientes.data));
      setProfesionales(normalizarLista(respuestaProfesionales.data));
      setResumenFinanciero(respuestaResumen.data || null);
    } catch (error) {
      console.error("Error cargando dashboard:", error);

      setError(
        error.response?.data?.mensaje ||
        error.response?.data?.title ||
        "No fue posible cargar el resumen del negocio."
      );
    } finally {
      setCargando(false);
    }
  };

  const citasActivas = useMemo(
    () => citasHoy.filter((cita) => cita.estado !== "Cancelada"),
    [citasHoy]
  );

  const citasPendientes = useMemo(
    () => citasActivas.filter((cita) => cita.estado === "Pendiente").length,
    [citasActivas]
  );

  const citasConfirmadas = useMemo(
    () => citasActivas.filter((cita) => cita.estado === "Confirmada").length,
    [citasActivas]
  );

  const citasCompletadas = useMemo(
    () => citasActivas.filter((cita) => cita.estado === "Completada").length,
    [citasActivas]
  );

  const clientesAtendidos = useMemo(() => {
    const ids = new Set(
      citasActivas
        .filter((cita) => cita.estado === "Completada")
        .map((cita) => cita.cliente?.id || cita.clienteId)
        .filter(Boolean)
    );

    return ids.size;
  }, [citasActivas]);

  const profesionalesActivos = useMemo(
    () => profesionales.filter((profesional) => profesional.activo !== false).length,
    [profesionales]
  );

  const proximasCitas = useMemo(
    () => citasActivas
      .filter((cita) => ["Pendiente", "Confirmada", "EnProceso"].includes(cita.estado))
      .sort((a, b) => obtenerFechaCita(a) - obtenerFechaCita(b))
      .slice(0, 6),
    [citasActivas]
  );

  const estadisticasProfesionales = useMemo(
    () => profesionales
      .filter((profesional) => profesional.activo !== false)
      .map((profesional) => {
        const citasProfesional = citasActivas.filter(
          (cita) => Number(cita.profesional?.id || cita.profesionalId) === Number(profesional.id)
        );

        const completadas = citasProfesional.filter(
          (cita) => cita.estado === "Completada"
        );

        const total = completadas.reduce(
          (suma, cita) => suma + Number(cita.precio || 0),
          0
        );

        return {
          ...profesional,
          cantidad: citasProfesional.length,
          completadas: completadas.length,
          total
        };
      })
      .sort((a, b) => b.cantidad - a.cantidad),
    [profesionales, citasActivas]
  );

  const ingresosTotales = Number(resumenFinanciero?.ingresosTotales || 0);
  const ingresosServicios = Number(resumenFinanciero?.servicios?.ingresos || 0);
  const ingresosProductos = Number(resumenFinanciero?.productos?.ingresos || 0);
  const cantidadVentasProductos = Number(resumenFinanciero?.productos?.cantidadVentas || 0);
  const cantidadCobros = Number(resumenFinanciero?.caja?.cantidadCobros || 0);
  const cantidadCobrosServicios = Number(resumenFinanciero?.servicios?.cantidadCobros || 0);
  const cantidadCobrosProductos = Number(resumenFinanciero?.productos?.cantidadCobros || 0);
  const utilidadBrutaProductos = Number(resumenFinanciero?.productos?.utilidadBruta || 0);
  const descuentosProductos = Number(resumenFinanciero?.productos?.descuentos || 0);
  const cobrosPorMetodoPago =
    resumenFinanciero?.cobrosPorMetodoPago ||
    resumenFinanciero?.ventasPorMetodoPago ||
    [];

  if (cargando) {
    return (
      <div className="py-5 text-center">
        <div className="spinner-border" role="status" />
        <div className="mt-3 text-muted">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h1 className="page-title mb-1">Dashboard</h1>
          <p className="text-muted mb-0">Resumen de {nombreNegocio}</p>
        </div>

        <div className="text-md-end">
          <div className="small text-muted">Hoy</div>
          <strong>{formatearFechaLarga(fechaHoy)}</strong>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mb-4">{error}</div>
      )}

      <div className="alert alert-light border mb-4">
        <strong>Caja real:</strong>{" "}
        los ingresos muestran únicamente dinero recibido hoy.
        Los abonos de cuentas pendientes cuentan en la fecha en que se pagan.
      </div>

      <div className="row g-4">
        <div className="col-md-6 col-xl-3">
          <DashboardMoneyCard
            label="Ingresos recibidos hoy"
            valor={ingresosTotales}
            detalle={`${cantidadCobros} cobro(s) recibido(s)`}
            icono={<FaMoneyBillWave size={28} className="text-primary" />}
            formatearMoneda={formatearMoneda}
            moneda={moneda}
          />
        </div>

        <div className="col-md-6 col-xl-3">
          <DashboardMoneyCard
            label="Servicios cobrados"
            valor={ingresosServicios}
            detalle={`${cantidadCobrosServicios} cobro(s) de servicios`}
            icono={<FaCheckCircle size={28} className="text-primary" />}
            formatearMoneda={formatearMoneda}
            moneda={moneda}
          />
        </div>

        <div className="col-md-6 col-xl-3">
          <DashboardMoneyCard
            label="Productos cobrados"
            valor={ingresosProductos}
            detalle={`${cantidadCobrosProductos} cobro(s) de productos`}
            icono={<FaShoppingBag size={28} className="text-primary" />}
            formatearMoneda={formatearMoneda}
            moneda={moneda}
          />
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="dashboard-card h-100">
            <div className="d-flex align-items-center justify-content-between gap-3">
              <div>
                <div className="dashboard-label">Citas de hoy</div>
                <div className="dashboard-value">{citasActivas.length}</div>
                <small className="text-muted">
                  {citasPendientes} pendientes · {citasCompletadas} completadas
                </small>
              </div>

              <FaCalendarAlt size={28} className="text-primary" />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mt-1">
        <div className="col-md-6 col-xl-3">
          <div className="dashboard-card h-100">
            <div className="d-flex align-items-center justify-content-between gap-3">
              <div>
                <div className="dashboard-label">Clientes</div>
                <div className="dashboard-value">{clientes.length}</div>
                <small className="text-muted">{clientesAtendidos} atendidos hoy</small>
              </div>

              <FaUsers size={28} className="text-primary" />
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="dashboard-card h-100">
            <div className="d-flex align-items-center justify-content-between gap-3">
              <div>
                <div className="dashboard-label">Profesionales</div>
                <div className="dashboard-value">{profesionalesActivos}</div>
                <small className="text-muted">activos</small>
              </div>

              <FaUserTie size={28} className="text-primary" />
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <DashboardMoneyCard
            label="Utilidad bruta productos"
            valor={utilidadBrutaProductos}
            detalle="Venta facturada menos costo de productos"
            icono={<FaMoneyBillWave size={28} className="text-primary" />}
            formatearMoneda={formatearMoneda}
            moneda={moneda}
          />
        </div>

        <div className="col-md-6 col-xl-3">
          <DashboardMoneyCard
            label="Descuentos productos"
            valor={descuentosProductos}
            detalle="Descuentos aplicados a ventas de hoy"
            icono={<FaShoppingBag size={28} className="text-primary" />}
            formatearMoneda={formatearMoneda}
            moneda={moneda}
          />
        </div>
      </div>

      <div className="row g-4 mt-1">
        <div className="col-lg-4">
          <div className="dashboard-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <div className="dashboard-label">Estado de citas</div>
                <div className="fw-bold mt-1">Resumen del día</div>
              </div>

              <FaClock size={24} className="text-primary" />
            </div>

            <DashboardStatusRow label="Pendientes" valor={citasPendientes} />
            <DashboardStatusRow label="Confirmadas" valor={citasConfirmadas} />
            <DashboardStatusRow label="Completadas" valor={citasCompletadas} />
            <DashboardStatusRow
              label="Canceladas"
              valor={citasHoy.filter((cita) => cita.estado === "Cancelada").length}
            />
            <DashboardStatusRow
              label="No asistió"
              valor={citasHoy.filter((cita) => cita.estado === "NoAsistio").length}
            />
          </div>
        </div>

        <div className="col-lg-8">
          <div className="dashboard-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <div className="dashboard-label">Próximas citas</div>
                <div className="fw-bold mt-1">Agenda de hoy</div>
              </div>

              <FaCheckCircle size={24} className="text-primary" />
            </div>

            {proximasCitas.length === 0 ? (
              <div className="text-muted py-4 text-center">
                No hay citas pendientes para hoy.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Cliente</th>
                      <th>Servicio</th>
                      <th>Profesional</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proximasCitas.map((cita) => (
                      <tr key={cita.id}>
                        <td className="fw-bold">{obtenerHoraCita(cita, zonaHoraria)}</td>
                        <td>{obtenerNombreCliente(cita)}</td>
                        <td>{obtenerNombreServicio(cita)}</td>
                        <td>{obtenerNombreProfesional(cita)}</td>
                        <td>
                          <span className={obtenerClaseEstado(cita.estado)}>
                            {formatearEstado(cita.estado)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row g-4 mt-1">
        <div className="col-lg-8">
          <div className="dashboard-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <div className="dashboard-label">Profesionales</div>
                <div className="fw-bold mt-1">Actividad de hoy</div>
              </div>

              <FaUserCheck size={24} className="text-primary" />
            </div>

            {estadisticasProfesionales.length === 0 ? (
              <div className="text-muted py-4 text-center">
                No hay profesionales activos.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Profesional</th>
                      <th className="text-center">Citas</th>
                      <th className="text-center">Completadas</th>
                      <th className="text-end">Facturado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estadisticasProfesionales.map((profesional) => (
                      <tr key={profesional.id}>
                        <td>
                          <div className="fw-bold">
                            {profesional.nombre} {profesional.apellidos}
                          </div>
                          {profesional.especialidad && (
                            <small className="text-muted">{profesional.especialidad}</small>
                          )}
                        </td>
                        <td className="text-center">{profesional.cantidad}</td>
                        <td className="text-center">{profesional.completadas}</td>
                        <td className="text-end fw-bold">
                          {mostrarMoneda(profesional.total, formatearMoneda, moneda)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="dashboard-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div>
                <div className="dashboard-label">Cobros recibidos</div>
                <div className="fw-bold mt-1">Por método de pago</div>
              </div>

              <FaMoneyBillWave size={24} className="text-primary" />
            </div>

            {cobrosPorMetodoPago.length === 0 ? (
              <div className="text-muted py-3 text-center">
                No hay cobros registrados hoy.
              </div>
            ) : (
              cobrosPorMetodoPago.map((item) => (
                <div
                  key={item.metodoPago}
                  className="d-flex align-items-center justify-content-between py-2 border-bottom"
                >
                  <div>
                    <div className="fw-semibold">{item.metodoPago}</div>
                    <small className="text-muted">
                      {item.cantidadCobros ?? item.cantidadVentas ?? 0} cobro(s)
                    </small>
                  </div>

                  <strong>
                    {mostrarMoneda(Number(item.total || 0), formatearMoneda, moneda)}
                  </strong>
                </div>
              ))
            )}

            <div className="dashboard-info mt-4">
              <div>
                <span>Zona horaria</span>
                <strong>{zonaHoraria}</strong>
              </div>
              <div>
                <span>Moneda</span>
                <strong>{moneda}</strong>
              </div>
              <div>
                <span>Fecha</span>
                <strong>{fechaHoy}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardMoneyCard({
  label,
  valor,
  detalle,
  icono,
  formatearMoneda,
  moneda
}) {
  return (
    <div className="dashboard-card h-100">
      <div className="d-flex align-items-center justify-content-between gap-3">
        <div>
          <div className="dashboard-label">{label}</div>
          <div className="dashboard-value">
            {mostrarMoneda(valor, formatearMoneda, moneda)}
          </div>
          <small className="text-muted">{detalle}</small>
        </div>
        {icono}
      </div>
    </div>
  );
}

function DashboardStatusRow({ label, valor }) {
  return (
    <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
      <span className="text-muted">{label}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function mostrarMoneda(valor, formatearMoneda, moneda) {
  const numero = Number(valor || 0);

  if (formatearMoneda) {
    return formatearMoneda(numero);
  }

  if (moneda === "CRC") {
    return `₡${numero.toLocaleString("es-CR")}`;
  }

  return `${moneda} ${numero.toLocaleString("es-CR")}`;
}

function normalizarLista(data) {
  if (Array.isArray(data)) {
    return data;
  }

  const posiblesPropiedades = [
    "items",
    "data",
    "resultados",
    "clientes",
    "profesionales",
    "citas"
  ];

  for (const propiedad of posiblesPropiedades) {
    if (Array.isArray(data?.[propiedad])) {
      return data[propiedad];
    }
  }

  return [];
}

function obtenerFechaActualTenant(zonaHoraria) {
  try {
    const partes = new Intl.DateTimeFormat("en-CA", {
      timeZone: zonaHoraria || "America/Costa_Rica",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());

    const year = partes.find((parte) => parte.type === "year")?.value;
    const month = partes.find((parte) => parte.type === "month")?.value;
    const day = partes.find((parte) => parte.type === "day")?.value;

    return `${year}-${month}-${day}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function obtenerFechaCita(cita) {
  const fechaTexto = cita.fechaInicioUtc || cita.fechaInicio;

  if (!fechaTexto) {
    return 0;
  }

  let valor = fechaTexto;

  if (
    typeof valor === "string" &&
    !valor.endsWith("Z") &&
    !/[+-]\d{2}:\d{2}$/.test(valor)
  ) {
    valor = `${valor}Z`;
  }

  const fecha = new Date(valor);

  return Number.isNaN(fecha.getTime()) ? 0 : fecha.getTime();
}

function obtenerHoraCita(cita, zonaHoraria) {
  const fechaTexto = cita.fechaInicioUtc || cita.fechaInicio;

  if (!fechaTexto) {
    return "-";
  }

  let valor = fechaTexto;

  if (
    typeof valor === "string" &&
    !valor.endsWith("Z") &&
    !/[+-]\d{2}:\d{2}$/.test(valor)
  ) {
    valor = `${valor}Z`;
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("es-CR", {
      timeZone: zonaHoraria || "America/Costa_Rica",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(fecha);
  } catch {
    return "-";
  }
}

function obtenerNombreCliente(cita) {
  const cliente = cita.cliente;

  if (!cliente) {
    return "Cliente";
  }

  return [cliente.nombre, cliente.apellidos]
    .filter(Boolean)
    .join(" ") || "Cliente";
}

function obtenerNombreProfesional(cita) {
  const profesional = cita.profesional;

  if (!profesional) {
    return "Profesional";
  }

  return [profesional.nombre, profesional.apellidos]
    .filter(Boolean)
    .join(" ") || "Profesional";
}

function obtenerNombreServicio(cita) {
  return cita.servicio?.nombre || cita.servicioNombre || "Servicio";
}

function obtenerClaseEstado(estado) {
  switch (estado) {
    case "Confirmada":
      return "appointment-status confirmed";
    case "EnProceso":
      return "appointment-status in-progress";
    case "Completada":
      return "appointment-status completed";
    case "Cancelada":
      return "appointment-status cancelled";
    case "NoAsistio":
      return "appointment-status absent";
    default:
      return "appointment-status pending";
  }
}

function formatearEstado(estado) {
  switch (estado) {
    case "EnProceso":
      return "En proceso";
    case "NoAsistio":
      return "No asistió";
    default:
      return estado || "Pendiente";
  }
}

function formatearFechaLarga(fecha) {
  if (!fecha) {
    return "";
  }

  const [year, month, day] = fecha.split("-").map(Number);
  const fechaLocal = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(fechaLocal);
}

export default Dashboard;
