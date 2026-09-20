import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  FaCalendarAlt,
  FaChartBar,
  FaMoneyBillWave,
  FaShoppingBag
} from "react-icons/fa";

import api from "../services/api";

import {
  useConfiguracion
} from "../context/ConfiguracionContext";

function Reportes() {
  const {
    zonaHoraria,
    moneda,
    locale,
    formatearMoneda
  } = useConfiguracion();

  const [tipoPeriodo, setTipoPeriodo] =
    useState("mes");

  const [fechaReferencia, setFechaReferencia] =
    useState(() =>
      obtenerFechaActualTenant(
        zonaHoraria
      )
    );

  const [sucursales, setSucursales] =
    useState([]);

  const [sucursalId, setSucursalId] =
    useState("");

  const [dias, setDias] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setFechaReferencia(
      obtenerFechaActualTenant(
        zonaHoraria
      )
    );
  }, [zonaHoraria]);

  useEffect(() => {
    cargarSucursales();
  }, []);

  useEffect(() => {
    cargarReporte();
  }, [
    tipoPeriodo,
    fechaReferencia,
    sucursalId
  ]);

  const periodo =
    useMemo(
      () =>
        obtenerPeriodo(
          tipoPeriodo,
          fechaReferencia
        ),
      [
        tipoPeriodo,
        fechaReferencia
      ]
    );

  const resumen =
    useMemo(() => {
      return dias.reduce(
        (acumulado, dia) => {
          acumulado.ingresosTotales +=
            Number(
              dia.ingresosTotales || 0
            );

          acumulado.ingresosServicios +=
            Number(
              dia.servicios?.ingresos || 0
            );

          acumulado.citasCompletadas +=
            Number(
              dia.servicios?.cantidadCitas || 0
            );

          acumulado.ingresosProductos +=
            Number(
              dia.productos?.ingresos || 0
            );

          acumulado.ventasProductos +=
            Number(
              dia.productos?.cantidadVentas || 0
            );

          acumulado.costoProductos +=
            Number(
              dia.productos?.costo || 0
            );

          acumulado.utilidadBrutaProductos +=
            Number(
              dia.productos?.utilidadBruta || 0
            );

          acumulado.descuentosProductos +=
            Number(
              dia.productos?.descuentos || 0
            );

          for (
            const metodo
            of dia.ventasPorMetodoPago || []
          ) {
            const clave =
              metodo.metodoPago ||
              "Sin especificar";

            if (!acumulado.metodosPago[clave]) {
              acumulado.metodosPago[clave] = {
                cantidadVentas: 0,
                total: 0
              };
            }

            acumulado.metodosPago[clave]
              .cantidadVentas +=
                Number(
                  metodo.cantidadVentas || 0
                );

            acumulado.metodosPago[clave]
              .total +=
                Number(
                  metodo.total || 0
                );
          }

          return acumulado;
        },
        {
          ingresosTotales: 0,
          ingresosServicios: 0,
          citasCompletadas: 0,
          ingresosProductos: 0,
          ventasProductos: 0,
          costoProductos: 0,
          utilidadBrutaProductos: 0,
          descuentosProductos: 0,
          metodosPago: {}
        }
      );
    }, [dias]);

  const metodosPagoOrdenados =
    useMemo(() => {
      return Object.entries(
        resumen.metodosPago
      )
        .map(
          ([metodoPago, valores]) => ({
            metodoPago,
            ...valores
          })
        )
        .sort(
          (a, b) =>
            b.total - a.total
        );
    }, [resumen]);

  const cargarSucursales = async () => {
    try {
      const response =
        await api.get(
          "/Sucursales"
        );

      setSucursales(
        response.data || []
      );
    } catch {
      // El reporte puede seguir funcionando
      // sin filtro por sucursal.
    }
  };

  const cargarReporte = async () => {
    try {
      setCargando(true);
      setError("");

      const fechas =
        generarFechasPeriodo(
          obtenerPeriodo(
            tipoPeriodo,
            fechaReferencia
          )
        );

      const respuestas =
        await Promise.all(
          fechas.map(
            async (fecha) => {
              const response =
                await api.get(
                  "/ResumenFinanciero/diario",
                  {
                    params: {
                      fecha,
                      ...(sucursalId
                        ? {
                            sucursalId:
                              Number(sucursalId)
                          }
                        : {})
                    }
                  }
                );

              return response.data;
            }
          )
        );

      setDias(respuestas);
    } catch (error) {
      console.error(
        "Error cargando reportes:",
        error
      );

      setError(
        error.response?.data?.mensaje ||
        error.response?.data?.title ||
        "No fue posible cargar el reporte."
      );

      setDias([]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Reportes
          </h1>

          <p className="text-muted mb-0">
            Ingresos por día, semana o mes.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <FaChartBar size={22} />
          <strong>Finanzas</strong>
        </div>
      </div>

      <div className="content-card mt-4">
        <div className="p-4">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">
                Periodo
              </label>

              <select
                className="form-select"
                value={tipoPeriodo}
                onChange={(e) =>
                  setTipoPeriodo(
                    e.target.value
                  )
                }
              >
                <option value="dia">
                  Día
                </option>
                <option value="semana">
                  Semana
                </option>
                <option value="mes">
                  Mes
                </option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">
                Fecha de referencia
              </label>

              <input
                type="date"
                className="form-control"
                value={fechaReferencia}
                onChange={(e) =>
                  setFechaReferencia(
                    e.target.value
                  )
                }
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">
                Sucursal
              </label>

              <select
                className="form-select"
                value={sucursalId}
                onChange={(e) =>
                  setSucursalId(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Todas las sucursales
                </option>

                {sucursales.map(
                  (sucursal) => (
                    <option
                      key={sucursal.id}
                      value={sucursal.id}
                    >
                      {sucursal.nombre}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="col-md-3">
              <div className="small text-muted mb-1">
                Rango
              </div>

              <strong>
                {formatearRango(
                  periodo.desde,
                  periodo.hasta,
                  locale
                )}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mt-4">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="py-5 text-center">
          <div
            className="spinner-border"
            role="status"
          />

          <div className="mt-3 text-muted">
            Cargando reporte...
          </div>
        </div>
      ) : (
        <>
          <div className="row g-4 mt-1">
            <div className="col-md-6 col-xl-3">
              <ReportCard
                label="Ingresos totales"
                valor={
                  mostrarMoneda(
                    resumen.ingresosTotales,
                    formatearMoneda,
                    moneda
                  )
                }
                detalle="Servicios + productos"
                icono={
                  <FaMoneyBillWave
                    size={28}
                    className="text-primary"
                  />
                }
              />
            </div>

            <div className="col-md-6 col-xl-3">
              <ReportCard
                label="Servicios"
                valor={
                  mostrarMoneda(
                    resumen.ingresosServicios,
                    formatearMoneda,
                    moneda
                  )
                }
                detalle={`${resumen.citasCompletadas} cita(s) completada(s)`}
                icono={
                  <FaCalendarAlt
                    size={28}
                    className="text-primary"
                  />
                }
              />
            </div>

            <div className="col-md-6 col-xl-3">
              <ReportCard
                label="Productos"
                valor={
                  mostrarMoneda(
                    resumen.ingresosProductos,
                    formatearMoneda,
                    moneda
                  )
                }
                detalle={`${resumen.ventasProductos} venta(s)`}
                icono={
                  <FaShoppingBag
                    size={28}
                    className="text-primary"
                  />
                }
              />
            </div>

            <div className="col-md-6 col-xl-3">
              <ReportCard
                label="Utilidad bruta productos"
                valor={
                  mostrarMoneda(
                    resumen.utilidadBrutaProductos,
                    formatearMoneda,
                    moneda
                  )
                }
                detalle={`Costo: ${mostrarMoneda(
                  resumen.costoProductos,
                  formatearMoneda,
                  moneda
                )}`}
                icono={
                  <FaMoneyBillWave
                    size={28}
                    className="text-primary"
                  />
                }
              />
            </div>
          </div>

          <div className="row g-4 mt-1">
            <div className="col-lg-8">
              <div className="content-card h-100">
                <div className="p-4 border-bottom">
                  <h5 className="mb-1">
                    Detalle por día
                  </h5>

                  <div className="text-muted small">
                    Historial financiero del periodo seleccionado.
                  </div>
                </div>

                {dias.length === 0 ? (
                  <div className="empty-state">
                    No hay información para este periodo.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th className="text-end">
                            Servicios
                          </th>
                          <th className="text-end">
                            Productos
                          </th>
                          <th className="text-center">
                            Citas
                          </th>
                          <th className="text-center">
                            Ventas
                          </th>
                          <th className="text-end">
                            Total
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {dias.map(
                          (dia) => (
                            <tr key={dia.fecha}>
                              <td>
                                <strong>
                                  {formatearFecha(
                                    dia.fecha,
                                    locale
                                  )}
                                </strong>
                              </td>

                              <td className="text-end">
                                {mostrarMoneda(
                                  Number(
                                    dia.servicios?.ingresos || 0
                                  ),
                                  formatearMoneda,
                                  moneda
                                )}
                              </td>

                              <td className="text-end">
                                {mostrarMoneda(
                                  Number(
                                    dia.productos?.ingresos || 0
                                  ),
                                  formatearMoneda,
                                  moneda
                                )}
                              </td>

                              <td className="text-center">
                                {dia.servicios?.cantidadCitas || 0}
                              </td>

                              <td className="text-center">
                                {dia.productos?.cantidadVentas || 0}
                              </td>

                              <td className="text-end fw-bold">
                                {mostrarMoneda(
                                  Number(
                                    dia.ingresosTotales || 0
                                  ),
                                  formatearMoneda,
                                  moneda
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-4">
              <div className="content-card h-100">
                <div className="p-4 border-bottom">
                  <h5 className="mb-1">
                    Métodos de pago
                  </h5>

                  <div className="text-muted small">
                    Ventas de productos del periodo.
                  </div>
                </div>

                <div className="p-4">
                  {metodosPagoOrdenados.length === 0 ? (
                    <div className="text-muted text-center py-4">
                      No hay ventas de productos.
                    </div>
                  ) : (
                    metodosPagoOrdenados.map(
                      (metodo) => (
                        <div
                          key={metodo.metodoPago}
                          className="d-flex justify-content-between align-items-center py-3 border-bottom"
                        >
                          <div>
                            <strong>
                              {metodo.metodoPago}
                            </strong>

                            <div className="text-muted small">
                              {metodo.cantidadVentas} venta(s)
                            </div>
                          </div>

                          <strong>
                            {mostrarMoneda(
                              metodo.total,
                              formatearMoneda,
                              moneda
                            )}
                          </strong>
                        </div>
                      )
                    )
                  )}

                  <div className="mt-4 pt-2">
                    <div className="d-flex justify-content-between py-2">
                      <span className="text-muted">
                        Descuentos
                      </span>

                      <strong>
                        {mostrarMoneda(
                          resumen.descuentosProductos,
                          formatearMoneda,
                          moneda
                        )}
                      </strong>
                    </div>

                    <div className="d-flex justify-content-between py-2">
                      <span className="text-muted">
                        Costo productos
                      </span>

                      <strong>
                        {mostrarMoneda(
                          resumen.costoProductos,
                          formatearMoneda,
                          moneda
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ReportCard({
  label,
  valor,
  detalle,
  icono
}) {
  return (
    <div className="dashboard-card h-100">
      <div className="d-flex align-items-center justify-content-between gap-3">
        <div>
          <div className="dashboard-label">
            {label}
          </div>

          <div className="dashboard-value">
            {valor}
          </div>

          <small className="text-muted">
            {detalle}
          </small>
        </div>

        {icono}
      </div>
    </div>
  );
}

function obtenerPeriodo(
  tipoPeriodo,
  fechaReferencia
) {
  const fecha =
    parseFechaLocal(
      fechaReferencia
    );

  if (tipoPeriodo === "dia") {
    const valor =
      formatearFechaIso(fecha);

    return {
      desde: valor,
      hasta: valor
    };
  }

  if (tipoPeriodo === "semana") {
    const diaSemana =
      fecha.getDay();

    const desplazamiento =
      diaSemana === 0
        ? -6
        : 1 - diaSemana;

    const lunes =
      new Date(fecha);

    lunes.setDate(
      fecha.getDate() +
      desplazamiento
    );

    const domingo =
      new Date(lunes);

    domingo.setDate(
      lunes.getDate() + 6
    );

    return {
      desde:
        formatearFechaIso(lunes),
      hasta:
        formatearFechaIso(domingo)
    };
  }

  const primero =
    new Date(
      fecha.getFullYear(),
      fecha.getMonth(),
      1
    );

  const ultimo =
    new Date(
      fecha.getFullYear(),
      fecha.getMonth() + 1,
      0
    );

  return {
    desde:
      formatearFechaIso(primero),
    hasta:
      formatearFechaIso(ultimo)
  };
}

function generarFechasPeriodo(
  periodo
) {
  const fechas = [];

  const actual =
    parseFechaLocal(
      periodo.desde
    );

  const fin =
    parseFechaLocal(
      periodo.hasta
    );

  while (actual <= fin) {
    fechas.push(
      formatearFechaIso(
        actual
      )
    );

    actual.setDate(
      actual.getDate() + 1
    );
  }

  return fechas;
}

function parseFechaLocal(
  fecha
) {
  const [
    year,
    month,
    day
  ] = fecha
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}

function formatearFechaIso(
  fecha
) {
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
}

function obtenerFechaActualTenant(
  zonaHoraria
) {
  try {
    const partes =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone:
            zonaHoraria ||
            "America/Costa_Rica",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }
      ).formatToParts(
        new Date()
      );

    const year =
      partes.find(
        (parte) =>
          parte.type === "year"
      )?.value;

    const month =
      partes.find(
        (parte) =>
          parte.type === "month"
      )?.value;

    const day =
      partes.find(
        (parte) =>
          parte.type === "day"
      )?.value;

    return `${year}-${month}-${day}`;
  } catch {
    return new Date()
      .toISOString()
      .slice(
        0,
        10
      );
  }
}

function formatearFecha(
  fecha,
  locale
) {
  return new Intl.DateTimeFormat(
    locale,
    {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  ).format(
    parseFechaLocal(fecha)
  );
}

function formatearRango(
  desde,
  hasta,
  locale
) {
  if (desde === hasta) {
    return formatearFecha(
      desde,
      locale
    );
  }

  return `${formatearFecha(
    desde,
    locale
  )} - ${formatearFecha(
    hasta,
    locale
  )}`;
}

function mostrarMoneda(
  valor,
  formatearMoneda,
  moneda
) {
  const numero =
    Number(valor || 0);

  if (formatearMoneda) {
    return formatearMoneda(
      numero
    );
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: moneda || "USD"
    }).format(numero);
  } catch {
    return `${moneda || ""} ${numero.toLocaleString()}`.trim();
  }
}

export default Reportes;
