import LegalLayout from "../components/LegalLayout";

export default function Terminos() {
  return (
    <LegalLayout
      title="Términos y Condiciones"
      subtitle="Última actualización: 26 de septiembre de 2026"
    >
      <p>
        Estos Términos y Condiciones regulan el uso de Barbería SaaS. Al crear una
        cuenta o utilizar la plataforma, el usuario acepta estos términos.
      </p>

      <h2 className="h4 fw-bold mt-4">1. Servicio</h2>
      <p>
        Barbería SaaS es una plataforma de software para gestión de negocios de
        barbería, salón, belleza y actividades relacionadas. Puede incluir agenda,
        clientes, profesionales, servicios, inventario, ventas, reportes,
        notificaciones y otras herramientas operativas.
      </p>

      <h2 className="h4 fw-bold mt-4">2. Cuenta y seguridad</h2>
      <p>
        El usuario es responsable de proporcionar información correcta, mantener
        seguras sus credenciales y controlar el acceso de las personas autorizadas
        dentro de su negocio. Debe notificarnos si detecta uso no autorizado.
      </p>

      <h2 className="h4 fw-bold mt-4">3. Responsabilidad sobre datos del negocio</h2>
      <p>
        Cada negocio es responsable de contar con las autorizaciones necesarias
        para registrar y tratar información de sus clientes, empleados y
        profesionales. Barbería SaaS actúa como herramienta tecnológica para
        gestionar esa información.
      </p>

      <h2 className="h4 fw-bold mt-4">4. Suscripción y pagos</h2>
      <p>
        Algunas funciones pueden estar sujetas a prueba gratuita, suscripción o
        pago. Los precios, moneda, período de facturación y medios de pago aplicables
        se mostrarán antes de contratar. La falta de pago puede limitar o suspender
        el acceso al servicio.
      </p>

      <h2 className="h4 fw-bold mt-4">5. Cancelación</h2>
      <p>
        El usuario puede dejar de utilizar el servicio y solicitar la eliminación
        de su cuenta. Cancelar una suscripción con un proveedor de pagos y eliminar
        una cuenta son acciones distintas; cuando corresponda, ambas deben
        completarse por separado.
      </p>

      <h2 className="h4 fw-bold mt-4">6. Uso aceptable</h2>
      <p>El usuario no debe utilizar Barbería SaaS para:</p>
      <ul>
        <li>Actividades ilegales, fraudulentas o abusivas.</li>
        <li>Acceder a cuentas, datos o sistemas sin autorización.</li>
        <li>Distribuir malware, automatizaciones dañinas o contenido ilícito.</li>
        <li>Interferir deliberadamente con la estabilidad o seguridad del servicio.</li>
        <li>Tratar datos personales sin una base o autorización válida cuando sea requerida.</li>
      </ul>

      <h2 className="h4 fw-bold mt-4">7. Servicios de terceros</h2>
      <p>
        Algunas funciones dependen de servicios de terceros, como infraestructura
        en la nube, correo, notificaciones, mensajería o pagos. La disponibilidad
        de esas funciones puede verse afectada por dichos proveedores.
      </p>

      <h2 className="h4 fw-bold mt-4">8. Disponibilidad y cambios</h2>
      <p>
        Procuramos mantener el servicio disponible y estable, pero pueden existir
        mantenimientos, interrupciones o cambios técnicos. Podemos modificar,
        mejorar o retirar funciones cuando sea necesario, procurando evitar
        afectaciones injustificadas a los usuarios.
      </p>

      <h2 className="h4 fw-bold mt-4">9. Propiedad intelectual</h2>
      <p>
        Barbería SaaS, su software, diseño, marca y materiales propios están
        protegidos por las leyes aplicables. El usuario conserva los derechos que
        correspondan sobre la información y contenido que incorpora al servicio.
      </p>

      <h2 className="h4 fw-bold mt-4">10. Limitación de responsabilidad</h2>
      <p>
        En la medida permitida por la ley, Barbería SaaS no será responsable por
        pérdidas indirectas derivadas de fallos de terceros, conectividad,
        configuraciones incorrectas, uso no autorizado de credenciales o decisiones
        comerciales tomadas exclusivamente con base en la plataforma.
      </p>

      <h2 className="h4 fw-bold mt-4">11. Suspensión o terminación</h2>
      <p>
        Podemos suspender cuentas cuando exista incumplimiento grave de estos
        términos, riesgo de seguridad, fraude, obligación legal o falta de pago,
        según corresponda.
      </p>

      <h2 className="h4 fw-bold mt-4">12. Privacidad</h2>
      <p>
        El tratamiento de datos personales se describe en nuestra
        <a href="/privacidad" className="ms-1">Política de Privacidad</a>.
      </p>

      <h2 className="h4 fw-bold mt-4">13. Ley aplicable</h2>
      <p>
        Salvo que una norma imperativa disponga otra cosa, estos términos se
        interpretarán conforme a las leyes de la República de Costa Rica.
      </p>

      <h2 className="h4 fw-bold mt-4">14. Contacto</h2>
      <p>
        Para consultas relacionadas con estos términos:
        <a href="mailto:soporte@barberiasaas.com" className="ms-1">soporte@barberiasaas.com</a>.
      </p>
    </LegalLayout>
  );
}
