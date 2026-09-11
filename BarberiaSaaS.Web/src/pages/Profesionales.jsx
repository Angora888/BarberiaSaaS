import { useEffect, useMemo, useState } from "react";
import {
  FaBriefcase,
  FaCalendarAlt,
  FaClock,
  FaPlus,
  FaSearch,
  FaTimes,
  FaUserTie
} from "react-icons/fa";

import api from "../services/api";
import BloqueosProfesional from "../components/BloqueosProfesional";

const DIAS_SEMANA = [
  { valor: 1, nombre: "Lunes" },
  { valor: 2, nombre: "Martes" },
  { valor: 3, nombre: "Miércoles" },
  { valor: 4, nombre: "Jueves" },
  { valor: 5, nombre: "Viernes" },
  { valor: 6, nombre: "Sábado" },
  { valor: 0, nombre: "Domingo" }
];

function Profesionales() {
  const [profesionales, setProfesionales] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [guardando, setGuardando] = useState(false);

  const [formulario, setFormulario] = useState({
    sucursalId: "",
    nombre: "",
    apellidos: "",
    telefono: "",
    email: "",
    especialidad: "",
    fotoUrl: "",
    servicioIds: []
  });

  const [mostrarHorarios, setMostrarHorarios] =
    useState(false);

  const [profesionalHorario, setProfesionalHorario] =
    useState(null);

  const [horarios, setHorarios] =
    useState([]);

  const [cargandoHorarios, setCargandoHorarios] =
    useState(false);

  const [guardandoHorario, setGuardandoHorario] =
    useState(false);

  const [formularioHorario, setFormularioHorario] =
    useState({
      diaSemana: 1,
      horaInicio: "08:00",
      horaFin: "17:00"
    });

  // ============================================================
  // CARGA INICIAL
  // ============================================================

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const [
        profesionalesResponse,
        serviciosResponse,
        sucursalesResponse
      ] = await Promise.all([
        api.get("/Profesionales"),
        api.get("/Servicios"),
        api.get("/Sucursales")
      ]);

      setProfesionales(
        profesionalesResponse.data
      );

      setServicios(
        serviciosResponse.data
      );

      setSucursales(
        sucursalesResponse.data
      );

      if (
        sucursalesResponse.data.length === 1
      ) {
        setFormulario(
          (anterior) => ({
            ...anterior,
            sucursalId:
              sucursalesResponse
                .data[0]
                .id
                .toString()
          })
        );
      }
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
          "No fue posible cargar los profesionales."
      );
    } finally {
      setCargando(false);
    }
  };

  // ============================================================
  // BUSCADOR
  // ============================================================

  const profesionalesFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return profesionales;
      }

      return profesionales.filter(
        (profesional) => {
          const nombreCompleto =
            `${profesional.nombre} ${profesional.apellidos || ""}`
              .toLowerCase();

          return (
            nombreCompleto.includes(
              texto
            ) ||
            profesional.especialidad
              ?.toLowerCase()
              .includes(texto) ||
            profesional.telefono
              ?.toLowerCase()
              .includes(texto) ||
            profesional.email
              ?.toLowerCase()
              .includes(texto)
          );
        }
      );
    }, [
      profesionales,
      busqueda
    ]);

  // ============================================================
  // PROFESIONAL
  // ============================================================

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

  const cambiarServicio =
    (servicioId) => {
      setFormulario(
        (anterior) => {
          const existe =
            anterior.servicioIds.includes(
              servicioId
            );

          return {
            ...anterior,

            servicioIds: existe
              ? anterior.servicioIds.filter(
                  (id) =>
                    id !== servicioId
                )
              : [
                  ...anterior.servicioIds,
                  servicioId
                ]
          };
        }
      );
    };

  const limpiarFormulario = () => {
    setFormulario({
      sucursalId:
        sucursales.length === 1
          ? sucursales[0].id.toString()
          : "",

      nombre: "",
      apellidos: "",
      telefono: "",
      email: "",
      especialidad: "",
      fotoUrl: "",
      servicioIds: []
    });
  };

  const cerrarFormulario = () => {
    limpiarFormulario();

    setMostrarFormulario(false);
  };

  const guardarProfesional =
    async (e) => {
      e.preventDefault();

      if (!formulario.nombre.trim()) {
        setError(
          "El nombre es requerido."
        );

        return;
      }

      if (
        formulario.servicioIds.length === 0
      ) {
        setError(
          "Selecciona al menos un servicio."
        );

        return;
      }

      try {
        setGuardando(true);
        setError("");

        await api.post(
          "/Profesionales",
          {
            sucursalId:
              formulario.sucursalId
                ? Number(
                    formulario.sucursalId
                  )
                : null,

            nombre:
              formulario.nombre,

            apellidos:
              formulario.apellidos,

            telefono:
              formulario.telefono ||
              null,

            email:
              formulario.email ||
              null,

            especialidad:
              formulario.especialidad ||
              null,

            fotoUrl:
              formulario.fotoUrl ||
              null,

            servicioIds:
              formulario.servicioIds
          }
        );

        cerrarFormulario();

        await cargarDatos();
      } catch (error) {
        setError(
          error.response?.data?.mensaje ||
            "No fue posible crear el profesional."
        );
      } finally {
        setGuardando(false);
      }
    };

  // ============================================================
  // HORARIOS
  // ============================================================

  const abrirHorarios =
    async (profesional) => {
      setProfesionalHorario(
        profesional
      );

      setMostrarHorarios(true);

      await cargarHorarios(
        profesional.id
      );
    };

  const cargarHorarios =
    async (profesionalId) => {
      try {
        setCargandoHorarios(true);
        setError("");

        const response =
          await api.get(
            `/profesionales/${profesionalId}/horarios`
          );

        setHorarios(
          response.data
        );
      } catch (error) {
        setError(
          error.response?.data?.mensaje ||
            "No fue posible cargar los horarios."
        );
      } finally {
        setCargandoHorarios(false);
      }
    };

  const cerrarHorarios = () => {
    setMostrarHorarios(false);

    setProfesionalHorario(null);

    setHorarios([]);

    setFormularioHorario({
      diaSemana: 1,
      horaInicio: "08:00",
      horaFin: "17:00"
    });
  };

  const cambiarCampoHorario =
    (e) => {
      const {
        name,
        value
      } = e.target;

      setFormularioHorario(
        (anterior) => ({
          ...anterior,

          [name]:
            name === "diaSemana"
              ? Number(value)
              : value
        })
      );
    };

  const guardarHorario =
    async (e) => {
      e.preventDefault();

      if (!profesionalHorario) {
        return;
      }

      if (
        formularioHorario.horaFin <=
        formularioHorario.horaInicio
      ) {
        setError(
          "La hora de salida debe ser posterior a la hora de entrada."
        );

        return;
      }

      try {
        setGuardandoHorario(true);
        setError("");

        await api.post(
          `/profesionales/${profesionalHorario.id}/horarios`,
          {
            diaSemana:
              formularioHorario.diaSemana,

            horaInicio:
              `${formularioHorario.horaInicio}:00`,

            horaFin:
              `${formularioHorario.horaFin}:00`
          }
        );

        await cargarHorarios(
          profesionalHorario.id
        );

        setFormularioHorario(
          (anterior) => ({
            ...anterior,
            horaInicio: "08:00",
            horaFin: "17:00"
          })
        );
      } catch (error) {
        setError(
          error.response?.data?.mensaje ||
            "No fue posible guardar el horario."
        );
      } finally {
        setGuardandoHorario(false);
      }
    };

  const obtenerNombreDia =
    (diaSemana) => {
      return (
        DIAS_SEMANA.find(
          (dia) =>
            dia.valor === diaSemana
        )?.nombre || "Día"
      );
    };

  const formatearHora =
    (hora) => {
      if (!hora) {
        return "";
      }

      return hora.substring(
        0,
        5
      );
    };

  const horariosOrdenados =
    useMemo(() => {
      const orden =
        [1, 2, 3, 4, 5, 6, 0];

      return [...horarios].sort(
        (a, b) => {
          const diaA =
            orden.indexOf(
              a.diaSemana
            );

          const diaB =
            orden.indexOf(
              b.diaSemana
            );

          if (diaA !== diaB) {
            return diaA - diaB;
          }

          return a.horaInicio
            .localeCompare(
              b.horaInicio
            );
        }
      );
    }, [horarios]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div>

      <div className="page-header">

        <div>

          <h1 className="page-title">
            Profesionales
          </h1>

          <p className="text-muted mb-0">
            Administra profesionales,
            servicios, horarios y
            ausencias.
          </p>

        </div>

        <button
          className="btn btn-primary"
          onClick={() =>
            setMostrarFormulario(true)
          }
        >
          <FaPlus className="me-2" />

          Nuevo profesional
        </button>

      </div>

      {error && (
        <div className="alert alert-danger mt-4">
          {error}
        </div>
      )}

      <div className="content-card mt-4">

        <div className="client-toolbar">

          <div className="search-box">

            <FaSearch />

            <input
              type="text"
              placeholder="Buscar profesional..."
              value={busqueda}
              onChange={(e) =>
                setBusqueda(
                  e.target.value
                )
              }
            />

          </div>

          <div className="text-muted">

            {profesionalesFiltrados.length}{" "}
            profesional
            {profesionalesFiltrados.length !== 1
              ? "es"
              : ""}

          </div>

        </div>

        {cargando ? (

          <div className="empty-state">
            Cargando profesionales...
          </div>

        ) : profesionalesFiltrados.length === 0 ? (

          <div className="empty-state">

            <FaUserTie size={32} />

            <h5 className="mt-3">
              No hay profesionales
            </h5>

            <p>
              Registra la primera persona
              que brindará servicios.
            </p>

          </div>

        ) : (

          <div className="professional-grid">

            {profesionalesFiltrados.map(
              (profesional) => (

                <div
                  className="professional-card"
                  key={
                    profesional.id
                  }
                >

                  <div className="professional-header">

                    {profesional.fotoUrl ? (

                      <img
                        src={
                          profesional.fotoUrl
                        }
                        alt={
                          profesional.nombre
                        }
                        className="professional-avatar-image"
                      />

                    ) : (

                      <div className="professional-avatar">

                        {profesional.nombre
                          ?.charAt(0)
                          .toUpperCase()}

                      </div>

                    )}

                    <div className="professional-info">

                      <h5>
                        {profesional.nombre}{" "}
                        {profesional.apellidos}
                      </h5>

                      <span>
                        {profesional.especialidad ||
                          "Profesional"}
                      </span>

                    </div>

                    <span
                      className={
                        profesional.activo
                          ? "service-status active"
                          : "service-status"
                      }
                    >
                      {profesional.activo
                        ? "Activo"
                        : "Inactivo"}
                    </span>

                  </div>

                  <div className="professional-contact">

                    {profesional.telefono && (

                      <div>

                        <strong>
                          Teléfono
                        </strong>

                        <span>
                          {profesional.telefono}
                        </span>

                      </div>

                    )}

                    {profesional.email && (

                      <div>

                        <strong>
                          Correo
                        </strong>

                        <span>
                          {profesional.email}
                        </span>

                      </div>

                    )}

                  </div>

                  <div className="professional-services">

                    <div className="professional-section-title">

                      <FaBriefcase />

                      <span>
                        Servicios
                      </span>

                    </div>

                    <div className="professional-service-tags">

                      {profesional.servicios
                        ?.length > 0 ? (

                        profesional.servicios.map(
                          (servicio) => (

                            <span
                              className="professional-service-tag"
                              key={
                                servicio.id
                              }
                            >
                              {servicio.nombre}
                            </span>

                          )
                        )

                      ) : (

                        <span className="text-muted small">
                          Sin servicios asignados.
                        </span>

                      )}

                    </div>

                  </div>

                  <div className="professional-card-actions">

                    <button
                      className="btn btn-light w-100"
                      onClick={() =>
                        abrirHorarios(
                          profesional
                        )
                      }
                    >
                      <FaCalendarAlt className="me-2" />

                      Horario y ausencias
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* NUEVO PROFESIONAL */}

      {mostrarFormulario && (

        <div className="custom-modal-backdrop">

          <div className="custom-modal custom-modal-large">

            <div className="custom-modal-header">

              <div>

                <h4>
                  Nuevo profesional
                </h4>

                <p className="text-muted mb-0">
                  Registra la información y
                  selecciona los servicios
                  que realiza.
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  cerrarFormulario
                }
              >
                <FaTimes />
              </button>

            </div>

            <form
              onSubmit={
                guardarProfesional
              }
            >

              <div className="custom-modal-body">

                <div className="row g-3">

                  <div className="col-md-6">

                    <label className="form-label">
                      Sucursal
                    </label>

                    <select
                      name="sucursalId"
                      className="form-select"
                      value={
                        formulario.sucursalId
                      }
                      onChange={
                        cambiarCampo
                      }
                    >

                      <option value="">
                        Sin sucursal específica
                      </option>

                      {sucursales.map(
                        (sucursal) => (

                          <option
                            key={
                              sucursal.id
                            }
                            value={
                              sucursal.id
                            }
                          >
                            {sucursal.nombre}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                  <div className="col-md-6">

                    <label className="form-label">
                      Especialidad
                    </label>

                    <input
                      type="text"
                      name="especialidad"
                      className="form-control"
                      value={
                        formulario.especialidad
                      }
                      onChange={
                        cambiarCampo
                      }
                      placeholder="Ej. Colorista"
                    />

                  </div>

                  <div className="col-md-6">

                    <label className="form-label">
                      Nombre *
                    </label>

                    <input
                      type="text"
                      name="nombre"
                      className="form-control"
                      value={
                        formulario.nombre
                      }
                      onChange={
                        cambiarCampo
                      }
                      required
                    />

                  </div>

                  <div className="col-md-6">

                    <label className="form-label">
                      Apellidos
                    </label>

                    <input
                      type="text"
                      name="apellidos"
                      className="form-control"
                      value={
                        formulario.apellidos
                      }
                      onChange={
                        cambiarCampo
                      }
                    />

                  </div>

                  <div className="col-md-6">

                    <label className="form-label">
                      Teléfono
                    </label>

                    <input
                      type="text"
                      name="telefono"
                      className="form-control"
                      value={
                        formulario.telefono
                      }
                      onChange={
                        cambiarCampo
                      }
                    />

                  </div>

                  <div className="col-md-6">

                    <label className="form-label">
                      Correo
                    </label>

                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={
                        formulario.email
                      }
                      onChange={
                        cambiarCampo
                      }
                    />

                  </div>

                  <div className="col-12">

                    <label className="form-label">
                      URL de fotografía
                    </label>

                    <input
                      type="url"
                      name="fotoUrl"
                      className="form-control"
                      value={
                        formulario.fotoUrl
                      }
                      onChange={
                        cambiarCampo
                      }
                      placeholder="https://..."
                    />

                  </div>

                  <div className="col-12">

                    <div className="professional-form-services-header">

                      <label className="form-label mb-0">
                        Servicios *
                      </label>

                      <span className="text-muted small">

                        {formulario.servicioIds.length} seleccionado
                        {formulario.servicioIds.length !== 1
                          ? "s"
                          : ""}

                      </span>

                    </div>

                    <div className="professional-service-selector">

                      {servicios.map(
                        (servicio) => {

                          const seleccionado =
                            formulario.servicioIds
                              .includes(
                                servicio.id
                              );

                          return (

                            <label
                              key={
                                servicio.id
                              }
                              className={
                                seleccionado
                                  ? "service-select-card selected"
                                  : "service-select-card"
                              }
                            >

                              <input
                                type="checkbox"
                                checked={
                                  seleccionado
                                }
                                onChange={() =>
                                  cambiarServicio(
                                    servicio.id
                                  )
                                }
                              />

                              <div>

                                <strong>
                                  {servicio.nombre}
                                </strong>

                                <span>
                                  {servicio.duracionMinutos} min
                                </span>

                              </div>

                            </label>

                          );
                        }
                      )}

                    </div>

                  </div>

                </div>

              </div>

              <div className="custom-modal-footer">

                <button
                  type="button"
                  className="btn btn-light"
                  onClick={
                    cerrarFormulario
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    guardando
                  }
                >
                  {guardando
                    ? "Guardando..."
                    : "Guardar profesional"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* HORARIOS Y BLOQUEOS */}

      {mostrarHorarios &&
        profesionalHorario && (

          <div className="custom-modal-backdrop">

            <div className="custom-modal custom-modal-large">

              <div className="custom-modal-header">

                <div>

                  <h4>
                    {profesionalHorario.nombre}{" "}
                    {profesionalHorario.apellidos}
                  </h4>

                  <p className="text-muted mb-0">
                    Horario laboral y períodos
                    no disponibles.
                  </p>

                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={
                    cerrarHorarios
                  }
                >
                  <FaTimes />
                </button>

              </div>

              <div className="custom-modal-body">

                <div className="schedule-form-card">

                  <h6>
                    Agregar horario
                  </h6>

                  <form
                    onSubmit={
                      guardarHorario
                    }
                  >

                    <div className="row g-3 align-items-end">

                      <div className="col-md-4">

                        <label className="form-label">
                          Día
                        </label>

                        <select
                          name="diaSemana"
                          className="form-select"
                          value={
                            formularioHorario.diaSemana
                          }
                          onChange={
                            cambiarCampoHorario
                          }
                        >

                          {DIAS_SEMANA.map(
                            (dia) => (

                              <option
                                key={
                                  dia.valor
                                }
                                value={
                                  dia.valor
                                }
                              >
                                {dia.nombre}
                              </option>

                            )
                          )}

                        </select>

                      </div>

                      <div className="col-md-3">

                        <label className="form-label">
                          Desde
                        </label>

                        <input
                          type="time"
                          name="horaInicio"
                          className="form-control"
                          value={
                            formularioHorario.horaInicio
                          }
                          onChange={
                            cambiarCampoHorario
                          }
                          required
                        />

                      </div>

                      <div className="col-md-3">

                        <label className="form-label">
                          Hasta
                        </label>

                        <input
                          type="time"
                          name="horaFin"
                          className="form-control"
                          value={
                            formularioHorario.horaFin
                          }
                          onChange={
                            cambiarCampoHorario
                          }
                          required
                        />

                      </div>

                      <div className="col-md-2">

                        <button
                          type="submit"
                          className="btn btn-primary w-100"
                          disabled={
                            guardandoHorario
                          }
                        >
                          {guardandoHorario
                            ? "..."
                            : "Agregar"}
                        </button>

                      </div>

                    </div>

                  </form>

                </div>

                <div className="schedule-section">

                  <div className="schedule-section-title">

                    <FaClock />

                    <span>
                      Horario semanal
                    </span>

                  </div>

                  {cargandoHorarios ? (

                    <div className="empty-state">
                      Cargando horarios...
                    </div>

                  ) : horariosOrdenados.length === 0 ? (

                    <div className="schedule-empty">

                      <FaCalendarAlt size={28} />

                      <strong>
                        Sin horario configurado
                      </strong>

                    </div>

                  ) : (

                    <div className="schedule-list">

                      {horariosOrdenados.map(
                        (horario) => (

                          <div
                            className="schedule-row"
                            key={
                              horario.id
                            }
                          >

                            <div className="schedule-day">

                              {obtenerNombreDia(
                                horario.diaSemana
                              )}

                            </div>

                            <div className="schedule-time">

                              <FaClock />

                              <span>
                                {formatearHora(
                                  horario.horaInicio
                                )}
                                {" — "}
                                {formatearHora(
                                  horario.horaFin
                                )}
                              </span>

                            </div>

                            <span className="service-status active">
                              Activo
                            </span>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </div>

                <hr className="my-4" />

                <BloqueosProfesional
                  profesional={
                    profesionalHorario
                  }
                />

              </div>

              <div className="custom-modal-footer">

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={
                    cerrarHorarios
                  }
                >
                  Listo
                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}

export default Profesionales;