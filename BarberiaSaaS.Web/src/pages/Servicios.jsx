import { useEffect, useMemo, useState } from "react";
import {
  FaClock,
  FaPlus,
  FaSearch,
  FaTimes
} from "react-icons/fa";
import api from "../services/api";
import {
  useConfiguracion
} from "../context/ConfiguracionContext";

function Servicios() {
  const {
    formatearMoneda
  } = useConfiguracion();

  const [servicios, setServicios] =
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

  const [guardando, setGuardando] =
    useState(false);

  const [formulario, setFormulario] =
    useState({
      nombre: "",
      descripcion: "",
      precio: ""
    });

  useEffect(() => {
    cargarServicios();
  }, []);

  // ============================================================
  // CARGAR SERVICIOS
  // ============================================================

  const cargarServicios = async () => {
    try {
      setCargando(true);
      setError("");

      const response =
        await api.get("/Servicios");

      setServicios(response.data);
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        "No fue posible cargar los servicios."
      );
    } finally {
      setCargando(false);
    }
  };

  // ============================================================
  // BUSCADOR
  // ============================================================

  const serviciosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return servicios;
      }

      return servicios.filter(
        (servicio) => {
          return (
            servicio.nombre
              ?.toLowerCase()
              .includes(texto) ||
            servicio.descripcion
              ?.toLowerCase()
              .includes(texto)
          );
        }
      );
    }, [servicios, busqueda]);

  // ============================================================
  // FORMULARIO
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

  const limpiarFormulario = () => {
    setFormulario({
      nombre: "",
      descripcion: "",
      precio: ""
    });
  };

  const cerrarFormulario = () => {
    limpiarFormulario();
    setMostrarFormulario(false);
  };

  // ============================================================
  // CREAR SERVICIO
  // ============================================================

  const guardarServicio = async (
    e
  ) => {
    e.preventDefault();

    if (
      !formulario.nombre.trim()
    ) {
      setError(
        "El nombre del servicio es requerido."
      );

      return;
    }

    const precio =
      Number(formulario.precio);

    if (
      Number.isNaN(precio) ||
      precio < 0
    ) {
      setError(
        "El precio no es válido."
      );

      return;
    }

    try {
      setGuardando(true);
      setError("");

      await api.post(
        "/Servicios",
        {
          nombre:
            formulario.nombre,

          descripcion:
            formulario.descripcion ||
            null,

          precio
        }
      );

      cerrarFormulario();

      await cargarServicios();
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        "No fue posible crear el servicio."
      );
    } finally {
      setGuardando(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div>

      {/* HEADER */}

      <div className="page-header">

        <div>
          <h1 className="page-title">
            Servicios
          </h1>

          <p className="text-muted mb-0">
            Administra los servicios
            ofrecidos por el negocio.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() =>
            setMostrarFormulario(true)
          }
        >
          <FaPlus className="me-2" />

          Nuevo servicio
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="alert alert-danger mt-4">
          {error}
        </div>
      )}

      {/* CONTENIDO */}

      <div className="content-card mt-4">

        <div className="client-toolbar">

          <div className="search-box">

            <FaSearch />

            <input
              type="text"
              placeholder="Buscar servicio..."
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
              serviciosFiltrados
                .length
            }{" "}
            servicio
            {
              serviciosFiltrados
                .length !== 1
                ? "s"
                : ""
            }
          </div>

        </div>

        {cargando ? (

          <div className="empty-state">
            Cargando servicios...
          </div>

        ) : serviciosFiltrados
            .length === 0 ? (

          <div className="empty-state">

            <FaClock size={32} />

            <h5 className="mt-3">
              No hay servicios
            </h5>

            <p>
              Registra el primer
              servicio del negocio.
            </p>

          </div>

        ) : (

          <div className="service-grid">

            {serviciosFiltrados.map(
              (servicio) => (

                <div
                  className="service-card"
                  key={servicio.id}
                >

                  <div className="service-card-top">

                    <div className="service-icon">
                      <FaClock />
                    </div>

                    <span
                      className={
                        servicio.activo
                          ? "service-status active"
                          : "service-status"
                      }
                    >
                      {servicio.activo
                        ? "Activo"
                        : "Inactivo"}
                    </span>

                  </div>

                  <h5>
                    {servicio.nombre}
                  </h5>

                  <p className="service-description">
                    {servicio.descripcion ||
                      "Sin descripción"}
                  </p>

                  <div className="service-footer">

                    <strong>
                      {formatearMoneda(
                        servicio.precio
                      )}
                    </strong>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* ============================================================
          MODAL
          ============================================================ */}

      {mostrarFormulario && (

        <div className="custom-modal-backdrop">

          <div className="custom-modal">

            <div className="custom-modal-header">

              <div>

                <h4>
                  Nuevo servicio
                </h4>

                <p className="text-muted mb-0">
                  Agrega un servicio
                  al catálogo.
                </p>

              </div>

              <button
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
                guardarServicio
              }
            >

              <div className="custom-modal-body">

                <div className="row g-3">

                  {/* NOMBRE */}

                  <div className="col-12">

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
                      placeholder="Ej. Balayage"
                      required
                    />

                  </div>

                  {/* DESCRIPCIÓN */}

                  <div className="col-12">

                    <label className="form-label">
                      Descripción
                    </label>

                    <textarea
                      name="descripcion"
                      className="form-control"
                      rows="3"
                      value={
                        formulario
                          .descripcion
                      }
                      onChange={
                        cambiarCampo
                      }
                      placeholder="Descripción del servicio..."
                    />

                  </div>

                  {/* PRECIO */}

                  <div className="col-12">

                    <label className="form-label">
                      Precio *
                    </label>

                    <input
                      type="number"
                      name="precio"
                      className="form-control"
                      value={
                        formulario.precio
                      }
                      onChange={
                        cambiarCampo
                      }
                      min="0"
                      step="1"
                      placeholder="15000"
                      required
                    />

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
                    : "Guardar servicio"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Servicios;