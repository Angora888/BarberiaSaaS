import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  FaCashRegister,
  FaMinus,
  FaPlus,
  FaReceipt,
  FaSearch,
  FaShoppingCart,
  FaTrash
} from "react-icons/fa";

import api from "../services/api";

import {
  useConfiguracion
} from "../context/ConfiguracionContext";

function Ventas() {
  const {
    formatearMoneda,
    formatearFechaHora
  } = useConfiguracion();

  const [sucursales, setSucursales] =
    useState([]);

  const [clientes, setClientes] =
    useState([]);

  const [productos, setProductos] =
    useState([]);

  const [ventas, setVentas] =
    useState([]);

  const [metodosPago, setMetodosPago] =
    useState([]);

  const [sucursalId, setSucursalId] =
    useState("");

  const [clienteId, setClienteId] =
    useState("");

  const [metodoPago, setMetodoPago] =
    useState("Efectivo");

  const [descuento, setDescuento] =
    useState("");

  const [notas, setNotas] =
    useState("");

  const [busqueda, setBusqueda] =
    useState("");

  const [carrito, setCarrito] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [cobrando, setCobrando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  useEffect(() => {
    cargarInicial();
  }, []);

  useEffect(() => {
    if (sucursalId) {
      cargarProductos();
    } else {
      setProductos([]);
      setCarrito([]);
    }
  }, [sucursalId]);

  const cargarInicial = async () => {
    try {
      setCargando(true);
      setError("");

      const [
        sucursalesResponse,
        clientesResponse,
        metodosResponse,
        ventasResponse
      ] = await Promise.all([
        api.get("/Sucursales"),
        api.get("/Clientes"),
        api.get("/Ventas/metodos-pago"),
        api.get("/Ventas?limite=15")
      ]);

      const sucursalesData =
        sucursalesResponse.data || [];

      setSucursales(sucursalesData);
      setClientes(clientesResponse.data || []);
      setMetodosPago(metodosResponse.data || []);
      setVentas(ventasResponse.data || []);

      if (metodosResponse.data?.length) {
        setMetodoPago(
          metodosResponse.data[0]
        );
      }

      if (sucursalesData.length === 1) {
        setSucursalId(
          sucursalesData[0].id.toString()
        );
      }
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        "No fue posible cargar la caja."
      );
    } finally {
      setCargando(false);
    }
  };

  const cargarProductos = async () => {
    try {
      setError("");

      const response = await api.get(
        "/Productos",
        {
          params: {
            sucursalId:
              Number(sucursalId)
          }
        }
      );

      setProductos(
        (response.data || []).filter(
          (producto) =>
            producto.activo !== false
        )
      );

      setCarrito([]);
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        "No fue posible cargar los productos."
      );
    }
  };

  const productosFiltrados =
    useMemo(() => {
      const texto =
        busqueda.trim().toLowerCase();

      if (!texto) {
        return productos;
      }

      return productos.filter(
        (producto) =>
          producto.nombre
            ?.toLowerCase()
            .includes(texto) ||
          producto.categoria
            ?.toLowerCase()
            .includes(texto) ||
          producto.codigo
            ?.toLowerCase()
            .includes(texto) ||
          producto.codigoBarras
            ?.toLowerCase()
            .includes(texto)
      );
    }, [productos, busqueda]);

  const obtenerStock = (producto) => {
    return Number(
      producto.stockTotal || 0
    );
  };

  const agregarProducto = (
    producto
  ) => {
    const stock =
      obtenerStock(producto);

    if (stock <= 0) {
      setError(
        `No hay existencias de ${producto.nombre}.`
      );
      return;
    }

    setError("");

    setCarrito((anterior) => {
      const existente =
        anterior.find(
          (item) =>
            item.productoId ===
            producto.id
        );

      if (existente) {
        if (
          existente.cantidad >= stock
        ) {
          setError(
            `Solo hay ${stock} unidad(es) disponibles de ${producto.nombre}.`
          );
          return anterior;
        }

        return anterior.map(
          (item) =>
            item.productoId ===
            producto.id
              ? {
                  ...item,
                  cantidad:
                    item.cantidad + 1
                }
              : item
        );
      }

      return [
        ...anterior,
        {
          productoId:
            producto.id,
          nombre:
            producto.nombre,
          precioVenta:
            Number(
              producto.precioVenta || 0
            ),
          stock,
          cantidad: 1
        }
      ];
    });
  };

  const cambiarCantidad = (
    productoId,
    cambio
  ) => {
    setError("");

    setCarrito((anterior) =>
      anterior
        .map((item) => {
          if (
            item.productoId !==
            productoId
          ) {
            return item;
          }

          const nuevaCantidad =
            item.cantidad + cambio;

          if (nuevaCantidad <= 0) {
            return null;
          }

          if (
            nuevaCantidad > item.stock
          ) {
            setError(
              `Solo hay ${item.stock} unidad(es) disponibles de ${item.nombre}.`
            );
            return item;
          }

          return {
            ...item,
            cantidad:
              nuevaCantidad
          };
        })
        .filter(Boolean)
    );
  };

  const eliminarProducto = (
    productoId
  ) => {
    setCarrito((anterior) =>
      anterior.filter(
        (item) =>
          item.productoId !==
          productoId
      )
    );
  };

  const subtotal =
    useMemo(
      () =>
        carrito.reduce(
          (total, item) =>
            total +
            item.precioVenta *
              item.cantidad,
          0
        ),
      [carrito]
    );

  const descuentoNumero =
    Math.max(
      0,
      Number(descuento) || 0
    );

  const total =
    Math.max(
      0,
      subtotal - descuentoNumero
    );

  const cobrar = async () => {
    setError("");
    setMensaje("");

    if (!sucursalId) {
      setError(
        "Selecciona una sucursal."
      );
      return;
    }

    if (!clienteId) {
      setError(
        "Selecciona un cliente para registrar la venta."
      );
      return;
    }

    if (carrito.length === 0) {
      setError(
        "Agrega al menos un producto a la venta."
      );
      return;
    }

    if (
      descuentoNumero > subtotal
    ) {
      setError(
        "El descuento no puede superar el subtotal."
      );
      return;
    }

    try {
      setCobrando(true);

      const response = await api.post(
        "/Ventas",
        {
          sucursalId:
            Number(sucursalId),
          clienteId:
            clienteId
              ? Number(clienteId)
              : null,
          metodoPago,
          descuento:
            descuentoNumero,
          notas:
            notas.trim() || null,
          detalles:
            carrito.map(
              (item) => ({
                productoId:
                  item.productoId,
                cantidad:
                  item.cantidad
              })
            )
        }
      );

      setMensaje(
        `Venta #${response.data.id} registrada por ${formatearMoneda(Number(response.data.total || total))}.`
      );

      setCarrito([]);
      setClienteId("");
      setDescuento("");
      setNotas("");

      await Promise.all([
        cargarProductos(),
        cargarVentas()
      ]);
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        "No fue posible registrar la venta."
      );
    } finally {
      setCobrando(false);
    }
  };

  const cargarVentas = async () => {
    try {
      const response =
        await api.get(
          "/Ventas?limite=15"
        );

      setVentas(
        response.data || []
      );
    } catch {
      // La venta ya fue guardada; si falla
      // el historial no bloqueamos la caja.
    }
  };

  const formatearFecha = (fecha) => formatearFechaHora(fecha);

  if (cargando) {
    return (
      <div className="empty-state">
        Cargando caja...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Ventas / Caja
          </h1>

          <p className="text-muted mb-0">
            Registra ventas de productos y
            descuenta inventario automáticamente.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <FaCashRegister size={22} />
          <strong>POS</strong>
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

      <div className="row g-4 mt-1">
        <div className="col-xl-8">
          <div className="content-card">
            <div className="client-toolbar">
              <div className="search-box">
                <FaSearch />

                <input
                  type="text"
                  placeholder="Buscar producto, código o categoría..."
                  value={busqueda}
                  onChange={(e) =>
                    setBusqueda(
                      e.target.value
                    )
                  }
                />
              </div>

              <select
                className="form-select"
                style={{
                  maxWidth: "230px"
                }}
                value={sucursalId}
                onChange={(e) =>
                  setSucursalId(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Seleccionar sucursal
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

            {!sucursalId ? (
              <div className="empty-state">
                Selecciona una sucursal para
                ver el inventario disponible.
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="empty-state">
                No hay productos disponibles.
              </div>
            ) : (
              <div className="p-3">
                <div className="row g-3">
                  {productosFiltrados.map(
                    (producto) => {
                      const stock =
                        obtenerStock(producto);

                      return (
                        <div
                          className="col-md-6 col-lg-4"
                          key={producto.id}
                        >
                          <button
                            type="button"
                            className="card h-100 w-100 text-start border-0 shadow-sm"
                            style={{
                              cursor:
                                stock > 0
                                  ? "pointer"
                                  : "not-allowed",
                              opacity:
                                stock > 0
                                  ? 1
                                  : 0.55
                            }}
                            disabled={stock <= 0}
                            onClick={() =>
                              agregarProducto(
                                producto
                              )
                            }
                          >
                            <div className="card-body">
                              <div className="d-flex justify-content-between gap-2 mb-2">
                                <strong>
                                  {producto.nombre}
                                </strong>

                                <span
                                  className={
                                    stock >
                                    Number(
                                      producto.stockMinimo || 0
                                    )
                                      ? "badge text-bg-success"
                                      : "badge text-bg-warning"
                                  }
                                >
                                  Stock {stock}
                                </span>
                              </div>

                              <div className="text-muted small mb-3">
                                {producto.categoria ||
                                  "Sin categoría"}
                              </div>

                              <div className="d-flex justify-content-between align-items-end">
                                <strong className="fs-5">
                                  {formatearMoneda(
                                    Number(
                                      producto.precioVenta || 0
                                    )
                                  )}
                                </strong>

                                <FaPlus />
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-xl-4">
          <div className="content-card">
            <div className="p-4 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <FaShoppingCart />
                <h5 className="mb-0">
                  Venta actual
                </h5>
              </div>
            </div>

            <div className="p-4">
              {carrito.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <FaShoppingCart size={28} />
                  <div className="mt-2">
                    Agrega productos a la venta.
                  </div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3 mb-4">
                  {carrito.map(
                    (item) => (
                      <div
                        key={item.productoId}
                        className="border rounded-3 p-3"
                      >
                        <div className="d-flex justify-content-between gap-2">
                          <div>
                            <strong>
                              {item.nombre}
                            </strong>

                            <div className="text-muted small">
                              {formatearMoneda(
                                item.precioVenta
                              )}{" "}
                              c/u
                            </div>
                          </div>

                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              eliminarProducto(
                                item.productoId
                              )
                            }
                          >
                            <FaTrash />
                          </button>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() =>
                                cambiarCantidad(
                                  item.productoId,
                                  -1
                                )
                              }
                            >
                              <FaMinus />
                            </button>

                            <button
                              className="btn btn-light"
                              disabled
                            >
                              {item.cantidad}
                            </button>

                            <button
                              className="btn btn-outline-secondary"
                              onClick={() =>
                                cambiarCantidad(
                                  item.productoId,
                                  1
                                )
                              }
                            >
                              <FaPlus />
                            </button>
                          </div>

                          <strong>
                            {formatearMoneda(
                              item.precioVenta *
                                item.cantidad
                            )}
                          </strong>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">
                  Cliente *
                </label>

                <select
                  className="form-select"
                  value={clienteId}
                  onChange={(e) =>
                    setClienteId(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Seleccionar cliente
                  </option>

                  {clientes.map(
                    (cliente) => (
                      <option
                        key={cliente.id}
                        value={cliente.id}
                      >
                        {cliente.nombre}{" "}
                        {cliente.apellidos}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Método de pago
                </label>

                <select
                  className="form-select"
                  value={metodoPago}
                  onChange={(e) =>
                    setMetodoPago(
                      e.target.value
                    )
                  }
                >
                  {metodosPago.map(
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

              <div className="mb-3">
                <label className="form-label">
                  Descuento
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={descuento}
                  onChange={(e) =>
                    setDescuento(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="mb-4">
                <label className="form-label">
                  Notas
                </label>

                <textarea
                  className="form-control"
                  rows="2"
                  value={notas}
                  onChange={(e) =>
                    setNotas(
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="border-top pt-3">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">
                    Subtotal
                  </span>

                  <strong>
                    {formatearMoneda(subtotal)}
                  </strong>
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">
                    Descuento
                  </span>

                  <strong>
                    - {formatearMoneda(
                      descuentoNumero
                    )}
                  </strong>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fs-5">
                    Total
                  </span>

                  <strong className="fs-3">
                    {formatearMoneda(total)}
                  </strong>
                </div>

                <button
                  className="btn btn-primary w-100 btn-lg"
                  disabled={
                    cobrando ||
                    carrito.length === 0
                  }
                  onClick={cobrar}
                >
                  <FaCashRegister className="me-2" />
                  {cobrando
                    ? "Procesando..."
                    : "Cobrar venta"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="content-card mt-4">
        <div className="p-4 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <FaReceipt />
            <h5 className="mb-0">
              Ventas recientes
            </h5>
          </div>
        </div>

        {ventas.length === 0 ? (
          <div className="empty-state">
            Aún no hay ventas registradas.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table client-table align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Pago</th>
                  <th>Productos</th>
                  <th>Estado</th>
                  <th className="text-end">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {ventas.map(
                  (venta) => (
                    <tr key={venta.id}>
                      <td>
                        #{venta.id}
                      </td>

                      <td>
                        {formatearFecha(
                          venta.fecha
                        )}
                      </td>

                      <td>
                        {venta.cliente ||
                          "Sin cliente"}
                      </td>

                      <td>
                        {venta.metodoPago}
                      </td>

                      <td>
                        {venta.cantidadProductos}
                      </td>

                      <td>
                        <span
                          className={
                            venta.estado ===
                            "Completada"
                              ? "badge text-bg-success"
                              : "badge text-bg-secondary"
                          }
                        >
                          {venta.estado}
                        </span>
                      </td>

                      <td className="text-end">
                        <strong>
                          {formatearMoneda(
                            Number(
                              venta.total || 0
                            )
                          )}
                        </strong>
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
  );
}

export default Ventas;