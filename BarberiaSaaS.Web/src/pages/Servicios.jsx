import { useEffect, useMemo, useState } from "react";
import {
  FaClock,
  FaPlus,
  FaSearch,
  FaTimes,
  FaTrash
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

  const [
    mostrarVariantes,
    setMostrarVariantes
  ] = useState(false);

  const [
    servicioVariantes,
    setServicioVariantes
  ] = useState(null);

  const [guardando, setGuardando] =
    useState(false);

  const [
    guardandoVariantes,
    setGuardandoVariantes
  ] = useState(false);

  const [formulario, setFormulario] =
    useState({
      nombre: "",
      descripcion: "",
      precio: "",
      variantes: []
    });

  const [
    variantesEdicion,
    setVariantesEdicion
  ] = useState([]);

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
          const coincideVariante =
            servicio.variantes
              ?.some(
                (variante) =>
                  variante.nombre
                    ?.toLowerCase()
                    .includes(texto)
              ) || false;

          return (
            servicio.nombre
              ?.toLowerCase()
              .includes(texto) ||
            servicio.descripcion
              ?.toLowerCase()
              .includes(texto) ||
            coincideVariante
          );
        }
      );
    }, [servicios, busqueda]);

  // ============================================================
  // HELPERS
  // ============================================================

  const variantesActivas = (
    servicio
  ) => {
    return (
      servicio.variantes?.filter(
        (variante) =>
          variante.activo
      ) || []
    );
  };

  const obtenerPrecioDesde = (
    servicio
  ) => {
    const activas =
      variantesActivas(servicio);

    if (activas.length === 0) {
      return Number(
        servicio.precio || 0
      );
    }

    return Math.min(
      ...activas.map(
        (variante) =>
          Number(
            variante.precio || 0
          )
      )
    );
  };

  // ============================================================
  // FORMULARIO NUEVO SERVICIO
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

  const agregarVarianteNueva = () => {
    setFormulario(
      (anterior) => ({
        ...anterior,
        variantes: [
          ...anterior.variantes,
          {
            nombre: "",
            precio: "",
            orden:
              anterior.variantes.length
          }
        ]
      })
    );
  };

  const cambiarVarianteNueva = (
    indice,
    campo,
    valor
  ) => {
    setFormulario(
      (anterior) => ({
        ...anterior,
        variantes:
          anterior.variantes.map(
            (variante, i) =>
              i === indice
                ? {
                    ...variante,
                    [campo]: valor
                  }
                : variante
          )
      })
    );
  };

  const eliminarVarianteNueva = (
    indice
  ) => {
    setFormulario(
      (anterior) => ({
        ...anterior,
        variantes:
          anterior.variantes
            .filter(
              (_, i) =>
                i !== indice
            )
            .map(
              (variante, i) => ({
                ...variante,
                orden: i
              })
            )
      })
    );
  };

  const limpiarFormulario = () => {
    setFormulario({
      nombre: "",
      descripcion: "",
      precio: "",
      variantes: []
    });
  };

  const cerrarFormulario = () => {
    limpiarFormulario();
    setMostrarFormulario(false);
  };

  // ============================================================
  // CREAR SERVICIO + VARIANTES
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

    const variantesValidas =
      formulario.variantes.filter(
        (variante) =>
          variante.nombre.trim()
      );

    for (
      const variante of
      variantesValidas
    ) {
      const precioVariante =
        Number(variante.precio);

      if (
        Number.isNaN(
          precioVariante
        ) ||
        precioVariante < 0
      ) {
        setError(
          `El precio de la variante "${variante.nombre}" no es válido.`
        );

        return;
      }
    }

    let precioServicio;

    if (
      variantesValidas.length > 0
    ) {
      precioServicio =
        Math.min(
          ...variantesValidas.map(
            (variante) =>
              Number(
                variante.precio
              )
          )
        );
    } else {
      precioServicio =
        Number(formulario.precio);

      if (
        Number.isNaN(
          precioServicio
        ) ||
        precioServicio < 0
      ) {
        setError(
          "El precio del servicio no es válido."
        );

        return;
      }
    }

    try {
      setGuardando(true);
      setError("");

      const responseServicio =
        await api.post(
          "/Servicios",
          {
            nombre:
              formulario.nombre,

            descripcion:
              formulario.descripcion ||
              null,

            precio:
              precioServicio
          }
        );

      const servicioId =
        responseServicio.data.id;

      for (
        let i = 0;
        i <
        variantesValidas.length;
        i += 1
      ) {
        const variante =
          variantesValidas[i];

        await api.post(
          `/Servicios/${servicioId}/variantes`,
          {
            nombre:
              variante.nombre.trim(),

            precio:
              Number(
                variante.precio
              ),

            orden:
              Number(
                variante.orden ?? i
              )
          }
        );
      }

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
  // ADMINISTRAR VARIANTES
  // ============================================================

  const abrirVariantes = (
    servicio
  ) => {
    setServicioVariantes(
      servicio
    );

    setVariantesEdicion(
      (servicio.variantes || [])
        .map(
          (variante) => ({
            id:
              variante.id,

            nombre:
              variante.nombre,

            precio:
              variante.precio
                ?.toString() ??
              "",

            orden:
              variante.orden ?? 0,

            activo:
              variante.activo,

            esNueva:
              false
          })
        )
    );

    setMostrarVariantes(true);
    setError("");
  };

  const cerrarVariantes = () => {
    setMostrarVariantes(false);
    setServicioVariantes(null);
    setVariantesEdicion([]);
  };

  const agregarVarianteEdicion = () => {
    setVariantesEdicion(
      (anterior) => [
        ...anterior,
        {
          id: null,
          nombre: "",
          precio: "",
          orden:
            anterior.length,
          activo: true,
          esNueva: true
        }
      ]
    );
  };

  const cambiarVarianteEdicion = (
    indice,
    campo,
    valor
  ) => {
    setVariantesEdicion(
      (anterior) =>
        anterior.map(
          (variante, i) =>
            i === indice
              ? {
                  ...variante,
                  [campo]: valor
                }
              : variante
        )
    );
  };

  const quitarVarianteNuevaEdicion =
    (indice) => {
      setVariantesEdicion(
        (anterior) =>
          anterior.filter(
            (_, i) =>
              i !== indice
          )
      );
    };

  const guardarCambiosVariantes =
    async (e) => {
      e.preventDefault();

      if (!servicioVariantes) {
        return;
      }

      for (
        const variante of
        variantesEdicion
      ) {
        if (
          !variante.nombre.trim()
        ) {
          setError(
            "Todas las variantes deben tener nombre."
          );

          return;
        }

        const precio =
          Number(variante.precio);

        if (
          Number.isNaN(precio) ||
          precio < 0
        ) {
          setError(
            `El precio de "${variante.nombre}" no es válido.`
          );

          return;
        }
      }

      try {
        setGuardandoVariantes(
          true
        );

        setError("");

        for (
          let i = 0;
          i <
          variantesEdicion.length;
          i += 1
        ) {
          const variante =
            variantesEdicion[i];

          if (
            variante.esNueva
          ) {
            await api.post(
              `/Servicios/${servicioVariantes.id}/variantes`,
              {
                nombre:
                  variante.nombre.trim(),

                precio:
                  Number(
                    variante.precio
                  ),

                orden:
                  Number(
                    variante.orden ??
                    i
                  )
              }
            );
          } else {
            await api.put(
              `/Servicios/${servicioVariantes.id}/variantes/${variante.id}`,
              {
                nombre:
                  variante.nombre.trim(),

                precio:
                  Number(
                    variante.precio
                  ),

                orden:
                  Number(
                    variante.orden ??
                    i
                  ),

                activo:
                  Boolean(
                    variante.activo
                  )
              }
            );
          }
        }

        cerrarVariantes();

        await cargarServicios();
      } catch (error) {
        setError(
          error.response?.data?.mensaje ||
          "No fue posible guardar las variantes."
        );
      } finally {
        setGuardandoVariantes(
          false
        );
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
              (servicio) => {
                const activas =
                  variantesActivas(
                    servicio
                  );

                return (
                  <div
                    className="service-card"
                    key={
                      servicio.id
                    }
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

                    {activas.length > 0 && (
                      <div className="mb-3">

                        <div className="small text-muted mb-2">
                          Variantes
                        </div>

                        <div className="d-flex flex-column gap-2">

                          {activas.map(
                            (variante) => (

                              <div
                                key={
                                  variante.id
                                }
                                className="d-flex justify-content-between align-items-center border rounded px-3 py-2"
                              >
                                <span>
                                  {variante.nombre}
                                </span>

                                <strong className="ms-3">
                                  {formatearMoneda(
                                    variante.precio
                                  )}
                                </strong>
                              </div>

                            )
                          )}

                        </div>

                      </div>
                    )}

                    <div className="service-footer">

                      <strong>
                        {activas.length > 0
                          ? `Desde ${formatearMoneda(
                              obtenerPrecioDesde(
                                servicio
                              )
                            )}`
                          : formatearMoneda(
                              servicio.precio
                            )}
                      </strong>

                    </div>

                    <button
                      type="button"
                      className="btn btn-light w-100 mt-3"
                      onClick={() =>
                        abrirVariantes(
                          servicio
                        )
                      }
                    >
                      {servicio.variantes
                        ?.length > 0
                        ? "Administrar variantes"
                        : "Agregar variantes"}
                    </button>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

      {/* ============================================================
          MODAL NUEVO SERVICIO
          ============================================================ */}

      {mostrarFormulario && (

        <div className="custom-modal-backdrop">

          <div className="custom-modal custom-modal-large">

            <div className="custom-modal-header">

              <div>

                <h4>
                  Nuevo servicio
                </h4>

                <p className="text-muted mb-0">
                  Puedes crear un precio
                  único o agregar variantes.
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
                guardarServicio
              }
            >

              <div className="custom-modal-body">

                <div className="row g-3">

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

                  {formulario.variantes
                    .length === 0 && (
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

                      <div className="form-text">
                        Si agregas variantes,
                        el precio base se
                        calculará automáticamente
                        usando la variante más
                        económica.
                      </div>

                    </div>
                  )}

                  <div className="col-12">

                    <div className="d-flex justify-content-between align-items-center mb-2">

                      <div>
                        <label className="form-label mb-0">
                          Variantes
                        </label>

                        <div className="form-text mt-0">
                          Opcional. Por ejemplo:
                          Corto, Medio y Largo.
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={
                          agregarVarianteNueva
                        }
                      >
                        <FaPlus className="me-1" />
                        Agregar variante
                      </button>

                    </div>

                    {formulario.variantes
                      .length > 0 && (
                      <div className="d-flex flex-column gap-3">

                        {formulario.variantes.map(
                          (
                            variante,
                            indice
                          ) => (

                            <div
                              className="border rounded p-3"
                              key={
                                indice
                              }
                            >

                              <div className="row g-2 align-items-end">

                                <div className="col-md-5">

                                  <label className="form-label">
                                    Nombre
                                  </label>

                                  <input
                                    type="text"
                                    className="form-control"
                                    value={
                                      variante.nombre
                                    }
                                    onChange={(e) =>
                                      cambiarVarianteNueva(
                                        indice,
                                        "nombre",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Ej. Cabello corto"
                                    required
                                  />

                                </div>

                                <div className="col-md-4">

                                  <label className="form-label">
                                    Precio
                                  </label>

                                  <input
                                    type="number"
                                    className="form-control"
                                    value={
                                      variante.precio
                                    }
                                    onChange={(e) =>
                                      cambiarVarianteNueva(
                                        indice,
                                        "precio",
                                        e.target.value
                                      )
                                    }
                                    min="0"
                                    step="1"
                                    placeholder="48000"
                                    required
                                  />

                                </div>

                                <div className="col-md-2">

                                  <label className="form-label">
                                    Orden
                                  </label>

                                  <input
                                    type="number"
                                    className="form-control"
                                    value={
                                      variante.orden
                                    }
                                    onChange={(e) =>
                                      cambiarVarianteNueva(
                                        indice,
                                        "orden",
                                        e.target.value
                                      )
                                    }
                                    min="0"
                                    step="1"
                                  />

                                </div>

                                <div className="col-md-1">

                                  <button
                                    type="button"
                                    className="btn btn-outline-danger w-100"
                                    onClick={() =>
                                      eliminarVarianteNueva(
                                        indice
                                      )
                                    }
                                    title="Quitar variante"
                                  >
                                    <FaTrash />
                                  </button>

                                </div>

                              </div>

                            </div>

                          )
                        )}

                      </div>
                    )}

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

      {/* ============================================================
          MODAL ADMINISTRAR VARIANTES
          ============================================================ */}

      {mostrarVariantes &&
        servicioVariantes && (

        <div className="custom-modal-backdrop">

          <div className="custom-modal custom-modal-large">

            <div className="custom-modal-header">

              <div>

                <h4>
                  Variantes de{" "}
                  {servicioVariantes.nombre}
                </h4>

                <p className="text-muted mb-0">
                  Administra nombres,
                  precios, orden y estado.
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  cerrarVariantes
                }
              >
                <FaTimes />
              </button>

            </div>

            <form
              onSubmit={
                guardarCambiosVariantes
              }
            >

              <div className="custom-modal-body">

                <div className="d-flex justify-content-between align-items-center mb-3">

                  <div className="text-muted">
                    {
                      variantesEdicion
                        .length
                    }{" "}
                    variante
                    {
                      variantesEdicion
                        .length !== 1
                        ? "s"
                        : ""
                    }
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={
                      agregarVarianteEdicion
                    }
                  >
                    <FaPlus className="me-1" />
                    Nueva variante
                  </button>

                </div>

                {variantesEdicion
                  .length === 0 ? (

                  <div className="empty-state">

                    <FaClock size={30} />

                    <h5 className="mt-3">
                      Sin variantes
                    </h5>

                    <p>
                      Este servicio utiliza
                      actualmente un precio
                      único.
                    </p>

                  </div>

                ) : (

                  <div className="d-flex flex-column gap-3">

                    {variantesEdicion.map(
                      (
                        variante,
                        indice
                      ) => (

                        <div
                          key={
                            variante.id ??
                            `nueva-${indice}`
                          }
                          className="border rounded p-3"
                        >

                          <div className="row g-2 align-items-end">

                            <div className="col-md-4">

                              <label className="form-label">
                                Nombre
                              </label>

                              <input
                                type="text"
                                className="form-control"
                                value={
                                  variante.nombre
                                }
                                onChange={(e) =>
                                  cambiarVarianteEdicion(
                                    indice,
                                    "nombre",
                                    e.target.value
                                  )
                                }
                                required
                              />

                            </div>

                            <div className="col-md-3">

                              <label className="form-label">
                                Precio
                              </label>

                              <input
                                type="number"
                                className="form-control"
                                value={
                                  variante.precio
                                }
                                onChange={(e) =>
                                  cambiarVarianteEdicion(
                                    indice,
                                    "precio",
                                    e.target.value
                                  )
                                }
                                min="0"
                                step="1"
                                required
                              />

                            </div>

                            <div className="col-md-2">

                              <label className="form-label">
                                Orden
                              </label>

                              <input
                                type="number"
                                className="form-control"
                                value={
                                  variante.orden
                                }
                                onChange={(e) =>
                                  cambiarVarianteEdicion(
                                    indice,
                                    "orden",
                                    e.target.value
                                  )
                                }
                                min="0"
                                step="1"
                              />

                            </div>

                            <div className="col-md-2">

                              {variante.esNueva ? (

                                <span className="badge text-bg-info w-100 py-2">
                                  Nueva
                                </span>

                              ) : (

                                <div className="form-check form-switch pt-2">

                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={
                                      variante.activo
                                    }
                                    onChange={(e) =>
                                      cambiarVarianteEdicion(
                                        indice,
                                        "activo",
                                        e.target.checked
                                      )
                                    }
                                    id={`variante-activa-${variante.id}`}
                                  />

                                  <label
                                    className="form-check-label"
                                    htmlFor={`variante-activa-${variante.id}`}
                                  >
                                    {variante.activo
                                      ? "Activa"
                                      : "Inactiva"}
                                  </label>

                                </div>

                              )}

                            </div>

                            <div className="col-md-1">

                              {variante.esNueva && (
                                <button
                                  type="button"
                                  className="btn btn-outline-danger w-100"
                                  onClick={() =>
                                    quitarVarianteNuevaEdicion(
                                      indice
                                    )
                                  }
                                  title="Quitar variante"
                                >
                                  <FaTrash />
                                </button>
                              )}

                            </div>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

              <div className="custom-modal-footer">

                <button
                  type="button"
                  className="btn btn-light"
                  onClick={
                    cerrarVariantes
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    guardandoVariantes
                  }
                >
                  {guardandoVariantes
                    ? "Guardando..."
                    : "Guardar cambios"}
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
