import {
  useEffect,
  useState
} from "react";

import {
  FaBan,
  FaCalendarAlt,
  FaPlus,
  FaTrash
} from "react-icons/fa";

import api from "../services/api";
import ProximasCitasProfesional from "./ProximasCitasProfesional";

function BloqueosProfesional({
  profesional
}) {
  const [bloqueos, setBloqueos] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [eliminandoId, setEliminandoId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [formulario, setFormulario] =
    useState({
      fecha: "",
      horaInicio: "08:00",
      horaFin: "17:00",
      motivo: ""
    });

  useEffect(() => {
    if (profesional?.id) {
      cargarBloqueos();
    }
  }, [profesional?.id]);

  const cargarBloqueos = async () => {
    try {
      setCargando(true);
      setError("");

      const response =
        await api.get(
          `/profesionales/${profesional.id}/bloqueos`
        );

      setBloqueos(
        response.data
      );
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
          "No fue posible cargar los bloqueos."
      );
    } finally {
      setCargando(false);
    }
  };

  const cambiarCampo = (e) => {
    const {
      name,
      value
    } = e.target;

    setFormulario(
      (anterior) => ({
        ...anterior,
        [name]: value
      })
    );
  };

  const guardarBloqueo =
    async (e) => {
      e.preventDefault();

      if (!formulario.fecha) {
        setError(
          "Selecciona una fecha."
        );

        return;
      }

      if (
        formulario.horaFin <=
        formulario.horaInicio
      ) {
        setError(
          "La hora final debe ser posterior a la hora inicial."
        );

        return;
      }

      try {
        setGuardando(true);
        setError("");

        await api.post(
          `/profesionales/${profesional.id}/bloqueos`,
          {
            fechaInicio:
              `${formulario.fecha}T${formulario.horaInicio}:00`,

            fechaFin:
              `${formulario.fecha}T${formulario.horaFin}:00`,

            motivo:
              formulario.motivo ||
              null
          }
        );

        setFormulario(
          (anterior) => ({
            ...anterior,
            horaInicio: "08:00",
            horaFin: "17:00",
            motivo: ""
          })
        );

        await cargarBloqueos();
      } catch (error) {
        setError(
          error.response?.data?.mensaje ||
            "No fue posible crear el bloqueo."
        );
      } finally {
        setGuardando(false);
      }
    };

  const eliminarBloqueo =
    async (bloqueo) => {
      const confirmar =
        window.confirm(
          "¿Deseas eliminar este bloqueo?"
        );

      if (!confirmar) {
        return;
      }

      try {
        setEliminandoId(
          bloqueo.id
        );

        setError("");

        await api.delete(
          `/profesionales/${profesional.id}/bloqueos/${bloqueo.id}`
        );

        await cargarBloqueos();
      } catch (error) {
        setError(
          error.response?.data?.mensaje ||
            "No fue posible eliminar el bloqueo."
        );
      } finally {
        setEliminandoId(null);
      }
    };

  const formatearFecha =
    (fecha) => {
      if (!fecha) {
        return "";
      }

      const texto =
        fecha.substring(0, 16);

      const [
        parteFecha,
        parteHora
      ] = texto.split("T");

      const [
        year,
        month,
        day
      ] = parteFecha.split("-");

      return `${day}/${month}/${year} ${parteHora}`;
    };

  return (
    <div className="professional-blocks">
      <div className="mb-3">
        <ProximasCitasProfesional
          profesional={profesional}
        />
      </div>

      <div className="schedule-section-title">
        <FaBan />

        <span>
          Bloqueos y ausencias
        </span>
      </div>

      <p className="text-muted small">
        Usa los bloqueos para vacaciones,
        citas personales, capacitaciones
        u otros períodos en los que no
        estará disponible.
      </p>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="schedule-form-card">
        <form
          onSubmit={
            guardarBloqueo
          }
        >
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">
                Fecha
              </label>

              <input
                type="date"
                name="fecha"
                className="form-control"
                value={
                  formulario.fecha
                }
                onChange={
                  cambiarCampo
                }
                required
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">
                Desde
              </label>

              <input
                type="time"
                name="horaInicio"
                className="form-control"
                value={
                  formulario.horaInicio
                }
                onChange={
                  cambiarCampo
                }
                required
              />
            </div>

            <div className="col-md-2">
              <label className="form-label">
                Hasta
              </label>

              <input
                type="time"
                name="horaFin"
                className="form-control"
                value={
                  formulario.horaFin
                }
                onChange={
                  cambiarCampo
                }
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                Motivo
              </label>

              <input
                type="text"
                name="motivo"
                className="form-control"
                value={
                  formulario.motivo
                }
                onChange={
                  cambiarCampo
                }
                placeholder="Ej. Cita médica"
              />
            </div>

            <div className="col-md-2">
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={
                  guardando
                }
              >
                <FaPlus className="me-1" />

                {guardando
                  ? "..."
                  : "Bloquear"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-4">
        {cargando ? (
          <div className="empty-state">
            Cargando bloqueos...
          </div>
        ) : bloqueos.length === 0 ? (
          <div className="schedule-empty">
            <FaCalendarAlt
              size={26}
            />

            <strong>
              Sin bloqueos
            </strong>

            <span>
              El profesional no tiene
              ausencias registradas.
            </span>
          </div>
        ) : (
          <div className="block-list">
            {bloqueos.map(
              (bloqueo) => (
                <div
                  className="block-row"
                  key={
                    bloqueo.id
                  }
                >
                  <div className="block-icon">
                    <FaBan />
                  </div>

                  <div className="block-info">
                    <strong>
                      {bloqueo.motivo ||
                        "No disponible"}
                    </strong>

                    <span>
                      {formatearFecha(
                        bloqueo.fechaInicioLocal
                      )}
                      {" — "}
                      {formatearFecha(
                        bloqueo.fechaFinLocal
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-light block-delete"
                    title="Eliminar bloqueo"
                    disabled={
                      eliminandoId ===
                      bloqueo.id
                    }
                    onClick={() =>
                      eliminarBloqueo(
                        bloqueo
                      )
                    }
                  >
                    <FaTrash />
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BloqueosProfesional;