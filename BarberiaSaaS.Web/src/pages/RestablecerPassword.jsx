import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

const authStyles = `
.auth-page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(circle at top left,rgba(59,130,246,.10),transparent 35%),radial-gradient(circle at bottom right,rgba(15,23,42,.08),transparent 35%),#f6f7f9}
.auth-card{width:100%;max-width:440px;padding:42px 38px;background:#fff;border:1px solid #e5e7eb;border-radius:24px;box-shadow:0 24px 70px rgba(15,23,42,.10)}
.auth-brand{text-align:center;margin-bottom:32px}.auth-logo{width:76px;height:76px;margin:0 auto;display:flex;align-items:center;justify-content:center;border-radius:22px;background:linear-gradient(145deg,#111827,#334155);color:#fff;font-size:25px;font-weight:800;letter-spacing:-1px;box-shadow:0 14px 30px rgba(15,23,42,.18)}
.auth-brand h2{margin:20px 0 5px;color:#111827;font-size:28px;font-weight:800;letter-spacing:-.7px}.auth-brand p{margin:0;color:#6b7280;font-size:14px}
.auth-label{color:#374151;font-size:14px;font-weight:650;margin-bottom:8px}.auth-input{min-height:52px;border:1px solid #d9dee7;border-radius:13px;background:#fff;font-size:15px;color:#111827;padding:0 15px}.auth-input:focus{border-color:#475569;box-shadow:0 0 0 4px rgba(71,85,105,.10)}
.auth-button{min-height:54px;border:0;border-radius:13px;background:linear-gradient(135deg,#111827,#334155);color:#fff!important;font-size:15px;font-weight:750}.auth-button:disabled{background:linear-gradient(135deg,#475569,#64748b)!important;color:#fff!important;opacity:1!important}
.auth-message{border-radius:12px;font-size:14px}.auth-info{border:1px solid #bfdbfe;background:#eff6ff;color:#1e40af}.auth-error{border:1px solid #fecaca;background:#fef2f2;color:#b91c1c}.auth-success{border:1px solid #bbf7d0;background:#f0fdf4;color:#166534}
.auth-back{text-align:center;margin-top:24px}.auth-back a{color:#2563eb;text-decoration:none}.auth-divider{height:1px;margin:30px 0 20px;background:#edf0f4}.auth-footer{margin:0;text-align:center;color:#9ca3af;font-size:12px}
@media(max-width:520px){.auth-page{padding:18px}.auth-card{padding:34px 24px;border-radius:20px}.auth-logo{width:68px;height:68px;border-radius:19px;font-size:23px}.auth-brand h2{font-size:25px}}
`;

export default function RestablecerPassword() {
  const { token } = useParams();
  const [password,setPassword]=useState(""); const [confirmar,setConfirmar]=useState("");
  const [mensaje,setMensaje]=useState(""); const [exito,setExito]=useState(false); const [cargando,setCargando]=useState(false);
  const guardar=async(e)=>{e.preventDefault();setMensaje("");setExito(false);
    if(password.length<8){setMensaje("La contraseña debe tener al menos 8 caracteres.");return;}
    if(password!==confirmar){setMensaje("Las contraseñas no coinciden.");return;}
    setCargando(true);
    try{const {data}=await api.post("/Auth/restablecer-password",{token,nuevaPassword:password});setMensaje(data.mensaje);setExito(true);}
    catch(err){setMensaje(err.response?.data?.mensaje||"No fue posible restablecer la contraseña.");}
    finally{setCargando(false);}
  };
  return <>
    <style>{authStyles}</style>
    <div className="auth-page"><div className="auth-card">
      <div className="auth-brand"><div className="auth-logo">BS</div><h2>Nueva contraseña</h2><p>Crea una nueva contraseña para tu cuenta.</p></div>
      {mensaje && <div className={`alert auth-message ${exito?"auth-success":"auth-error"} mb-4`}>{mensaje}</div>}
      {!exito && <form onSubmit={guardar}>
        <div className="mb-3"><label className="form-label auth-label">Nueva contraseña</label><input type="password" className="form-control auth-input" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required minLength={8} autoComplete="new-password"/></div>
        <div className="mb-4"><label className="form-label auth-label">Confirmar contraseña</label><input type="password" className="form-control auth-input" value={confirmar} onChange={(e)=>setConfirmar(e.target.value)} placeholder="Repite tu contraseña" required minLength={8} autoComplete="new-password"/></div>
        <button className="btn auth-button w-100" disabled={cargando}>{cargando?"Guardando...":"Cambiar contraseña"}</button>
      </form>}
      <div className="auth-back"><Link to="/login">{exito?"Ir a iniciar sesión":"Volver a iniciar sesión"}</Link></div>
      <div className="auth-divider"/><p className="auth-footer">Barberia SaaS · Plataforma de administración</p>
    </div></div>
  </>;
}