import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

function AceptarInvitacion() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setCargando(true);
      const response = await api.post("/Auth/aceptar-invitacion", {
        token,
        password
      });
      setExito(response.data?.mensaje || "Tu acceso quedó activado.");
    } catch (e) {
      setError(e.response?.data?.mensaje || "No fue posible aceptar la invitación.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3" style={{ background: "#f7f4f6" }}>
      <div className="card border-0 shadow-sm" style={{ width: "100%", maxWidth: 480, borderRadius: 24 }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="fw-bold text-uppercase small" style={{ color: "#c62864", letterSpacing: 1.2 }}>Barbería SaaS</div>
            <h2 className="fw-bold mt-2">Crea tu contraseña</h2>
            <p className="text-muted mb-0">Activa tu acceso como profesional.</p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {exito && <div className="alert alert-success">{exito}</div>}

          {!exito ? (
            <form onSubmit={guardar}>
              <div className="mb-3">
                <label className="form-label">Nueva contraseña</label>
                <input
                  type="password"
                  className="form-control form-control-lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label">Confirmar contraseña</label>
                <input
                  type="password"
                  className="form-control form-control-lg"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
              </div>

              <button className="btn btn-primary btn-lg w-100" disabled={cargando}>
                {cargando ? "Activando..." : "Crear contraseña y activar acceso"}
              </button>
            </form>
          ) : (
            <Link to="/login" className="btn btn-primary btn-lg w-100">Iniciar sesión</Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default AceptarInvitacion;
