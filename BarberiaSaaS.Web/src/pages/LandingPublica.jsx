import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useParams
} from "react-router-dom";

import {
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaFacebookF,
  FaInstagram,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaWhatsapp
} from "react-icons/fa";

import api from "../services/api";

import "./LandingPublica.css";

const formatearHoraPublica = (hora) => {
  if (!hora) return "";

  const match = String(hora).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return hora;

  const horas24 = Number(match[1]);
  const minutos = match[2];
  const periodo = horas24 >= 12 ? "PM" : "AM";
  const horas12 = horas24 % 12 || 12;

  return `${horas12}:${minutos} ${periodo}`;
};

function LandingPublica() {
  const { slug } = useParams();

  const [landing, setLanding] =
    useState(null);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  const [servicioId, setServicioId] =
    useState("");

  const [
    profesionalId,
    setProfesionalId
  ] = useState("");

  const [
    duracionMinutos,
    setDuracionMinutos
  ] = useState(60);

  const [
    mesActual,
    setMesActual
  ] = useState(() => {
    const hoy = new Date();

    return new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      1
    );
  });

  const [
    disponibilidad,
    setDisponibilidad
  ] = useState(null);

  const [
    cargandoDisponibilidad,
    setCargandoDisponibilidad
  ] = useState(false);

  const [
    fechaSeleccionada,
    setFechaSeleccionada
  ] = useState(null);

  useEffect(() => {
    cargarLanding();
  }, [slug]);

  useEffect(() => {
    if (
      servicioId &&
      landing
    ) {
      cargarDisponibilidad();
    } else {
      setDisponibilidad(null);
      setFechaSeleccionada(null);
    }
  }, [
    servicioId,
    profesionalId,
    duracionMinutos,
    mesActual,
    landing
  ]);

  const cargarLanding = async () => {
    try {
      setCargando(true);
      setError("");

      const response =
        await api.get(
          `/Publico/${slug}`
        );

      setLanding(
        response.data
      );

      const servicios =
        response.data?.servicios || [];

      if (servicios.length > 0) {
        setServicioId(
          String(servicios[0].id)
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.mensaje ||
          "No fue posible cargar esta página."
      );
    } finally {
      setCargando(false);
    }
  };

  const cargarDisponibilidad =
    async () => {
      try {
        setCargandoDisponibilidad(
          true
        );

        setFechaSeleccionada(null);

        const anio =
          mesActual.getFullYear();

        const mes =
          mesActual.getMonth();

        const hoy = new Date();

        const esMesActual =
          hoy.getFullYear() === anio &&
          hoy.getMonth() === mes;

        const fechaInicio =
          esMesActual
            ? hoy
            : new Date(
                anio,
                mes,
                1
              );

        const ultimoDia =
          new Date(
            anio,
            mes + 1,
            0
          );

        const diferencia =
          Math.floor(
            (
              normalizarFecha(
                ultimoDia
              ) -
              normalizarFecha(
                fechaInicio
              )
            ) /
              86400000
          ) + 1;

        const params = {
          servicioId:
            Number(servicioId),

          duracionMinutos:
            Number(
              duracionMinutos
            ),

          desde:
            formatearFechaApi(
              fechaInicio
            ),

          dias:
            diferencia
        };

        if (profesionalId) {
          params.profesionalId =
            Number(
              profesionalId
            );
        }

        const response =
          await api.get(
            `/Publico/${slug}/disponibilidad`,
            {
              params
            }
          );

        setDisponibilidad(
          response.data
        );
      } catch (err) {
        console.error(err);

        setDisponibilidad({
          dias: []
        });
      } finally {
        setCargandoDisponibilidad(
          false
        );
      }
    };

  const normalizarFecha = (
    fecha
  ) => {
    return new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      fecha.getDate()
    );
  };

  const formatearFechaApi = (
    fecha
  ) => {
    const year =
      fecha.getFullYear();

    const month =
      String(
        fecha.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        fecha.getDate()
      ).padStart(
        2,
        "0"
      );

    return `${year}-${month}-${day}`;
  };

  const moneda = (
    valor
  ) => {
    const monedaCodigo =
      landing?.branding?.moneda ||
      "CRC";

    return new Intl.NumberFormat(
      "es-CR",
      {
        style: "currency",
        currency:
          monedaCodigo,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    ).format(
      Number(valor || 0)
    );
  };

  const profesionalesServicio =
    useMemo(() => {
      if (!landing) {
        return [];
      }

      if (!servicioId) {
        return (
          landing.profesionales ||
          []
        );
      }

      return (
        landing.profesionales ||
        []
      ).filter(
        (profesional) =>
          (
            profesional.servicios ||
            []
          ).some(
            (servicio) =>
              Number(
                servicio.id
              ) ===
              Number(
                servicioId
              )
          )
      );
    }, [
      landing,
      servicioId
    ]);

  useEffect(() => {
    if (
      profesionalId &&
      !profesionalesServicio.some(
        (profesional) =>
          String(
            profesional.id
          ) ===
          String(
            profesionalId
          )
      )
    ) {
      setProfesionalId("");
    }
  }, [
    profesionalesServicio,
    profesionalId
  ]);

  const diasCalendario =
    useMemo(() => {
      const year =
        mesActual.getFullYear();

      const month =
        mesActual.getMonth();

      const primerDia =
        new Date(
          year,
          month,
          1
        );

      const ultimoDia =
        new Date(
          year,
          month + 1,
          0
        );

      const lunesPrimeraSemana =
        (
          primerDia.getDay() +
          6
        ) % 7;

      const resultado = [];

      for (
        let i = 0;
        i <
        lunesPrimeraSemana;
        i++
      ) {
        resultado.push(null);
      }

      for (
        let dia = 1;
        dia <=
        ultimoDia.getDate();
        dia++
      ) {
        resultado.push(
          new Date(
            year,
            month,
            dia
          )
        );
      }

      while (
        resultado.length %
          7 !==
        0
      ) {
        resultado.push(null);
      }

      return resultado;
    }, [mesActual]);

  const mapaDisponibilidad =
    useMemo(() => {
      const mapa = {};

      (
        disponibilidad?.dias ||
        []
      ).forEach((dia) => {
        mapa[dia.fecha] = dia;
      });

      return mapa;
    }, [disponibilidad]);

  const detalleFecha =
    useMemo(() => {
      if (!fechaSeleccionada) {
        return null;
      }

      return mapaDisponibilidad[
        fechaSeleccionada
      ] || null;
    }, [
      fechaSeleccionada,
      mapaDisponibilidad
    ]);

  const cambiarMes = (
    incremento
  ) => {
    setMesActual(
      (actual) =>
        new Date(
          actual.getFullYear(),
          actual.getMonth() +
            incremento,
          1
        )
    );
  };

  const esFechaPasada = (
    fecha
  ) => {
    const hoy =
      normalizarFecha(
        new Date()
      );

    return (
      normalizarFecha(
        fecha
      ) < hoy
    );
  };

  const formatearNombreMes = () => {
    return new Intl.DateTimeFormat(
      "es-CR",
      {
        month: "long",
        year: "numeric"
      }
    ).format(
      mesActual
    );
  };

  const formatearFechaBonita = (
    valor
  ) => {
    if (!valor) {
      return "";
    }

    const [
      year,
      month,
      day
    ] =
      valor
        .split("-")
        .map(Number);

    return new Intl.DateTimeFormat(
      "es-CR",
      {
        weekday: "long",
        day: "numeric",
        month: "long"
      }
    ).format(
      new Date(
        year,
        month - 1,
        day
      )
    );
  };

  const normalizarWhatsapp = (
    numero
  ) => {
    if (!numero) {
      return "";
    }

    let limpio =
      String(numero)
        .replace(
          /\D/g,
          ""
        );

    return limpio;
  };

  const whatsapp =
    normalizarWhatsapp(
      landing?.contacto
        ?.whatsapp ||
        landing?.negocio
          ?.telefono
    );

  const colores = {
    "--landing-primary":
      landing?.branding
        ?.colorPrimario ||
      "#c62864",

    "--landing-secondary":
      landing?.branding
        ?.colorSecundario ||
      "#f8e7ee",

    "--landing-background":
      landing?.branding
        ?.colorFondo ||
      "#ffffff"
  };

  if (cargando) {
    return (
      <div className="landing-publica-cargando">
        <div className="landing-publica-spinner" />

        <p>
          Cargando...
        </p>
      </div>
    );
  }

  if (
    error ||
    !landing
  ) {
    return (
      <div className="landing-publica-error">
        <div className="landing-publica-error-card">
          <h1>
            Página no disponible
          </h1>

          <p>
            {error ||
              "No encontramos este negocio."}
          </p>
        </div>
      </div>
    );
  }

  const nombreNegocio =
    landing.negocio?.nombre ||
    "Nuestro negocio";

  return (
    <div
      className="landing-publica"
      style={colores}
    >
      {/* HERO */}

      <header className="landing-hero">
        <div className="landing-hero-overlay" />

        <div className="landing-hero-content">
          {landing.branding
            ?.logoUrl ? (
            <img
              src={
                landing.branding
                  .logoUrl
              }
              alt={
                nombreNegocio
              }
              className="landing-logo"
            />
          ) : (
            <div className="landing-logo-fallback">
              {nombreNegocio
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <p className="landing-eyebrow">
            {landing.branding?.frasePresentacion || "Belleza • Bienestar • Estilo"}
          </p>

          <h1>
            {nombreNegocio}
          </h1>

          <p className="landing-hero-text">
            Conoce nuestros
            servicios, revisa
            disponibilidad y
            descubre nuestros
            productos.
          </p>

          <div className="landing-hero-actions">
            <a
              href="#disponibilidad"
              className="landing-btn landing-btn-primary"
            >
              <FaCalendarAlt />

              Ver disponibilidad
            </a>

            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="landing-btn landing-btn-whatsapp"
              >
                <FaWhatsapp />

                WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* CONTACTO */}

        <section className="landing-contact-strip">
          <div className="landing-container landing-contact-grid">
            {landing.negocio
              ?.telefono && (
              <div className="landing-contact-item">
                <FaPhoneAlt />

                <span>
                  {
                    landing
                      .negocio
                      .telefono
                  }
                </span>
              </div>
            )}

            {landing
              .sucursales?.[0]
              ?.direccion && (
              <div className="landing-contact-item">
                <FaMapMarkerAlt />

                <span>
                  {
                    landing
                      .sucursales[0]
                      .direccion
                  }
                </span>
              </div>
            )}

            <div className="landing-social-links">
              {landing.contacto
                ?.instagram && (
                <a
                  href={
                    landing
                      .contacto
                      .instagram
                  }
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  <FaInstagram />
                </a>
              )}

              {landing.contacto
                ?.facebook && (
                <a
                  href={
                    landing
                      .contacto
                      .facebook
                  }
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                >
                  <FaFacebookF />
                </a>
              )}

              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp />
                </a>
              )}
            </div>
          </div>
        </section>

        {/* SERVICIOS */}

        {landing.servicios
          ?.length > 0 && (
          <section className="landing-section">
            <div className="landing-container">
              <div className="landing-section-heading">
                <span>
                  LO QUE HACEMOS
                </span>

                <h2>
                  Nuestros servicios
                </h2>

                <p>
                  Selecciona un
                  servicio para
                  consultar los
                  espacios disponibles.
                </p>
              </div>

              <div className="landing-services-grid">
                {landing.servicios.map(
                  (
                    servicio
                  ) => (
                    <button
                      key={
                        servicio.id
                      }
                      type="button"
                      onClick={() => {
                        setServicioId(
                          String(
                            servicio.id
                          )
                        );

                        document
                          .getElementById(
                            "disponibilidad"
                          )
                          ?.scrollIntoView(
                            {
                              behavior:
                                "smooth"
                            }
                          );
                      }}
                      className={`landing-service-card ${
                        String(
                          servicio.id
                        ) ===
                        String(
                          servicioId
                        )
                          ? "active"
                          : ""
                      }`}
                    >
                      <div className="landing-service-icon">
                        ✦
                      </div>

                      <div>
                        <h3>
                          {
                            servicio.nombre
                          }
                        </h3>

                        {servicio.descripcion && (
                          <p>
                            {
                              servicio.descripcion
                            }
                          </p>
                        )}

                        {landing
                          .branding
                          ?.mostrarPrecios !==
                          false && (
                          <strong>
                            Desde{" "}
                            {moneda(
                              servicio.precio
                            )}
                          </strong>
                        )}
                      </div>

                      {servicio
                        .variantes
                        ?.length >
                        0 && (
                        <div className="landing-variants">
                          {servicio.variantes.map(
                            (
                              variante
                            ) => (
                              <span
                                key={
                                  variante.id
                                }
                              >
                                {
                                  variante.nombre
                                }

                                {landing
                                  .branding
                                  ?.mostrarPrecios !==
                                  false &&
                                  ` · ${moneda(
                                    variante.precio
                                  )}`}
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* DISPONIBILIDAD */}

        <section
          id="disponibilidad"
          className="landing-section landing-availability-section"
        >
          <div className="landing-container">
            <div className="landing-section-heading">
              <span>
                AGENDA
              </span>

              <h2>
                Consulta
                disponibilidad
              </h2>

              <p>
                Los días marcados
                tienen al menos un
                espacio disponible.
              </p>
            </div>

            <div className="landing-availability-layout">
              <div className="landing-calendar-panel">
                <div className="landing-filters">
                  <div className="landing-field">
                    <label>
                      Servicio
                    </label>

                    <select
                      value={
                        servicioId
                      }
                      onChange={(
                        event
                      ) =>
                        setServicioId(
                          event
                            .target
                            .value
                        )
                      }
                    >
                      {landing.servicios?.map(
                        (
                          servicio
                        ) => (
                          <option
                            key={
                              servicio.id
                            }
                            value={
                              servicio.id
                            }
                          >
                            {
                              servicio.nombre
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="landing-field">
                    <label>
                      Profesional
                    </label>

                    <select
                      value={
                        profesionalId
                      }
                      onChange={(
                        event
                      ) =>
                        setProfesionalId(
                          event
                            .target
                            .value
                        )
                      }
                    >
                      <option value="">
                        Cualquiera
                      </option>

                      {profesionalesServicio.map(
                        (
                          profesional
                        ) => (
                          <option
                            key={
                              profesional.id
                            }
                            value={
                              profesional.id
                            }
                          >
                            {`${profesional.nombre} ${profesional.apellidos}`.trim()}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="landing-field">
                    <label>
                      Duración
                      aproximada
                    </label>

                    <select
                      value={
                        duracionMinutos
                      }
                      onChange={(
                        event
                      ) =>
                        setDuracionMinutos(
                          Number(
                            event
                              .target
                              .value
                          )
                        )
                      }
                    >
                      <option value={30}>
                        30 minutos
                      </option>

                      <option value={45}>
                        45 minutos
                      </option>

                      <option value={60}>
                        1 hora
                      </option>

                      <option value={90}>
                        1 hora 30 min
                      </option>

                      <option value={120}>
                        2 horas
                      </option>

                      <option value={150}>
                        2 horas 30 min
                      </option>

                      <option value={180}>
                        3 horas
                      </option>

                      <option value={240}>
                        4 horas
                      </option>

                      <option value={300}>
                        5 horas
                      </option>

                      <option value={360}>
                        6 horas
                      </option>

                      <option value={420}>
                        7 horas
                      </option>

                      <option value={480}>
                        8 horas
                      </option>
                    </select>
                  </div>
                </div>

                <div className="landing-calendar-header">
                  <button
                    type="button"
                    onClick={() =>
                      cambiarMes(
                        -1
                      )
                    }
                    className="landing-calendar-nav"
                  >
                    <FaChevronLeft />
                  </button>

                  <h3>
                    {formatearNombreMes()}
                  </h3>

                  <button
                    type="button"
                    onClick={() =>
                      cambiarMes(
                        1
                      )
                    }
                    className="landing-calendar-nav"
                  >
                    <FaChevronRight />
                  </button>
                </div>

                <div className="landing-weekdays">
                  <span>Lun</span>
                  <span>Mar</span>
                  <span>Mié</span>
                  <span>Jue</span>
                  <span>Vie</span>
                  <span>Sáb</span>
                  <span>Dom</span>
                </div>

                {cargandoDisponibilidad ? (
                  <div className="landing-calendar-loading">
                    <div className="landing-publica-spinner" />

                    <span>
                      Consultando
                      horarios...
                    </span>
                  </div>
                ) : (
                  <div className="landing-calendar-grid">
                    {diasCalendario.map(
                      (
                        fecha,
                        index
                      ) => {
                        if (!fecha) {
                          return (
                            <div
                              key={`empty-${index}`}
                              className="landing-calendar-day empty"
                            />
                          );
                        }

                        const fechaApi =
                          formatearFechaApi(
                            fecha
                          );

                        const info =
                          mapaDisponibilidad[
                            fechaApi
                          ];

                        const pasada =
                          esFechaPasada(
                            fecha
                          );

                        const disponible =
                          !pasada &&
                          info
                            ?.tieneDisponibilidad;

                        const seleccionado =
                          fechaSeleccionada ===
                          fechaApi;

                        return (
                          <button
                            key={
                              fechaApi
                            }
                            type="button"
                            disabled={
                              !disponible
                            }
                            onClick={() =>
                              setFechaSeleccionada(
                                fechaApi
                              )
                            }
                            className={`landing-calendar-day ${
                              disponible
                                ? "available"
                                : ""
                            } ${
                              seleccionado
                                ? "selected"
                                : ""
                            } ${
                              pasada
                                ? "past"
                                : ""
                            }`}
                          >
                            <span className="landing-calendar-number">
                              {
                                fecha.getDate()
                              }
                            </span>

                            {disponible && (
                              <>
                                <span className="landing-availability-dot" />

                                <small>
                                  Disponible
                                </small>
                              </>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                )}

                <div className="landing-calendar-legend">
                  <span>
                    <i className="legend-dot available" />
                    Disponible
                  </span>

                  <span>
                    <i className="legend-dot unavailable" />
                    Sin espacios
                  </span>
                </div>
              </div>

              <aside className="landing-times-panel">
                {!fechaSeleccionada && (
                  <div className="landing-times-empty">
                    <FaCalendarAlt />

                    <h3>
                      Selecciona un día
                    </h3>

                    <p>
                      Toca un día
                      disponible en el
                      calendario para
                      ver los horarios.
                    </p>
                  </div>
                )}

                {fechaSeleccionada &&
                  detalleFecha && (
                    <>
                      <div className="landing-times-heading">
                        <span>
                          HORARIOS
                        </span>

                        <h3>
                          {formatearFechaBonita(
                            fechaSeleccionada
                          )}
                        </h3>
                      </div>

                      <div className="landing-professional-times">
                        {detalleFecha.profesionales?.map(
                          (
                            profesional
                          ) => (
                            <div
                              key={
                                profesional.profesionalId
                              }
                              className="landing-professional-times-card"
                            >
                              <div className="landing-professional-mini">
                                {profesional.fotoUrl ? (
                                  <img
                                    src={
                                      profesional.fotoUrl
                                    }
                                    alt={
                                      profesional.profesionalNombre
                                    }
                                  />
                                ) : (
                                  <div className="landing-avatar-mini">
                                    {profesional.profesionalNombre
                                      .charAt(
                                        0
                                      )
                                      .toUpperCase()}
                                  </div>
                                )}

                                <div>
                                  <strong>
                                    {
                                      profesional.profesionalNombre
                                    }
                                  </strong>

                                  {profesional.especialidad && (
                                    <small>
                                      {
                                        profesional.especialidad
                                      }
                                    </small>
                                  )}
                                </div>
                              </div>

                              <div className="landing-time-chips">
                                {profesional.horas?.map(
                                  (
                                    hora
                                  ) => (
                                    <span
                                      key={
                                        hora
                                      }
                                    >
                                      {
                                        formatearHoraPublica(hora)
                                      }
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      {whatsapp && (
                        <a
                          className="landing-whatsapp-consult"
                          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                            `Hola, vi disponibilidad para ${formatearFechaBonita(
                              fechaSeleccionada
                            )} en ${nombreNegocio}. Quisiera consultar un espacio.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FaWhatsapp />

                          Consultar por
                          WhatsApp
                        </a>
                      )}
                    </>
                  )}
              </aside>
            </div>
          </div>
        </section>

        {/* PROFESIONALES */}

        {landing.profesionales
          ?.length > 0 && (
          <section className="landing-section">
            <div className="landing-container">
              <div className="landing-section-heading">
                <span>
                  NUESTRO EQUIPO
                </span>

                <h2>
                  Profesionales
                </h2>
              </div>

              <div className="landing-professionals-grid">
                {landing.profesionales.map(
                  (
                    profesional
                  ) => (
                    <article
                      key={
                        profesional.id
                      }
                      className="landing-professional-card"
                    >
                      {profesional.fotoUrl ? (
                        <img
                          src={
                            profesional.fotoUrl
                          }
                          alt={`${profesional.nombre} ${profesional.apellidos}`}
                        />
                      ) : (
                        <div className="landing-professional-placeholder">
                          {profesional.nombre
                            .charAt(
                              0
                            )
                            .toUpperCase()}
                        </div>
                      )}

                      <div>
                        <h3>
                          {`${profesional.nombre} ${profesional.apellidos}`.trim()}
                        </h3>

                        {profesional.especialidad && (
                          <p>
                            {
                              profesional.especialidad
                            }
                          </p>
                        )}

                        <div className="landing-professional-services">
                          {profesional.servicios?.map(
                            (
                              servicio
                            ) => (
                              <span
                                key={
                                  servicio.id
                                }
                              >
                                {
                                  servicio.nombre
                                }
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* PRODUCTOS */}

        {landing.productos
          ?.length > 0 && (
          <section className="landing-section landing-products-section">
            <div className="landing-container">
              <div className="landing-section-heading">
                <span>
                  PARA TI
                </span>

                <h2>
                  Productos
                  disponibles
                </h2>

                <p>
                  Productos que puedes
                  encontrar actualmente
                  en el negocio.
                </p>
              </div>

              <div className="landing-products-grid">
                {landing.productos.map(
                  (
                    producto
                  ) => (
                    <article
                      key={
                        producto.id
                      }
                      className="landing-product-card"
                    >
                      <div className="landing-product-image">
                        {producto.imagenUrl ? (
                          <img
                            src={
                              producto.imagenUrl
                            }
                            alt={
                              producto.nombre
                            }
                          />
                        ) : (
                          <span>
                            ✦
                          </span>
                        )}

                        <div className="landing-stock-badge">
                          Disponible
                        </div>
                      </div>

                      <div className="landing-product-body">
                        {producto.categoria && (
                          <small>
                            {
                              producto.categoria
                            }
                          </small>
                        )}

                        <h3>
                          {
                            producto.nombre
                          }
                        </h3>

                        {producto.descripcion && (
                          <p>
                            {
                              producto.descripcion
                            }
                          </p>
                        )}

                        {landing
                          .branding
                          ?.mostrarPrecios !==
                          false && (
                          <strong>
                            {moneda(
                              producto.precioVenta
                            )}
                          </strong>
                        )}

                        {whatsapp && (
                          <a
                            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
                              `Hola, vi el producto "${producto.nombre}" en la página de ${nombreNegocio}. Quisiera consultar disponibilidad.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Consultar
                          </a>
                        )}
                      </div>
                    </article>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* FOOTER */}

        <footer className="landing-footer">
          <div className="landing-container">
            {landing.branding
              ?.logoUrl && (
              <img
                src={
                  landing.branding
                    .logoUrl
                }
                alt={
                  nombreNegocio
                }
              />
            )}

            <h2>
              {nombreNegocio}
            </h2>

            <p>
              Gracias por visitarnos.
            </p>

            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
              >
                <FaWhatsapp />

                Escríbenos
              </a>
            )}

            <small>
              ©{" "}
              {new Date().getFullYear()}{" "}
              {nombreNegocio}
            </small>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default LandingPublica;