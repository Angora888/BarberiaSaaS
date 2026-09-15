import { useState } from "react";
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
    zonaHoraria
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
        "es-CR",
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
      ).toLocaleString("es-CR");
    }
  };

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

      {mostrar && (
        <div
          className="modal-backdrop-custom"
          onClick={cerrar}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background:
              "rgba(15, 23, 42, 0.48)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18
          }}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              width: "100%",
              maxWidth: 560,
              maxHeight: "82vh",
              overflow: "hidden",
              background: "#fff",
              borderRadius: 22,
              boxShadow:
                "0 24px 70px rgba(15, 23, 42, 0.22)"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: 16,
                padding: "20px 22px",
                borderBottom:
                  "1px solid #edf0f4"
              }}
            >
              <div>
                <div
                  className="text-muted"
                  style={{
                    fontSize: 13
                  }}
                >
                  Próximas citas
                </div>

                <h4
                  style={{
                    margin: "2px 0 0",
                    fontWeight: 800
                  }}
                >
                  {profesional.nombre}{" "}
                  {profesional.apellidos || ""}
                </h4>
              </div>

              <button
                type="button"
                className="btn btn-light btn-sm"
                onClick={cerrar}
                aria-label="Cerrar"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div
              style={{
                maxHeight: "calc(82vh - 82px)",
                overflowY: "auto",
                padding: 18
              }}
            >
              {cargando ? (
                <div
                  className="text-center text-muted py-5"
                >
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
                <div
                  className="text-center py-5"
                >
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
                <div>
                  {citas.map((cita) => (
                    <div
                      key={cita.id}
                      style={{
                        padding: "16px 4px",
                        borderBottom:
                          "1px solid #edf0f4"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "flex-start",
                          gap: 14
                        }}
                      >
                        <div
                          style={{
                            minWidth: 0
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 16,
                              color: "#1f2937"
                            }}
                          >
                            {nombreCliente(cita)}
                          </div>

                          <div
                            style={{
                              marginTop: 3,
                              fontWeight: 700,
                              color:
                                "var(--primary)"
                            }}
                          >
                            {cita.servicio?.nombre ||
                              "Servicio"}
                          </div>

                          <div
                            className="text-muted"
                            style={{
                              marginTop: 5,
                              fontSize: 14
                            }}
                          >
                            {formatearFechaHora(
                              cita.fechaInicio
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProximasCitasProfesional;