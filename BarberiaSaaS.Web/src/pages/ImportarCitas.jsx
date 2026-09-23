import { useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaCheckCircle, FaFileExcel, FaUpload } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ImportarCitas() {
  const navigate = useNavigate();
  const [archivo, setArchivo] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [sucursalId, setSucursalId] = useState("");
  const [profesionalId, setProfesionalId] = useState("");
  const [estado, setEstado] = useState("Confirmada");
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        const [s, p] = await Promise.all([
          api.get("/Sucursales"),
          api.get("/Profesionales")
        ]);
        setSucursales(s.data || []);
        setProfesionales(p.data || []);
        if ((s.data || []).length === 1) setSucursalId(String(s.data[0].id));
      } catch (e) {
        setError(e.response?.data?.mensaje || "No fue posible cargar sucursales y profesionales.");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const profesionalesFiltrados = useMemo(() => {
    if (!sucursalId) return profesionales;
    return profesionales.filter((p) =>
      !p.sucursalId || Number(p.sucursalId) === Number(sucursalId)
    );
  }, [profesionales, sucursalId]);

  useEffect(() => {
    if (profesionalId && !profesionalesFiltrados.some((p) => p.id === Number(profesionalId))) {
      setProfesionalId("");
    }
  }, [sucursalId, profesionalId, profesionalesFiltrados]);

  const crearFormData = () => {
    const form = new FormData();
    form.append("archivo", archivo);
    form.append("sucursalId", sucursalId);
    form.append("profesionalId", profesionalId);
    form.append("estado", estado);
    return form;
  };

  const validar = async () => {
    setError("");
    setExito("");
    setResultado(null);

    if (!archivo) return setError("Selecciona el archivo Excel.");
    if (!sucursalId) return setError("Selecciona la sucursal.");
    if (!profesionalId) return setError("Selecciona el profesional.");

    try {
      setProcesando(true);
      const { data } = await api.post("/importacion-citas/validar", crearFormData());
      setResultado(data);
    } catch (e) {
      setError(e.response?.data?.mensaje || "No fue posible validar el archivo.");
      if (e.response?.data?.filas) setResultado({ filas: e.response.data.filas });
    } finally {
      setProcesando(false);
    }
  };

  const importar = async () => {
    if (!resultado || resultado.conErrores > 0) return;

    try {
      setProcesando(true);
      setError("");
      setExito("");
      const { data } = await api.post("/importacion-citas/importar", crearFormData());
      setExito(
        `${data.mensaje} Clientes nuevos: ${data.clientesCreados}. Clientes existentes reutilizados: ${data.clientesExistentes}.`
      );
      setResultado(null);
    } catch (e) {
      setError(e.response?.data?.mensaje || "No fue posible importar las citas.");
      if (e.response?.data?.filas) {
        setResultado({
          filas: e.response.data.filas,
          conErrores: e.response.data.filas.filter((x) => !x.valido).length
        });
      }
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="container-fluid py-3" style={{ maxWidth: 1180 }}>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="page-title mb-1">Importar citas</h1>
          <p className="text-muted mb-0">
            Carga un Excel con Fecha, Hora inicio, Hora fin, Cliente, Celular y Servicio.
          </p>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/agenda")}>
          <FaArrowLeft className="me-2" /> Volver a Agenda
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {exito && (
        <div className="alert alert-success">
          <FaCheckCircle className="me-2" />
          {exito}
          <div className="mt-2">
            <button className="btn btn-success btn-sm" onClick={() => navigate("/agenda")}>
              Ver agenda
            </button>
          </div>
        </div>
      )}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <h5 className="mb-3"><FaFileExcel className="me-2" />Archivo y destino</h5>

          {cargando ? (
            <div className="text-muted">Cargando...</div>
          ) : (
            <div className="row g-3">
              <div className="col-12 col-lg-4">
                <label className="form-label fw-semibold">Sucursal</label>
                <select
                  className="form-select"
                  value={sucursalId}
                  onChange={(e) => { setSucursalId(e.target.value); setResultado(null); }}
                >
                  <option value="">Seleccionar...</option>
                  {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>

              <div className="col-12 col-lg-4">
                <label className="form-label fw-semibold">Profesional</label>
                <select
                  className="form-select"
                  value={profesionalId}
                  onChange={(e) => { setProfesionalId(e.target.value); setResultado(null); }}
                >
                  <option value="">Seleccionar...</option>
                  {profesionalesFiltrados.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.apellidos || ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-lg-4">
                <label className="form-label fw-semibold">Estado de las citas</label>
                <select
                  className="form-select"
                  value={estado}
                  onChange={(e) => { setEstado(e.target.value); setResultado(null); }}
                >
                  <option value="Confirmada">Confirmadas</option>
                  <option value="Pendiente">Pendientes</option>
                </select>
                <div className="form-text">
                  Pendientes: enviarán el recordatorio para confirmar. Confirmadas: no enviarán recordatorio por WhatsApp.
                </div>
              </div>

              <div className="col-12 col-lg-4">
                <label className="form-label fw-semibold">Archivo Excel (.xlsx)</label>
                <input
                  className="form-control"
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => { setArchivo(e.target.files?.[0] || null); setResultado(null); setExito(""); }}
                />
              </div>

              <div className="col-12">
                <div className="small text-muted">
                  El celular puede venir en formato internacional, por ejemplo <strong>+50660662375</strong>.
                  El nombre del servicio debe existir en Barbería SaaS. Si el teléfono ya existe, se reutiliza
                  ese cliente; si no existe, se crea automáticamente.
                </div>
              </div>

              <div className="col-12">
                <button className="btn btn-primary" disabled={procesando} onClick={validar}>
                  <FaUpload className="me-2" />
                  {procesando ? "Validando..." : "Validar archivo"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {resultado?.filas && (
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <div>
                <h5 className="mb-1">Vista previa</h5>
                <div className="text-muted small">
                  {resultado.validas ?? resultado.filas.filter((x) => x.valido).length} válidas ·{" "}
                  {resultado.conErrores ?? resultado.filas.filter((x) => !x.valido).length} con errores
                </div>
              </div>
              <button
                className="btn btn-success"
                disabled={procesando || (resultado.conErrores ?? 0) > 0}
                onClick={importar}
              >
                {procesando ? "Importando..." : "Importar citas"}
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Celular</th>
                    <th>Servicio</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.filas.map((fila) => (
                    <tr key={fila.fila} className={fila.valido ? "" : "table-danger"}>
                      <td>{fila.fila}</td>
                      <td>{fila.fecha}</td>
                      <td>{fila.horaInicio} – {fila.horaFin}</td>
                      <td>{fila.cliente}</td>
                      <td>{fila.telefono}</td>
                      <td>{fila.servicio}</td>
                      <td>
                        {fila.valido ? (
                          <span className="badge text-bg-success">Lista</span>
                        ) : (
                          <div>
                            <span className="badge text-bg-danger mb-1">Corregir</span>
                            {(fila.errores || []).map((e, i) => (
                              <div className="small text-danger" key={i}>{e}</div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImportarCitas;
