import { useEffect, useMemo, useRef, useState } from "react";
import { FaCheckCircle, FaCreditCard, FaLock, FaPaypal } from "react-icons/fa";
import api from "../services/api";

function cargarPayPalSdk(clientId, mode) {
  return new Promise((resolve, reject) => {
    if (window.paypal) return resolve(window.paypal);
    const existente = document.querySelector("script[data-barberiasaas-paypal]");
    if (existente) {
      existente.addEventListener("load", () => resolve(window.paypal), { once: true });
      existente.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.dataset.barberiasaasPaypal = "true";
    const host = String(mode).toLowerCase() === "sandbox" ? "https://www.sandbox.paypal.com" : "https://www.paypal.com";
    script.src = `${host}/sdk/js?client-id=${encodeURIComponent(clientId)}&components=buttons&vault=true&intent=subscription&currency=USD`;
    script.async = true;
    script.onload = () => resolve(window.paypal);
    script.onerror = () => reject(new Error("No se pudo cargar PayPal."));
    document.head.appendChild(script);
  });
}

export default function MiSuscripcion() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [suscripcion, setSuscripcion] = useState(null);
  const paypalRef = useRef(null);
  const usuario = useMemo(() => JSON.parse(localStorage.getItem("usuario") || "{}"), []);

  useEffect(() => {
    let activo = true;
    api.get("/paypal/subscription-config")
      .then(({ data }) => { if (activo) setConfig(data); })
      .catch((err) => { if (activo) setError(err.response?.data?.message || "No se pudo cargar la configuración de PayPal."); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    if (!config || !paypalRef.current || suscripcion) return;
    let cancelado = false;
    let buttons;
    cargarPayPalSdk(config.clientId, config.mode)
      .then((paypal) => {
        if (cancelado || !paypalRef.current) return;
        paypalRef.current.innerHTML = "";
        buttons = paypal.Buttons({
          style: { shape: "rect", layout: "vertical", label: "subscribe" },
          createSubscription: (_data, actions) => actions.subscription.create({ plan_id: config.planId }),
          onApprove: async (data) => {
            try {
              const respuesta = await api.get(`/paypal/subscriptions/${encodeURIComponent(data.subscriptionID)}`);
              setSuscripcion(respuesta.data);
              localStorage.setItem("barberiaSaaS.paypalSubscriptionId", data.subscriptionID);
              setError("");
            } catch (err) {
              setError(err.response?.data?.message || "PayPal aprobó la suscripción, pero no pudimos verificarla. Contacta al administrador.");
            }
          },
          onError: () => setError("PayPal no pudo completar la suscripción. Intenta nuevamente.")
        });
        return buttons.render(paypalRef.current);
      })
      .catch((err) => { if (!cancelado) setError(err.message || "No se pudo cargar PayPal."); });
    return () => { cancelado = true; try { buttons?.close?.(); } catch { /* noop */ } };
  }, [config, suscripcion]);

  return (
    <div className="container-fluid px-0" style={{ maxWidth: 980 }}>
      <div className="mb-4">
        <div className="text-uppercase fw-bold" style={{ color: "var(--primary)", fontSize: 12, letterSpacing: 1.2 }}>Barbería SaaS</div>
        <h2 className="fw-bold mb-1">Mi suscripción</h2>
        <p className="text-muted mb-0">Administra el plan de tu negocio y mantén activo el acceso a Barbería SaaS.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 22 }}>
            <div className="card-body p-4 p-md-5">
              <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
                <div>
                  <span className="badge rounded-pill text-bg-light mb-2">PLAN MENSUAL</span>
                  <h3 className="fw-bold mb-0">Barbería SaaS</h3>
                </div>
                <div className="text-end"><span className="fw-bold" style={{ fontSize: 34 }}>$10</span><span className="text-muted"> USD/mes</span></div>
              </div>

              <div className="d-grid gap-3 mb-4">
                <div><FaCheckCircle className="me-2" style={{ color: "var(--primary)" }} />Agenda, clientes y profesionales</div>
                <div><FaCheckCircle className="me-2" style={{ color: "var(--primary)" }} />Ventas, caja y cuentas por cobrar</div>
                <div><FaCheckCircle className="me-2" style={{ color: "var(--primary)" }} />Reportes y control del negocio</div>
                <div><FaCheckCircle className="me-2" style={{ color: "var(--primary)" }} />Renovación automática mensual con PayPal</div>
              </div>

              {cargando && <div className="text-muted">Preparando PayPal...</div>}

              {suscripcion ? (
                <div className="alert alert-success mb-0" style={{ borderRadius: 16 }}>
                  <div className="fw-bold mb-1"><FaCheckCircle className="me-2" />¡Suscripción confirmada!</div>
                  <div>Estado PayPal: <strong>{suscripcion.status}</strong></div>
                  <div className="small mt-1">ID: {suscripcion.subscriptionId}</div>
                </div>
              ) : (
                <div ref={paypalRef} style={{ minHeight: 48 }} />
              )}

              {config?.mode === "Sandbox" && <div className="small text-muted mt-3">Modo de prueba PayPal Sandbox. No se cobrará dinero real.</div>}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 22 }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-3 mb-3"><FaPaypal size={28} /><div><div className="fw-bold">Pago seguro con PayPal</div><div className="small text-muted">Renovación mensual automática</div></div></div>
              <p className="text-muted mb-0">PayPal procesa el pago. Barbería SaaS no almacena los datos de tu tarjeta ni tu contraseña de PayPal.</p>
            </div>
          </div>
          <div className="card border-0 shadow-sm" style={{ borderRadius: 22 }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-2 fw-bold mb-2"><FaLock /> Tu cuenta</div>
              <div className="small text-muted">Negocio</div><div className="fw-semibold mb-2">{usuario.negocio || "Tu negocio"}</div>
              <div className="small text-muted">Correo</div><div className="fw-semibold text-break">{usuario.email || "—"}</div>
              <hr />
              <div className="d-flex align-items-center gap-2 small text-muted"><FaCreditCard /> Puedes cancelar la renovación desde PayPal.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
