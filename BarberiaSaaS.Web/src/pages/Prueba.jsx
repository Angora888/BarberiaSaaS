import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
  FaRocket,
  FaShieldAlt,} from "react-icons/fa";
import api from "../services/api";

const BRAND_LOGO = "data:image/webp;base64,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";

const PAISES = [
  { codigo: "CR", nombre: "Costa Rica", bandera: "🇨🇷", prefijo: "+506", placeholder: "8888 8888" },
  { codigo: "PA", nombre: "Panamá", bandera: "🇵🇦", prefijo: "+507", placeholder: "6000 0000" },
  { codigo: "NI", nombre: "Nicaragua", bandera: "🇳🇮", prefijo: "+505", placeholder: "8888 8888" },
  { codigo: "HN", nombre: "Honduras", bandera: "🇭🇳", prefijo: "+504", placeholder: "9999 9999" },
  { codigo: "SV", nombre: "El Salvador", bandera: "🇸🇻", prefijo: "+503", placeholder: "7000 0000" },
  { codigo: "GT", nombre: "Guatemala", bandera: "🇬🇹", prefijo: "+502", placeholder: "5555 5555" },
  { codigo: "BZ", nombre: "Belice", bandera: "🇧🇿", prefijo: "+501", placeholder: "600 0000" },
  { codigo: "US", nombre: "Estados Unidos", bandera: "🇺🇸", prefijo: "+1", placeholder: "305 555 0123" }
];

const estadoInicial = {
  nombreNegocio: "",
  identificacion: "",
  paisCodigo: "CR",
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
    const valor = name === "telefono" ? value.replace(/\D/g, "").slice(0, 15) : value;

    setFormulario((actual) => ({
      ...actual,
      [name]: valor
    }));
  };

  const registrarNegocio = async (e) => {
    e.preventDefault();

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
        paisCodigo: formulario.paisCodigo,
        telefono: formulario.telefono || null,
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
          --bs-navy: #071a46;
          --bs-navy-2: #102b63;
          --bs-gold: #f4c64f;
          --bs-gold-2: #ffdc73;
          min-height: 100vh;
          color: #111827;
          background:
            radial-gradient(circle at 88% 8%, rgba(244,198,79,.13), transparent 28%),
            radial-gradient(circle at 12% 92%, rgba(7,26,70,.07), transparent 30%),
            #f7f8fc;
        }
        .trial-nav {
          background: rgba(7, 26, 70, .97);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,.09);
        }
        .trial-brand-logo {
          width: 46px; height: 46px; border-radius: 12px; object-fit: cover;
          box-shadow: 0 8px 24px rgba(0,0,0,.22);
        }
        .trial-brand-name { color: #fff; font-weight: 800; letter-spacing: -.4px; }
        .trial-brand-name span { color: var(--bs-gold); }
        .trial-nav-link {
          color: rgba(255,255,255,.86) !important;
          font-weight: 700;
          border-color: rgba(255,255,255,.35) !important;
        }
        .trial-nav-link:hover { color: var(--bs-gold) !important; border-color: var(--bs-gold) !important; }
        .trial-nav-login {
          background: var(--bs-gold);
          border-color: var(--bs-gold);
          color: #0b1738;
          font-weight: 800;
        }
        .trial-nav-login:hover {
          background: var(--bs-gold-2);
          border-color: var(--bs-gold-2);
          color: #0b1738;
        }
        .trial-shell { max-width: 1120px; margin: 0 auto; padding: 54px 20px 70px; }
        .trial-kicker {
          display: inline-flex; align-items: center; gap: 8px; padding: 9px 14px;
          border-radius: 999px; color: #9a7110; border: 1px solid rgba(244,198,79,.55);
          background: rgba(244,198,79,.14); font-weight: 800; font-size: .9rem;
        }
        .trial-heading { color: var(--bs-navy); letter-spacing: -1.4px; }
        .trial-info-card, .trial-form-card, .trial-success-card {
          background: #fff; border: 1px solid #e5e9f0; border-radius: 26px;
          box-shadow: 0 24px 70px rgba(7, 26, 70, 0.09);
        }
        .trial-info-card {
          height: 100%; padding: 38px; color: #fff;
          background:
            radial-gradient(circle at 85% 12%, rgba(244,198,79,.18), transparent 30%),
            linear-gradient(145deg, var(--bs-navy) 0%, var(--bs-navy-2) 100%);
          border: none;
        }
        .trial-info-pill {
          display: inline-flex; align-items: center; gap: 8px; padding: 8px 13px;
          border-radius: 999px; color: var(--bs-gold-2);
          background: rgba(244,198,79,.08);
          border: 1px solid rgba(244,198,79,.30); font-size: 13px; font-weight: 700;
        }
        .trial-feature {
          display: flex; gap: 12px; align-items: flex-start; padding: 14px 0;
          border-top: 1px solid rgba(255,255,255,.10);
        }
        .trial-feature:first-of-type { border-top: 0; }
        .trial-check { margin-top: 3px; color: var(--bs-gold); }
        .trial-form-card { padding: 38px; }
        .trial-form-card h3 { color: var(--bs-navy); }
        .trial-label { color: #344054; font-size: 14px; font-weight: 700; margin-bottom: 7px; }
        .trial-input {
          min-height: 50px; border-radius: 13px; border: 1px solid #d9dee7;
          box-shadow: none !important;
        }
        .trial-input:focus {
          border-color: #c89b24;
          box-shadow: 0 0 0 .2rem rgba(244,198,79,.16) !important;
        }
        .trial-phone-group {
          display: flex; align-items: stretch; min-height: 50px; border: 1px solid #d9dee7;
          border-radius: 13px; overflow: hidden; background: #fff; transition: border-color .15s ease, box-shadow .15s ease;
        }
        .trial-phone-group:focus-within {
          border-color: #c89b24;
          box-shadow: 0 0 0 .2rem rgba(244,198,79,.16);
        }
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
        .trial-phone-help { margin-top: 6px; color: #667085; font-size: 12px; }
        .trial-submit {
          min-height: 54px; border: 0; border-radius: 14px;
          background: var(--bs-gold); color: #0b1738; font-weight: 850;
          box-shadow: 0 10px 24px rgba(244,198,79,.25);
        }
        .trial-submit:hover:not(:disabled) {
          background: var(--bs-gold-2); color: #0b1738; transform: translateY(-1px);
        }
        .trial-password-wrap { position: relative; }
        .trial-password-wrap .trial-input { padding-right: 52px; }
        .trial-eye {
          position: absolute; top: 50%; right: 13px; transform: translateY(-50%);
          border: 0; background: transparent; color: #667085; padding: 7px;
        }
        .trial-success-card {
          max-width: 760px; margin: 24px auto 0; padding: 50px 42px; text-align: center;
        }
        .trial-success-card h1 { color: var(--bs-navy); }
        .trial-success-icon {
          width: 84px; height: 84px; margin: 0 auto 22px; display: flex;
          align-items: center; justify-content: center; border-radius: 50%;
          background: rgba(244,198,79,.18); color: #9a7110; font-size: 42px;
        }
        .trial-credential {
          padding: 16px 18px; border-radius: 14px; background: #f8fafc;
          border: 1px solid #e5e7eb;
        }
        .trial-dark-btn {
          background: var(--bs-navy); border-color: var(--bs-navy); color: #fff;
          font-weight: 800;
        }
        .trial-dark-btn:hover { background: var(--bs-navy-2); border-color: var(--bs-navy-2); color: #fff; }
        .trial-outline-btn {
          border-color: var(--bs-navy); color: var(--bs-navy); font-weight: 800;
        }
        .trial-outline-btn:hover { background: var(--bs-navy); color: #fff; }
        @media (max-width: 767px) {
          .trial-shell { padding-top: 30px; }
          .trial-info-card, .trial-form-card { padding: 27px 22px; border-radius: 21px; }
          .trial-success-card { padding: 36px 22px; border-radius: 21px; }
        }
      `}</style>

      <div className="trial-page">
        <nav className="trial-nav sticky-top">
          <div className="container py-3 d-flex align-items-center justify-content-between gap-3">
            <Link to="/" className="text-decoration-none d-flex align-items-center gap-2">
              <img src={BRAND_LOGO} alt="Barbería SaaS" className="trial-brand-logo" />
              <span className="trial-brand-name fs-5">Barbería <span>SaaS</span></span>
            </Link>
            <div className="d-flex gap-2">
              <Link to="/manual" className="btn btn-outline-light trial-nav-link d-none d-sm-inline-flex">Ver manual</Link>
              <Link to="/login" className="btn trial-nav-login">Iniciar sesión</Link>
            </div>
          </div>
        </nav>

        <main className="trial-shell">
          {!registro ? (
            <>
              <div className="text-center mx-auto mb-5" style={{ maxWidth: 760 }}>
                <span className="trial-kicker mb-3">
                  <FaRocket /> Empieza por tu cuenta
                </span>
                <h1 className="display-5 fw-bold mb-3 trial-heading">¿Te gustaría probar Barbería SaaS?</h1>
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
                          <input type="text" className="form-control trial-input" name="identificacion" value={formulario.identificacion} onChange={manejarCambio} placeholder="Identificación del negocio" />
                        </div>

                        <div className="col-md-6">
                          <label className="trial-label">País *</label>
                          <select className="form-select trial-input" name="paisCodigo" value={formulario.paisCodigo} onChange={manejarCambio} required>
                            {PAISES.map((pais) => (
                              <option key={pais.codigo} value={pais.codigo}>{pais.bandera} {pais.nombre}</option>
                            ))}
                          </select>
                        </div>

                        <div className="col-12">
                          <label className="trial-label">Teléfono *</label>
                          <div className="trial-phone-group">
                            <div className="trial-phone-prefix" aria-hidden="true">
                              <span className="trial-phone-flag">{PAISES.find((p) => p.codigo === formulario.paisCodigo)?.bandera}</span>
                              <span>{PAISES.find((p) => p.codigo === formulario.paisCodigo)?.prefijo}</span>
                            </div>
                            <input
                              type="tel"
                              inputMode="numeric"
                              autoComplete="tel-national"
                              className="form-control trial-input trial-phone-input"
                              name="telefono"
                              value={formulario.telefono}
                              onChange={manejarCambio}
                              placeholder={PAISES.find((p) => p.codigo === formulario.paisCodigo)?.placeholder}
                              maxLength={15}
                              required
                            />
                          </div>
                          <div className="trial-phone-help">Ingresa tu número nacional. Lo validaremos para el país seleccionado y lo guardaremos en formato internacional.</div>
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

                      <button type="submit" className="btn trial-submit w-100 mt-4" disabled={cargando}>
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
                <Link to="/login" className="btn trial-dark-btn btn-lg px-4">Ir a iniciar sesión</Link>
                <Link to="/manual" className="btn trial-outline-btn btn-lg px-4">Ver manual de la aplicación</Link>
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