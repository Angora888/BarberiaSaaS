import { useEffect, useMemo, useState } from "react";
import {
  FaClock,
  FaEdit,
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
    servicioEditando,
    setServicioEditando
  ] = useState(null);

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
      activo: true,
      variantes: []
    });

  const [
    variantesEdicion,
    setVariantesEdicion
  ] = useState([]);

  useEffect(() => {
    cargarServicios();
  }, []);

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

  const serviciosFiltrados =
    useMemo(() => {
      const texto =
        busqueda.trim().toLowerCase();

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

  const limpiarFormulario = () => {
    setFormulario({
      nombre: "",
      descripcion: "",
      precio: "",
      activo: true,
      variantes: []
    });
  };

  const abrirNuevoServicio = () => {
    setServicioEditando(null);
    limpiarFormulario();
    setError("");
    setMostrarFormulario(true);
  };

  const abrirEditarServicio = (
    servicio
  ) => {
    setServicioEditando(servicio);

    setFormulario({
      nombre:
        servicio.nombre || "",
      descripcion:
        servicio.descripcion || "",
      precio:
        servicio.precio
          ?.toString() || "0",
      activo:
        servicio.activo !== false,
      variantes: []
    });

    setError("");
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    limpiarFormulario();
    setServicioEditando(null);
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
        "El precio del servicio no es válido."
      );
      return;
    }

    try {
      setGuardando(true);
      setError("");

      if (servicioEditando) {
        await api.put(
          `/Servicios/${servicioEditando.id}`,
          {
            nombre:
              formulario.nombre.trim(),
            descripcion:
              formulario.descripcion
                ?.trim() || null,
            precio,
            activo:
              Boolean(
                formulario.activo
              )
          }
        );
      } else {
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
            Number(
              variante.precio
            );

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

        let precioServicio =
          precio;

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
        }

        const responseServicio =
          await api.post(
            "/Servicios",
            {
              nombre:
                formulario.nombre.trim(),
              descripcion:
                formulario.descripcion
                  ?.trim() || null,
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
                  variante.orden ??
                  i
                )
            }
          );
        }
      }

      cerrarFormulario();

      await cargarServicios();
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        (
          servicioEditando
            ? "No fue posible actualizar el servicio."
            : "No fue posible crear el servicio."
        )
      );
    } finally {
      setGuardando(false);
    }
  };

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

        const precioVariante =
          Number(
            variante.precio
          );

        if (
          Number.isNaN(
            precioVariante
          ) ||
          precioVariante < 0
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

  return (
    <div>
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
          onClick={
            abrirNuevoServicio
          }
        >
          <FaPlus className="me-2" />
          Nuevo servicio
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

                    {activas.length >
                    0 ? (
                      <>
                        <div className="fw-semibold mb-2">
                          Desde{" "}
                          {formatearMoneda(
                            obtenerPrecioDesde(
                              servicio
                            )
                          )}
                        </div>

                        <div className="d-flex flex-column gap-1 mb-3">
                          {activas
                            .slice(0, 4)
                            .map(
                              (
                                variante
                              ) => (
                                <div
                                  key={
                                    variante.id
                                  }
                                  className="d-flex justify-content-between small"
                                >
                                  <span>
                                    {
                                      variante.nombre
                                    }
                                  </span>

                                  <span>
                                    {formatearMoneda(
                                      variante.precio
                                    )}
                                  </span>
                                </div>
                              )
                            )}

                          {activas.length >
                            4 && (
                            <span className="text-muted small">
                              +
                              {activas.length -
                                4}{" "}
                              variantes
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="fw-semibold mb-3">
                        {formatearMoneda(
                          servicio.precio
                        )}
                      </div>
                    )}

                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() =>
                          abrirEditarServicio(
                            servicio
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
                          abrirVariantes(
                            servicio
                          )
                        }
                      >
                        Variantes
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {mostrarFormulario && (
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
              <form
                onSubmit={
                  guardarServicio
                }
              >
                <div className="modal-header">
                  <h5 className="modal-title">
                    {servicioEditando
                      ? "Editar servicio"
                      : "Nuevo servicio"}
                  </h5>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={
                      cerrarFormulario
                    }
                  />
                </div>

                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-8">
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

                    <div className="col-md-4">
                      <label className="form-label">
                        Precio base *
                      </label>

                      <input
                        name="precio"
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control"
                        value={
                          formulario.precio
                        }
                        onChange={
                          cambiarCampo
                        }
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
                          formulario.descripcion
                        }
                        onChange={
                          cambiarCampo
                        }
                      />
                    </div>

                    {servicioEditando && (
                      <div className="col-12">
                        <div className="form-check form-switch">
                          <input
                            id="servicioActivo"
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
                            htmlFor="servicioActivo"
                            className="form-check-label"
                          >
                            Servicio activo
                          </label>
                        </div>
                      </div>
                    )}

                    {!servicioEditando && (
                      <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <h6 className="mb-0">
                              Variantes
                            </h6>

                            <small className="text-muted">
                              Opcional. Por ejemplo: corto, medio y largo.
                            </small>
                          </div>

                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={
                              agregarVarianteNueva
                            }
                          >
                            <FaPlus className="me-1" />
                            Agregar
                          </button>
                        </div>

                        {formulario
                          .variantes
                          .map(
                            (
                              variante,
                              indice
                            ) => (
                              <div
                                key={
                                  indice
                                }
                                className="row g-2 align-items-end mb-2"
                              >
                                <div className="col-md-6">
                                  <label className="form-label">
                                    Nombre
                                  </label>

                                  <input
                                    className="form-control"
                                    value={
                                      variante.nombre
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      cambiarVarianteNueva(
                                        indice,
                                        "nombre",
                                        e
                                          .target
                                          .value
                                      )
                                    }
                                  />
                                </div>

                                <div className="col-md-4">
                                  <label className="form-label">
                                    Precio
                                  </label>

                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="form-control"
                                    value={
                                      variante.precio
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      cambiarVarianteNueva(
                                        indice,
                                        "precio",
                                        e
                                          .target
                                          .value
                                      )
                                    }
                                  />
                                </div>

                                <div className="col-md-2">
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger w-100"
                                    onClick={() =>
                                      eliminarVarianteNueva(
                                        indice
                                      )
                                    }
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                            )
                          )}
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
                      : servicioEditando
                        ? "Guardar cambios"
                        : "Crear servicio"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {mostrarVariantes &&
        servicioVariantes && (
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
              <form
                onSubmit={
                  guardarCambiosVariantes
                }
              >
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title">
                      Variantes de{" "}
                      {
                        servicioVariantes.nombre
                      }
                    </h5>

                    <small className="text-muted">
                      Puedes editar precio, orden y estado.
                    </small>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={
                      cerrarVariantes
                    }
                  />
                </div>

                <div className="modal-body">
                  <div className="d-flex justify-content-end mb-3">
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

                  {variantesEdicion.length ===
                  0 ? (
                    <div className="text-muted text-center py-4">
                      Este servicio no tiene variantes.
                    </div>
                  ) : (
                    variantesEdicion.map(
                      (
                        variante,
                        indice
                      ) => (
                        <div
                          key={
                            variante.id ??
                            `nueva-${indice}`
                          }
                          className="border rounded p-3 mb-3"
                        >
                          <div className="row g-2 align-items-end">
                            <div className="col-md-4">
                              <label className="form-label">
                                Nombre
                              </label>

                              <input
                                className="form-control"
                                value={
                                  variante.nombre
                                }
                                onChange={(
                                  e
                                ) =>
                                  cambiarVarianteEdicion(
                                    indice,
                                    "nombre",
                                    e
                                      .target
                                      .value
                                  )
                                }
                              />
                            </div>

                            <div className="col-md-3">
                              <label className="form-label">
                                Precio
                              </label>

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="form-control"
                                value={
                                  variante.precio
                                }
                                onChange={(
                                  e
                                ) =>
                                  cambiarVarianteEdicion(
                                    indice,
                                    "precio",
                                    e
                                      .target
                                      .value
                                  )
                                }
                              />
                            </div>

                            <div className="col-md-2">
                              <label className="form-label">
                                Orden
                              </label>

                              <input
                                type="number"
                                min="0"
                                className="form-control"
                                value={
                                  variante.orden
                                }
                                onChange={(
                                  e
                                ) =>
                                  cambiarVarianteEdicion(
                                    indice,
                                    "orden",
                                    e
                                      .target
                                      .value
                                  )
                                }
                              />
                            </div>

                            <div className="col-md-2">
                              <div className="form-check form-switch mb-2">
                                <input
                                  id={`activo-variante-${indice}`}
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={
                                    variante.activo
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    cambiarVarianteEdicion(
                                      indice,
                                      "activo",
                                      e
                                        .target
                                        .checked
                                    )
                                  }
                                  disabled={
                                    variante.esNueva
                                  }
                                />

                                <label
                                  htmlFor={`activo-variante-${indice}`}
                                  className="form-check-label"
                                >
                                  Activa
                                </label>
                              </div>
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
                                >
                                  <FaTimes />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>

                <div className="modal-footer">
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
        </div>
      )}
    </div>
  );
}

export default Servicios;
