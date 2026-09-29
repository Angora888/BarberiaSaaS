import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaLink, FaRedo, FaToggleOff, FaToggleOn, FaUserShield } from "react-icons/fa";
import api from "../services/api";

function UsuariosAcceso() {
  const usuarioActual = JSON.parse(localStorage.getItem("usuario") || "{}");
  const [data, setData] = useState({ usuarios: [], profesionales: [] });
  const [correos, setCorreos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargar = async () => {
    try {
      setCargando(true);
      setError("");
      const response = await api.get("/usuarios-acceso");
      const payload = response.data || { usuarios: [], profesionales: [] };
      setData(payload);
      setCorreos((actual) => {
        const siguiente = { ...actual };
        (payload.profesionales || []).forEach((p) => {
          if (siguiente[p.id] === undefined) siguiente[p.id] = p.email || "";
        });
        return siguiente;
      });
    } catch (e) {
      setError(e.response?.data?.mensaje || "No fue posible cargar los usuarios.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const miUsuario = useMemo(
    () => (data.usuarios || []).find((x) => Number(x.id) === Number(usuarioActual.id)),
    [data.usuarios, usuarioActual.id]
  );

  const profesionalesSinUsuario = useMemo(
    () => (data.profesionales || []).filter((p) => !p.usuario),
    [data.profesionales]
  );

  const ejecutar = async (clave, accion) => {
    try {
      setProcesando(clave);
      setError("");
      setMensaje("");
      const response = await accion();
      setMensaje(response?.data?.mensaje || "Cambio realizado correctamente.");
      await cargar();
    } catch (e) {
      setError(e.response?.data?.mensaje || "No fue posible completar la acción.");
    } finally {
      setProcesando("");
    }
  };

  const vincularme = (profesionalId) =>
    ejecutar(`vincular-${profesionalId}`, () =>
      api.post("/usuarios-acceso/vincular-actual", { profesionalId })
    );

  const invitar = (profesional) => {
    const email = (correos[profesional.id] || "").trim();
    if (!email) {
      setError("Ingresa un correo para enviar la invitación.");
      return;
    }

    ejecutar(`invitar-${profesional.id}`, () =>
      api.post("/usuarios-acceso/invitar-profesional", {
        profesionalId: profesional.id,
        email
      })
    );
  };

  const cambiarActivo = (usuario) =>
    ejecutar(`activo-${usuario.id}`, () =>
      api.put(`/usuarios-acceso/${usuario.id}/activo`, { activo: !usuario.activo })
    );

  const reenviar = (usuario) =>
    ejecutar(`reenviar-${usuario.id}`, () =>
      api.post(`/usuarios-acceso/${usuario.id}/reenviar-invitacion`)
    );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios y accesos</h1>
          <p className="text-muted mb-0">
            Vincula profesionales con usuarios y controla quién puede iniciar sesión.
          </p>
        </div>
        <Link to="/configuracion" className="btn btn-outline-secondary">Volver a configuración</Link>
      </div>

      {error && <div className="alert alert-danger mt-4">{error}</div>}
      {mensaje && <div className="alert alert-success mt-4">{mensaje}</div>}

      {cargando ? (
        <div className="content-card mt-4 p-4">Cargando usuarios...</div>
      ) : (
        <>
          <div className="content-card mt-4 p-4">
            <div className="d-flex align-items-center gap-2 mb-1">
              <FaUserShield />
              <h5 className="mb-0">Usuarios con acceso</h5>
            </div>
            <p className="text-muted small mb-4">
              El rol Profesional queda limitado a Agenda, Clientes y Servicios.
            </p>

            <div className="d-flex flex-column gap-3">
              {(data.usuarios || []).map((usuario) => (
                <div key={usuario.id} className="border rounded-4 p-3">
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                    <div>
                      <div className="fw-bold">
                        {[usuario.nombre, usuario.apellidos].filter(Boolean).join(" ")}
                        {usuario.esUsuarioActual && <span className="badge text-bg-light ms-2">Tú</span>}
                      </div>
                      <div className="text-muted small">{usuario.email}</div>
                      <div className="mt-2 d-flex flex-wrap gap-2">
                        <span className="badge text-bg-dark">{usuario.rol}</span>
                        <span className={`badge ${usuario.activo ? "text-bg-success" : "text-bg-warning"}`}>
                          {usuario.activo ? "Activo" : "Pendiente / inactivo"}
                        </span>
                        {usuario.profesional && (
                          <span className="badge text-bg-light border">
                            Profesional: {usuario.profesional.nombre} {usuario.profesional.apellidos || ""}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2">
                      {usuario.rol === "Profesional" && !usuario.activo && (
                        <button
                          className="btn btn-outline-primary btn-sm"
                          disabled={procesando === `reenviar-${usuario.id}`}
                          onClick={() => reenviar(usuario)}
                        >
                          <FaRedo className="me-1" /> Reenviar invitación
                        </button>
                      )}

                      {!usuario.esUsuarioActual && usuario.rol !== "Propietario" && (
                        <button
                          className={`btn btn-sm ${usuario.activo ? "btn-outline-danger" : "btn-outline-success"}`}
                          disabled={procesando === `activo-${usuario.id}`}
                          onClick={() => cambiarActivo(usuario)}
                        >
                          {usuario.activo ? <FaToggleOff className="me-1" /> : <FaToggleOn className="me-1" />}
                          {usuario.activo ? "Desactivar" : "Activar"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="content-card mt-4 p-4">
            <div className="d-flex align-items-center gap-2 mb-1">
              <FaEnvelope />
              <h5 className="mb-0">Profesionales sin usuario</h5>
            </div>
            <p className="text-muted small mb-4">
              Puedes vincular tu propia cuenta o enviar una invitación para que la persona cree su contraseña.
            </p>

            {profesionalesSinUsuario.length === 0 ? (
              <div className="text-muted">Todos los profesionales activos ya están vinculados.</div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {profesionalesSinUsuario.map((profesional) => (
                  <div key={profesional.id} className="border rounded-4 p-3">
                    <div className="row g-3 align-items-end">
                      <div className="col-lg-4">
                        <div className="fw-bold">
                          {profesional.nombre} {profesional.apellidos || ""}
                        </div>
                        <div className="text-muted small">Profesional #{profesional.id}</div>
                      </div>

                      <div className="col-lg-4">
                        <label className="form-label small fw-semibold">Correo para acceso</label>
                        <input
                          type="email"
                          className="form-control"
                          value={correos[profesional.id] || ""}
                          onChange={(e) => setCorreos((x) => ({ ...x, [profesional.id]: e.target.value }))}
                          placeholder="correo@ejemplo.com"
                        />
                      </div>

                      <div className="col-lg-4 d-flex flex-wrap gap-2">
                        {!miUsuario?.profesionalId && (
                          <button
                            className="btn btn-outline-dark"
                            disabled={procesando === `vincular-${profesional.id}`}
                            onClick={() => vincularme(profesional.id)}
                          >
                            <FaLink className="me-1" /> Este profesional soy yo
                          </button>
                        )}

                        <button
                          className="btn btn-primary"
                          disabled={procesando === `invitar-${profesional.id}`}
                          onClick={() => invitar(profesional)}
                        >
                          <FaEnvelope className="me-1" /> Enviar invitación
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default UsuariosAcceso;
