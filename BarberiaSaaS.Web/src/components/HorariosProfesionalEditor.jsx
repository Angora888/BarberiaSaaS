import { useEffect, useRef, useState } from "react";
import { FaEdit, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import api from "../services/api";

const DIAS_SEMANA = [
  { valor: 1, nombre: "Lunes" },
  { valor: 2, nombre: "Martes" },
  { valor: 3, nombre: "Miércoles" },
  { valor: 4, nombre: "Jueves" },
  { valor: 5, nombre: "Viernes" },
  { valor: 6, nombre: "Sábado" },
  { valor: 0, nombre: "Domingo" }
];

function HorariosProfesionalEditor() {
  const [horarioEditando, setHorarioEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    diaSemana: 1,
    horaInicio: "08:00",
    horaFin: "17:00"
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const contextoRef = useRef({
    profesionalId: null,
    nombreProfesional: "",
    horarios: [],
    cargando: false
  });

  const normalizarTexto = (texto) =>
    (texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const obtenerModalHorarios = () =>
    Array.from(document.querySelectorAll(".modal-content")).find(
      (modal) => {
        const titulo = modal.querySelector(".modal-title")?.textContent || "";
        return titulo.trim().startsWith("Horarios de ");
      }
    );

  const obtenerNombreDesdeModal = (modal) => {
    const titulo = modal?.querySelector(".modal-title")?.textContent || "";
    return titulo.replace(/^Horarios de\s*/i, "").trim();
  };

  const cargarContexto = async (modal) => {
    if (!modal || contextoRef.current.cargando) {
      return;
    }

    const nombreModal = obtenerNombreDesdeModal(modal);

    if (
      contextoRef.current.profesionalId &&
      normalizarTexto(contextoRef.current.nombreProfesional) === normalizarTexto(nombreModal)
    ) {
      return;
    }

    try {
      contextoRef.current.cargando = true;

      const profesionalesResponse = await api.get("/Profesionales");
      const profesional = (profesionalesResponse.data || []).find((item) => {
        const nombreCompleto = `${item.nombre || ""} ${item.apellidos || ""}`.trim();
        return normalizarTexto(nombreCompleto) === normalizarTexto(nombreModal);
      });

      if (!profesional) {
        return;
      }

      const horariosResponse = await api.get(
        `/profesionales/${profesional.id}/horarios`
      );

      contextoRef.current = {
        profesionalId: profesional.id,
        nombreProfesional: nombreModal,
        horarios: horariosResponse.data || [],
        cargando: false
      };
    } catch (errorCarga) {
      console.error("No fue posible cargar horarios para edición:", errorCarga);
    } finally {
      contextoRef.current.cargando = false;
    }
  };

  const obtenerNombreDia = (diaSemana) =>
    DIAS_SEMANA.find((dia) => dia.valor === Number(diaSemana))?.nombre || "Día";

  const formatearHora = (hora) => (hora ? hora.substring(0, 5) : "");

  const encontrarHorarioFila = (fila) => {
    const dia = fila.querySelector("strong")?.textContent?.trim() || "";
    const horarioTexto = fila.querySelector("span")?.textContent || "";
    const partes = horarioTexto
      .split("-")
      .map((valor) => valor.trim())
      .filter(Boolean);

    return contextoRef.current.horarios.find((horario) => {
      return (
        normalizarTexto(obtenerNombreDia(horario.diaSemana)) === normalizarTexto(dia) &&
        formatearHora(horario.horaInicio) === partes[0] &&
        formatearHora(horario.horaFin) === partes[1]
      );
    });
  };

  const abrirEdicion = (horario) => {
    setHorarioEditando(horario);
    setFormulario({
      diaSemana: Number(horario.diaSemana),
      horaInicio: formatearHora(horario.horaInicio),
      horaFin: formatearHora(horario.horaFin)
    });
    setError("");
  };

  const cerrarEdicion = () => {
    if (guardando) {
      return;
    }

    setHorarioEditando(null);
    setError("");
  };

  const refrescarHorarioEnPantalla = (horarioActualizado) => {
    const modal = obtenerModalHorarios();
    if (!modal) {
      return;
    }

    const filas = Array.from(modal.querySelectorAll(".list-group-item"));

    filas.forEach((fila) => {
      const boton = fila.querySelector(
        `[data-horario-editar-id="${horarioActualizado.id}"]`
      );

      if (!boton) {
        return;
      }

      const nombreDia = fila.querySelector("strong");
      const horas = fila.querySelector("span");

      if (nombreDia) {
        nombreDia.textContent = obtenerNombreDia(horarioActualizado.diaSemana);
      }

      if (horas) {
        horas.textContent = `${formatearHora(horarioActualizado.horaInicio)} - ${formatearHora(horarioActualizado.horaFin)}`;
      }
    });
  };

  const guardarCambios = async (evento) => {
    evento.preventDefault();

    if (!horarioEditando || !contextoRef.current.profesionalId) {
      return;
    }

    if (formulario.horaFin <= formulario.horaInicio) {
      setError("La hora de salida debe ser posterior a la hora de entrada.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const response = await api.put(
        `/profesionales/${contextoRef.current.profesionalId}/horarios/${horarioEditando.id}`,
        {
          diaSemana: Number(formulario.diaSemana),
          horaInicio: `${formulario.horaInicio}:00`,
          horaFin: `${formulario.horaFin}:00`
        }
      );

      const actualizado = {
        ...horarioEditando,
        ...response.data,
        id: horarioEditando.id,
        diaSemana: Number(formulario.diaSemana),
        horaInicio: `${formulario.horaInicio}:00`,
        horaFin: `${formulario.horaFin}:00`
      };

      contextoRef.current.horarios = contextoRef.current.horarios.map((horario) =>
        horario.id === actualizado.id ? actualizado : horario
      );

      refrescarHorarioEnPantalla(actualizado);
      setHorarioEditando(null);
    } catch (errorGuardar) {
      setError(
        errorGuardar.response?.data?.mensaje ||
          "No fue posible actualizar el horario."
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminarHorario = async (horario, fila) => {
    if (!contextoRef.current.profesionalId) {
      return;
    }

    const confirmar = window.confirm(
      `¿Eliminar el horario de ${obtenerNombreDia(horario.diaSemana)} ${formatearHora(horario.horaInicio)} - ${formatearHora(horario.horaFin)}?`
    );

    if (!confirmar) {
      return;
    }

    try {
      await api.delete(
        `/profesionales/${contextoRef.current.profesionalId}/horarios/${horario.id}`
      );

      contextoRef.current.horarios = contextoRef.current.horarios.filter(
        (item) => item.id !== horario.id
      );

      fila.remove();
    } catch (errorEliminar) {
      window.alert(
        errorEliminar.response?.data?.mensaje ||
          "No fue posible eliminar el horario."
      );
    }
  };

  const agregarAcciones = async () => {
    const modal = obtenerModalHorarios();

    if (!modal) {
      contextoRef.current = {
        profesionalId: null,
        nombreProfesional: "",
        horarios: [],
        cargando: false
      };
      return;
    }

    await cargarContexto(modal);

    if (!contextoRef.current.profesionalId) {
      return;
    }

    const filas = Array.from(modal.querySelectorAll(".list-group-item"));

    filas.forEach((fila) => {
      if (fila.querySelector(".horario-editor-actions")) {
        return;
      }

      const horario = encontrarHorarioFila(fila);
      if (!horario) {
        return;
      }

      fila.classList.add("gap-2", "flex-wrap");

      const acciones = document.createElement("div");
      acciones.className = "horario-editor-actions d-flex gap-1 ms-auto";

      const editar = document.createElement("button");
      editar.type = "button";
      editar.className = "btn btn-outline-primary btn-sm";
      editar.setAttribute("aria-label", "Editar horario");
      editar.setAttribute("title", "Editar horario");
      editar.dataset.horarioEditarId = horario.id;
      editar.innerHTML = "✏️";
      editar.addEventListener("click", () => abrirEdicion(horario));

      const eliminar = document.createElement("button");
      eliminar.type = "button";
      eliminar.className = "btn btn-outline-danger btn-sm";
      eliminar.setAttribute("aria-label", "Eliminar horario");
      eliminar.setAttribute("title", "Eliminar horario");
      eliminar.innerHTML = "🗑️";
      eliminar.addEventListener("click", () => eliminarHorario(horario, fila));

      acciones.appendChild(editar);
      acciones.appendChild(eliminar);
      fila.appendChild(acciones);
    });
  };

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      agregarAcciones();
    }, 700);

    agregarAcciones();

    return () => {
      window.clearInterval(intervalo);
    };
  }, []);

  if (!horarioEditando) {
    return null;
  }

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{
        backgroundColor: "rgba(0,0,0,.55)",
        zIndex: 1080
      }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={guardarCambios}>
            <div className="modal-header">
              <div>
                <h5 className="modal-title">Editar horario</h5>
                <small className="text-muted">
                  Cambia el horario normal de atención.
                </small>
              </div>

              <button
                type="button"
                className="btn-close"
                onClick={cerrarEdicion}
                disabled={guardando}
              />
            </div>

            <div className="modal-body">
              {error && (
                <div className="alert alert-danger">{error}</div>
              )}

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Día</label>
                  <select
                    className="form-select"
                    value={formulario.diaSemana}
                    onChange={(e) =>
                      setFormulario((anterior) => ({
                        ...anterior,
                        diaSemana: Number(e.target.value)
                      }))
                    }
                  >
                    {DIAS_SEMANA.map((dia) => (
                      <option key={dia.valor} value={dia.valor}>
                        {dia.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-6">
                  <label className="form-label">Desde</label>
                  <input
                    type="time"
                    className="form-control"
                    value={formulario.horaInicio}
                    onChange={(e) =>
                      setFormulario((anterior) => ({
                        ...anterior,
                        horaInicio: e.target.value
                      }))
                    }
                    required
                  />
                </div>

                <div className="col-6">
                  <label className="form-label">Hasta</label>
                  <input
                    type="time"
                    className="form-control"
                    value={formulario.horaFin}
                    onChange={(e) =>
                      setFormulario((anterior) => ({
                        ...anterior,
                        horaFin: e.target.value
                      }))
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                onClick={cerrarEdicion}
                disabled={guardando}
              >
                <FaTimes className="me-2" />
                Cancelar
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={guardando}
              >
                <FaSave className="me-2" />
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default HorariosProfesionalEditor;
