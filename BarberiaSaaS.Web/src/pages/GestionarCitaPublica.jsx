import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";

function formatearDuracion(minutos) {
  const total = Number(minutos) || 0;
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  if (horas && resto) return `${horas} h ${resto} min`;
  if (horas) return horas === 1 ? "1 hora" : `${horas} horas`;
  return `${resto} min`;
}

export default function GestionarCitaPublica() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [cita, setCita] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!token) {
      setError("El enlace de la cita no es válido.");
      setCargando(false);
      return;
    }

    api.get("/public-citas/manage", { params: { token } })
      .then(({ data }) => setCita(data))
      .catch((err) => {
        setError(
          err?.response?.data?.mensaje ||
          "No fue posible consultar esta cita."
        );
      })
      .finally(() => setCargando(false));
  }, [token]);

  const fechaBonita = useMemo(() => {
    if (!cita?.fecha) return "";
    const [anio, mes, dia] = cita.fecha.split("-").map(Number);
    return new Intl.DateTimeFormat("es-CR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(anio, mes - 1, dia, 12, 0, 0));
  }, [cita]);

  const cancelar = async () => {
    if (!window.confirm("¿Seguro que deseas cancelar esta cita?")) return;

    try {
      setCancelando(true);
      setError("");
      const { data } = await api.post("/public-citas/cancel", { token });
      setMensaje(data?.mensaje || "Tu cita fue cancelada correctamente.");
      setCita((actual) =>
        actual
          ? { ...actual, estado: "Cancelada", cancelable: false, mensaje: "Esta cita ya fue cancelada." }
          : actual
      );
    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
        "No fue posible cancelar la cita."
      );
    } finally {
      setCancelando(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f7f7f8",
      padding: "32px 16px",
      fontFamily: "Arial, sans-serif",
      color: "#1f2937"
    }}>
      <div style={{
        maxWidth: 620,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 24,
        padding: 28,
        boxShadow: "0 18px 50px rgba(15,23,42,.08)",
        border: "1px solid #eceef2"
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#c62864", marginBottom: 8 }}>
          BARBERÍA SAAS
        </div>
        <h1 style={{ margin: "0 0 8px", fontSize: 30 }}>
          Gestionar mi cita
        </h1>
        <p style={{ marginTop: 0, color: "#6b7280" }}>
          Consulta los detalles de tu reserva y, si aún aplica, cancélala desde aquí.
        </p>

        {cargando && <p>Cargando cita...</p>}

        {error && (
          <div style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 12,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c"
          }}>
            {error}
          </div>
        )}

        {mensaje && (
          <div style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 12,
            background: "#ecfdf3",
            border: "1px solid #bbf7d0",
            color: "#166534"
          }}>
            {mensaje}
          </div>
        )}

        {cita && (
          <>
            <div style={{
              marginTop: 24,
              padding: 20,
              borderRadius: 16,
              background: "#faf7f9",
              border: "1px solid #f0e5eb",
              lineHeight: 1.8
            }}>
              <div><strong>Negocio:</strong> {cita.negocio}</div>
              <div><strong>Servicio:</strong> {cita.servicio}</div>
              <div><strong>Profesional:</strong> {cita.profesional}</div>
              <div><strong>Fecha:</strong> {fechaBonita}</div>
              <div><strong>Hora:</strong> {cita.hora}</div>
              <div><strong>Duración aproximada:</strong> {formatearDuracion(cita.duracionMinutos)}</div>
              <div><strong>Estado:</strong> {cita.estado}</div>
            </div>

            <p style={{ color: "#6b7280", marginTop: 18 }}>
              {cita.mensaje}
            </p>

            {cita.cancelable && (
              <button
                type="button"
                onClick={cancelar}
                disabled={cancelando}
                style={{
                  width: "100%",
                  minHeight: 52,
                  marginTop: 10,
                  border: 0,
                  borderRadius: 14,
                  background: "#b91c1c",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 800,
                  cursor: cancelando ? "default" : "pointer",
                  opacity: cancelando ? .65 : 1
                }}
              >
                {cancelando ? "Cancelando..." : "Cancelar cita"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
