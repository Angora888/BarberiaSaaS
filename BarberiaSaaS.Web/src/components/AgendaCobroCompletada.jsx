import { useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaMoneyBillWave,
  FaTimes
} from "react-icons/fa";

import api from "../services/api";
import { useConfiguracion } from "../context/ConfiguracionContext";
import "./AgendaCobroCompletada.css";

const METODOS_PAGO = [
  "Efectivo",
  "SINPE Movil",
  "Tarjeta",
  "Transferencia"
];

function AgendaCobroCompletada() {
  const { formatearMoneda } = useConfiguracion();

  const [cita, setCita] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [formulario, setFormulario] = useState({
    descuento: "",
    montoPagado: "",
    metodoPago: "SINPE Movil",
    notas: ""
  });

  useEffect(() => {
    const manejarCitaCompletada = async (evento) => {
      const citaId = Number(
        evento?.detail?.citaId
      );

      if (!Number.isFinite(citaId)) {
        return;
      }

      try {
        setCargando(true);
        setError("");
        setMensaje("");

        const response =
          await api.get(
            `/Citas/${citaId}`
          );

        const citaActual =
          response.data;

        const precio = Number(
          citaActual?.precio || 0
        );

        setCita(citaActual);
        setFormulario({
          descuento: "",
          montoPagado:
            precio.toString(),
          metodoPago: "SINPE Movil",
          notas: ""
        });
      } catch (err) {
        setError(
          err.response?.data?.mensaje ||
            "La cita se completó, pero no fue posible cargar la información para registrar el cobro."
        );
      } finally {
        setCargando(false);
      }
    };

    window.addEventListener(
      "barberiaSaaS:citaCompletada",
      manejarCitaCompletada
    );

    return () => {
      window.removeEventListener(
        "barberiaSaaS:citaCompletada",
        manejarCitaCompletada
      );
    };
  }, []);

  const precioOriginal =
    Number(cita?.precio || 0);

  const descuento =
    Number(
      formulario.descuento || 0
    );

  const descuentoValido =
    Number.isFinite(descuento)
      ? Math.max(0, descuento)
      : 0;

  const totalCobrar = useMemo(() => {
    return Math.max(
      0,
      precioOriginal - descuentoValido
    );
  }, [precioOriginal, descuentoValido]);

  const montoPagado =
    Number(
      formulario.montoPagado || 0
    );

  const saldo = useMemo(() => {
    const valor =
      totalCobrar -
      (Number.isFinite(montoPagado)
        ? montoPagado
        : 0);

    return Math.max(0, valor);
  }, [totalCobrar, montoPagado]);

  const tipoCobro = useMemo(() => {
    if (totalCobrar <= 0) {
      return {
        texto: "Cubierto por descuento",
        clase: "agenda-cobro-status paid"
      };
    }

    if (
      !Number.isFinite(montoPagado) ||
      montoPagado <= 0
    ) {
      return {
        texto: "Pendiente de pago",
        clase: "agenda-cobro-status pending"
      };
    }

    if (montoPagado < totalCobrar) {
      return {
        texto: "Pago parcial",
        clase: "agenda-cobro-status partial"
      };
    }

    return {
      texto: "Pagado completo",
      clase: "agenda-cobro-status paid"
    };
  }, [montoPagado, totalCobrar]);

  const nombreCliente = useMemo(() => {
    if (!cita?.cliente) {
      return "Cliente";
    }

    return `${
      cita.cliente.nombre || ""
    } ${
      cita.cliente.apellidos || ""
    }`.trim() || "Cliente";
  }, [cita]);

  const nombreServicio = useMemo(() => {
    const servicio =
      cita?.servicio?.nombre ||
      "Servicio";

    const variante =
      cita?.servicioVariante?.nombre;

    return variante
      ? `${servicio} · ${variante}`
      : servicio;
  }, [cita]);

  const cerrar = () => {
    if (guardando) {
      return;
    }

    setCita(null);
    setError("");
    setMensaje("");
    setFormulario({
      descuento: "",
      montoPagado: "",
      metodoPago: "SINPE Movil",
      notas: ""
    });
  };

  const seleccionarPagoCompleto = () => {
    setFormulario(
      (anterior) => ({
        ...anterior,
        montoPagado:
          totalCobrar.toString()
      })
    );
  };

  const seleccionarPendiente = () => {
    setFormulario(
      (anterior) => ({
        ...anterior,
        montoPagado: "0"
      })
    );
  };

  const cambiarDescuento = (valor) => {
    const nuevoDescuento = valor;
    const descuentoAnterior = Number(
      formulario.descuento || 0
    );
    const totalAnterior = Math.max(
      0,
      precioOriginal -
        (Number.isFinite(descuentoAnterior)
          ? descuentoAnterior
          : 0)
    );

    const descuentoNumero = Number(
      nuevoDescuento || 0
    );
    const nuevoTotal = Math.max(
      0,
      precioOriginal -
        (Number.isFinite(descuentoNumero)
          ? descuentoNumero
          : 0)
    );

    const pagabaCompleto =
      Number(formulario.montoPagado || 0) ===
      totalAnterior;

    setFormulario(
      (anterior) => ({
        ...anterior,
        descuento: nuevoDescuento,
        montoPagado:
          pagabaCompleto
            ? nuevoTotal.toString()
            : Number(anterior.montoPagado || 0) > nuevoTotal
              ? nuevoTotal.toString()
              : anterior.montoPagado
      })
    );
  };

  const registrarCobro = async (event) => {
    event.preventDefault();

    if (!cita) {
      return;
    }

    const monto = Number(
      formulario.montoPagado
    );

    const descuentoEnviar = Number(
      formulario.descuento || 0
    );

    if (
      !Number.isFinite(descuentoEnviar) ||
      descuentoEnviar < 0
    ) {
      setError(
        "Ingresa un descuento válido."
      );
      return;
    }

    if (descuentoEnviar > precioOriginal) {
      setError(
        "El descuento no puede superar el precio original del servicio."
      );
      return;
    }

    if (
      !Number.isFinite(monto) ||
      monto < 0
    ) {
      setError(
        "Ingresa un monto válido."
      );
      return;
    }

    if (monto > totalCobrar) {
      setError(
        "El monto pagado no puede superar el total a cobrar después del descuento."
      );
      return;
    }

    if (
      monto > 0 &&
      !formulario.metodoPago
    ) {
      setError(
        "Selecciona un método de pago."
      );
      return;
    }

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const response =
        await api.post(
          "/CuentasPorCobrar/registrar-cobro-cita",
          {
            citaId: cita.id,
            descuento: descuentoEnviar,
            montoPagado: monto,
            metodoPago:
              monto > 0
                ? formulario.metodoPago
                : null,
            notas:
              formulario.notas ||
              null
          }
        );

      const estado =
        response.data?.estado ||
        "Registrado";

      setMensaje(
        estado === "Pagada"
          ? "Cobro registrado como pagado completo."
          : estado === "Parcial"
            ? "Pago parcial registrado. El saldo quedó en cuentas por cobrar."
            : "La cita quedó registrada como pendiente de pago."
      );

      window.setTimeout(
        cerrar,
        900
      );
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No fue posible registrar el cobro."
      );
    } finally {
      setGuardando(false);
    }
  };

  if (!cita && !cargando) {
    return null;
  }

  return (
    <div className="agenda-cobro-backdrop">
      <div className="agenda-cobro-modal">
        <div className="agenda-cobro-header">
          <div className="agenda-cobro-title-wrap">
            <div className="agenda-cobro-icon">
              <FaMoneyBillWave />
            </div>

            <div>
              <div className="agenda-cobro-kicker">
                Cita completada
              </div>
              <h4 className="mb-0">
                Registrar cobro
              </h4>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-light agenda-cobro-close"
            onClick={cerrar}
            disabled={guardando}
          >
            <FaTimes />
          </button>
        </div>

        <div className="agenda-cobro-body">
          {cargando ? (
            <div className="agenda-cobro-loading">
              <div
                className="spinner-border"
                role="status"
              />
              <span>
                Preparando cobro...
              </span>
            </div>
          ) : (
            <form onSubmit={registrarCobro}>
              <div className="agenda-cobro-cita-card">
                <div>
                  <span>Cliente</span>
                  <strong>
                    {nombreCliente}
                  </strong>
                </div>

                <div>
                  <span>Servicio</span>
                  <strong>
                    {nombreServicio}
                  </strong>
                </div>

                <div>
                  <span>Precio original</span>
                  <strong className="agenda-cobro-total">
                    {formatearMoneda(precioOriginal)}
                  </strong>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger mt-3 mb-0">
                  {error}
                </div>
              )}

              {mensaje && (
                <div className="alert alert-success mt-3 mb-0 d-flex align-items-center gap-2">
                  <FaCheckCircle />
                  {mensaje}
                </div>
              )}

              <div className="agenda-cobro-quick-actions mt-4">
                <button
                  type="button"
                  className="btn btn-outline-success"
                  onClick={
                    seleccionarPagoCompleto
                  }
                >
                  Pagado completo
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={
                    seleccionarPendiente
                  }
                >
                  Dejar pendiente
                </button>
              </div>

              <div className="row g-3 mt-1">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Descuento
                  </label>

                  <input
                    type="number"
                    min="0"
                    max={precioOriginal}
                    step="0.01"
                    className="form-control form-control-lg"
                    value={
                      formulario.descuento
                    }
                    onChange={(e) =>
                      cambiarDescuento(
                        e.target.value
                      )
                    }
                  />

                  <div className="form-text">
                    Total a cobrar: {formatearMoneda(totalCobrar)}
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Monto pagado
                  </label>

                  <input
                    type="number"
                    min="0"
                    max={totalCobrar}
                    step="0.01"
                    className="form-control form-control-lg"
                    value={
                      formulario.montoPagado
                    }
                    onChange={(e) =>
                      setFormulario(
                        (anterior) => ({
                          ...anterior,
                          montoPagado:
                            e.target.value
                        })
                      )
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Método de pago
                  </label>

                  <select
                    className="form-select form-select-lg"
                    value={
                      formulario.metodoPago
                    }
                    disabled={
                      montoPagado <= 0
                    }
                    onChange={(e) =>
                      setFormulario(
                        (anterior) => ({
                          ...anterior,
                          metodoPago:
                            e.target.value
                        })
                      )
                    }
                  >
                    {METODOS_PAGO.map(
                      (metodo) => (
                        <option
                          key={metodo}
                          value={metodo}
                        >
                          {metodo}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="col-md-6">
                  <div className="border rounded-3 p-3 h-100 bg-light">
                    <div className="small text-muted mb-1">
                      Descuento aplicado
                    </div>
                    <strong className="fs-5">
                      {formatearMoneda(descuentoValido)}
                    </strong>
                  </div>
                </div>

                <div className="col-12">
                  <div className="agenda-cobro-summary">
                    <div>
                      <span>Total a cobrar</span>
                      <strong>
                        {formatearMoneda(
                          totalCobrar
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Pagado ahora</span>
                      <strong>
                        {formatearMoneda(
                          Number.isFinite(
                            montoPagado
                          )
                            ? montoPagado
                            : 0
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Saldo pendiente</span>
                      <strong>
                        {formatearMoneda(
                          saldo
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Resultado</span>
                      <strong
                        className={
                          tipoCobro.clase
                        }
                      >
                        {tipoCobro.texto}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Notas
                  </label>

                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Ej: descuento especial, saldo pendiente para el viernes..."
                    value={
                      formulario.notas
                    }
                    onChange={(e) =>
                      setFormulario(
                        (anterior) => ({
                          ...anterior,
                          notas:
                            e.target.value
                        })
                      )
                    }
                  />
                </div>
              </div>

              <div className="agenda-cobro-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={cerrar}
                  disabled={guardando}
                >
                  Cerrar sin registrar
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    guardando ||
                    Boolean(mensaje)
                  }
                >
                  {guardando
                    ? "Registrando..."
                    : "Registrar cobro"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AgendaCobroCompletada;