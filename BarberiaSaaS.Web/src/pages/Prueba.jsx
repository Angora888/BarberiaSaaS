import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
  FaRocket,
  FaShieldAlt,
  FaCut
} from "react-icons/fa";
import api from "../services/api";

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
        .trial-brand-icon {
          width: 46px; height: 46px; display: inline-flex; align-items: center;
          justify-content: center; border-radius: 12px; color: var(--bs-gold);
          background: linear-gradient(145deg, #0b2256, #061538);
          border: 1px solid rgba(244,198,79,.28);
          box-shadow: 0 8px 24px rgba(0,0,0,.22);
          font-size: 20px;
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
              <span className="trial-brand-icon"><FaCut /></span>
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