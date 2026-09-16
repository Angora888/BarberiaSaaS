import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
  FaRocket,
  FaShieldAlt,
  FaSpa
} from "react-icons/fa";
import api from "../services/api";

const estadoInicial = {
  nombreNegocio: "",
  identificacion: "",
  telefono: "",
  nombrePropietario: "",
  apellidosPropietario: "",
  email: "",
  password: "",
  confirmarPassword: ""
};

function Prueba() {
  const [formulario, setFormulario] = useState(estadoInicial);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [registro, setRegistro] = useState(null);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    const valor = name === "telefono" ? value.replace(/\D/g, "").slice(0, 8) : value;

    setFormulario((actual) => ({
      ...actual,
      [name]: valor
    }));
  };

  const registrarNegocio = async (e) => {
    e.preventDefault();

    if (formulario.telefono && formulario.telefono.length !== 8) {
      setError("El teléfono debe contener exactamente 8 números.");
      return;
    }

    if (formulario.password !== formulario.confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (formulario.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      setCargando(true);
      setError("");

      const response = await api.post("/Auth/registrar-negocio", {
        nombreNegocio: formulario.nombreNegocio.trim(),
        identificacion: formulario.identificacion.trim() || null,
        telefono: formulario.telefono ? `+506${formulario.telefono}` : null,
        nombrePropietario: formulario.nombrePropietario.trim(),
        apellidosPropietario: formulario.apellidosPropietario.trim(),
        email: formulario.email.trim(),
        password: formulario.password
      });

      setRegistro({ ...response.data, email: formulario.email.trim() });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No fue posible registrar el negocio. Intenta nuevamente."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <style>{`
        .trial-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(198, 40, 100, 0.08), transparent 34%),
            radial-gradient(circle at bottom right, rgba(17, 24, 39, 0.08), transparent 32%),
            #f7f8fa;
        }
        .trial-nav {
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid #e8ebef;
        }
        .trial-brand-icon {
          width: 42px; height: 42px; display: inline-flex; align-items: center;
          justify-content: center; border-radius: 13px; color: #fff;
          background: linear-gradient(135deg, #111827 0%, #374151 100%);
        }
        .trial-shell { max-width: 1120px; margin: 0 auto; padding: 54px 20px 70px; }
        .trial-info-card, .trial-form-card, .trial-success-card {
          background: #fff; border: 1px solid #e5e7eb; border-radius: 26px;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
        }
        .trial-info-card {
          height: 100%; padding: 38px; color: #fff;
          background: linear-gradient(145deg, #111827 0%, #283548 100%); border: none;
        }
        .trial-info-pill {
          display: inline-flex; align-items: center; gap: 8px; padding: 8px 13px;
          border-radius: 999px; background: rgba(255,255,255,.10);
          border: 1px solid rgba(255,255,255,.13); font-size: 13px; font-weight: 700;
        }
        .trial-feature {
          display: flex; gap: 12px; align-items: flex-start; padding: 14px 0;
          border-top: 1px solid rgba(255,255,255,.10);
        }
        .trial-feature:first-of-type { border-top: 0; }
        .trial-check { margin-top: 3px; color: #86efac; }
        .trial-form-card { padding: 38px; }
        .trial-label { color: #374151; font-size: 14px; font-weight: 700; margin-bottom: 7px; }
        .trial-input {
          min-height: 50px; border-radius: 13px; border: 1px solid #d9dee7;
          box-shadow: none !important;
        }
        .trial-input:focus { border-color: #6b7280; }
        .trial-phone-group {
          display: flex; align-items: stretch; min-height: 50px; border: 1px solid #d9dee7;
          border-radius: 13px; overflow: hidden; background: #fff; transition: border-color .15s ease;
        }
        .trial-phone-group:focus-within { border-color: #6b7280; }
        .trial-phone-prefix {
          display: flex; align-items: center; gap: 8px; padding: 0 12px;
          background: #f8fafc; border-right: 1px solid #e5e7eb; color: #374151;
          font-weight: 700; white-space: nowrap;
        }
        .trial-phone-flag { font-size: 22px; line-height: 1; }
        .trial-phone-input {
          flex: 1; min-width: 0; border: 0 !important; border-radius: 0 !important;
          box-shadow: none !important; padding-left: 12px;
        }
        .trial-phone-help { margin-top: 6px; color: #6b7280; font-size: 12px; }
        .trial-submit {
          min-height: 54px; border: 0; border-radius: 14px;
          background: linear-gradient(135deg, #c62864 0%, #8f204d 100%); font-weight: 800;
        }
        .trial-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #b9235a 0%, #7f1d46 100%);
        }
        .trial-password-wrap { position: relative; }
        .trial-password-wrap .trial-input { padding-right: 52px; }
        .trial-eye {
          position: absolute; top: 50%; right: 13px; transform: translateY(-50%);
          border: 0; background: transparent; color: #6b7280; padding: 7px;
        }
        .trial-success-card {
          max-width: 760px; margin: 24px auto 0; padding: 50px 42px; text-align: center;
        }
        .trial-success-icon {
          width: 84px; height: 84px; margin: 0 auto 22px; display: flex;
          align-items: center; justify-content: center; border-radius: 50%;
          background: #ecfdf3; color: #16803c; font-size: 42px;
        }
        .trial-credential {
          padding: 16px 18px; border-radius: 14px; background: #f8fafc;
          border: 1px solid #e5e7eb;
        }
        @media (max-width: 767px) {
          .trial-shell { padding-top: 30px; }
          .trial-info-card, .trial-form-card { padding: 27px 22px; border-radius: 21px; }
          .trial-success-card { padding: 36px 22px; border-radius: 21px; }
        }
      `}</style>

      <div className="trial-page">
        <nav className="trial-nav sticky-top">
          <div className="container py-3 d-flex align-items-center justify-content-between gap-3">
            <Link to="/" className="text-decoration-none text-dark d-flex align-items-center gap-2">
              <span className="trial-brand-icon"><FaSpa /></span>
              <span className="fw-bold fs-5">Barbería SaaS</span>
            </Link>
            <div className="d-flex gap-2">
              <Link to="/manual" className="btn btn-outline-secondary d-none d-sm-inline-flex">Ver manual</Link>
              <Link to="/login" className="btn btn-dark">Iniciar sesión</Link>
            </div>
          </div>
        </nav>

        <main className="trial-shell">
          {!registro ? (
            <>
              <div className="text-center mx-auto mb-5" style={{ maxWidth: 760 }}>
                <span className="badge rounded-pill text-bg-light border px-3 py-2 mb-3">
                  <FaRocket className="me-2" /> Empieza por tu cuenta
                </span>
                <h1 className="display-5 fw-bold mb-3">¿Te gustaría probar Barbería SaaS?</h1>
                <p className="lead text-secondary mb-0">
                  Registra tu negocio y empieza a explorar la aplicación inmediatamente.
                  Solo necesitas completar tus datos y crear tu acceso.
                </p>
              </div>

              <div className="row g-4 align-items-stretch">
                <div className="col-lg-5">
                  <div className="trial-info-card">
                    <span className="trial-info-pill mb-4"><FaShieldAlt /> Tu negocio queda separado de los demás</span>
                    <h2 className="fw-bold mb-3">Todo listo para comenzar a organizar tu negocio.</h2>
                    <p className="text-white-50 mb-4">
                      Al registrarte crearemos automáticamente tu negocio, una sucursal principal y tu usuario propietario.
                    </p>
                    {[
                      "Configura servicios, variantes y profesionales.",
                      "Administra agenda, clientes y horarios.",
                      "Controla productos, inventario y ventas.",
                      "Registra cobros y cuentas por cobrar.",
                      "Consulta dashboard y reportes del negocio."
                    ].map((texto) => (
                      <div className="trial-feature" key={texto}>
                        <FaCheckCircle className="trial-check" /><span>{texto}</span>
                      </div>
                    ))}
                    <div className="mt-4 pt-3 border-top border-secondary">
                      <small className="text-white-50">
                        Consejo: después de entrar, empieza por Configuración, Servicios y Profesionales. El manual te guía paso a paso.
                      </small>
                    </div>
                  </div>
                </div>

                <div className="col-lg-7">
                  <div className="trial-form-card">
                    <div className="mb-4">
                      <h3 className="fw-bold mb-1">Crea tu negocio</h3>
                      <p className="text-secondary mb-0">Los campos marcados con * son requeridos.</p>
                    </div>

                    {error && <div className="alert alert-danger rounded-3">{error}</div>}

                    <form onSubmit={registrarNegocio}>
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="trial-label">Nombre del negocio *</label>
                          <input type="text" className="form-control trial-input" name="nombreNegocio" value={formulario.nombreNegocio} onChange={manejarCambio} placeholder="Ej. Barbería El Patrón" required />
                        </div>

                        <div className="col-md-6">
                          <label className="trial-label">Identificación</label>
                          <input type="text" className="form-control trial-input" name="identificacion" value={formulario.identificacion} onChange={manejarCambio} placeholder="Cédula física o jurídica" />
                        </div>

                        <div className="col-md-6">
                          <label className="trial-label">Teléfono</label>
                          <div className="trial-phone-group">
                            <div className="trial-phone-prefix" aria-hidden="true">
                              <span className="trial-phone-flag">🇨🇷</span>
                              <span>+506</span>
                            </div>
                            <input
                              type="tel"
                              inputMode="numeric"
                              autoComplete="tel-national"
                              className="form-control trial-input trial-phone-input"
                              name="telefono"
                              value={formulario.telefono}
                              onChange={manejarCambio}
                              placeholder="8888 8888"
                              maxLength={8}
                              pattern="[0-9]{8}"
                              title="Ingresa 8 números"
                            />
                          </div>
                          <div className="trial-phone-help">Ingresa solo 8 números. Guardaremos el teléfono con el código +506.</div>
                        </div>

                        <div className="col-md-6">
                          <label className="trial-label">Nombre del propietario *</label>
                          <input type="text" className="form-control trial-input" name="nombrePropietario" value={formulario.nombrePropietario} onChange={manejarCambio} placeholder="Nombre" required />
                        </div>

                        <div className="col-md-6">
                          <label className="trial-label">Apellidos</label>
                          <input type="text" className="form-control trial-input" name="apellidosPropietario" value={formulario.apellidosPropietario} onChange={manejarCambio} placeholder="Apellidos" />
                        </div>

                        <div className="col-12">
                          <label className="trial-label">Correo electrónico *</label>
                          <input type="email" className="form-control trial-input" name="email" value={formulario.email} onChange={manejarCambio} placeholder="correo@ejemplo.com" autoComplete="email" required />
                        </div>

                        <div className="col-md-6">
                          <label className="trial-label">Contraseña *</label>
                          <div className="trial-password-wrap">
                            <input type={mostrarPassword ? "text" : "password"} className="form-control trial-input" name="password" value={formulario.password} onChange={manejarCambio} placeholder="Mínimo 8 caracteres" autoComplete="new-password" minLength={8} required />
                            <button type="button" className="trial-eye" onClick={() => setMostrarPassword((actual) => !actual)} aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                              {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label className="trial-label">Confirmar contraseña *</label>
                          <input type={mostrarPassword ? "text" : "password"} className="form-control trial-input" name="confirmarPassword" value={formulario.confirmarPassword} onChange={manejarCambio} placeholder="Repite la contraseña" autoComplete="new-password" minLength={8} required />
                        </div>
                      </div>

                      <button type="submit" className="btn btn-primary trial-submit w-100 mt-4" disabled={cargando}>
                        {cargando ? "Creando tu negocio..." : "Crear mi negocio y empezar a probar"}
                      </button>

                      <p className="small text-secondary text-center mt-3 mb-0">
                        Te enviaremos un correo de confirmación a la dirección proporcionada. Debes confirmar tu correo para activar tu negocio y comenzar el período de prueba.
                      </p>
                    </form>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="trial-success-card">
              <div className="trial-success-icon"><FaCheckCircle /></div>
              <span className="badge text-bg-success rounded-pill px-3 py-2 mb-3">Registro completado</span>
              <h1 className="fw-bold mb-3">¡Listo! Tu negocio ya fue registrado.</h1>
              <p className="lead text-secondary mb-2">
                Revisa tu correo electrónico y confirma tu cuenta para activar el negocio y comenzar tu período de prueba.
              </p>
              <div className="alert alert-warning py-2 px-3 mb-4" role="alert">
                <strong>¿No ves el correo?</strong> Revisa también tu carpeta de Spam o Correo no deseado.
              </div>
              <div className="trial-credential text-start mb-4">
                <div className="small text-secondary mb-1">Negocio</div>
                <div className="fw-bold mb-3">{registro.negocio || formulario.nombreNegocio}</div>
                <div className="small text-secondary mb-1">Correo registrado</div>
                <div className="fw-bold text-break">{registro.email}</div>
                <div className="small text-secondary mt-3">
                  Después de confirmar el correo podrás iniciar sesión con la contraseña que acabas de crear.
                </div>
              </div>
              <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
                <Link to="/login" className="btn btn-dark btn-lg px-4">Ir a iniciar sesión</Link>
                <Link to="/manual" className="btn btn-outline-dark btn-lg px-4">Ver manual de la aplicación</Link>
              </div>
              <Link to="/" className="d-inline-flex align-items-center gap-2 mt-4 text-secondary text-decoration-none">
                <FaArrowLeft /> Volver al inicio
              </Link>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default Prueba;