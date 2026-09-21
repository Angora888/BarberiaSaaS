import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const WHATSAPP_ADMIN = "50660662375";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [negocioInactivo, setNegocioInactivo] = useState(false);

  const iniciarSesion = async (e) => {
    e.preventDefault();

    try {
      setCargando(true);
      setError("");
      setNegocioInactivo(false);

      const response = await api.post("/Auth/login", {
        email,
        password
      });

      localStorage.setItem(
        "token",
        response.data.token
      );

      localStorage.setItem(
        "usuario",
        JSON.stringify(response.data.usuario)
      );

      navigate("/dashboard");
    } catch (error) {
      const mensaje =
        error.response?.data?.mensaje ||
        "No fue posible iniciar sesión.";

      const estaInactivo =
        mensaje === "El negocio se encuentra inactivo.";

      setNegocioInactivo(estaInactivo);

      setError(
        estaInactivo
          ? "Tu membresía se encuentra inactiva. Contacta al administrador para reactivar el acceso a Barberia SaaS."
          : mensaje
      );
    } finally {
      setCargando(false);
    }
  };

  const renovarMembresia = () => {
    const mensaje = [
      "¡Hola! 👋",
      "Quiero renovar mi membresía de Barberia SaaS. ✨",
      "",
      `Mi correo registrado es: ${email.trim()}`,
      "",
      "¿Me puedes ayudar con la reactivación de mi cuenta? 😊"
    ].join("\n");

    window.open(
      `https://wa.me/${WHATSAPP_ADMIN}?text=${encodeURIComponent(mensaje)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <>
      <style>
        {`
          .login-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background:
              radial-gradient(
                circle at top left,
                rgba(59, 130, 246, 0.10),
                transparent 35%
              ),
              radial-gradient(
                circle at bottom right,
                rgba(15, 23, 42, 0.08),
                transparent 35%
              ),
              #f6f7f9;
          }

          .login-card {
            width: 100%;
            max-width: 440px;
            padding: 42px 38px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 24px;
            box-shadow:
              0 24px 70px rgba(15, 23, 42, 0.10) !important;
          }

          .login-brand {
            text-align: center;
            margin-bottom: 32px;
          }

          .login-logo {
            width: 76px;
            height: 76px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 22px;
            background:
              linear-gradient(
                145deg,
                #111827,
                #334155
              );
            color: #ffffff;
            font-size: 25px;
            font-weight: 800;
            letter-spacing: -1px;
            box-shadow:
              0 14px 30px rgba(15, 23, 42, 0.18);
          }

          .login-brand h2 {
            margin: 20px 0 5px;
            color: #111827;
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.7px;
          }

          .login-brand p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
          }

          .login-form-label {
            color: #374151;
            font-size: 14px;
            font-weight: 650;
            margin-bottom: 8px;
          }

          .login-input {
            min-height: 52px;
            border: 1px solid #d9dee7;
            border-radius: 13px;
            background: #ffffff;
            font-size: 15px;
            color: #111827;
            padding-left: 15px;
            padding-right: 15px;
            transition:
              border-color 0.2s ease,
              box-shadow 0.2s ease;
          }

          .login-input:focus {
            border-color: #475569;
            box-shadow:
              0 0 0 4px rgba(71, 85, 105, 0.10);
          }

          .login-input::placeholder {
            color: #a1a8b3;
          }

          .login-button {
            min-height: 54px;
            border: 0;
            border-radius: 13px;
            background:
              linear-gradient(
                135deg,
                #111827,
                #334155
              );
            color: #ffffff !important;
            font-size: 15px;
            font-weight: 750;
            transition:
              transform 0.2s ease,
              box-shadow 0.2s ease,
              opacity 0.2s ease;
          }

          .login-button:hover:not(:disabled) {
            color: #ffffff !important;
            transform: translateY(-1px);
            box-shadow:
              0 12px 25px rgba(15, 23, 42, 0.18);
          }

          .login-button:active:not(:disabled) {
            transform: translateY(0);
          }

          .login-button:disabled,
          .login-button:disabled:hover,
          .login-button:disabled:focus,
          .login-button:disabled:active {
            color: #ffffff !important;
            background:
              linear-gradient(
                135deg,
                #475569,
                #64748b
              ) !important;
            border-color: transparent !important;
            opacity: 1 !important;
            cursor: wait;
            -webkit-text-fill-color: #ffffff;
          }

          .login-spinner {
            width: 18px;
            height: 18px;
            border-width: 2px;
            vertical-align: -3px;
          }

          .login-divider {
            height: 1px;
            margin: 30px 0 20px;
            background: #edf0f4;
          }

          .login-footer {
            margin: 0;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
          }

          .login-error {
            border: 1px solid #fecaca;
            border-radius: 12px;
            background: #fef2f2;
            color: #b91c1c;
            font-size: 14px;
          }

          .login-renewal {
            margin-top: 14px;
            padding-top: 14px;
            border-top: 1px solid #fecaca;
          }

          .login-renewal-text {
            margin-bottom: 10px;
            color: #7f1d1d;
            font-size: 13px;
          }

          .login-whatsapp-button {
            width: 100%;
            min-height: 44px;
            border: 0;
            border-radius: 11px;
            background: #128c7e;
            color: #ffffff;
            font-weight: 700;
            transition:
              transform 0.2s ease,
              box-shadow 0.2s ease;
          }

          .login-whatsapp-button:hover {
            color: #ffffff;
            transform: translateY(-1px);
            box-shadow:
              0 8px 18px rgba(18, 140, 126, 0.22);
          }

          @media (max-width: 520px) {
            .login-page {
              padding: 18px;
            }

            .login-card {
              padding: 34px 24px;
              border-radius: 20px;
            }

            .login-logo {
              width: 68px;
              height: 68px;
              border-radius: 19px;
              font-size: 23px;
            }

            .login-brand h2 {
              font-size: 25px;
            }
          }
        `}
      </style>

      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-logo">
              BS
            </div>

            <h2>
              Barberia SaaS
            </h2>

            <p>
              Gestión para barberías, salones y centros de belleza
            </p>
          </div>

          {error && (
            <div className="alert login-error mb-4">
              <div>{error}</div>

              {negocioInactivo && (
                <div className="login-renewal">
                  <div className="login-renewal-text">
                    ¿Deseas continuar utilizando Barberia SaaS? Escríbenos y te ayudamos a reactivar tu membresía.
                  </div>

                  <button
                    type="button"
                    className="login-whatsapp-button"
                    onClick={renovarMembresia}
                  >
                    💬 Contactar al administrador por WhatsApp
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={iniciarSesion}>
            <div className="mb-3">
              <label className="form-label login-form-label">
                Correo electrónico
              </label>

              <input
                type="email"
                className="form-control login-input"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="mb-2">
              <label className="form-label login-form-label">
                Contraseña
              </label>

              <input
                type="password"
                className="form-control login-input"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="text-end mb-4"><Link to="/olvide-password" className="text-decoration-none">¿Olvidaste tu contraseña?</Link></div>

            <button
              type="submit"
              className="btn login-button w-100"
              disabled={cargando}
            >
              {cargando ? (
                <span className="d-inline-flex align-items-center justify-content-center gap-2">
                  <span
                    className="spinner-border spinner-border-sm login-spinner"
                    aria-hidden="true"
                  />
                  <span>Ingresando...</span>
                </span>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>

          <div className="login-divider" />

          <p className="login-footer">
            Barberia SaaS · Plataforma de administración
          </p>
        </div>
      </div>
    </>
  );
}

export default Login;