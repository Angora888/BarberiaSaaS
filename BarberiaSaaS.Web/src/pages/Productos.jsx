import {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  FaBoxes,
  FaEdit,
  FaPlus,
  FaSearch,
  FaTags,
  FaTimes
} from "react-icons/fa";
import api from "../services/api";
import {
  useConfiguracion
} from "../context/ConfiguracionContext";

function Productos() {
  const { formatearMoneda } =
    useConfiguracion();

  const [productos, setProductos] =
    useState([]);
  const [categorias, setCategorias] =
    useState([]);
  const [sucursales, setSucursales] =
    useState([]);
  const [busqueda, setBusqueda] =
    useState("");
  const [sucursalId, setSucursalId] =
    useState("");
  const [cargando, setCargando] =
    useState(true);
  const [error, setError] =
    useState("");
  const [mensaje, setMensaje] =
    useState("");
  const [guardando, setGuardando] =
    useState(false);

  const [mostrarProducto, setMostrarProducto] =
    useState(false);
  const [productoEditando, setProductoEditando] =
    useState(null);
  const [mostrarCategoria, setMostrarCategoria] =
    useState(false);
  const [mostrarStock, setMostrarStock] =
    useState(false);
  const [productoStock, setProductoStock] =
    useState(null);

  const [productoForm, setProductoForm] =
    useState({
      categoriaProductoId: "",
      nombre: "",
      descripcion: "",
      codigo: "",
      codigoBarras: "",
      costo: "",
      precioVenta: "",
      stockMinimo: "0",
      imagenUrl: "",
      activo: true
    });

  const [categoriaForm, setCategoriaForm] =
    useState({
      nombre: "",
      descripcion: ""
    });

  const [stockForm, setStockForm] =
    useState({
      sucursalId: "",
      tipo: "Entrada",
      cantidad: "",
      motivo: ""
    });

  useEffect(() => {
    cargarInicial();
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [sucursalId]);

  const cargarInicial = async () => {
    try {
      setCargando(true);
      setError("");

      const [cat, suc] =
        await Promise.all([
          api.get("/CategoriasProductos"),
          api.get("/Sucursales")
        ]);

      setCategorias(cat.data || []);
      setSucursales(suc.data || []);

      if (suc.data?.length === 1) {
        setStockForm((anterior) => ({
          ...anterior,
          sucursalId: String(suc.data[0].id)
        }));
      }
    } catch (e) {
      setError(
        e.response?.data?.mensaje ||
        "No fue posible cargar categorías y sucursales."
      );
    } finally {
      setCargando(false);
    }
  };

  const cargarProductos = async () => {
    try {
      const params = {};
      if (sucursalId) {
        params.sucursalId = Number(sucursalId);
      }

      const response =
        await api.get("/Productos", { params });

      setProductos(response.data || []);
    } catch (e) {
      setError(
        e.response?.data?.mensaje ||
        "No fue posible cargar los productos."
      );
    }
  };

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return productos;

    return productos.filter((p) =>
      p.nombre?.toLowerCase().includes(texto) ||
      p.categoria?.toLowerCase().includes(texto) ||
      p.codigo?.toLowerCase().includes(texto) ||
      p.codigoBarras?.toLowerCase().includes(texto)
    );
  }, [productos, busqueda]);

  const limpiarMensajes = () => {
    setError("");
    setMensaje("");
  };

  const nuevoProducto = () => {
    limpiarMensajes();
    setProductoEditando(null);
    setProductoForm({
      categoriaProductoId: "",
      nombre: "",
      descripcion: "",
      codigo: "",
      codigoBarras: "",
      costo: "",
      precioVenta: "",
      stockMinimo: "0",
      imagenUrl: "",
      activo: true
    });
    setMostrarProducto(true);
  };

  const editarProducto = (p) => {
    limpiarMensajes();
    setProductoEditando(p);
    setProductoForm({
      categoriaProductoId:
        p.categoriaProductoId?.toString() || "",
      nombre: p.nombre || "",
      descripcion: p.descripcion || "",
      codigo: p.codigo || "",
      codigoBarras: p.codigoBarras || "",
      costo: String(p.costo ?? 0),
      precioVenta: String(p.precioVenta ?? 0),
      stockMinimo: String(p.stockMinimo ?? 0),
      imagenUrl: p.imagenUrl || "",
      activo: p.activo !== false
    });
    setMostrarProducto(true);
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    limpiarMensajes();

    const costo = Number(productoForm.costo);
    const precioVenta = Number(productoForm.precioVenta);
    const stockMinimo = Number(productoForm.stockMinimo);

    if (!productoForm.nombre.trim()) {
      setError("El nombre es requerido.");
      return;
    }

    if ([costo, precioVenta, stockMinimo].some(
      (x) => Number.isNaN(x) || x < 0
    )) {
      setError("Costo, precio y stock mínimo deben ser válidos.");
      return;
    }

    const payload = {
      categoriaProductoId:
        productoForm.categoriaProductoId
          ? Number(productoForm.categoriaProductoId)
          : null,
      nombre: productoForm.nombre.trim(),
      descripcion: productoForm.descripcion.trim() || null,
      codigo: productoForm.codigo.trim() || null,
      codigoBarras: productoForm.codigoBarras.trim() || null,
      costo,
      precioVenta,
      stockMinimo,
      imagenUrl: productoForm.imagenUrl.trim() || null,
      activo: productoForm.activo
    };

    try {
      setGuardando(true);

      if (productoEditando) {
        await api.put(
          `/Productos/${productoEditando.id}`,
          payload
        );
        setMensaje("Producto actualizado correctamente.");
      } else {
        const { activo, ...nuevo } = payload;
        await api.post("/Productos", nuevo);
        setMensaje("Producto creado correctamente.");
      }

      setMostrarProducto(false);
      await cargarProductos();
    } catch (e) {
      setError(
        e.response?.data?.mensaje ||
        "No fue posible guardar el producto."
      );
    } finally {
      setGuardando(false);
    }
  };

  const guardarCategoria = async (e) => {
    e.preventDefault();
    limpiarMensajes();

    if (!categoriaForm.nombre.trim()) {
      setError("El nombre de la categoría es requerido.");
      return;
    }

    try {
      setGuardando(true);
      await api.post("/CategoriasProductos", {
        nombre: categoriaForm.nombre.trim(),
        descripcion: categoriaForm.descripcion.trim() || null
      });

      const response =
        await api.get("/CategoriasProductos");

      setCategorias(response.data || []);
      setCategoriaForm({ nombre: "", descripcion: "" });
      setMensaje("Categoría creada correctamente.");
    } catch (e) {
      setError(
        e.response?.data?.mensaje ||
        "No fue posible crear la categoría."
      );
    } finally {
      setGuardando(false);
    }
  };

  const abrirStock = (p) => {
    limpiarMensajes();
    setProductoStock(p);
    setStockForm((anterior) => ({
      sucursalId:
        anterior.sucursalId ||
        (sucursales.length === 1
          ? String(sucursales[0].id)
          : ""),
      tipo: "Entrada",
      cantidad: "",
      motivo: ""
    }));
    setMostrarStock(true);
  };

  const guardarStock = async (e) => {
    e.preventDefault();
    limpiarMensajes();

    const cantidad = Number(stockForm.cantidad);

    if (!stockForm.sucursalId) {
      setError("Selecciona una sucursal.");
      return;
    }

    if (
      Number.isNaN(cantidad) ||
      cantidad < 0 ||
      (stockForm.tipo !== "Ajuste" && cantidad <= 0)
    ) {
      setError("La cantidad no es válida.");
      return;
    }

    try {
      setGuardando(true);
      await api.post("/Inventario/ajustar", {
        sucursalId: Number(stockForm.sucursalId),
        productoId: productoStock.id,
        tipo: stockForm.tipo,
        cantidad,
        motivo: stockForm.motivo.trim() || null
      });

      setMostrarStock(false);
      setMensaje("Inventario actualizado correctamente.");
      await cargarProductos();
    } catch (e) {
      setError(
        e.response?.data?.mensaje ||
        "No fue posible actualizar el inventario."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Productos e inventario</h1>
          <p className="text-muted mb-0">
            Administra catálogo, precios y existencias.
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-outline-secondary"
            onClick={() => {
              limpiarMensajes();
              setMostrarCategoria(true);
            }}
          >
            <FaTags className="me-2" />
            Categorías
          </button>

          <button
            className="btn btn-primary"
            onClick={nuevoProducto}
          >
            <FaPlus className="me-2" />
            Nuevo producto
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger mt-4">{error}</div>
      )}

      {mensaje && (
        <div className="alert alert-success mt-4">{mensaje}</div>
      )}

      <div className="content-card mt-4">
        <div className="client-toolbar">
          <div className="search-box">
            <FaSearch />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto..."
            />
          </div>

          <select
            className="form-select"
            style={{ maxWidth: 240 }}
            value={sucursalId}
            onChange={(e) => setSucursalId(e.target.value)}
          >
            <option value="">Todas las sucursales</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>

        {cargando ? (
          <div className="empty-state">Cargando...</div>
        ) : filtrados.length === 0 ? (
          <div className="empty-state">
            <FaBoxes size={32} />
            <h5 className="mt-3">No hay productos</h5>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table client-table align-middle">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Costo</th>
                  <th>Venta</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => {
                  const stock = Number(p.stockTotal || 0);
                  const bajo = stock <= Number(p.stockMinimo || 0);

                  return (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.nombre}</strong>
                        {(p.codigo || p.codigoBarras) && (
                          <div className="text-muted small">
                            {p.codigo || p.codigoBarras}
                          </div>
                        )}
                      </td>
                      <td>{p.categoria || "Sin categoría"}</td>
                      <td>{formatearMoneda(Number(p.costo || 0))}</td>
                      <td><strong>{formatearMoneda(Number(p.precioVenta || 0))}</strong></td>
                      <td>
                        <span className={`badge ${bajo ? "text-bg-warning" : "text-bg-success"}`}>
                          {stock}
                        </span>
                      </td>
                      <td>{p.stockMinimo}</td>
                      <td>{p.activo ? "Activo" : "Inactivo"}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => abrirStock(p)}
                        >
                          Stock
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => editarProducto(p)}
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mostrarProducto && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal custom-modal-large">
            <div className="custom-modal-header">
              <h4>{productoEditando ? "Editar producto" : "Nuevo producto"}</h4>
              <button className="modal-close" onClick={() => setMostrarProducto(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={guardarProducto}>
              <div className="custom-modal-body">
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label">Nombre</label>
                    <input
                      className="form-control"
                      value={productoForm.nombre}
                      onChange={(e) => setProductoForm({ ...productoForm, nombre: e.target.value })}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Categoría</label>
                    <select
                      className="form-select"
                      value={productoForm.categoriaProductoId}
                      onChange={(e) => setProductoForm({ ...productoForm, categoriaProductoId: e.target.value })}
                    >
                      <option value="">Sin categoría</option>
                      {categorias.filter((c) => c.activa !== false).map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      value={productoForm.descripcion}
                      onChange={(e) => setProductoForm({ ...productoForm, descripcion: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Código</label>
                    <input
                      className="form-control"
                      value={productoForm.codigo}
                      onChange={(e) => setProductoForm({ ...productoForm, codigo: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Código de barras</label>
                    <input
                      className="form-control"
                      value={productoForm.codigoBarras}
                      onChange={(e) => setProductoForm({ ...productoForm, codigoBarras: e.target.value })}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Costo</label>
                    <input type="number" min="0" step="0.01" className="form-control" value={productoForm.costo} onChange={(e) => setProductoForm({ ...productoForm, costo: e.target.value })} required />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Precio venta</label>
                    <input type="number" min="0" step="0.01" className="form-control" value={productoForm.precioVenta} onChange={(e) => setProductoForm({ ...productoForm, precioVenta: e.target.value })} required />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Stock mínimo</label>
                    <input type="number" min="0" step="0.01" className="form-control" value={productoForm.stockMinimo} onChange={(e) => setProductoForm({ ...productoForm, stockMinimo: e.target.value })} required />
                  </div>

                  {productoEditando && (
                    <div className="col-12 form-check ms-2">
                      <input
                        id="productoActivo"
                        className="form-check-input"
                        type="checkbox"
                        checked={productoForm.activo}
                        onChange={(e) => setProductoForm({ ...productoForm, activo: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="productoActivo">Producto activo</label>
                    </div>
                  )}
                </div>
              </div>

              <div className="custom-modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setMostrarProducto(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarCategoria && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal">
            <div className="custom-modal-header">
              <h4>Nueva categoría</h4>
              <button className="modal-close" onClick={() => setMostrarCategoria(false)}><FaTimes /></button>
            </div>

            <form onSubmit={guardarCategoria}>
              <div className="custom-modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input className="form-control" value={categoriaForm.nombre} onChange={(e) => setCategoriaForm({ ...categoriaForm, nombre: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Descripción</label>
                  <textarea className="form-control" value={categoriaForm.descripcion} onChange={(e) => setCategoriaForm({ ...categoriaForm, descripcion: e.target.value })} />
                </div>
              </div>

              <div className="custom-modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setMostrarCategoria(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarStock && productoStock && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal">
            <div className="custom-modal-header">
              <div>
                <h4>Ajustar inventario</h4>
                <div className="text-muted">{productoStock.nombre}</div>
              </div>
              <button className="modal-close" onClick={() => setMostrarStock(false)}><FaTimes /></button>
            </div>

            <form onSubmit={guardarStock}>
              <div className="custom-modal-body">
                <div className="mb-3">
                  <label className="form-label">Sucursal</label>
                  <select className="form-select" value={stockForm.sucursalId} onChange={(e) => setStockForm({ ...stockForm, sucursalId: e.target.value })} required>
                    <option value="">Seleccionar...</option>
                    {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Operación</label>
                  <select className="form-select" value={stockForm.tipo} onChange={(e) => setStockForm({ ...stockForm, tipo: e.target.value })}>
                    <option value="Entrada">Entrada</option>
                    <option value="Salida">Salida</option>
                    <option value="Ajuste">Ajuste de existencia</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Cantidad</label>
                  <input type="number" min="0" step="0.01" className="form-control" value={stockForm.cantidad} onChange={(e) => setStockForm({ ...stockForm, cantidad: e.target.value })} required />
                </div>

                <div>
                  <label className="form-label">Motivo</label>
                  <textarea className="form-control" value={stockForm.motivo} onChange={(e) => setStockForm({ ...stockForm, motivo: e.target.value })} />
                </div>
              </div>

              <div className="custom-modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setMostrarStock(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>Aplicar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Productos;
