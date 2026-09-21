import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

export default function RestablecerPassword() {
  const {token}=useParams();
  const [password,setPassword]=useState("");
  const [confirmar,setConfirmar]=useState("");
  const [mensaje,setMensaje]=useState("");
  const [exito,setExito]=useState(false);
  const [cargando,setCargando]=useState(false);
  const guardar=async(e)=>{
    e.preventDefault(); setMensaje("");
    if(password.length<8){setMensaje("La contraseña debe tener al menos 8 caracteres.");return;}
    if(password!==confirmar){setMensaje("Las contraseñas no coinciden.");return;}
    setCargando(true);
    try {
      const {data}=await api.post("/Auth/restablecer-password",{token,nuevaPassword:password});
      setMensaje(data.mensaje); setExito(true);
    } catch(err){setMensaje(err.response?.data?.mensaje||"No fue posible restablecer la contraseña.");}
    finally{setCargando(false);}
  };
  return <div className="login-page"><div className="login-card">
    <div className="login-brand"><div className="login-logo">BS</div><h2>Nueva contraseña</h2><p>Crea una nueva contraseña para tu cuenta.</p></div>
    {mensaje && <div className={`alert ${exito?"alert-success":"login-error"}`}>{mensaje}</div>}
    {!exito && <form onSubmit={guardar}>
      <label className="form-label login-form-label">Nueva contraseña</label>
      <input type="password" className="form-control login-input mb-3" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} autoComplete="new-password"/>
      <label className="form-label login-form-label">Confirmar contraseña</label>
      <input type="password" className="form-control login-input mb-4" value={confirmar} onChange={e=>setConfirmar(e.target.value)} required minLength={8} autoComplete="new-password"/>
      <button className="btn login-button w-100" disabled={cargando}>{cargando?"Guardando...":"Cambiar contraseña"}</button>
    </form>}
    <div className="text-center mt-4"><Link to="/login">Volver a iniciar sesión</Link></div>
  </div></div>;
}