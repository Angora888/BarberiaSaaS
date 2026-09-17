import { useEffect, useState } from "react";
import { FaGift, FaSave } from "react-icons/fa";
import api from "../services/api";

const fechaInput = (valor) => valor ? new Date(valor).toISOString().slice(0, 10) : "";

export default function AdminSuscripciones() {
  const [negocios, setNegocios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const cargar = async () => {
    try {
      const { data } = await api.get("/admin/suscripciones");
      setNegocios(data.map(x => ({ ...x, fechaManual: fechaInput(x.suscripcionHasta) })));
    } finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const cambiar = (id, campo, valor) =>
    setNegocios(actual => actual.map(x => x.id === id ? { ...x, [campo]: valor } : x));

  const guardar = async (negocio) => {
    setMensaje("");
    const suscripcionHasta = negocio.accesoCortesia || !negocio.fechaManual
      ? null
      : new Date(`${negocio.fechaManual}T23:59:59`).toISOString();
    await api.put(`/admin/suscripciones/${negocio.id}`, {
      metodoSuscripcion: negocio.accesoCortesia ? "Cortesia" : (negocio.metodoSuscripcion || null),
      suscripcionHasta,
      accesoCortesia: Boolean(negocio.accesoCortesia),
      notaSuscripcion: negocio.notaSuscripcion || null
    });
    setMensaje(`Guardado: ${negocio.nombre}`);
    await cargar();
  };

  if (cargando) return <div>Cargando suscripciones...</div>;

  return (
    <div className="container-fluid px-0">
      <div className="mb-4">
        <div className="text-uppercase fw-bold" style={{ color: "var(--primary)", fontSize: 12, letterSpacing: 1.2 }}>SuperAdmin</div>
        <h2 className="fw-bold mb-1">Administrar suscripciones</h2>
        <p className="text-muted mb-0">Controla PayPal, SINPE, efectivo y accesos de cortesía sin modificar la base de datos.</p>
      </div>
      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      <div className="d-grid gap-3">
        {negocios.map(n => (
          <div key={n.id} className="card border-0 shadow-sm" style={{ borderRadius: 18 }}>
            <div className="card-body p-4">
              <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
                <div><div className="fw-bold fs-5">{n.nombre}</div><div className="small text-muted">{n.email || "Sin correo"} · Tenant #{n.id}</div></div>
                <span className={`badge ${n.accesoActivo ? "text-bg-success" : "text-bg-danger"}`}>{n.accesoActivo ? "Acceso activo" : "Bloqueado"}</span>
              </div>
              <div className="row g-3">
                <div className="col-md-3"><label className="form-label small fw-semibold">PayPal</label><input className="form-control" value={n.payPalSubscriptionStatus || "—"} disabled /></div>
                <div className="col-md-3"><label className="form-label small fw-semibold">Método manual</label><select className="form-select" value={n.metodoSuscripcion || ""} disabled={n.accesoCortesia} onChange={e => cambiar(n.id, "metodoSuscripcion", e.target.value)}><option value="">Ninguno</option><option>SINPE</option><option>Efectivo</option><option>Transferencia</option><option>Otro</option></select></div>
                <div className="col-md-3"><label className="form-label small fw-semibold">Acceso hasta</label><input type="date" className="form-control" value={n.fechaManual} disabled={n.accesoCortesia} onChange={e => cambiar(n.id, "fechaManual", e.target.value)} /></div>
                <div className="col-md-3 d-flex align-items-end"><div className="form-check mb-2"><input className="form-check-input" type="checkbox" checked={Boolean(n.accesoCortesia)} onChange={e => cambiar(n.id, "accesoCortesia", e.target.checked)} id={`c-${n.id}`} /><label className="form-check-label fw-semibold" htmlFor={`c-${n.id}`}><FaGift className="me-1" />Cortesía</label></div></div>
                <div className="col-12"><label className="form-label small fw-semibold">Nota</label><input className="form-control" maxLength={300} placeholder="Ej: SINPE recibido / cortesía familiar" value={n.notaSuscripcion || ""} onChange={e => cambiar(n.id, "notaSuscripcion", e.target.value)} /></div>
              </div>
              <div className="text-end mt-3"><button className="btn btn-primary fw-semibold" onClick={() => guardar(n)}><FaSave className="me-2" />Guardar acceso</button></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
