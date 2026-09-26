import { useMemo, useState } from "react";
import LegalLayout from "../components/LegalLayout";

const SOPORTE = "soporte@barberiasaas.com";

export default function EliminarCuenta() {
  const [email, setEmail] = useState("");
  const [negocio, setNegocio] = useState("");
  const [motivo, setMotivo] = useState("");

  const mailto = useMemo(() => {
    const subject = "Solicitud de eliminación de cuenta - Barbería SaaS";
    const body = [
      "Solicito iniciar la eliminación de mi cuenta y los datos asociados en Barbería SaaS.",
      "",
      `Correo de la cuenta: ${email || "[indicar correo]"}`,
      `Negocio: ${negocio || "[indicar negocio]"}`,
      `Motivo opcional: ${motivo || "[sin indicar]"}`,
      "",
      "Entiendo que Barbería SaaS puede contactarme para verificar mi identidad antes de completar la eliminación."
    ].join("\n");

    return `mailto:${SOPORTE}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [email, negocio, motivo]);

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
        Completa los datos y toca el botón. Se abrirá tu aplicación de correo con la
        solicitud preparada para enviarla a nuestro equipo de soporte.
      </p>

      <div className="mb-3">
        <label className="form-label fw-semibold">Correo de la cuenta</label>
        <input
          className="form-control"
          type="email"
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

      <a className="btn btn-danger btn-lg" href={mailto}>
        Solicitar eliminación de cuenta
      </a>

      <p className="small text-secondary mt-3">
        También puedes escribir directamente a <a href={`mailto:${SOPORTE}`}>{SOPORTE}</a>.
        No envíes contraseñas, códigos de acceso ni información de tarjetas.
      </p>

      <h2 className="h4 fw-bold mt-4">Tiempo de procesamiento</h2>
      <p>
        Procesaremos las solicitudes en un plazo razonable y podremos pedir
        información adicional únicamente para verificar identidad o determinar el
        alcance de la eliminación.
      </p>
    </LegalLayout>
  );
}
