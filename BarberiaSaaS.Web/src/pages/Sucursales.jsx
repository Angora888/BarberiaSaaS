import {
  useEffect,
  useState
} from "react";
import {
  FaEdit,
  FaPlus,
  FaStore,
  FaToggleOff,
  FaToggleOn
} from "react-icons/fa";
import api from "../services/api";

const formularioInicial = {
  nombre: "",
  direccion: "",
  telefono: "",
  email: ""
};

function Sucursales() {
  const [sucursales, setSucursales] =
    useState([]);

  const [formulario, setFormulario] =
    useState(formularioInicial);

  const [editandoId, setEditandoId] =
    useState(null);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const cargarSucursales = async () => {
    try {
      setCargando(true);
      setError("");

      const response =
        await api.get(
          "/Sucursales?incluirInactivas=true"
        );

      setSucursales(response.data || []);
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        "No fue posible cargar las sucursales."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSucursales();
  }, []);

  const cambiarCampo = (event) => {
    const {
      name,
      value
    } = event.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value
    }));
  };

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setEditandoId(null);
  };

  const editarSucursal = (sucursal) => {
    setFormulario({
      nombre: sucursal.nombre || "",
      direccion: sucursal.direccion || "",
      telefono: sucursal.telefono || "",
      email: sucursal.email || ""
    });

    setEditandoId(sucursal.id);
    setMensaje("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const guardarSucursal = async (event) => {
    event.preventDefault();

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      if (editandoId) {
        await api.put(
          `/Sucursales/${editandoId}`,
          formulario
        );

        setMensaje(
          "Sucursal actualizada correctamente."
        );
      } else {
        await api.post(
          "/Sucursales",
          formulario
        );

        setMensaje(
          "Sucursal creada correctamente."
        );
      }

      limpiarFormulario();
      await cargarSucursales();
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        "No fue posible guardar la sucursal."
      );
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (sucursal) => {
    const nuevoEstado = !sucursal.activa;

    const texto = nuevoEstado
      ? `¿Deseas activar la sucursal ${sucursal.nombre}?`
      : `¿Deseas desactivar la sucursal ${sucursal.nombre}?`;

    if (!window.confirm(texto)) {
      return;
    }

    try {
      setError("");
      setMensaje("");

      await api.patch(
        `/Sucursales/${sucursal.id}/estado`,
        {
          activa: nuevoEstado
        }
      );

      setMensaje(
        nuevoEstado
          ? "Sucursal activada correctamente."
          : "Sucursal desactivada correctamente."
      );

      await cargarSucursales();
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        "No fue posible cambiar el estado de la sucursal."
      );
    }
  };

  return (
    <div>
      <div className="page-header d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="mb-1">
            Sucursales
          </h1>

          <p className="text-muted mb-0">
            Administra las ubicaciones de tu negocio.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 text-muted">
          <FaStore />
          <span>
            {sucursales.filter((x) => x.activa).length}
            {" "}
            activas
          </span>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="alert alert-success">
          {mensaje}
        </div>
      )}

      <div className="content-card mb-4">
        <div className="d-flex align-items-center gap-2 mb-4">
          <FaPlus />
          <h4 className="mb-0">
            {editandoId
              ? "Editar sucursal"
              : "Nueva sucursal"}
          </h4>
        </div>

        <form onSubmit={guardarSucursal}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">
                Nombre
              </label>

              <input
                type="text"
                name="nombre"
                className="form-control"
                value={formulario.nombre}
                onChange={cambiarCampo}
                placeholder="Ej. Sucursal San José"
                required
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
                value={formulario.telefono}
                onChange={cambiarCampo}
                placeholder="Ej. 8888-8888"
              />
            </div>

            <div className="col-md-8">
              <label className="form-label">
                Dirección
              </label>

              <input
                type="text"
                name="direccion"
                className="form-control"
                value={formulario.direccion}
                onChange={cambiarCampo}
                placeholder="Dirección de la sucursal"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">
                Correo
              </label>

              <input
                type="email"
                name="email"
                className="form-control"
                value={formulario.email}
                onChange={cambiarCampo}
                placeholder="sucursal@negocio.com"
              />
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 mt-4">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : editandoId
                  ? "Guardar cambios"
                  : "Crear sucursal"}
            </button>

            {editandoId && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={limpiarFormulario}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="content-card">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h4 className="mb-0">
            Sucursales registradas
          </h4>

          <span className="badge text-bg-light border">
            {sucursales.length} total
          </span>
        </div>

        {cargando ? (
          <div className="text-center py-5">
            <div
              className="spinner-border"
              role="status"
            />
          </div>
        ) : sucursales.length === 0 ? (
          <div className="text-center text-muted py-5">
            No hay sucursales registradas.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Dirección</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Estado</th>
                  <th className="text-end">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {sucursales.map((sucursal) => (
                  <tr key={sucursal.id}>
                    <td>
                      <strong>
                        {sucursal.nombre}
                      </strong>
                    </td>

                    <td>
                      {sucursal.direccion || "-"}
                    </td>

                    <td>
                      {sucursal.telefono || "-"}
                    </td>

                    <td>
                      {sucursal.email || "-"}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          sucursal.activa
                            ? "text-bg-success"
                            : "text-bg-secondary"
                        }`}
                      >
                        {sucursal.activa
                          ? "Activa"
                          : "Inactiva"}
                      </span>
                    </td>

                    <td>
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() =>
                            editarSucursal(sucursal)
                          }
                        >
                          <FaEdit className="me-1" />
                          Editar
                        </button>

                        <button
                          type="button"
                          className={`btn btn-sm ${
                            sucursal.activa
                              ? "btn-outline-danger"
                              : "btn-outline-success"
                          }`}
                          onClick={() =>
                            cambiarEstado(sucursal)
                          }
                        >
                          {sucursal.activa ? (
                            <FaToggleOff className="me-1" />
                          ) : (
                            <FaToggleOn className="me-1" />
                          )}

                          {sucursal.activa
                            ? "Desactivar"
                            : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sucursales;
