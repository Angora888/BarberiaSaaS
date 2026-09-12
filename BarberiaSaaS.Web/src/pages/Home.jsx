import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCalendarAlt,
  FaChartBar,
  FaCheckCircle,
  FaCut,
  FaMoneyBillWave,
  FaPalette,
  FaShoppingBag,
  FaSpa,
  FaStore,
  FaUsers,
  FaUserTie
} from "react-icons/fa";

function Home() {
  const [menuAbierto, setMenuAbierto] =
    useState(false);

  const estaLogueado =
    Boolean(localStorage.getItem("token"));

  const irASeccion = (id) => {
    setMenuAbierto(false);

    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth"
      });
  };

  const rutaAcceso =
    estaLogueado
      ? "/dashboard"
      : "/login";

  const textoAcceso =
    estaLogueado
      ? "Volver al dashboard"
      : "Iniciar sesión";

  return (
    <div className="bg-white text-dark min-vh-100">
      <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top">
        <div className="container py-2">
          <button
            type="button"
            className="navbar-brand border-0 bg-transparent p-0 d-flex align-items-center gap-2"
            onClick={() => irASeccion("inicio")}
          >
            <span
              className="d-inline-flex align-items-center justify-content-center rounded-3 text-white"
              style={{
                width: 44,
                height: 44,
                background:
                  "linear-gradient(135deg, #c62864 0%, #7b1f45 100%)"
              }}
            >
              <FaSpa />
            </span>

            <span className="fw-bold fs-4">
              Barbería SaaS
            </span>
          </button>

          <button
            className="navbar-toggler"
            type="button"
            onClick={() =>
              setMenuAbierto((actual) => !actual)
            }
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div
            className={`collapse navbar-collapse ${
              menuAbierto ? "show" : ""
            }`}
          >
            <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
              <li className="nav-item">
                <button
                  className="nav-link border-0 bg-transparent"
                  onClick={() => irASeccion("funciones")}
                >
                  Funciones
                </button>
              </li>

              <li className="nav-item">
                <button
                  className="nav-link border-0 bg-transparent"
                  onClick={() => irASeccion("beneficios")}
                >
                  Beneficios
                </button>
              </li>

              <li className="nav-item">
                <button
                  className="nav-link border-0 bg-transparent"
                  onClick={() => irASeccion("como-funciona")}
                >
                  Cómo funciona
                </button>
              </li>

              <li className="nav-item ms-lg-2">
                <Link
                  to={rutaAcceso}
                  className="btn btn-outline-dark"
                >
                  {textoAcceso}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main>
        <section
          id="inicio"
          className="position-relative overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #fdf5f8 0%, #ffffff 100%)"
          }}
        >
          <div className="container py-5">
            <div className="row align-items-center g-5 py-lg-5">
              <div className="col-lg-6 py-4">
                <span className="badge rounded-pill border px-3 py-2 mb-3 bg-white text-dark">
                  <FaSpa className="me-2" />
                  Administración moderna para belleza y bienestar
                </span>

                <h1
                  className="display-3 fw-bold lh-1 mb-4"
                  style={{ letterSpacing: "-2px" }}
                >
                  Agenda, clientes, ventas y control de tu negocio en un solo lugar.
                </h1>

                <p className="lead text-secondary mb-4">
                  Una plataforma web para salones, barberías, spas y estudios de
                  belleza que quieren organizar citas, profesionales, servicios,
                  productos, inventario y resultados sin complicaciones.
                </p>

                <div className="d-flex flex-wrap gap-3">
                  <Link
                    to={rutaAcceso}
                    className="btn btn-dark btn-lg px-4"
                  >
                    {textoAcceso}
                    <FaArrowRight className="ms-2" />
                  </Link>

                  <button
                    type="button"
                    className="btn btn-outline-dark btn-lg px-4"
                    onClick={() => irASeccion("funciones")}
                  >
                    Ver funciones
                  </button>
                </div>

                <div className="d-flex flex-wrap gap-4 mt-5 text-secondary">
                  <div>
                    <FaCheckCircle className="text-success me-2" />
                    Fácil de usar
                  </div>
                  <div>
                    <FaCheckCircle className="text-success me-2" />
                    Acceso desde web
                  </div>
                  <div>
                    <FaCheckCircle className="text-success me-2" />
                    Multi-sucursal
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div
                  className="rounded-5 p-3 p-md-4 shadow-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, #c62864 0%, #6f173c 100%)"
                  }}
                >
                  <div className="bg-white rounded-4 overflow-hidden">
                    <div className="border-bottom p-3 d-flex align-items-center justify-content-between">
                      <div className="d-flex gap-2">
                        <span className="rounded-circle bg-danger d-block" style={{ width: 10, height: 10 }} />
                        <span className="rounded-circle bg-warning d-block" style={{ width: 10, height: 10 }} />
                        <span className="rounded-circle bg-success d-block" style={{ width: 10, height: 10 }} />
                      </div>
                      <small className="text-secondary">
                        Dashboard del negocio
                      </small>
                    </div>

                    <div className="p-4">
                      <div className="row g-3 mb-3">
                        {[
                          ["Ingresos hoy", "₡185,000"],
                          ["Citas", "12"],
                          ["Clientes", "248"],
                          ["Ventas", "₡42,500"]
                        ].map(([titulo, valor]) => (
                          <div className="col-6" key={titulo}>
                            <div className="border rounded-3 p-3 h-100">
                              <div className="small text-secondary">
                                {titulo}
                              </div>
                              <div className="fs-5 fw-bold mt-1">
                                {valor}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border rounded-3 p-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <strong>Próximas citas</strong>
                          <span className="badge rounded-pill text-bg-light">
                            Hoy
                          </span>
                        </div>

                        {[
                          ["9:00", "María Rodríguez", "Balayage"],
                          ["10:30", "Andrea Mora", "Corte y peinado"],
                          ["12:00", "Sofía Vargas", "Manicure"]
                        ].map(([hora, cliente, servicio]) => (
                          <div
                            key={`${hora}-${cliente}`}
                            className="d-flex justify-content-between gap-3 py-2 border-top"
                          >
                            <strong>{hora}</strong>
                            <div className="flex-grow-1">
                              <div className="fw-semibold">{cliente}</div>
                              <small className="text-secondary">{servicio}</small>
                            </div>
                            <FaCalendarAlt className="text-secondary mt-1" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-top border-bottom bg-white">
          <div className="container py-4">
            <div className="row g-4 text-center">
              {[
                ["Agenda", "Citas organizadas"],
                ["Clientes", "Historial centralizado"],
                ["Caja", "Ventas e ingresos"],
                ["Reportes", "Decisiones con datos"]
              ].map(([titulo, texto]) => (
                <div className="col-6 col-md-3" key={titulo}>
                  <div className="fw-bold fs-4">{titulo}</div>
                  <small className="text-secondary">{texto}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="funciones" className="py-5">
          <div className="container py-lg-5">
            <div className="text-center mx-auto mb-5" style={{ maxWidth: 780 }}>
              <span className="text-uppercase fw-semibold small text-secondary">
                Todo conectado
              </span>
              <h2 className="display-5 fw-bold mt-2">
                Las herramientas que necesita tu negocio cada día
              </h2>
              <p className="lead text-secondary">
                Menos trabajo manual y más tiempo para atender a tus clientes.
              </p>
            </div>

            <div className="row g-4">
              {[
                {
                  icono: <FaCalendarAlt />,
                  titulo: "Agenda inteligente",
                  texto: "Organiza citas por profesional, horarios, bloqueos, disponibilidad y duración real de cada servicio."
                },
                {
                  icono: <FaUsers />,
                  titulo: "Clientes",
                  texto: "Mantén los datos e historial de tus clientes organizados y disponibles cuando los necesites."
                },
                {
                  icono: <FaCut />,
                  titulo: "Servicios y variantes",
                  texto: "Administra servicios, precios y variantes como corto, medio o largo sin duplicar tu catálogo."
                },
                {
                  icono: <FaUserTie />,
                  titulo: "Profesionales",
                  texto: "Asigna servicios, horarios y actividad a cada profesional de tu equipo."
                },
                {
                  icono: <FaShoppingBag />,
                  titulo: "Productos, caja e inventario",
                  texto: "Vende productos, controla existencias por sucursal y registra movimientos automáticamente."
                },
                {
                  icono: <FaChartBar />,
                  titulo: "Dashboard y reportes",
                  texto: "Consulta ingresos, servicios, productos, métodos de pago y resultados por día, semana o mes."
                }
              ].map((item) => (
                <div className="col-md-6 col-lg-4" key={item.titulo}>
                  <div className="card border-0 shadow-sm h-100 rounded-4">
                    <div className="card-body p-4">
                      <div
                        className="d-inline-flex align-items-center justify-content-center text-white rounded-3 mb-4"
                        style={{
                          width: 52,
                          height: 52,
                          background: "#c62864",
                          fontSize: 22
                        }}
                      >
                        {item.icono}
                      </div>
                      <h4 className="fw-bold">{item.titulo}</h4>
                      <p className="text-secondary mb-0">{item.texto}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="beneficios" className="py-5 bg-light">
          <div className="container py-lg-5">
            <div className="row align-items-center g-5">
              <div className="col-lg-5">
                <span className="text-uppercase fw-semibold small text-secondary">
                  Beneficios
                </span>
                <h2 className="display-5 fw-bold mt-2">
                  Más control sin complicar tu operación
                </h2>
                <p className="lead text-secondary">
                  Diseñado para que el equipo lo aprenda rápido y la administración
                  tenga una visión clara del negocio.
                </p>
              </div>

              <div className="col-lg-7">
                <div className="row g-3">
                  {[
                    [<FaCalendarAlt />, "Menos desorden", "Agenda, horarios, bloqueos y profesionales permanecen en un único sistema."],
                    [<FaMoneyBillWave />, "Control de ingresos", "Separa ingresos por servicios y productos y consulta tus resultados diarios."],
                    [<FaStore />, "Preparado para crecer", "La arquitectura multi-tenant y multi-sucursal permite crecer sin rehacer el sistema."],
                    [<FaPalette />, "Tu propia identidad", "Personaliza logo, colores, moneda, zona horaria y datos del negocio desde Configuración."]
                  ].map(([icono, titulo, texto]) => (
                    <div className="col-md-6" key={titulo}>
                      <div className="bg-white rounded-4 p-4 h-100 shadow-sm">
                        <div className="fs-3 mb-3" style={{ color: "#c62864" }}>
                          {icono}
                        </div>
                        <h5 className="fw-bold">{titulo}</h5>
                        <p className="text-secondary mb-0">{texto}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="py-5">
          <div className="container py-lg-5">
            <div className="text-center mx-auto mb-5" style={{ maxWidth: 720 }}>
              <span className="text-uppercase fw-semibold small text-secondary">
                Cómo funciona
              </span>
              <h2 className="display-5 fw-bold mt-2">
                Empieza a trabajar en pocos pasos
              </h2>
            </div>

            <div className="row g-4">
              {[
                ["01", "Configura tu negocio", "Define identidad, moneda, horarios, sucursales, servicios y profesionales."],
                ["02", "Organiza tu operación", "Registra clientes, agenda citas, administra productos y controla inventario."],
                ["03", "Mide tus resultados", "Consulta dashboard y reportes para conocer ingresos y rendimiento del negocio."]
              ].map(([numero, titulo, texto]) => (
                <div className="col-md-4" key={numero}>
                  <div className="h-100 p-4 border rounded-4">
                    <div
                      className="fw-bold fs-2 mb-3"
                      style={{ color: "#c62864" }}
                    >
                      {numero}
                    </div>
                    <h4 className="fw-bold">{titulo}</h4>
                    <p className="text-secondary mb-0">{texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-5">
          <div className="container">
            <div
              className="rounded-5 p-5 text-white text-center"
              style={{
                background:
                  "linear-gradient(135deg, #c62864 0%, #641633 100%)"
              }}
            >
              <FaSpa size={38} className="mb-3" />
              <h2 className="display-6 fw-bold">
                Todo tu negocio, más organizado.
              </h2>
              <p className="lead opacity-75 mx-auto" style={{ maxWidth: 700 }}>
                Agenda, equipo, clientes, productos, caja e información financiera
                desde una plataforma creada para negocios de belleza y bienestar.
              </p>
              <Link
                to={rutaAcceso}
                className="btn btn-light btn-lg px-4 mt-2"
              >
                {textoAcceso}
                <FaArrowRight className="ms-2" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-top bg-white">
        <div className="container py-4 d-flex flex-wrap justify-content-between gap-3 text-secondary">
          <span>© {new Date().getFullYear()} Barbería SaaS</span>
          <span>Gestión para salones, barberías y spas</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
