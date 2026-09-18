import { useEffect, useMemo, useState } from "react";
import {
  FaBriefcase,
  FaCalendarAlt,
  FaClock,
  FaEdit,
  FaPlus,
  FaSearch,
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
  const [profesionales, setProfesionales] =
    useState([]);

  const [servicios, setServicios] =
    useState([]);

  const [sucursales, setSucursales] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  const [busqueda, setBusqueda] =
    useState("");

  const [
    mostrarFormulario,
    setMostrarFormulario
  ] = useState(false);

  const [
    profesionalEditando,
    setProfesionalEditando
  ] = useState(null);

  const [guardando, setGuardando] =
    useState(false);

  const [formulario, setFormulario] =
    useState({
      sucursalId: "",
      nombre: "",
      apellidos: "",
      telefono: "",
      email: "",
      especialidad: "",
      fotoUrl: "",
      servicioIds: [],
      activo: true
    });

  const [
    mostrarHorarios,
    setMostrarHorarios
  ] = useState(false);

  const [
    profesionalHorario,
    setProfesionalHorario
  ] = useState(null);

  const [horarios, setHorarios] =
    useState([]);

  const [
    cargandoHorarios,
    setCargandoHorarios
  ] = useState(false);

  const [
    guardandoHorario,
    setGuardandoHorario
  ] = useState(false);

  const [
    formularioHorario,
    setFormularioHorario
  ] = useState({
    diaSemana: 1,
    horaInicio: "08:00",
    horaFin: "17:00"
  });

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
        sucursalesResponse
          .data.length === 1
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

  const formularioVacio = () => ({
    sucursalId:
      sucursales.length === 1
        ? sucursales[0]
            .id
            .toString()
        : "",
    nombre: "",
    apellidos: "",
    telefono: "",
    email: "",
    especialidad: "",
    fotoUrl: "",
    servicioIds: [],
    activo: true
  });

  const abrirNuevoProfesional = () => {
    setProfesionalEditando(null);
    setFormulario(
      formularioVacio()
    );
    setError("");
    setMostrarFormulario(true);
  };

  const abrirEditarProfesional = (
    profesional
  ) => {
    setProfesionalEditando(
      profesional
    );

    setFormulario({
      sucursalId:
        profesional.sucursalId
          ?.toString() || "",
      nombre:
        profesional.nombre || "",
      apellidos:
        profesional.apellidos || "",
      telefono:
        profesional.telefono || "",
      email:
        profesional.email || "",
      especialidad:
        profesional.especialidad ||
        "",
      fotoUrl:
        profesional.fotoUrl || "",
      servicioIds:
        (
          profesional.servicios ||
          []
        ).map(
          (servicio) =>
            servicio.id
        ),
      activo:
        profesional.activo !== false
    });

    setError("");
    setMostrarFormulario(true);
  };

  const limpiarFormulario = () => {
    setFormulario(
      formularioVacio()
    );
  };

  const cerrarFormulario = () => {
    limpiarFormulario();
    setProfesionalEditando(null);
    setMostrarFormulario(false);
  };

  const cambiarCampo = (e) => {
    const {
      name,
      value,
      type,
      checked
    } = e.target;

    setFormulario(
      (anterior) => ({
        ...anterior,
        [name]:
          type === "checkbox"
            ? checked
            : value
      })
    );
  };

  const cambiarServicio = (
    servicioId
  ) => {
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

  const guardarProfesional =
    async (e) => {
      e.preventDefault();

      if (
        !formulario.nombre.trim()
      ) {
        setError(
          "El nombre es requerido."
        );
        return;
      }

      if (
        formulario
          .servicioIds
          .length === 0
      ) {
        setError(
          "Selecciona al menos un servicio."
        );
        return;
      }

      const payload = {
        sucursalId:
          formulario.sucursalId
            ? Number(
                formulario.sucursalId
              )
            : null,

        nombre:
          formulario.nombre.trim(),

        apellidos:
          formulario.apellidos
            .trim(),

        telefono:
          formulario.telefono
            .trim() || null,

        email:
          formulario.email
            .trim() || null,

        especialidad:
          formulario.especialidad
            .trim() || null,

        fotoUrl:
          formulario.fotoUrl
            .trim() || null,

        servicioIds:
          formulario.servicioIds
      };

      try {
        setGuardando(true);
        setError("");

        if (
          profesionalEditando
        ) {
          await api.put(
            `/Profesionales/${profesionalEditando.id}`,
            {
              ...payload,
              activo:
                Boolean(
                  formulario.activo
                )
            }
          );
        } else {
          await api.post(
            "/Profesionales",
            payload
          );
        }

        cerrarFormulario();

        await cargarDatos();
      } catch (error) {
        setError(
          error.response?.data?.mensaje ||
          (
            profesionalEditando
              ? "No fue posible actualizar el profesional."
              : "No fue posible crear el profesional."
          )
        );
      } finally {
        setGuardando(false);
      }
    };

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
        formularioHorario
          .horaFin <=
        formularioHorario
          .horaInicio
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
              formularioHorario
                .diaSemana,

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
            dia.valor ===
            diaSemana
        )?.nombre || "Día"
      );
    };

  const formatearHora =
    (hora) => {
      if (!hora) {
        return "";
      }

      const match = String(hora).match(
        /^(\d{1,2}):(\d{2})/
      );

      if (!match) {
        return hora;
      }

      const horas24 = Number(match[1]);
      const minutos = match[2];
      const periodo = horas24 >= 12 ? "PM" : "AM";
      const horas12 = horas24 % 12 || 12;

      return `${horas12}:${minutos} ${periodo}`;
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
          onClick={
            abrirNuevoProfesional
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
            {
              profesionalesFiltrados
                .length
            }{" "}
            profesional
            {
              profesionalesFiltrados
                .length !== 1
                ? "es"
                : ""
            }
          </div>
        </div>

        {cargando ? (
          <div className="empty-state">
            Cargando profesionales...
          </div>
        ) : profesionalesFiltrados
            .length === 0 ? (
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
                        {
                          profesional.apellidos
                        }
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
                          {
                            profesional.telefono
                          }
                        </span>
                      </div>
                    )}

                    {profesional.email && (
                      <div>
                        <strong>
                          Correo
                        </strong>

                        <span>
                          {
                            profesional.email
                          }
                        </span>
                      </div>
                    )}

                    {profesional.sucursal && (
                      <div>
                        <strong>
                          Sucursal
                        </strong>

                        <span>
                          {
                            profesional.sucursal
                          }
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
                          (
                            servicio
                          ) => (
                            <span
                              key={
                                servicio.id
                              }
                              className="professional-service-tag"
                            >
                              {
                                servicio.nombre
                              }
                            </span>
                          )
                        )
                      ) : (
                        <span className="text-muted small">
                          Sin servicios
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() =>
                        abrirEditarProfesional(
                          profesional
                        )
                      }
                    >
                      <FaEdit className="me-1" />
                      Editar
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() =>
                        abrirHorarios(
                          profesional
                        )
                      }
                    >
                      <FaClock className="me-1" />
                      Horarios
                    </button>
                  </div>

                  <div className="mt-3">
                    <BloqueosProfesional
                      profesional={
                        profesional
                      }
                    />
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {mostrarFormulario && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{
            backgroundColor: "rgba(0,0,0,.45)",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch"
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable my-3">
            <div className="modal-content" style={{ maxHeight: "calc(100dvh - 2rem)" }}>
              <form
                className="d-flex flex-column overflow-hidden"
                style={{ maxHeight: "calc(100dvh - 2rem)" }}
                onSubmit={
                  guardarProfesional
                }
              >
                <div className="modal-header">
                  <h5 className="modal-title">
                    {profesionalEditando
                      ? "Editar profesional"
                      : "Nuevo profesional"}
                  </h5>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={
                      cerrarFormulario
                    }
                  />
                </div>

                <div
                  className="modal-body"
                  style={{
                    overflowY: "auto",
                    WebkitOverflowScrolling: "touch"
                  }}
                >
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">
                        Nombre *
                      </label>

                      <input
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
                        name="email"
                        type="email"
                        className="form-control"
                        value={
                          formulario.email
                        }
                        onChange={
                          cambiarCampo
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Especialidad
                      </label>

                      <input
                        name="especialidad"
                        className="form-control"
                        value={
                          formulario.especialidad
                        }
                        onChange={
                          cambiarCampo
                        }
                      />
                    </div>

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
                          Sin sucursal
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
                              {
                                sucursal.nombre
                              }
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label">
                        URL de foto
                      </label>

                      <input
                        name="fotoUrl"
                        className="form-control"
                        value={
                          formulario.fotoUrl
                        }
                        onChange={
                          cambiarCampo
                        }
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label d-block">
                        Servicios *
                      </label>

                      <div className="row g-2">
                        {servicios
                          .filter(
                            (servicio) =>
                              servicio.activo ||
                              formulario
                                .servicioIds
                                .includes(
                                  servicio.id
                                )
                          )
                          .map(
                            (
                              servicio
                            ) => (
                              <div
                                className="col-md-6"
                                key={
                                  servicio.id
                                }
                              >
                                <div className="form-check border rounded p-3">
                                  <input
                                    id={`servicio-${servicio.id}`}
                                    className="form-check-input ms-0 me-2"
                                    type="checkbox"
                                    checked={
                                      formulario
                                        .servicioIds
                                        .includes(
                                          servicio.id
                                        )
                                    }
                                    onChange={() =>
                                      cambiarServicio(
                                        servicio.id
                                      )
                                    }
                                  />

                                  <label
                                    className="form-check-label"
                                    htmlFor={`servicio-${servicio.id}`}
                                  >
                                    {
                                      servicio.nombre
                                    }
                                    {!servicio.activo &&
                                      " (Inactivo)"}
                                  </label>
                                </div>
                              </div>
                            )
                          )}
                      </div>
                    </div>

                    {profesionalEditando && (
                      <div className="col-12">
                        <div className="form-check form-switch">
                          <input
                            id="profesionalActivo"
                            name="activo"
                            type="checkbox"
                            className="form-check-input"
                            checked={
                              formulario.activo
                            }
                            onChange={
                              cambiarCampo
                            }
                          />

                          <label
                            htmlFor="profesionalActivo"
                            className="form-check-label"
                          >
                            Profesional activo
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
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
                      : profesionalEditando
                        ? "Guardar cambios"
                        : "Crear profesional"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {mostrarHorarios &&
        profesionalHorario && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{
            backgroundColor:
              "rgba(0,0,0,.45)"
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title">
                    Horarios de{" "}
                    {
                      profesionalHorario.nombre
                    }{" "}
                    {
                      profesionalHorario.apellidos
                    }
                  </h5>

                  <small className="text-muted">
                    Define los horarios normales de atención.
                  </small>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={
                    cerrarHorarios
                  }
                />
              </div>

              <div className="modal-body">
                <form
                  className="row g-3 align-items-end mb-4"
                  onSubmit={
                    guardarHorario
                  }
                >
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
                            {
                              dia.nombre
                            }
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
                      name="horaInicio"
                      type="time"
                      className="form-control"
                      value={
                        formularioHorario.horaInicio
                      }
                      onChange={
                        cambiarCampoHorario
                      }
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">
                      Hasta
                    </label>

                    <input
                      name="horaFin"
                      type="time"
                      className="form-control"
                      value={
                        formularioHorario.horaFin
                      }
                      onChange={
                        cambiarCampoHorario
                      }
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
                      <FaPlus />
                    </button>
                  </div>
                </form>

                <div className="professional-section-title mb-3">
                  <FaCalendarAlt />

                  <span>
                    Horarios registrados
                  </span>
                </div>

                {cargandoHorarios ? (
                  <div className="text-muted">
                    Cargando horarios...
                  </div>
                ) : horariosOrdenados
                    .length === 0 ? (
                  <div className="text-muted">
                    No hay horarios registrados.
                  </div>
                ) : (
                  <div className="list-group">
                    {horariosOrdenados.map(
                      (horario) => (
                        <div
                          key={
                            horario.id
                          }
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <strong>
                            {obtenerNombreDia(
                              horario.diaSemana
                            )}
                          </strong>

                          <span>
                            {formatearHora(
                              horario.horaInicio
                            )}{" "}
                            -{" "}
                            {formatearHora(
                              horario.horaFin
                            )}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={
                    cerrarHorarios
                  }
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profesionales;
