import {
  useEffect,
  useState
} from "react";

import {
  FaPalette,
  FaSave,
  FaStore,
  FaWhatsapp
} from "react-icons/fa";

import api from "../services/api";

import {
  useConfiguracion
} from "../context/ConfiguracionContext";

const formularioInicial = {
  nombre: "",
  nombreComercial: "",
  identificacion: "",
  telefono: "",
  email: "",
  logoUrl: "",
  colorPrimario: "#C62864",
  colorSecundario: "#F8E7EE",
  colorFondo: "#FFFFFF",
  moneda: "CRC",
  zonaHoraria: "America/Costa_Rica",
  idioma: "es",
  duracionSlotMinutos: 15,
  permitirReservaOnline: true,
  mostrarPrecios: true,
  requiereDeposito: false,
  porcentajeDeposito: 0,
  instagram: "",
  facebook: "",
  whatsApp: ""
};

function Configuracion() {
  const {
    tenant,
    configuracion,
    cargarConfiguracion
  } = useConfiguracion();

  const [formulario, setFormulario] =
    useState(formularioInicial);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  useEffect(() => {
    if (!tenant) {
      return;
    }

    setFormulario({
      nombre:
        tenant.nombre || "",
      nombreComercial:
        tenant.nombreComercial || "",
      identificacion:
        tenant.identificacion || "",
      telefono:
        tenant.telefono || "",
      email:
        tenant.email || "",
      logoUrl:
        configuracion?.logoUrl || "",
      colorPrimario:
        configuracion?.colorPrimario ||
        "#C62864",
      colorSecundario:
        configuracion?.colorSecundario ||
        "#F8E7EE",
      colorFondo:
        configuracion?.colorFondo ||
        "#FFFFFF",
      moneda:
        configuracion?.moneda || "CRC",
      zonaHoraria:
        configuracion?.zonaHoraria ||
        "America/Costa_Rica",
      idioma:
        configuracion?.idioma || "es",
      duracionSlotMinutos:
        configuracion?.duracionSlotMinutos ||
        15,
      permitirReservaOnline:
        configuracion?.permitirReservaOnline ??
        true,
      mostrarPrecios:
        configuracion?.mostrarPrecios ??
        true,
      requiereDeposito:
        configuracion?.requiereDeposito ??
        false,
      porcentajeDeposito:
        configuracion?.porcentajeDeposito ||
        0,
      instagram:
        configuracion?.instagram || "",
      facebook:
        configuracion?.facebook || "",
      whatsApp:
        configuracion?.whatsApp || ""
    });
  }, [tenant, configuracion]);

  const actualizarCampo = (
    campo,
    valor
  ) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor
    }));
  };

  const guardar = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setMensaje("");

    if (!formulario.nombre.trim()) {
      setError(
        "El nombre del negocio es requerido."
      );
      return;
    }

    if (
      formulario.requiereDeposito &&
      (
        Number(
          formulario.porcentajeDeposito
        ) <= 0 ||
        Number(
          formulario.porcentajeDeposito
        ) > 100
      )
    ) {
      setError(
        "El porcentaje de depósito debe ser mayor que 0 y menor o igual que 100."
      );
      return;
    }

    try {
      setGuardando(true);

      await api.put(
        "/Configuracion",
        {
          ...formulario,
          duracionSlotMinutos:
            Number(
              formulario.duracionSlotMinutos
            ),
          porcentajeDeposito:
            Number(
              formulario.porcentajeDeposito
            )
        }
      );

      await cargarConfiguracion();

      setMensaje(
        "Configuración guardada correctamente."
      );
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        error.response?.data?.title ||
        "No fue posible guardar la configuración."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Configuración
          </h1>

          <p className="text-muted mb-0">
            Personaliza los datos, apariencia y preferencias del negocio.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mt-4">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="alert alert-success mt-4">
          {mensaje}
        </div>
      )}

      <form
        className="mt-4"
        onSubmit={guardar}
      >
        <div className="row g-4">
          <div className="col-xl-8">
            <div className="content-card p-4 mb-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <FaStore />
                <h5 className="mb-0">
                  Datos del negocio
                </h5>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">
                    Nombre legal
                  </label>
                  <input
                    className="form-control"
                    value={formulario.nombre}
                    onChange={(e) =>
                      actualizarCampo(
                        "nombre",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Nombre comercial
                  </label>
                  <input
                    className="form-control"
                    value={
                      formulario.nombreComercial
                    }
                    onChange={(e) =>
                      actualizarCampo(
                        "nombreComercial",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Identificación
                  </label>
                  <input
                    className="form-control"
                    value={
                      formulario.identificacion
                    }
                    onChange={(e) =>
                      actualizarCampo(
                        "identificacion",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Teléfono
                  </label>
                  <input
                    className="form-control"
                    value={formulario.telefono}
                    onChange={(e) =>
                      actualizarCampo(
                        "telefono",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Correo
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    value={formulario.email}
                    onChange={(e) =>
                      actualizarCampo(
                        "email",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    URL del logo
                  </label>
                  <input
                    className="form-control"
                    placeholder="https://..."
                    value={formulario.logoUrl}
                    onChange={(e) =>
                      actualizarCampo(
                        "logoUrl",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            </div>

            <div className="content-card p-4 mb-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <FaPalette />
                <h5 className="mb-0">
                  Apariencia
                </h5>
              </div>

              <div className="row g-3">
                <ColorField
                  label="Color principal"
                  valor={
                    formulario.colorPrimario
                  }
                  onChange={(valor) =>
                    actualizarCampo(
                      "colorPrimario",
                      valor
                    )
                  }
                />

                <ColorField
                  label="Color secundario"
                  valor={
                    formulario.colorSecundario
                  }
                  onChange={(valor) =>
                    actualizarCampo(
                      "colorSecundario",
                      valor
                    )
                  }
                />

                <ColorField
                  label="Color de fondo"
                  valor={
                    formulario.colorFondo
                  }
                  onChange={(valor) =>
                    actualizarCampo(
                      "colorFondo",
                      valor
                    )
                  }
                />
              </div>
            </div>

            <div className="content-card p-4 mb-4">
              <h5 className="mb-4">
                Regional y agenda
              </h5>

              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">
                    Moneda
                  </label>
                  <select
                    className="form-select"
                    value={formulario.moneda}
                    onChange={(e) =>
                      actualizarCampo(
                        "moneda",
                        e.target.value
                      )
                    }
                  >
                    <option value="CRC">
                      CRC - Colón
                    </option>
                    <option value="USD">
                      USD - Dólar
                    </option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label">
                    Idioma
                  </label>
                  <select
                    className="form-select"
                    value={formulario.idioma}
                    onChange={(e) =>
                      actualizarCampo(
                        "idioma",
                        e.target.value
                      )
                    }
                  >
                    <option value="es">
                      Español
                    </option>
                    <option value="en">
                      English
                    </option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label">
                    Intervalo de agenda
                  </label>
                  <select
                    className="form-select"
                    value={
                      formulario.duracionSlotMinutos
                    }
                    onChange={(e) =>
                      actualizarCampo(
                        "duracionSlotMinutos",
                        e.target.value
                      )
                    }
                  >
                    <option value={5}>5 min</option>
                    <option value={10}>10 min</option>
                    <option value={15}>15 min</option>
                    <option value={20}>20 min</option>
                    <option value={30}>30 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label">
                    Zona horaria
                  </label>
                  <input
                    className="form-control"
                    value={
                      formulario.zonaHoraria
                    }
                    onChange={(e) =>
                      actualizarCampo(
                        "zonaHoraria",
                        e.target.value
                      )
                    }
                  />
                  <small className="text-muted">
                    Para Costa Rica usa America/Costa_Rica.
                  </small>
                </div>
              </div>
            </div>

            <div className="content-card p-4 mb-4">
              <h5 className="mb-4">
                Reservas y depósitos
              </h5>

              <SwitchField
                label="Permitir reservas online"
                checked={
                  formulario.permitirReservaOnline
                }
                onChange={(valor) =>
                  actualizarCampo(
                    "permitirReservaOnline",
                    valor
                  )
                }
              />

              <SwitchField
                label="Mostrar precios"
                checked={
                  formulario.mostrarPrecios
                }
                onChange={(valor) =>
                  actualizarCampo(
                    "mostrarPrecios",
                    valor
                  )
                }
              />

              <SwitchField
                label="Requerir depósito"
                checked={
                  formulario.requiereDeposito
                }
                onChange={(valor) =>
                  actualizarCampo(
                    "requiereDeposito",
                    valor
                  )
                }
              />

              {formulario.requiereDeposito && (
                <div className="mt-3">
                  <label className="form-label">
                    Porcentaje de depósito
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      className="form-control"
                      value={
                        formulario.porcentajeDeposito
                      }
                      onChange={(e) =>
                        actualizarCampo(
                          "porcentajeDeposito",
                          e.target.value
                        )
                      }
                    />
                    <span className="input-group-text">
                      %
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="content-card p-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <FaWhatsapp />
                <h5 className="mb-0">
                  Redes y contacto
                </h5>
              </div>

              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">
                    WhatsApp
                  </label>
                  <input
                    className="form-control"
                    placeholder="+506 8888 8888"
                    value={formulario.whatsApp}
                    onChange={(e) =>
                      actualizarCampo(
                        "whatsApp",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">
                    Instagram
                  </label>
                  <input
                    className="form-control"
                    placeholder="@negocio"
                    value={formulario.instagram}
                    onChange={(e) =>
                      actualizarCampo(
                        "instagram",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">
                    Facebook
                  </label>
                  <input
                    className="form-control"
                    value={formulario.facebook}
                    onChange={(e) =>
                      actualizarCampo(
                        "facebook",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-4">
            <div
              className="content-card p-4 position-sticky"
              style={{ top: "24px" }}
            >
              <h5 className="mb-3">
                Vista previa
              </h5>

              <div
                className="rounded-4 p-4 border"
                style={{
                  backgroundColor:
                    formulario.colorFondo
                }}
              >
                <div className="d-flex align-items-center gap-3 mb-4">
                  {formulario.logoUrl ? (
                    <img
                      src={formulario.logoUrl}
                      alt="Logo"
                      style={{
                        width: "56px",
                        height: "56px",
                        objectFit: "cover",
                        borderRadius: "14px"
                      }}
                    />
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-center fw-bold text-white"
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "14px",
                        backgroundColor:
                          formulario.colorPrimario
                      }}
                    >
                      {(formulario.nombreComercial ||
                        formulario.nombre ||
                        "N")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div>
                    <strong>
                      {formulario.nombreComercial ||
                        formulario.nombre ||
                        "Mi negocio"}
                    </strong>
                    <div className="small text-muted">
                      {formulario.telefono ||
                        "Teléfono del negocio"}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn w-100 text-white"
                  style={{
                    backgroundColor:
                      formulario.colorPrimario
                  }}
                >
                  Reservar cita
                </button>

                <div
                  className="rounded-3 mt-3 p-3"
                  style={{
                    backgroundColor:
                      formulario.colorSecundario
                  }}
                >
                  <small>
                    Así se verán los colores principales del negocio.
                  </small>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 mt-4"
                disabled={guardando}
              >
                <FaSave className="me-2" />
                {guardando
                  ? "Guardando..."
                  : "Guardar configuración"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function ColorField({
  label,
  valor,
  onChange
}) {
  return (
    <div className="col-md-4">
      <label className="form-label">
        {label}
      </label>

      <div className="input-group">
        <input
          type="color"
          className="form-control form-control-color"
          value={valor}
          onChange={(e) =>
            onChange(e.target.value)
          }
        />

        <input
          className="form-control"
          value={valor}
          onChange={(e) =>
            onChange(e.target.value)
          }
        />
      </div>
    </div>
  );
}

function SwitchField({
  label,
  checked,
  onChange
}) {
  return (
    <div className="form-check form-switch mb-3">
      <input
        className="form-check-input"
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(e.target.checked)
        }
      />

      <label className="form-check-label">
        {label}
      </label>
    </div>
  );
}

export default Configuracion;
