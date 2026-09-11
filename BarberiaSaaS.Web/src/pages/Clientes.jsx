import { useEffect, useMemo, useState } from "react";
import {
  FaEdit,
  FaHistory,
  FaPlus,
  FaSearch,
  FaTimes,
  FaUser
} from "react-icons/fa";
import api from "../services/api";

function Clientes() {
  const [clientes, setClientes] =
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
    clienteEditando,
    setClienteEditando
  ] = useState(null);

  const [guardando, setGuardando] =
    useState(false);

  const [formulario, setFormulario] =
    useState({
      nombre: "",
      apellidos: "",
      telefono: "",
      email: "",
      fechaNacimiento: "",
      notas: ""
    });

  const [
    clienteHistorial,
    setClienteHistorial
  ] = useState(null);

  const [
    cargandoHistorial,
    setCargandoHistorial
  ] = useState(false);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setCargando(true);
      setError("");

      const response =
        await api.get("/Clientes");

      setClientes(response.data);
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        "No fue posible cargar los clientes."
      );
    } finally {
      setCargando(false);
    }
  };

  const clientesFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return clientes;
      }

      return clientes.filter(
        (cliente) => {
          const nombreCompleto =
            `${cliente.nombre} ${cliente.apellidos || ""}`
              .toLowerCase();

          return (
            nombreCompleto.includes(
              texto
            ) ||
            cliente.telefono
              ?.toLowerCase()
              .includes(texto) ||
            cliente.email
              ?.toLowerCase()
              .includes(texto)
          );
        }
      );
    }, [clientes, busqueda]);

  const formularioVacio = () => ({
    nombre: "",
    apellidos: "",
    telefono: "",
    email: "",
    fechaNacimiento: "",
    notas: ""
  });

  const abrirNuevoCliente = () => {
    setClienteEditando(null);
    setFormulario(
      formularioVacio()
    );
    setError("");
    setMostrarFormulario(true);
  };

  const abrirEditarCliente = (
    cliente
  ) => {
    setClienteEditando(cliente);

    setFormulario({
      nombre:
        cliente.nombre || "",
      apellidos:
        cliente.apellidos || "",
      telefono:
        cliente.telefono || "",
      email:
        cliente.email || "",
      fechaNacimiento:
        cliente.fechaNacimiento
          ? cliente.fechaNacimiento
              .substring(0, 10)
          : "",
      notas:
        cliente.notas || ""
    });

    setError("");
    setMostrarFormulario(true);
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

  const limpiarFormulario = () => {
    setFormulario(
      formularioVacio()
    );
  };

  const cerrarFormulario = () => {
    limpiarFormulario();
    setClienteEditando(null);
    setMostrarFormulario(false);
  };

  const guardarCliente =
    async (e) => {
      e.preventDefault();

      if (
        !formulario.nombre.trim()
      ) {
        setError(
          "El nombre del cliente es requerido."
        );
        return;
      }

      const payload = {
        nombre:
          formulario.nombre.trim(),

        apellidos:
          formulario.apellidos.trim(),

        telefono:
          formulario.telefono.trim() ||
          null,

        email:
          formulario.email.trim() ||
          null,

        fechaNacimiento:
          formulario.fechaNacimiento ||
          null,

        notas:
          formulario.notas.trim() ||
          null
      };

      try {
        setGuardando(true);
        setError("");

        if (clienteEditando) {
          await api.put(
            `/Clientes/${clienteEditando.id}`,
            payload
          );
        } else {
          await api.post(
            "/Clientes",
            payload
          );
        }

        cerrarFormulario();

        await cargarClientes();
      } catch (error) {
        setError(
          error.response?.data?.mensaje ||
          (
            clienteEditando
              ? "No fue posible actualizar el cliente."
              : "No fue posible crear el cliente."
          )
        );
      } finally {
        setGuardando(false);
      }
    };

  const abrirHistorial =
    async (clienteId) => {
      try {
        setCargandoHistorial(
          true
        );
        setError("");

        const response =
          await api.get(
            `/Clientes/${clienteId}/historial`
          );

        setClienteHistorial(
          response.data
        );
      } catch (error) {
        setError(
          error.response?.data?.mensaje ||
          "No fue posible cargar el historial."
        );
      } finally {
        setCargandoHistorial(
          false
        );
      }
    };

  const formatearMoneda = (
    valor
  ) => {
    return new Intl.NumberFormat(
      "es-CR",
      {
        style: "currency",
        currency: "CRC",
        maximumFractionDigits: 0
      }
    ).format(valor || 0);
  };

  const formatearFecha = (
    fecha
  ) => {
    if (!fecha) {
      return "-";
    }

    const partes =
      fecha
        .substring(0, 10)
        .split("-");

    if (partes.length !== 3) {
      return fecha;
    }

    const [
      anio,
      mes,
      dia
    ] = partes;

    return `${dia}/${mes}/${anio}`;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Clientes
          </h1>

          <p className="text-muted mb-0">
            Administra los clientes
            del negocio.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={
            abrirNuevoCliente
          }
        >
          <FaPlus className="me-2" />
          Nuevo cliente
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
              placeholder="Buscar por nombre, teléfono o correo..."
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
              clientesFiltrados.length
            }{" "}
            cliente
            {
              clientesFiltrados.length !== 1
                ? "s"
                : ""
            }
          </div>
        </div>

        {cargando ? (
          <div className="empty-state">
            Cargando clientes...
          </div>
        ) : clientesFiltrados.length ===
          0 ? (
          <div className="empty-state">
            <FaUser size={32} />

            <h5 className="mt-3">
              No encontramos clientes
            </h5>

            <p>
              Registra el primer
              cliente para comenzar.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle client-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>
                    Fecha nacimiento
                  </th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {clientesFiltrados.map(
                  (cliente) => (
                    <tr
                      key={
                        cliente.id
                      }
                    >
                      <td>
                        <div className="client-name-cell">
                          <div className="client-avatar">
                            {cliente.nombre
                              ?.charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {
                                cliente.nombre
                              }{" "}
                              {
                                cliente.apellidos
                              }
                            </strong>

                            {cliente.notas && (
                              <div className="client-note">
                                {
                                  cliente.notas
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        {cliente.telefono ||
                          "-"}
                      </td>

                      <td>
                        {cliente.email ||
                          "-"}
                      </td>

                      <td>
                        {formatearFecha(
                          cliente.fechaNacimiento
                        )}
                      </td>

                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2 flex-wrap">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() =>
                              abrirEditarCliente(
                                cliente
                              )
                            }
                          >
                            <FaEdit className="me-2" />
                            Editar
                          </button>

                          <button
                            type="button"
                            className="btn btn-light btn-sm"
                            onClick={() =>
                              abrirHistorial(
                                cliente.id
                              )
                            }
                          >
                            <FaHistory className="me-2" />
                            Historial
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mostrarFormulario && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal">
            <div className="custom-modal-header">
              <div>
                <h4>
                  {clienteEditando
                    ? "Editar cliente"
                    : "Nuevo cliente"}
                </h4>

                <p className="text-muted mb-0">
                  {clienteEditando
                    ? "Actualiza la información del cliente."
                    : "Ingresa la información del cliente."}
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
                guardarCliente
              }
            >
              <div className="custom-modal-body">
                <div className="row g-3">
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
                      Correo electrónico
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

                  <div className="col-md-6">
                    <label className="form-label">
                      Fecha de nacimiento
                    </label>

                    <input
                      type="date"
                      name="fechaNacimiento"
                      className="form-control"
                      value={
                        formulario.fechaNacimiento
                      }
                      onChange={
                        cambiarCampo
                      }
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
                      value={
                        formulario.notas
                      }
                      onChange={
                        cambiarCampo
                      }
                      placeholder="Preferencias, observaciones..."
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
                    : clienteEditando
                      ? "Guardar cambios"
                      : "Guardar cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(clienteHistorial ||
        cargandoHistorial) && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal custom-modal-large">
            {cargandoHistorial ? (
              <div className="empty-state">
                Cargando historial...
              </div>
            ) : (
              <>
                <div className="custom-modal-header">
                  <div>
                    <h4>
                      {
                        clienteHistorial
                          .cliente.nombre
                      }{" "}
                      {
                        clienteHistorial
                          .cliente
                          .apellidos
                      }
                    </h4>

                    <p className="text-muted mb-0">
                      Historial del cliente
                    </p>
                  </div>

                  <button
                    type="button"
                    className="modal-close"
                    onClick={() =>
                      setClienteHistorial(
                        null
                      )
                    }
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="custom-modal-body">
                  <div className="row g-3 mb-4">
                    <div className="col-md-3">
                      <div className="history-stat">
                        <span>
                          Total citas
                        </span>

                        <strong>
                          {
                            clienteHistorial
                              .resumen
                              .totalCitas
                          }
                        </strong>
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div className="history-stat">
                        <span>
                          Completadas
                        </span>

                        <strong>
                          {
                            clienteHistorial
                              .resumen
                              .citasCompletadas
                          }
                        </strong>
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div className="history-stat">
                        <span>
                          No asistió
                        </span>

                        <strong>
                          {
                            clienteHistorial
                              .resumen
                              .noAsistio
                          }
                        </strong>
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div className="history-stat">
                        <span>
                          Total gastado
                        </span>

                        <strong>
                          {formatearMoneda(
                            clienteHistorial
                              .resumen
                              .totalGastado
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {clienteHistorial
                    .citas.length ===
                  0 ? (
                    <div className="empty-state">
                      Este cliente todavía no tiene citas.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead>
                          <tr>
                            <th>
                              Fecha
                            </th>
                            <th>
                              Servicio
                            </th>
                            <th>
                              Profesional
                            </th>
                            <th>
                              Estado
                            </th>
                            <th>
                              Precio
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {clienteHistorial
                            .citas.map(
                              (
                                cita
                              ) => (
                                <tr
                                  key={
                                    cita.id
                                  }
                                >
                                  <td>
                                    {new Date(
                                      cita.fechaInicio
                                    ).toLocaleString(
                                      "es-CR",
                                      {
                                        timeZone:
                                          "America/Costa_Rica"
                                      }
                                    )}
                                  </td>

                                  <td>
                                    {
                                      cita
                                        .servicio
                                        .nombre
                                    }
                                  </td>

                                  <td>
                                    {
                                      cita
                                        .profesional
                                        .nombre
                                    }{" "}
                                    {
                                      cita
                                        .profesional
                                        .apellidos
                                    }
                                  </td>

                                  <td>
                                    <span className="status-badge">
                                      {
                                        cita.estado
                                      }
                                    </span>
                                  </td>

                                  <td>
                                    {formatearMoneda(
                                      cita.precio
                                    )}
                                  </td>
                                </tr>
                              )
                            )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;
