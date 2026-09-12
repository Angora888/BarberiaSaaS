import { useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaClock,
  FaDollarSign,
  FaEye,
  FaMoneyBillWave,
  FaTimes,
  FaWallet
} from "react-icons/fa";

import api from "../services/api";
import { useConfiguracion } from "../context/ConfiguracionContext";
import "./CuentasPorCobrar.css";

const METODOS_PAGO = [
  "Efectivo",
  "SINPE Movil",
  "Tarjeta",
  "Transferencia"
];

function CuentasPorCobrar() {
  const { formatearMoneda } = useConfiguracion();

  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("abiertas");
  const [busqueda, setBusqueda] = useState("");

  const [cuentaDetalle, setCuentaDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState("");

  const [mostrarAbono, setMostrarAbono] = useState(false);
  const [guardandoAbono, setGuardandoAbono] = useState(false);
  const [errorAbono, setErrorAbono] = useState("");
  const [abonoForm, setAbonoForm] = useState({
    monto: "",
    metodoPago: "SINPE Movil",
    notas: ""
  });

  useEffect(() => {
    cargarCuentas();
  }, []);

  const cargarCuentas = async () => {
    try {
      setCargando(true);
      setError("");

      const response = await api.get("/CuentasPorCobrar");
      setCuentas(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No fue posible cargar las cuentas por cobrar."
      );
    } finally {
      setCargando(false);
    }
  };

  const cuentasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return cuentas.filter((cuenta) => {
      const abierta =
        cuenta.estado === "Pendiente" ||
        cuenta.estado === "Parcial";

      if (filtroEstado === "abiertas" && !abierta) {
        return false;
      }

      if (
        filtroEstado !== "todas" &&
        filtroEstado !== "abiertas" &&
        cuenta.estado !== filtroEstado
      ) {
        return false;
      }

      if (!texto) {
        return true;
      }

      const cliente = `${cuenta.cliente?.nombre || ""} ${
        cuenta.cliente?.apellidos || ""
      }`.toLowerCase();

      const telefono = (cuenta.cliente?.telefono || "").toLowerCase();
      const origen = cuenta.citaId
        ? `cita ${cuenta.citaId}`
        : cuenta.ventaId
          ? `venta ${cuenta.ventaId}`
          : "";

      return (
        cliente.includes(texto) ||
        telefono.includes(texto) ||
        origen.includes(texto)
      );
    });
  }, [cuentas, filtroEstado, busqueda]);

  const resumen = useMemo(() => {
    const abiertas = cuentas.filter(
      (cuenta) =>
        cuenta.estado === "Pendiente" || cuenta.estado === "Parcial"
    );

    return {
      abiertas: abiertas.length,
      saldoTotal: abiertas.reduce(
        (total, cuenta) => total + Number(cuenta.saldoPendiente || 0),
        0
      ),
      parciales: cuentas.filter((cuenta) => cuenta.estado === "Parcial").length,
      pagadas: cuentas.filter((cuenta) => cuenta.estado === "Pagada").length
    };
  }, [cuentas]);

  const abrirDetalle = async (id) => {
    try {
      setCargandoDetalle(true);
      setErrorDetalle("");
      setCuentaDetalle(null);

      const response = await api.get(`/CuentasPorCobrar/${id}`);
      setCuentaDetalle(response.data);
    } catch (err) {
      setErrorDetalle(
        err.response?.data?.mensaje ||
          "No fue posible cargar el detalle de la cuenta."
      );
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarDetalle = () => {
    if (guardandoAbono) {
      return;
    }

    setCuentaDetalle(null);
    setErrorDetalle("");
    cerrarAbono();
  };

  const abrirAbono = () => {
    if (!cuentaDetalle) {
      return;
    }

    setAbonoForm({
      monto: Number(cuentaDetalle.saldoPendiente || 0).toString(),
      metodoPago: "SINPE Movil",
      notas: ""
    });
    setErrorAbono("");
    setMostrarAbono(true);
  };

  const cerrarAbono = () => {
    if (guardandoAbono) {
      return;
    }

    setMostrarAbono(false);
    setErrorAbono("");
    setAbonoForm({
      monto: "",
      metodoPago: "SINPE Movil",
      notas: ""
    });
  };

  const guardarAbono = async (event) => {
    event.preventDefault();

    if (!cuentaDetalle) {
      return;
    }

    const monto = Number(abonoForm.monto);
    const saldo = Number(cuentaDetalle.saldoPendiente || 0);

    if (!Number.isFinite(monto) || monto <= 0) {
      setErrorAbono("Ingresa un monto mayor a cero.");
      return;
    }

    if (monto > saldo) {
      setErrorAbono("El abono no puede superar el saldo pendiente.");
      return;
    }

    try {
      setGuardandoAbono(true);
      setErrorAbono("");

      await api.post(`/CuentasPorCobrar/${cuentaDetalle.id}/abonos`, {
        monto,
        metodoPago: abonoForm.metodoPago,
        notas: abonoForm.notas || null
      });

      await Promise.all([
        cargarCuentas(),
        abrirDetalle(cuentaDetalle.id)
      ]);

      cerrarAbono();
    } catch (err) {
      setErrorAbono(
        err.response?.data?.mensaje ||
          "No fue posible registrar el abono."
      );
    } finally {
      setGuardandoAbono(false);
    }
  };

  const formatearFecha = (valor) => {
    if (!valor) {
      return "—";
    }

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      return "—";
    }

    return new Intl.DateTimeFormat("es-CR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(fecha);
  };

  const nombreCliente = (cliente) => {
    const nombre = `${cliente?.nombre || ""} ${cliente?.apellidos || ""}`.trim();
    return nombre || "Cliente";
  };

  const claseEstado = (estado) => {
    switch (estado) {
      case "Pagada":
        return "cxc-badge cxc-badge-paid";
      case "Parcial":
        return "cxc-badge cxc-badge-partial";
      case "Anulada":
        return "cxc-badge cxc-badge-cancelled";
      default:
        return "cxc-badge cxc-badge-pending";
    }
  };

  return (
    <div className="cxc-page">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="text-muted small mb-1">Finanzas</div>
          <h2 className="mb-1">Cuentas por cobrar</h2>
          <p className="text-muted mb-0">
            Controla saldos pendientes y registra abonos de tus clientes.
          </p>
        </div>

        <button className="btn btn-outline-secondary" onClick={cargarCuentas}>
          Actualizar
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="cxc-summary-grid mb-4">
        <ResumenCard
          titulo="Saldo pendiente"
          valor={formatearMoneda(resumen.saldoTotal)}
          detalle={`${resumen.abiertas} cuenta(s) abierta(s)`}
          icono={<FaMoneyBillWave />}
        />
        <ResumenCard
          titulo="Parciales"
          valor={resumen.parciales}
          detalle="Con al menos un pago"
          icono={<FaWallet />}
        />
        <ResumenCard
          titulo="Pagadas"
          valor={resumen.pagadas}
          detalle="Cuentas canceladas"
          icono={<FaCheckCircle />}
        />
      </div>

      <div className="card border-0 shadow-sm cxc-card">
        <div className="card-body">
          <div className="row g-3 align-items-end mb-4">
            <div className="col-12 col-lg-7">
              <label className="form-label">Buscar</label>
              <input
                className="form-control"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Cliente, teléfono o número de cita..."
              />
            </div>

            <div className="col-12 col-lg-5">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="abiertas">Pendientes + parciales</option>
                <option value="Pendiente">Pendientes</option>
                <option value="Parcial">Parciales</option>
                <option value="Pagada">Pagadas</option>
                <option value="Anulada">Anuladas</option>
                <option value="todas">Todas</option>
              </select>
            </div>
          </div>

          {cargando ? (
            <div className="cxc-empty-state">
              <div className="spinner-border" role="status" />
              <div className="mt-3">Cargando cuentas...</div>
            </div>
          ) : cuentasFiltradas.length === 0 ? (
            <div className="cxc-empty-state">
              <FaCheckCircle size={34} />
              <strong>No hay cuentas para mostrar.</strong>
              <span>Cuando existan saldos pendientes aparecerán aquí.</span>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle cxc-table mb-0">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Origen</th>
                    <th>Total</th>
                    <th>Pagado</th>
                    <th>Saldo</th>
                    <th>Estado</th>
                    <th className="text-end">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {cuentasFiltradas.map((cuenta) => (
                    <tr key={cuenta.id}>
                      <td>
                        <div className="fw-semibold">
                          {nombreCliente(cuenta.cliente)}
                        </div>
                        <small className="text-muted">
                          {cuenta.cliente?.telefono || "Sin teléfono"}
                        </small>
                      </td>
                      <td>
                        {cuenta.citaId
                          ? `Cita #${cuenta.citaId}`
                          : cuenta.ventaId
                            ? `Venta #${cuenta.ventaId}`
                            : "Manual"}
                      </td>
                      <td>{formatearMoneda(cuenta.montoOriginal)}</td>
                      <td>{formatearMoneda(cuenta.montoPagado)}</td>
                      <td className="fw-bold cxc-saldo">
                        {formatearMoneda(cuenta.saldoPendiente)}
                      </td>
                      <td>
                        <span className={claseEstado(cuenta.estado)}>
                          {cuenta.estado}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => abrirDetalle(cuenta.id)}
                        >
                          <FaEye className="me-1" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {(cuentaDetalle || cargandoDetalle || errorDetalle) && (
        <div className="cxc-modal-backdrop" onMouseDown={cerrarDetalle}>
          <div className="cxc-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="cxc-modal-header">
              <div>
                <div className="text-muted small">Cuenta por cobrar</div>
                <h4 className="mb-0">
                  {cuentaDetalle ? nombreCliente(cuentaDetalle.cliente) : "Detalle"}
                </h4>
              </div>
              <button className="btn btn-light cxc-close" onClick={cerrarDetalle}>
                <FaTimes />
              </button>
            </div>

            <div className="cxc-modal-body">
              {cargandoDetalle ? (
                <div className="cxc-empty-state py-5">
                  <div className="spinner-border" role="status" />
                </div>
              ) : errorDetalle ? (
                <div className="alert alert-danger">{errorDetalle}</div>
              ) : cuentaDetalle ? (
                <>
                  <div className="cxc-detail-grid">
                    <Dato label="Total" value={formatearMoneda(cuentaDetalle.montoOriginal)} />
                    <Dato label="Pagado" value={formatearMoneda(cuentaDetalle.montoPagado)} />
                    <Dato
                      label="Saldo pendiente"
                      value={formatearMoneda(cuentaDetalle.saldoPendiente)}
                      destacado
                    />
                    <Dato label="Estado" value={cuentaDetalle.estado} />
                  </div>

                  <div className="cxc-origin-box mt-4">
                    <div>
                      <span className="text-muted">Origen</span>
                      <strong>
                        {cuentaDetalle.citaId
                          ? `Cita #${cuentaDetalle.citaId}`
                          : cuentaDetalle.ventaId
                            ? `Venta #${cuentaDetalle.ventaId}`
                            : "Registro manual"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted">Sucursal</span>
                      <strong>{cuentaDetalle.sucursal || "—"}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Creada</span>
                      <strong>{formatearFecha(cuentaDetalle.fechaCreacion)}</strong>
                    </div>
                  </div>

                  {cuentaDetalle.notas && (
                    <div className="alert alert-light border mt-3 mb-0">
                      {cuentaDetalle.notas}
                    </div>
                  )}

                  <div className="d-flex align-items-center justify-content-between mt-4 mb-3">
                    <h5 className="mb-0">Historial de abonos</h5>

                    {(cuentaDetalle.estado === "Pendiente" ||
                      cuentaDetalle.estado === "Parcial") && (
                      <button className="btn btn-primary" onClick={abrirAbono}>
                        <FaDollarSign className="me-1" />
                        Registrar abono
                      </button>
                    )}
                  </div>

                  {!cuentaDetalle.abonos?.length ? (
                    <div className="cxc-no-payments">
                      <FaClock />
                      Aún no hay pagos registrados.
                    </div>
                  ) : (
                    <div className="cxc-payments-list">
                      {cuentaDetalle.abonos.map((abono) => (
                        <div className="cxc-payment-item" key={abono.id}>
                          <div>
                            <strong>{formatearMoneda(abono.monto)}</strong>
                            <span>{abono.metodoPago}</span>
                            {abono.notas && <small>{abono.notas}</small>}
                          </div>
                          <time>{formatearFecha(abono.fechaPago)}</time>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {mostrarAbono && cuentaDetalle && (
        <div className="cxc-modal-backdrop cxc-modal-backdrop-top" onMouseDown={cerrarAbono}>
          <form className="cxc-modal cxc-abono-modal" onSubmit={guardarAbono} onMouseDown={(e) => e.stopPropagation()}>
            <div className="cxc-modal-header">
              <div>
                <div className="text-muted small">Nuevo pago</div>
                <h4 className="mb-0">Registrar abono</h4>
              </div>
              <button type="button" className="btn btn-light cxc-close" onClick={cerrarAbono}>
                <FaTimes />
              </button>
            </div>

            <div className="cxc-modal-body">
              <div className="cxc-balance-banner mb-4">
                <span>Saldo actual</span>
                <strong>{formatearMoneda(cuentaDetalle.saldoPendiente)}</strong>
              </div>

              {errorAbono && <div className="alert alert-danger">{errorAbono}</div>}

              <div className="mb-3">
                <label className="form-label">Monto del abono</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={cuentaDetalle.saldoPendiente}
                  className="form-control form-control-lg"
                  value={abonoForm.monto}
                  onChange={(e) =>
                    setAbonoForm((anterior) => ({ ...anterior, monto: e.target.value }))
                  }
                  autoFocus
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Método de pago</label>
                <select
                  className="form-select"
                  value={abonoForm.metodoPago}
                  onChange={(e) =>
                    setAbonoForm((anterior) => ({
                      ...anterior,
                      metodoPago: e.target.value
                    }))
                  }
                >
                  {METODOS_PAGO.map((metodo) => (
                    <option key={metodo} value={metodo}>
                      {metodo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label">Notas (opcional)</label>
                <textarea
                  rows="3"
                  className="form-control"
                  value={abonoForm.notas}
                  onChange={(e) =>
                    setAbonoForm((anterior) => ({ ...anterior, notas: e.target.value }))
                  }
                  placeholder="Ej. Abono por SINPE..."
                />
              </div>

              <div className="d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-light" onClick={cerrarAbono} disabled={guardandoAbono}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={guardandoAbono}>
                  {guardandoAbono ? "Guardando..." : "Registrar abono"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ResumenCard({ titulo, valor, detalle, icono }) {
  return (
    <div className="cxc-summary-card">
      <div className="cxc-summary-icon">{icono}</div>
      <div>
        <span>{titulo}</span>
        <strong>{valor}</strong>
        <small>{detalle}</small>
      </div>
    </div>
  );
}

function Dato({ label, value, destacado = false }) {
  return (
    <div className={`cxc-detail-card ${destacado ? "cxc-detail-highlight" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default CuentasPorCobrar;
