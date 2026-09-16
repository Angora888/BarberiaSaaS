import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaHistory,
  FaTimes
} from "react-icons/fa";

import api from "../services/api";
import {
  useConfiguracion
} from "../context/ConfiguracionContext";

function HistorialCitasProfesional({ profesional }) {
  const { zonaHoraria } = useConfiguracion();

  const [mostrar, setMostrar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [citas, setCitas] = useState([]);
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const cargarCitas = async () => {
    if (!profesional?.id) return;

    try {
      setCargando(true);
      setError("");

      const response = await api.get("/Citas");

      const historial = (response.data || [])
        .filter(
          (cita) =>
            Number(cita.profesional?.id) ===
            Number(profesional.id)
        )
        .sort(
          (a, b) =>
            new Date(b.fechaInicio) -
            new Date(a.fechaInicio)
        );

      setCitas(historial);
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
          "No fue posible cargar el historial de citas."
      );
    } finally {
      setCargando(false);
    }
  };

  const abrir = async () => {
    setMostrar(true);
    await cargarCitas();
  };

  const cerrar = () => {
    setMostrar(false);
    setError("");
  };

  const citasFiltradas = useMemo(() => {
    return citas.filter((cita) => {
      const estado = String(cita.estado || "").toLowerCase();
      const cumpleEstado =
        estadoFiltro === "Todos" ||
        estado === estadoFiltro.toLowerCase();

      const fecha = new Date(cita.fechaInicio);
      if (Number.isNaN(fecha.getTime())) return false;

      let cumpleDesde = true;
      let cumpleHasta = true;

      if (desde) {
        const inicio = new Date(`${desde}T00:00:00`);
        cumpleDesde = fecha >= inicio;
      }

      if (hasta) {
        const fin = new Date(`${hasta}T23:59:59.999`);
        cumpleHasta = fecha <= fin;
      }

      return cumpleEstado && cumpleDesde && cumpleHasta;
    });
  }, [citas, estadoFiltro, desde, hasta]);

  const nombreCliente = (cita) => {
    const nombre = cita.cliente?.nombre || "Cliente";
    const apellidos = cita.cliente?.apellidos || "";
    return `${nombre} ${apellidos}`.trim();
  };

  const formatearFechaHora = (fecha) => {
    if (!fecha) return "";

    try {
      return new Intl.DateTimeFormat("es-CR", {
        timeZone: zonaHoraria || "America/Costa_Rica",
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      }).format(new Date(fecha));
    } catch {
      return new Date(fecha).toLocaleString("es-CR");
    }
  };

  const formatearEstado = (estado) => {
    const valor = String(estado || "").toLowerCase();

    const nombres = {
      pendiente: "Pendiente",
      confirmada: "Confirmada",
      enproceso: "En proceso",
      completada: "Completada",
      cancelada: "Cancelada",
      noasistio: "No asistió"
    };

    return nombres[valor] || estado || "Sin estado";
  };

  const claseEstado = (estado) => {
    const valor = String(estado || "").toLowerCase();
    return `historial-citas-estado historial-citas-estado-${valor}`;
  };

  const limpiarFiltros = () => {
    setEstadoFiltro("Todos");
    setDesde("");
    setHasta("");
  };

  const modal = mostrar ? (
    <div className="proximas-citas-backdrop" onClick={cerrar}>
      <div
        className="proximas-citas-modal historial-citas-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="proximas-citas-header">
          <div className="proximas-citas-heading">
            <div className="text-muted proximas-citas-eyebrow">
              Historial de citas
            </div>
            <h4>
              {profesional.nombre}{" "}
              {profesional.apellidos || ""}
            </h4>
          </div>

          <button
            type="button"
            className="btn btn-light btn-sm proximas-citas-close"
            onClick={cerrar}
            aria-label="Cerrar"
          >
            <FaTimes />
          </button>
        </div>

        <div className="proximas-citas-body">
          <div className="historial-citas-filtros">
            <div>
              <label className="form-label small mb-1">Estado</label>
              <select
                className="form-select form-select-sm"
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
              >
                <option>Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Confirmada">Confirmada</option>
                <option value="EnProceso">En proceso</option>
                <option value="Completada">Completada</option>
                <option value="Cancelada">Cancelada</option>
                <option value="NoAsistio">No asistió</option>
              </select>
            </div>

            <div>
              <label className="form-label small mb-1">Desde</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label small mb-1">Hasta</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn btn-light btn-sm historial-citas-limpiar"
              onClick={limpiarFiltros}
            >
              Limpiar
            </button>
          </div>

          {cargando ? (
            <div className="text-center text-muted py-5">
              <div
                className="spinner-border spinner-border-sm me-2"
                role="status"
              />
              Cargando historial...
            </div>
          ) : error ? (
            <div className="alert alert-danger mb-0">{error}</div>
          ) : citasFiltradas.length === 0 ? (
            <div className="text-center py-5">
              <FaHistory size={30} className="text-muted mb-3" />
              <h6 className="mb-1">Sin citas para mostrar</h6>
              <div className="text-muted small">
                No hay citas que coincidan con los filtros seleccionados.
              </div>
            </div>
          ) : (
            <div className="proximas-citas-lista">
              {citasFiltradas.map((cita) => (
                <div key={cita.id} className="proximas-citas-item historial-citas-item">
                  <div className="historial-citas-item-top">
                    <div className="proximas-citas-cliente">
                      {nombreCliente(cita)}
                    </div>
                    <span className={claseEstado(cita.estado)}>
                      {formatearEstado(cita.estado)}
                    </span>
                  </div>

                  <div className="proximas-citas-servicio">
                    {cita.servicio?.nombre || "Servicio"}
                  </div>

                  <div className="text-muted proximas-citas-fecha">
                    {formatearFechaHora(cita.fechaInicio)}
                  </div>

                  {cita.notas && (
                    <div className="historial-citas-notas">
                      {cita.notas}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={abrir}
      >
        <FaHistory className="me-1" />
        Historial de citas
      </button>

      {modal && createPortal(modal, document.body)}
    </>
  );
}

export default HistorialCitasProfesional;
