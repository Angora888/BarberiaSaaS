import { useEffect, useState } from "react";
import { FaBell, FaPalette, FaSave, FaStore, FaWhatsapp } from "react-icons/fa";
import api from "../services/api";
import { useConfiguracion } from "../context/ConfiguracionContext";

const formularioInicial = {
  nombre: "", nombreComercial: "", identificacion: "", telefono: "", email: "", logoUrl: "", frasePresentacion: "",
  colorPrimario: "#C62864", colorSecundario: "#F8E7EE", colorFondo: "#FFFFFF",
  moneda: "CRC", zonaHoraria: "America/Costa_Rica", idioma: "es", duracionSlotMinutos: 15,
  permitirReservaOnline: true, mostrarPrecios: true,
  recordatorioEmailActivo: true, recordatorioWhatsAppActivo: true, recordatorioEmailHorasAntes: 24,
  requiereDeposito: false, porcentajeDeposito: 0,
  instagram: "", facebook: "", whatsApp: ""
};

function Configuracion() {
  const { tenant, configuracion, cargarConfiguracion } = useConfiguracion();
  const [formulario, setFormulario] = useState(formularioInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!tenant) return;
    setFormulario({
      nombre: tenant.nombre || "", nombreComercial: tenant.nombreComercial || "",
      identificacion: tenant.identificacion || "", telefono: tenant.telefono || "", email: tenant.email || "",
      logoUrl: configuracion?.logoUrl || "", frasePresentacion: configuracion?.frasePresentacion || "", colorPrimario: configuracion?.colorPrimario || "#C62864",
      colorSecundario: configuracion?.colorSecundario || "#F8E7EE", colorFondo: configuracion?.colorFondo || "#FFFFFF",
      moneda: configuracion?.moneda || "CRC", zonaHoraria: configuracion?.zonaHoraria || "America/Costa_Rica",
      idioma: configuracion?.idioma || "es", duracionSlotMinutos: configuracion?.duracionSlotMinutos || 15,
      permitirReservaOnline: configuracion?.permitirReservaOnline ?? true,
      mostrarPrecios: configuracion?.mostrarPrecios ?? true,
      recordatorioEmailActivo: configuracion?.recordatorioEmailActivo ?? true,
      recordatorioWhatsAppActivo: configuracion?.recordatorioWhatsAppActivo ?? true,
      recordatorioEmailHorasAntes: configuracion?.recordatorioEmailHorasAntes ?? 24,
      requiereDeposito: configuracion?.requiereDeposito ?? false,
      porcentajeDeposito: configuracion?.porcentajeDeposito || 0,
      instagram: configuracion?.instagram || "", facebook: configuracion?.facebook || "", whatsApp: configuracion?.whatsApp || ""
    });
  }, [tenant, configuracion]);

  const actualizarCampo = (campo, valor) => setFormulario(actual => ({ ...actual, [campo]: valor }));

  const guardar = async (event) => {
    event.preventDefault(); setError(""); setMensaje("");
    if (!formulario.nombre.trim()) return setError("El nombre del negocio es requerido.");
    if (formulario.requiereDeposito && (Number(formulario.porcentajeDeposito) <= 0 || Number(formulario.porcentajeDeposito) > 100))
      return setError("El porcentaje de depósito debe ser mayor que 0 y menor o igual que 100.");
    const horas = Number(formulario.recordatorioEmailHorasAntes);
    if ((formulario.recordatorioEmailActivo || formulario.recordatorioWhatsAppActivo) && (horas < 1 || horas > 168))
      return setError("El recordatorio debe programarse entre 1 y 168 horas antes.");

    try {
      setGuardando(true);
      await api.put("/Configuracion", {
        ...formulario,
        duracionSlotMinutos: Number(formulario.duracionSlotMinutos),
        porcentajeDeposito: Number(formulario.porcentajeDeposito),
        recordatorioEmailHorasAntes: horas
      });
      await cargarConfiguracion();
      setMensaje("Configuración guardada correctamente.");
    } catch (e) {
      setError(e.response?.data?.mensaje || e.response?.data?.title || "No fue posible guardar la configuración.");
    } finally { setGuardando(false); }
  };

  return <div>
    <div className="page-header"><div><h1 className="page-title">Configuración</h1><p className="text-muted mb-0">Personaliza los datos, apariencia y preferencias del negocio.</p></div></div>
    {error && <div className="alert alert-danger mt-4">{error}</div>}
    {mensaje && <div className="alert alert-success mt-4">{mensaje}</div>}

    <form className="mt-4" onSubmit={guardar}><div className="row g-4"><div className="col-xl-8">
      <div className="content-card p-4 mb-4">
        <div className="d-flex align-items-center gap-2 mb-4"><FaStore /><h5 className="mb-0">Datos del negocio</h5></div>
        <div className="row g-3">
          <TextField label="Nombre legal" value={formulario.nombre} onChange={v => actualizarCampo("nombre", v)} />
          <TextField label="Nombre comercial" value={formulario.nombreComercial} onChange={v => actualizarCampo("nombreComercial", v)} />
          <TextField label="Identificación" value={formulario.identificacion} onChange={v => actualizarCampo("identificacion", v)} />
          <TextField label="Teléfono" value={formulario.telefono} onChange={v => actualizarCampo("telefono", v)} />
          <TextField label="Correo" type="email" value={formulario.email} onChange={v => actualizarCampo("email", v)} />
          <TextField label="URL del logo" placeholder="https://..." value={formulario.logoUrl} onChange={v => actualizarCampo("logoUrl", v)} />
          <TextField label="Frase de presentación" placeholder="Belleza • Bienestar • Estilo" value={formulario.frasePresentacion} onChange={v => actualizarCampo("frasePresentacion", v)} />
        </div>
      </div>

      <div className="content-card p-4 mb-4">
        <div className="d-flex align-items-center gap-2 mb-4"><FaPalette /><h5 className="mb-0">Apariencia</h5></div>
        <div className="row g-3">
          <ColorField label="Color principal" valor={formulario.colorPrimario} onChange={v => actualizarCampo("colorPrimario", v)} />
          <ColorField label="Color secundario" valor={formulario.colorSecundario} onChange={v => actualizarCampo("colorSecundario", v)} />
          <ColorField label="Color de fondo" valor={formulario.colorFondo} onChange={v => actualizarCampo("colorFondo", v)} />
        </div>
      </div>

      <div className="content-card p-4 mb-4"><h5 className="mb-4">Regional y agenda</h5><div className="row g-3">
        <div className="col-md-4"><label className="form-label">Moneda</label><select className="form-select" value={formulario.moneda} onChange={e => actualizarCampo("moneda", e.target.value)}><option value="CRC">CRC - Colón</option><option value="USD">USD - Dólar</option></select></div>
        <div className="col-md-4"><label className="form-label">Idioma</label><select className="form-select" value={formulario.idioma} onChange={e => actualizarCampo("idioma", e.target.value)}><option value="es">Español</option><option value="en">English</option></select></div>
        <div className="col-md-4"><label className="form-label">Intervalo de agenda</label><select className="form-select" value={formulario.duracionSlotMinutos} onChange={e => actualizarCampo("duracionSlotMinutos", e.target.value)}>{[5,10,15,20,30,60].map(v => <option key={v} value={v}>{v} min</option>)}</select></div>
        <div className="col-12"><label className="form-label">Zona horaria</label><input className="form-control" value={formulario.zonaHoraria} onChange={e => actualizarCampo("zonaHoraria", e.target.value)} /><small className="text-muted">Para Costa Rica usa America/Costa_Rica.</small></div>
      </div></div>

      <div className="content-card p-4 mb-4">
        <div className="d-flex align-items-center gap-2 mb-2"><FaBell /><h5 className="mb-0">Notificaciones</h5></div>
        <p className="text-muted small mb-4">Configura cuándo tus clientes reciben recordatorios automáticos de sus citas.</p>
        <div className="border rounded-4 p-3 p-md-4">
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div><div className="fw-semibold">📧 Recordatorio por correo</div><div className="small text-muted mt-1">Solo se programa si el cliente tiene un correo válido.</div></div>
            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" role="switch" checked={formulario.recordatorioEmailActivo} onChange={e => actualizarCampo("recordatorioEmailActivo", e.target.checked)} /></div>
          </div>
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mt-3 pt-3 border-top">
            <div><div className="fw-semibold">📲 Recordatorio por WhatsApp</div><div className="small text-muted mt-1">Solo se programa si el cliente tiene un teléfono válido.</div></div>
            <div className="form-check form-switch"><input className="form-check-input" type="checkbox" role="switch" checked={formulario.recordatorioWhatsAppActivo} onChange={e => actualizarCampo("recordatorioWhatsAppActivo", e.target.checked)} /></div>
          </div>
          {(formulario.recordatorioEmailActivo || formulario.recordatorioWhatsAppActivo) && <div className="row mt-3"><div className="col-md-6"><label className="form-label">Enviar recordatorios</label><select className="form-select" value={formulario.recordatorioEmailHorasAntes} onChange={e => actualizarCampo("recordatorioEmailHorasAntes", e.target.value)}><option value={2}>2 horas antes</option><option value={6}>6 horas antes</option><option value={12}>12 horas antes</option><option value={24}>24 horas antes</option><option value={48}>48 horas antes</option><option value={72}>72 horas antes</option></select><small className="text-muted">Esta anticipación se aplica a correo y WhatsApp. Si la cambias, los recordatorios pendientes se reprograman automáticamente.</small></div></div>}
        </div>
      </div>

      <div className="content-card p-4 mb-4"><h5 className="mb-4">Reservas y depósitos</h5>
        <SwitchField label="Permitir reservas online" checked={formulario.permitirReservaOnline} onChange={v => actualizarCampo("permitirReservaOnline", v)} />
        <SwitchField label="Mostrar precios" checked={formulario.mostrarPrecios} onChange={v => actualizarCampo("mostrarPrecios", v)} />
        <SwitchField label="Requerir depósito" checked={formulario.requiereDeposito} onChange={v => actualizarCampo("requiereDeposito", v)} />
        {formulario.requiereDeposito && <div className="mt-3"><label className="form-label">Porcentaje de depósito</label><div className="input-group"><input type="number" min="1" max="100" step="1" className="form-control" value={formulario.porcentajeDeposito} onChange={e => actualizarCampo("porcentajeDeposito", e.target.value)} /><span className="input-group-text">%</span></div></div>}
      </div>

      <div className="content-card p-4"><div className="d-flex align-items-center gap-2 mb-4"><FaWhatsapp /><h5 className="mb-0">Redes y contacto</h5></div><div className="row g-3">
        <TextField label="WhatsApp" placeholder="+código de país + número" value={formulario.whatsApp} onChange={v => actualizarCampo("whatsApp", v)} />
        <TextField label="Instagram" placeholder="@negocio" value={formulario.instagram} onChange={v => actualizarCampo("instagram", v)} />
        <TextField label="Facebook" value={formulario.facebook} onChange={v => actualizarCampo("facebook", v)} />
      </div></div>
    </div>

    <div className="col-xl-4"><div className="content-card p-4 position-sticky" style={{top:"24px"}}><h5 className="mb-3">Vista previa</h5>
      <div className="rounded-4 p-4 border" style={{backgroundColor:formulario.colorFondo}}><div className="d-flex align-items-center gap-3 mb-4">
        {formulario.logoUrl ? <img src={formulario.logoUrl} alt="Logo" style={{width:"56px",height:"56px",objectFit:"cover",borderRadius:"14px"}} /> : <div className="d-flex align-items-center justify-content-center fw-bold text-white" style={{width:"56px",height:"56px",borderRadius:"14px",backgroundColor:formulario.colorPrimario}}>{(formulario.nombreComercial || formulario.nombre || "N").charAt(0).toUpperCase()}</div>}
        <div><strong>{formulario.nombreComercial || formulario.nombre || "Mi negocio"}</strong><div className="small text-muted">{formulario.telefono || "Teléfono del negocio"}</div></div>
      </div><button type="button" className="btn w-100 text-white" style={{backgroundColor:formulario.colorPrimario}}>Reservar cita</button><div className="rounded-3 mt-3 p-3" style={{backgroundColor:formulario.colorSecundario}}><small>Así se verán los colores principales del negocio.</small></div></div>
      <button type="submit" className="btn btn-primary w-100 mt-4" disabled={guardando}><FaSave className="me-2" />{guardando ? "Guardando..." : "Guardar configuración"}</button>
    </div></div>
    </div></form>
  </div>;
}

function TextField({ label, value, onChange, type="text", placeholder }) { return <div className="col-md-6"><label className="form-label">{label}</label><input type={type} className="form-control" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} /></div>; }
function ColorField({ label, valor, onChange }) { return <div className="col-md-4"><label className="form-label">{label}</label><div className="input-group"><input type="color" className="form-control form-control-color" value={valor} onChange={e => onChange(e.target.value)} /><input className="form-control" value={valor} onChange={e => onChange(e.target.value)} /></div></div>; }
function SwitchField({ label, checked, onChange }) { return <div className="form-check form-switch mb-3"><input className="form-check-input" type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /><label className="form-check-label">{label}</label></div>; }

export default Configuracion;
