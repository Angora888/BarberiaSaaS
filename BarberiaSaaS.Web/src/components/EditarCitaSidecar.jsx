import {
  useEffect,
  useMemo,
  useState
} from "react";
import { createPortal } from "react-dom";
import {
  FaEdit,
  FaTimes
} from "react-icons/fa";
import api from "../services/api";
import { useConfiguracion } from "../context/ConfiguracionContext";

function obtenerFechaHoraLocal(
  fechaUtc,
  zonaHoraria
) {
  if (!fechaUtc) {
    return {
      fecha: "",
      hora: ""
    };
  }

  try {
    const partes = new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          zonaHoraria ||
          "America/Costa_Rica",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }
    ).formatToParts(
      new Date(fechaUtc)
    );

    const valor = (tipo) =>
      partes.find(
        (parte) =>
          parte.type === tipo
      )?.value || "";

    return {
      fecha:
        `${valor("year")}-${valor("month")}-${valor("day")}`,
      hora:
        `${valor("hour")}:${valor("minute")}`
    };
  } catch {
    const fecha = new Date(fechaUtc);

    return {
      fecha:
        `${fecha.getFullYear()}-${String(
          fecha.getMonth() + 1
        ).padStart(2, "0")}-${String(
          fecha.getDate()
        ).padStart(2, "0")}`,
      hora:
        `${String(fecha.getHours()).padStart(2, "0")}:${String(
          fecha.getMinutes()
        ).padStart(2, "0")}`
    };
  }
}

function EditarCitaSidecar() {
  const { zonaHoraria } = useConfiguracion();

  const [cita, setCita] = useState(null);
  const [portalTarget, setPortalTarget] =
    useState(null);
  const [mostrar, setMostrar] =
    useState(false);
  const [servicios, setServicios] =
    useState([]);
  const [profesionales, setProfesionales] =
    useState([]);
  const [sucursales, setSucursales] =
    useState([]);
  const [cargando, setCargando] =
    useState(false);
  const [guardando, setGuardando] =
    useState(false);
  const [error, setError] =
    useState("");
  const [exito, setExito] =
    useState(false);

  const [formulario, setFormulario] =
    useState({
      servicioId: "",
      servicioVarianteId: "",
      profesionalId: "",
      sucursalId: "",
      fecha: "",
      hora: "",
      duracionMinutos: "60",
      notas: ""
    });

  useEffect(() => {
    const manejarDetalle = (evento) => {
      if (evento.detail?.cita) {
        setCita(evento.detail.cita);
      }
    };

    window.addEventListener(
      "barberiaSaaS:citaDetalle",
      manejarDetalle
    );

    return () => {
      window.removeEventListener(
        "barberiaSaaS:citaDetalle",
        manejarDetalle
      );
    };
  }, []);

  useEffect(() => {
    const buscarFooter = () => {
      const modales = Array.from(
        document.querySelectorAll(
          ".custom-modal"
        )
      );

      const modalDetalle = modales.find(
        (modal) =>
          modal.querySelector("h4")
            ?.textContent
            ?.trim() ===
          "Detalle de la cita"
      );

      setPortalTarget(
        modalDetalle?.querySelector(
          ".custom-modal-footer"
        ) || null
      );
    };

    buscarFooter();

    const observer = new MutationObserver(
      buscarFooter
    );

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, []);

  const servicioSeleccionado =
    useMemo(() => {
      return servicios.find(
        (item) =>
          Number(item.id) ===
          Number(formulario.servicioId)
      );
    }, [
      servicios,
      formulario.servicioId
    ]);

  const variantes = useMemo(() => {
    return (
      servicioSeleccionado?.variantes ||
      []
    ).filter(
      (item) =>
        item.activo !== false
    );
  }, [servicioSeleccionado]);

  const profesionalesFiltrados =
    useMemo(() => {
      const servicioId = Number(
        formulario.servicioId
      );

      if (!servicioId) {
        return profesionales;
      }

      return profesionales.filter(
        (profesional) =>
          (profesional.servicios || [])
            .some(
              (servicio) =>
                Number(servicio.id) ===
                servicioId
            )
      );
    }, [
      profesionales,
      formulario.servicioId
    ]);

  const abrir = async () => {
    if (!cita) {
      return;
    }

    const local = obtenerFechaHoraLocal(
      cita.fechaInicio,
      zonaHoraria
    );

    setFormulario({
      servicioId:
        String(cita.servicio?.id || ""),
      servicioVarianteId:
        cita.servicioVariante?.id
          ? String(cita.servicioVariante.id)
          : "",
      profesionalId:
        String(cita.profesional?.id || ""),
      sucursalId:
        String(cita.sucursal?.id || ""),
      fecha: local.fecha,
      hora: local.hora,
      duracionMinutos:
        String(cita.duracionMinutos || 60),
      notas: cita.notas || ""
    });

    setMostrar(true);
    setError("");
    setExito(false);

    if (
      servicios.length > 0 &&
      profesionales.length > 0 &&
      sucursales.length > 0
    ) {
      return;
    }

    try {
      setCargando(true);

      const [
        serviciosResponse,
        profesionalesResponse,
        sucursalesResponse
      ] = await Promise.all([
        api.get("/Servicios"),
        api.get("/Profesionales"),
        api.get("/Sucursales")
      ]);

      setServicios(
        serviciosResponse.data || []
      );
      setProfesionales(
        profesionalesResponse.data || []
      );
      setSucursales(
        sucursalesResponse.data || []
      );
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No fue posible cargar los datos para editar la cita."
      );
    } finally {
      setCargando(false);
    }
  };

  const cerrar = () => {
    if (guardando) {
      return;
    }

    setMostrar(false);
    setError("");
    setExito(false);
  };

  const cambiarCampo = (evento) => {
    const { name, value } = evento.target;

    setError("");

    setFormulario(
      (anterior) => ({
        ...anterior,
        [name]: value,
        ...(name === "servicioId"
          ? {
              servicioVarianteId: ""
            }
          : {})
      })
    );
  };

  const guardar = async (evento) => {
    evento.preventDefault();

    if (!cita) {
      return;
    }

    if (
      !formulario.servicioId ||
      !formulario.profesionalId ||
      !formulario.sucursalId ||
      !formulario.fecha ||
      !formulario.hora ||
      Number(formulario.duracionMinutos) <= 0
    ) {
      setError(
        "Completa todos los campos requeridos."
      );
      return;
    }

    try {
      setGuardando(true);
      setError("");

      await api.put(
        `/Citas/${cita.id}/editar`,
        {
          servicioId:
            Number(formulario.servicioId),
          servicioVarianteId:
            formulario.servicioVarianteId
              ? Number(
                  formulario.servicioVarianteId
                )
              : null,
          profesionalId:
            Number(formulario.profesionalId),
          sucursalId:
            Number(formulario.sucursalId),
          fechaInicio:
            `${formulario.fecha}T${formulario.hora}:00`,
          duracionMinutos:
            Number(formulario.duracionMinutos),
          notas:
            formulario.notas?.trim() ||
            null
        }
      );

      setExito(true);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          err.response?.data?.title ||
          "No fue posible actualizar la cita."
      );
    } finally {
      setGuardando(false);
    }
  };

  const puedeEditar =
    cita &&
    !["Completada", "Cancelada"]
      .includes(cita.estado);

  return (
    <>
      {portalTarget &&
        puedeEditar &&
        createPortal(
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={abrir}
          >
            <FaEdit className="me-2" />
            Editar cita
          </button>,
          portalTarget
        )}

      {mostrar && (
        <div
          className="custom-modal-backdrop"
          style={{
            zIndex: 12000
          }}
        >
          <div className="custom-modal custom-modal-large">
            <div className="custom-modal-header">
              <div>
                <h4>Editar cita</h4>
                <p className="text-muted mb-0">
                  Ajusta servicio, variante, profesional, fecha, hora y duración.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={cerrar}
                disabled={guardando}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={guardar}>
              <div className="custom-modal-body">
                {error && (
                  <div className="alert alert-danger mb-4">
                    {error}
                  </div>
                )}

                {exito && (
                  <div className="alert alert-success mb-4">
                    Cita actualizada correctamente. El precio se recalculó según el servicio o variante seleccionada.
                  </div>
                )}

                {cargando ? (
                  <div className="d-flex align-items-center gap-2 text-muted py-4">
                    <div
                      className="spinner-border spinner-border-sm"
                      role="status"
                    />
                    Cargando información...
                  </div>
                ) : (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">
                        Servicio *
                      </label>
                      <select
                        name="servicioId"
                        className="form-select"
                        value={formulario.servicioId}
                        onChange={cambiarCampo}
                        required
                      >
                        <option value="">
                          Seleccionar servicio
                        </option>
                        {servicios
                          .filter(
                            (item) =>
                              item.activo !== false
                          )
                          .map((item) => (
                            <option
                              key={item.id}
                              value={item.id}
                            >
                              {item.nombre}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Variante
                      </label>
                      <select
                        name="servicioVarianteId"
                        className="form-select"
                        value={formulario.servicioVarianteId}
                        onChange={cambiarCampo}
                      >
                        <option value="">
                          Sin variante definida
                        </option>
                        {variantes.map(
                          (variante) => (
                            <option
                              key={variante.id}
                              value={variante.id}
                            >
                              {variante.nombre}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Profesional *
                      </label>
                      <select
                        name="profesionalId"
                        className="form-select"
                        value={formulario.profesionalId}
                        onChange={cambiarCampo}
                        required
                      >
                        <option value="">
                          Seleccionar profesional
                        </option>
                        {profesionalesFiltrados.map(
                          (profesional) => (
                            <option
                              key={profesional.id}
                              value={profesional.id}
                            >
                              {`${profesional.nombre || ""} ${profesional.apellidos || ""}`.trim()}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Sucursal *
                      </label>
                      <select
                        name="sucursalId"
                        className="form-select"
                        value={formulario.sucursalId}
                        onChange={cambiarCampo}
                        required
                      >
                        <option value="">
                          Seleccionar sucursal
                        </option>
                        {sucursales
                          .filter(
                            (item) =>
                              item.activa !== false
                          )
                          .map((item) => (
                            <option
                              key={item.id}
                              value={item.id}
                            >
                              {item.nombre}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">
                        Fecha *
                      </label>
                      <input
                        type="date"
                        name="fecha"
                        className="form-control"
                        value={formulario.fecha}
                        onChange={cambiarCampo}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">
                        Hora *
                      </label>
                      <input
                        type="time"
                        name="hora"
                        className="form-control"
                        value={formulario.hora}
                        onChange={cambiarCampo}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">
                        Duración (min) *
                      </label>
                      <input
                        type="number"
                        name="duracionMinutos"
                        className="form-control"
                        value={formulario.duracionMinutos}
                        onChange={cambiarCampo}
                        min="15"
                        step="15"
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">
                        Notas
                      </label>
                      <textarea
                        name="notas"
                        className="form-control"
                        rows="3"
                        value={formulario.notas}
                        onChange={cambiarCampo}
                        placeholder="Observaciones de la cita..."
                      />
                    </div>

                    <div className="col-12">
                      <div className="alert alert-light border mb-0">
                        Si eliges una variante, el precio de la cita se actualizará al precio de esa variante. Si la dejas sin definir, se utilizará el precio base del servicio.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="custom-modal-footer">
                {exito ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                      window.location.reload()
                    }
                  >
                    Actualizar agenda
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={cerrar}
                      disabled={guardando}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={
                        guardando ||
                        cargando
                      }
                    >
                      {guardando
                        ? "Guardando..."
                        : "Guardar cambios"}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default EditarCitaSidecar;
