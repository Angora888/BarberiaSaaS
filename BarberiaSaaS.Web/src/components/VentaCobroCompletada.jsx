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

function VentaCobroCompletada() {
  const { formatearMoneda } = useConfiguracion();

  const [venta, setVenta] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [formulario, setFormulario] = useState({
    montoPagado: "",
    metodoPago: "Efectivo",
    notas: ""
  });

  useEffect(() => {
    const manejarVentaRegistrada = async (evento) => {
      const ventaId = Number(
        evento?.detail?.ventaId
      );

      if (!Number.isFinite(ventaId)) {
        return;
      }

      try {
        setCargando(true);
        setError("");
        setMensaje("");

        const response =
          await api.get(
            `/Ventas/${ventaId}`
          );

        const ventaActual =
          response.data;

        setVenta(ventaActual);
        setFormulario({
          montoPagado:
            Number(
              ventaActual?.total || 0
            ).toString(),
          metodoPago:
            ventaActual?.metodoPago ||
            "Efectivo",
          notas: ""
        });
      } catch (err) {
        setError(
          err.response?.data?.mensaje ||
            "La venta se registró, pero no fue posible cargar la información para registrar el cobro."
        );
      } finally {
        setCargando(false);
      }
    };

    window.addEventListener(
      "barberiaSaaS:ventaRegistrada",
      manejarVentaRegistrada
    );

    return () => {
      window.removeEventListener(
        "barberiaSaaS:ventaRegistrada",
        manejarVentaRegistrada
      );
    };
  }, []);

  const total =
    Number(venta?.total || 0);

  const montoPagado =
    Number(
      formulario.montoPagado || 0
    );

  const saldo = useMemo(() => {
    const valor =
      total -
      (Number.isFinite(montoPagado)
        ? montoPagado
        : 0);

    return Math.max(0, valor);
  }, [total, montoPagado]);

  const tipoCobro = useMemo(() => {
    if (
      !Number.isFinite(montoPagado) ||
      montoPagado <= 0
    ) {
      return {
        texto: "Pendiente de pago",
        clase: "agenda-cobro-status pending"
      };
    }

    if (montoPagado < total) {
      return {
        texto: "Pago parcial",
        clase: "agenda-cobro-status partial"
      };
    }

    return {
      texto: "Pagado completo",
      clase: "agenda-cobro-status paid"
    };
  }, [montoPagado, total]);

  const cerrar = () => {
    if (guardando) {
      return;
    }

    setVenta(null);
    setError("");
    setMensaje("");
    setFormulario({
      montoPagado: "",
      metodoPago: "Efectivo",
      notas: ""
    });
  };

  const seleccionarPagoCompleto = () => {
    setFormulario(
      (anterior) => ({
        ...anterior,
        montoPagado:
          total.toString()
      })
    );
    setError("");
  };

  const seleccionarPendiente = () => {
    if (!venta?.clienteId) {
      setError(
        "Para dejar una venta pendiente debes seleccionar un cliente antes de registrar la venta."
      );
      return;
    }

    setFormulario(
      (anterior) => ({
        ...anterior,
        montoPagado: "0"
      })
    );
    setError("");
  };

  const registrarCobro = async (event) => {
    event.preventDefault();

    if (!venta) {
      return;
    }

    const monto = Number(
      formulario.montoPagado
    );

    if (
      !Number.isFinite(monto) ||
      monto < 0
    ) {
      setError(
        "Ingresa un monto válido."
      );
      return;
    }

    if (monto > total) {
      setError(
        "El monto pagado no puede superar el total de la venta."
      );
      return;
    }

    if (
      monto < total &&
      !venta.clienteId
    ) {
      setError(
        "Para registrar un pago parcial o pendiente, la venta debe tener un cliente seleccionado."
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
          "/CobrosVentas/registrar",
          {
            ventaId: venta.id,
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
          ? "Cobro de la venta registrado como pagado completo."
          : estado === "Parcial"
            ? "Pago parcial registrado. El saldo quedó en cuentas por cobrar."
            : "La venta quedó registrada como pendiente de pago."
      );

      window.setTimeout(
        cerrar,
        1000
      );
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No fue posible registrar el cobro de la venta."
      );
    } finally {
      setGuardando(false);
    }
  };

  if (!venta && !cargando) {
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
                Venta registrada
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
                  <span>Venta</span>
                  <strong>
                    #{venta?.id}
                  </strong>
                </div>

                <div>
                  <span>Cliente</span>
                  <strong>
                    {venta?.cliente ||
                      "Venta sin cliente"}
                  </strong>
                </div>

                <div>
                  <span>Total de la venta</span>
                  <strong className="agenda-cobro-total">
                    {formatearMoneda(total)}
                  </strong>
                </div>
              </div>

              {!venta?.clienteId && (
                <div className="alert alert-info mt-3 mb-0">
                  Esta venta no tiene cliente. Puede registrarse como pagada completa,
                  pero para dejar un saldo pendiente la venta debe tener un cliente asociado.
                </div>
              )}

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
                  disabled={!venta?.clienteId}
                >
                  Dejar pendiente
                </button>
              </div>

              <div className="row g-3 mt-1">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Monto pagado
                  </label>

                  <input
                    type="number"
                    min="0"
                    max={total}
                    step="0.01"
                    className="form-control form-control-lg"
                    value={
                      formulario.montoPagado
                    }
                    onChange={(e) => {
                      setFormulario(
                        (anterior) => ({
                          ...anterior,
                          montoPagado:
                            e.target.value
                        })
                      );
                      setError("");
                    }}
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

                <div className="col-12">
                  <div className="agenda-cobro-summary">
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
                    placeholder="Ej: saldo pendiente para el viernes..."
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

export default VentaCobroCompletada;
