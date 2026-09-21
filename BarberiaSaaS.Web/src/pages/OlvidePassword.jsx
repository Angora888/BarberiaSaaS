import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function OlvidePassword() {
  const [email,setEmail]=useState("");
  const [mensaje,setMensaje]=useState("");
  const [cargando,setCargando]=useState(false);
  const enviar=async(e)=>{
    e.preventDefault(); setCargando(true); setMensaje("");
    try {
      const {data}=await api.post("/Auth/solicitar-recuperacion-password",{email});
      setMensaje(data.mensaje);
    } catch {
      setMensaje("No fue posible procesar la solicitud. Intenta nuevamente.");
    } finally { setCargando(false); }
  };
  return <div className="login-page"><div className="login-card">
    <div className="login-brand"><div className="login-logo">BS</div><h2>Recuperar contraseña</h2><p>Te enviaremos un enlace seguro a tu correo.</p></div>
    {mensaje && <div className="alert alert-info">{mensaje}</div>}
    <form onSubmit={enviar}>
      <label className="form-label login-form-label">Correo electrónico</label>
      <input type="email" className="form-control login-input mb-4" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" />
      <button className="btn login-button w-100" disabled={cargando}>{cargando?"Enviando...":"Enviar enlace"}</button>
    </form>
    <div className="text-center mt-4"><Link to="/login">Volver a iniciar sesión</Link></div>
  </div></div>;
}