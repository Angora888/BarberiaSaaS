import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  FaCalendarCheck,
  FaClock,
  FaTimes,
  FaUser,
  FaUserTie
} from "react-icons/fa";
import api from "../services/api";

const MESES = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12
};

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function obtenerFechaSeleccionadaDesdeDom() {
  const boton = document.querySelector(
    ".landing-calendar-day.selected"
  );

  const numero = boton?.querySelector(
    ".landing-calendar-number"
  )?.textContent?.trim();

  const tituloMes = document.querySelector(
    ".landing-calendar-header h3"
  )?.textContent?.trim();

  if (!numero || !tituloMes) {
    return "";
  }

  const texto = normalizarTexto(tituloMes);
  const match = texto.match(
    /^([a-z]+)\s+de\s+(\d{4})$/
  );

  if (!match) {
    return "";
  }

  const mes = MESES[match[1]];
  const anio = Number(match[2]);
  const dia = Number(numero);

  if (!mes || !anio || !dia) {
    return "";
  }

  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function formatearFecha(fechaTexto, locale) {
  if (!fechaTexto) {
    return "";
  }

  const [anio, mes, dia] = fechaTexto
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat(
    locale,
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  ).format(
    new Date(anio, mes - 1, dia, 12, 0, 0)
  );
}

function normalizarHoraReserva(hora) {
  const valor = String(hora || "").trim();

  const formato24 = valor.match(/^(\d{1,2}):(\d{2})$/);
  if (formato24) {
    const horas = Number(formato24[1]);
    const minutos = Number(formato24[2]);

    if (horas >= 0 && horas <= 23 && minutos >= 0 && minutos <= 59) {
      return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
    }
  }

  const formato12 = valor.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!formato12) {
    return valor;
  }

  let horas = Number(formato12[1]);
  const minutos = Number(formato12[2]);
  const periodo = formato12[3].toUpperCase();

  if (horas < 1 || horas > 12 || minutos < 0 || minutos > 59) {
    return valor;
  }

  if (periodo === "AM" && horas === 12) horas = 0;
  if (periodo === "PM" && horas !== 12) horas += 12;

  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

function formatearHora12(hora) {
  const match = String(hora || "").match(
    /^(\d{1,2}):(\d{2})$/
  );

  if (!match) {
    return hora;
  }

  const horas24 = Number(match[1]);
  const minutos = match[2];
  const periodo = horas24 >= 12 ? "PM" : "AM";
  const horas12 = horas24 % 12 || 12;

  return `${horas12}:${minutos} ${periodo}`;
}

function formatearDuracion(minutos) {
  const total = Number(minutos) || 0;
  const horas = Math.floor(total / 60);
  const resto = total % 60;

  if (horas > 0 && resto > 0) {
    return `${horas} h ${resto} min`;
  }

  if (horas > 0) {
    return horas === 1 ? "1 hora" : `${horas} horas`;
  }

  return `${resto} min`;
}

function ReservaPublicaSidecar() {
  const { slug } = useParams();

  const [landing, setLanding] = useState(null);
  const [reserva, setReserva] = useState(null);
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [paisCodigoTelefono, setPaisCodigoTelefono] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(null);

  const locale = landing
    ? `${landing?.branding?.idioma === "en" ? "en" : "es"}-${landing?.negocio?.paisCodigo || "CR"}`
    : "es-CR";

  useEffect(() => {
    if (!slug) {
      return;
    }

    api.get(`/Publico/${slug}`)
      .then((response) => {
        setLanding(response.data);
        setPaisCodigoTelefono(response.data?.negocio?.paisCodigo || "CR");
      })
      .catch(() => {
        setLanding(null);
      });
  }, [slug]);

  useEffect(() => {
    if (!landing) {
      return undefined;
    }

    const enlazar = () => {
      document
        .querySelectorAll(".landing-time-chips span")
        .forEach((chip) => {
          if (chip.dataset.reservaPublicaBound === "1") {
            return;
          }

          chip.dataset.reservaPublicaBound = "1";
          chip.classList.add("landing-time-chip-bookable");
          chip.setAttribute("role", "button");
          chip.setAttribute("tabindex", "0");
          chip.setAttribute(
            "title",
            "Toca para solicitar esta cita"
          );

          const abrirDesdeChip = () => {
            const selects = document.querySelectorAll(
              ".landing-filters select"
            );

            const servicioId = Number(
              selects?.[0]?.value || 0
            );

            const duracionMinutos = Number(
              selects?.[2]?.value || 0
            );

            const fecha =
              obtenerFechaSeleccionadaDesdeDom();

            const hora =
              chip.textContent?.trim() || "";

            const card = chip.closest(
              ".landing-professional-times-card"
            );

            const profesionalNombre =
              card?.querySelector(
                ".landing-professional-mini strong"
              )?.textContent?.trim() || "";

            const profesional =
              (landing.profesionales || []).find(
                (item) =>
                  normalizarTexto(
                    `${item.nombre || ""} ${item.apellidos || ""}`
                  ) === normalizarTexto(profesionalNombre)
              );

            const servicio =
              (landing.servicios || []).find(
                (item) =>
                  Number(item.id) === servicioId
              );

            if (
              !servicio ||
              !profesional ||
              !fecha ||
              !hora ||
              duracionMinutos <= 0
            ) {
              return;
            }

            setError("");
            setExito(null);
            setNombreCompleto("");
            setTelefono("");
            setPaisCodigoTelefono(landing?.negocio?.paisCodigo || "CR");
            setReserva({
              servicio,
              profesional,
              fecha,
              hora,
              duracionMinutos
            });
          };

          chip.addEventListener(
            "click",
            abrirDesdeChip
          );

          chip.addEventListener(
            "keydown",
            (evento) => {
              if (
                evento.key === "Enter" ||
                evento.key === " "
              ) {
                evento.preventDefault();
                abrirDesdeChip();
              }
            }
          );
        });
    };

    enlazar();

    const observer = new MutationObserver(enlazar);

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [landing]);

  const tituloReserva = useMemo(() => {
    if (!reserva) {
      return "";
    }

    return `${formatearFecha(reserva.fecha, locale)} · ${formatearHora12(reserva.hora)}`;
  }, [reserva]);

  const cerrar = () => {
    if (guardando) {
      return;
    }

    setReserva(null);
    setError("");
    setExito(null);
  };

  const guardar = async (evento) => {
    evento.preventDefault();

    if (!reserva) {
      return;
    }

    if (!nombreCompleto.trim()) {
      setError("Ingresa tu nombre completo.");
      return;
    }

    if (!telefono.trim()) {
      setError("Ingresa tu número de teléfono.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const response = await api.post(
        `/Publico/${slug}/reservas`,
        {
          nombreCompleto: nombreCompleto.trim(),
          telefono: telefono.trim(),
          paisCodigoTelefono: paisCodigoTelefono || landing?.negocio?.paisCodigo || "CR",
          servicioId: Number(reserva.servicio.id),
          profesionalId: Number(reserva.profesional.id),
          fecha: `${reserva.fecha}T00:00:00`,
          horaInicio: normalizarHoraReserva(reserva.hora),
          duracionMinutos: Number(
            reserva.duracionMinutos
          )
        }
      );

      setExito(response.data);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No fue posible registrar la cita. Intenta nuevamente."
      );
    } finally {
      setGuardando(false);
    }
  };

  if (!reserva) {
    return (
      <style>{`
        .landing-time-chip-bookable {
          cursor: pointer;
          transition: transform .15s ease, box-shadow .15s ease;
          user-select: none;
        }
        .landing-time-chip-bookable:hover,
        .landing-time-chip-bookable:focus {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0,0,0,.08);
          outline: 2px solid var(--landing-primary, #c62864);
          outline-offset: 2px;
        }
      `}</style>
    );
  }

  return (
    <>
      <style>{`
        .landing-time-chip-bookable {
          cursor: pointer;
          transition: transform .15s ease, box-shadow .15s ease;
          user-select: none;
        }
        .landing-reserva-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, .58);
          backdrop-filter: blur(4px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }
        .landing-reserva-modal {
          width: min(520px, 100%);
          max-height: calc(100vh - 36px);
          overflow-y: auto;
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 28px 80px rgba(15, 23, 42, .25);
        }
        .landing-reserva-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 24px 24px 18px;
          border-bottom: 1px solid #eef0f3;
        }
        .landing-reserva-header h3 {
          margin: 0 0 4px;
          font-size: 24px;
          font-weight: 800;
        }
        .landing-reserva-header p {
          margin: 0;
          color: #6b7280;
        }
        .landing-reserva-close {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          border: 0;
          border-radius: 12px;
          background: #f3f4f6;
          color: #374151;
          display: grid;
          place-items: center;
        }
        .landing-reserva-body {
          padding: 22px 24px 24px;
        }
        .landing-reserva-summary {
          display: grid;
          gap: 10px;
          padding: 16px;
          border-radius: 16px;
          background: #faf7f9;
          border: 1px solid #f0e5eb;
          margin-bottom: 20px;
        }
        .landing-reserva-summary-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .landing-reserva-summary-row svg {
          margin-top: 4px;
          color: var(--landing-primary, #c62864);
        }
        .landing-reserva-summary-row strong,
        .landing-reserva-summary-row span {
          display: block;
        }
        .landing-reserva-summary-row span {
          color: #6b7280;
          font-size: 13px;
        }
        .landing-reserva-field {
          margin-bottom: 16px;
        }
        .landing-reserva-field label {
          display: block;
          margin-bottom: 7px;
          font-weight: 700;
          color: #374151;
        }
        .landing-reserva-field input,
        .landing-reserva-field select {
          width: 100%;
          min-height: 50px;
          border: 1px solid #d9dee7;
          border-radius: 13px;
          padding: 0 14px;
          font-size: 16px;
        }
        .landing-reserva-field input:focus,
        .landing-reserva-field select:focus {
          outline: none;
          border-color: var(--landing-primary, #c62864);
          box-shadow: 0 0 0 4px rgba(198,40,100,.1);
        }
        .landing-reserva-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 12px 14px;
          border-radius: 12px;
          margin-bottom: 16px;
        }
        .landing-reserva-submit {
          width: 100%;
          min-height: 52px;
          border: 0;
          border-radius: 14px;
          background: var(--landing-primary, #c62864);
          color: #fff;
          font-size: 16px;
          font-weight: 800;
        }
        .landing-reserva-submit:disabled {
          opacity: .65;
        }
        .landing-reserva-success {
          text-align: center;
          padding: 12px 0 4px;
        }
        .landing-reserva-success-icon {
          width: 68px;
          height: 68px;
          margin: 0 auto 14px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #ecfdf3;
          color: #16a34a;
          font-size: 30px;
        }
        .landing-reserva-success h3 {
          margin-bottom: 8px;
          font-weight: 800;
        }
        .landing-reserva-success p {
          color: #6b7280;
        }
        .landing-reserva-success button {
          width: 100%;
          min-height: 50px;
          margin-top: 10px;
          border: 0;
          border-radius: 14px;
          background: #111827;
          color: #fff;
          font-weight: 800;
        }
      `}</style>

      <div className="landing-reserva-backdrop">
        <div className="landing-reserva-modal">
          <div className="landing-reserva-header">
            <div>
              <h3>Reservar cita</h3>
              <p>{tituloReserva}</p>
            </div>

            <button
              type="button"
              className="landing-reserva-close"
              onClick={cerrar}
              disabled={guardando}
              aria-label="Cerrar"
            >
              <FaTimes />
            </button>
          </div>

          <div className="landing-reserva-body">
            {exito ? (
              <div className="landing-reserva-success">
                <div className="landing-reserva-success-icon">
                  <FaCalendarCheck />
                </div>

                <h3>¡Tu cita fue solicitada!</h3>

                <p>
                  La reserva quedó registrada como pendiente. El negocio podrá ajustar detalles como variante, duración o precio antes de confirmarla.
                </p>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                >
                  Listo
                </button>
              </div>
            ) : (
              <form onSubmit={guardar}>
                <div className="landing-reserva-summary">
                  <div className="landing-reserva-summary-row">
                    <FaCalendarCheck />
                    <div>
                      <strong>{reserva.servicio.nombre}</strong>
                      <span>Servicio seleccionado</span>
                    </div>
                  </div>

                  <div className="landing-reserva-summary-row">
                    <FaUserTie />
                    <div>
                      <strong>
                        {`${reserva.profesional.nombre || ""} ${reserva.profesional.apellidos || ""}`.trim()}
                      </strong>
                      <span>Profesional</span>
                    </div>
                  </div>

                  <div className="landing-reserva-summary-row">
                    <FaClock />
                    <div>
                      <strong>{tituloReserva}</strong>
                      <span>
                        Duración aproximada: {formatearDuracion(reserva.duracionMinutos)}
                      </span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="landing-reserva-error">
                    {error}
                  </div>
                )}

                <div className="landing-reserva-field">
                  <label htmlFor="reserva-nombre">
                    Nombre completo
                  </label>
                  <input
                    id="reserva-nombre"
                    type="text"
                    value={nombreCompleto}
                    onChange={(e) =>
                      setNombreCompleto(e.target.value)
                    }
                    autoComplete="name"
                    placeholder="Tu nombre y apellidos"
                    required
                  />
                </div>

                <div className="landing-reserva-field">
                  <label htmlFor="reserva-pais-telefono">
                    País del teléfono
                  </label>
                  <select
                    id="reserva-pais-telefono"
                    value={paisCodigoTelefono}
                    onChange={(e) => {
                      setPaisCodigoTelefono(e.target.value);
                      setTelefono("");
                    }}
                    required
                  >
                    {(landing?.paisesTelefono || []).map((pais) => (
                      <option key={pais.codigo} value={pais.codigo}>
                        {pais.bandera} {pais.nombre} ({pais.codigoTelefonico})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="landing-reserva-field">
                  <label htmlFor="reserva-telefono">
                    Teléfono
                  </label>
                  <input
                    id="reserva-telefono"
                    type="tel"
                    value={telefono}
                    onChange={(e) =>
                      setTelefono(
                        e.target.value
                          .replace(/[^\d\s()\-]/g, "")
                          .slice(0, 20)
                      )
                    }
                    autoComplete="tel-national"
                    inputMode="tel"
                    placeholder="Número de teléfono"
                    required
                  />
                  <small style={{ display: "block", marginTop: 6, color: "#6b7280", fontSize: 12 }}>
                    Selecciona el país del número. Lo validaremos antes de reservar.
                  </small>
                </div>

                <button
                  type="submit"
                  className="landing-reserva-submit"
                  disabled={guardando}
                >
                  {guardando
                    ? "Reservando..."
                    : "Solicitar cita"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ReservaPublicaSidecar;
