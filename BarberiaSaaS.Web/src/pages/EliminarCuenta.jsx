import { useState } from "react";
import LegalLayout from "../components/LegalLayout";
import api from "../services/api";

export default function EliminarCuenta() {
  const [email, setEmail] = useState("");
  const [negocio, setNegocio] = useState("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const enviar = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!email.trim()) {
      setError("Ingresa el correo asociado a tu cuenta.");
      return;
    }

    try {
      setEnviando(true);
      const { data } = await api.post("/account-deletion/request", {
        email: email.trim(),
        negocio: negocio.trim() || null,
        motivo: motivo.trim() || null
      });

      setMensaje(
        data?.mensaje ||
          "Solicitud recibida. Revisa tu correo para continuar con el proceso."
      );
      setEmail("");
      setNegocio("");
      setMotivo("");
    } catch (e) {
      setError(
        e?.response?.data?.mensaje ||
          "No fue posible registrar la solicitud. Intenta nuevamente más tarde."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <LegalLayout
      title="Eliminar cuenta"
      subtitle="Solicita la eliminación de tu cuenta de Barbería SaaS y los datos personales asociados."
    >
      <div className="alert alert-warning">
        <strong>Importante:</strong> eliminar la aplicación del teléfono no elimina
        tu cuenta. Debes iniciar una solicitud de eliminación.
      </div>

      <h2 className="h4 fw-bold mt-4">Qué sucede al solicitar la eliminación</h2>
      <ul>
        <li>Verificaremos que la solicitud corresponda al titular o a una persona autorizada.</li>
        <li>La cuenta dejará de poder utilizarse una vez procesada la eliminación.</li>
        <li>Los datos personales asociados serán eliminados o anonimizados, salvo información que deba conservarse por obligaciones legales, fiscales, seguridad o prevención de fraude.</li>
        <li>Si eres empleado o profesional de un negocio, determinados registros operativos del negocio pueden conservarse anonimizados para no alterar su historial contable o de citas.</li>
        <li>Si eres propietario y deseas eliminar todo el negocio, indícalo expresamente en la solicitud.</li>
      </ul>

      <h2 className="h4 fw-bold mt-4">Solicitar eliminación</h2>
      <p className="text-secondary">
        Completa el formulario. No necesitas tener la aplicación instalada para
        iniciar la solicitud.
      </p>

      {mensaje ? <div className="alert alert-success">{mensaje}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <form onSubmit={enviar}>
        <div className="mb-3">
          <label className="form-label fw-semibold">Correo de la cuenta</label>
          <input
            className="form-control"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Nombre del negocio</label>
          <input
            className="form-control"
            value={negocio}
            onChange={(e) => setNegocio(e.target.value)}
            placeholder="Nombre del negocio"
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Motivo (opcional)</label>
          <textarea
            className="form-control"
            rows="4"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Puedes agregar cualquier detalle que nos ayude a procesar la solicitud."
          />
        </div>

        <button className="btn btn-danger btn-lg" type="submit" disabled={enviando}>
          {enviando ? "Enviando solicitud..." : "Solicitar eliminación de cuenta"}
        </button>
      </form>

      <p className="small text-secondary mt-3">
        No envíes contraseñas, códigos de acceso ni información de tarjetas.
      </p>

      <h2 className="h4 fw-bold mt-4">Tiempo de procesamiento</h2>
      <p>
        Una solicitud válida se procesará normalmente dentro de 30 días. Podemos
        solicitar una verificación razonable de identidad antes de completar la
        eliminación y te enviaremos una confirmación cuando el proceso termine.
      </p>
    </LegalLayout>
  );
}
