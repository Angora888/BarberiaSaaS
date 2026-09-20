import { useState } from "react";
import { createPortal } from "react-dom";
import {
  FaCalendarAlt,
  FaTimes
} from "react-icons/fa";

import api from "../services/api";
import {
  useConfiguracion
} from "../context/ConfiguracionContext";

function ProximasCitasProfesional({
  profesional
}) {
  const {
    zonaHoraria,
    locale
  } = useConfiguracion();

  const [mostrar, setMostrar] =
    useState(false);

  const [cargando, setCargando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [citas, setCitas] =
    useState([]);

  const cargarCitas = async () => {
    if (!profesional?.id) {
      return;
    }

    try {
      setCargando(true);
      setError("");

      const response =
        await api.get("/Citas");

      const ahora = new Date();

      const proximas = (
        response.data || []
      )
        .filter((cita) => {
          const mismoProfesional =
            Number(cita.profesional?.id) ===
            Number(profesional.id);

          const fecha =
            new Date(cita.fechaInicio);

          const esFutura =
            !Number.isNaN(
              fecha.getTime()
            ) &&
            fecha >= ahora;

          const estado =
            String(
              cita.estado || ""
            ).toLowerCase();

          const visible =
            estado !== "cancelada" &&
            estado !== "noasistio" &&
            estado !== "completada";

          return (
            mismoProfesional &&
            esFutura &&
            visible
          );
        })
        .sort(
          (a, b) =>
            new Date(a.fechaInicio) -
            new Date(b.fechaInicio)
        );

      setCitas(proximas);
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        "No fue posible cargar las próximas citas."
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

  const nombreCliente = (cita) => {
    const nombre =
      cita.cliente?.nombre || "Cliente";

    const apellidos =
      cita.cliente?.apellidos || "";

    return `${nombre} ${apellidos}`.trim();
  };

  const formatearFechaHora = (fecha) => {
    if (!fecha) {
      return "";
    }

    try {
      return new Intl.DateTimeFormat(
        locale,
        {
          timeZone:
            zonaHoraria ||
            "America/Costa_Rica",
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }
      ).format(
        new Date(fecha)
      );
    } catch {
      return new Date(
        fecha
      ).toLocaleString(locale);
    }
  };

  const modal = mostrar ? (
    <div
      className="proximas-citas-backdrop"
      onClick={cerrar}
    >
      <div
        className="proximas-citas-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="proximas-citas-header">
          <div className="proximas-citas-heading">
            <div className="text-muted proximas-citas-eyebrow">
              Próximas citas
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
          {cargando ? (
            <div className="text-center text-muted py-5">
              <div
                className="spinner-border spinner-border-sm me-2"
                role="status"
              />
              Cargando próximas citas...
            </div>
          ) : error ? (
            <div className="alert alert-danger mb-0">
              {error}
            </div>
          ) : citas.length === 0 ? (
            <div className="text-center py-5">
              <FaCalendarAlt
                size={30}
                className="text-muted mb-3"
              />

              <h6 className="mb-1">
                Sin citas próximas
              </h6>

              <div className="text-muted small">
                Este profesional no tiene citas futuras registradas.
              </div>
            </div>
          ) : (
            <div className="proximas-citas-lista">
              {citas.map((cita) => (
                <div
                  key={cita.id}
                  className="proximas-citas-item"
                >
                  <div className="proximas-citas-cliente">
                    {nombreCliente(cita)}
                  </div>

                  <div className="proximas-citas-servicio">
                    {cita.servicio?.nombre ||
                      "Servicio"}
                  </div>

                  <div className="text-muted proximas-citas-fecha">
                    {formatearFechaHora(
                      cita.fechaInicio
                    )}
                  </div>
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
        <FaCalendarAlt className="me-1" />
        Próximas citas
      </button>

      {modal &&
        createPortal(
          modal,
          document.body
        )}
    </>
  );
}

export default ProximasCitasProfesional;
