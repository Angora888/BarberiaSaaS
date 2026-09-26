import LegalLayout from "../components/LegalLayout";

export default function Privacidad() {
  return (
    <LegalLayout
      title="Política de Privacidad"
      subtitle="Última actualización: 26 de septiembre de 2026"
    >
      <p>
        Esta Política de Privacidad explica cómo Barbería SaaS recopila, utiliza,
        almacena y protege información cuando una persona utiliza nuestra
        plataforma web o aplicación móvil.
      </p>

      <h2 className="h4 fw-bold mt-4">1. Información que podemos recopilar</h2>
      <p>Dependiendo de las funciones utilizadas, podemos tratar:</p>
      <ul>
        <li>Datos de cuenta: nombre, apellidos, correo electrónico, rol y credenciales protegidas.</li>
        <li>Datos del negocio: nombre comercial, teléfono, correo, sucursales, configuración y preferencias.</li>
        <li>Datos de clientes administrados por el negocio: nombre, teléfono, correo, notas y citas.</li>
        <li>Datos operativos: servicios, profesionales, horarios, productos, inventario, ventas y reportes.</li>
        <li>Datos de reservas: fecha, hora, servicio, profesional, estado de la cita y notas relacionadas.</li>
        <li>Contactos: únicamente cuando el usuario autoriza el acceso para seleccionar e importar un contacto.</li>
        <li>Notificaciones: identificadores técnicos de dispositivo y tokens push necesarios para entregar avisos.</li>
        <li>Imágenes cargadas voluntariamente, como logos del negocio o fotografías de profesionales/productos.</li>
        <li>Datos técnicos básicos, registros de errores y datos necesarios para seguridad, diagnóstico y funcionamiento del servicio.</li>
      </ul>

      <h2 className="h4 fw-bold mt-4">2. Cómo usamos la información</h2>
      <ul>
        <li>Prestar y operar Barbería SaaS.</li>
        <li>Autenticar usuarios y proteger cuentas.</li>
        <li>Gestionar citas, clientes, profesionales, inventario, ventas y reportes.</li>
        <li>Enviar notificaciones relacionadas con citas y actividad del negocio.</li>
        <li>Procesar solicitudes de soporte, recuperación de contraseña y comunicaciones del servicio.</li>
        <li>Prevenir abuso, fraude y accesos no autorizados.</li>
        <li>Mejorar estabilidad, seguridad y experiencia de uso.</li>
      </ul>

      <h2 className="h4 fw-bold mt-4">3. Acceso a contactos</h2>
      <p>
        Barbería SaaS puede solicitar permiso para acceder a los contactos del
        dispositivo. El acceso se utiliza para permitir que el usuario seleccione
        un contacto y lo registre como cliente. No vendemos listas de contactos ni
        utilizamos esta información para publicidad.
      </p>

      <h2 className="h4 fw-bold mt-4">4. Notificaciones push</h2>
      <p>
        Si el usuario autoriza notificaciones, podemos registrar identificadores
        técnicos del dispositivo y tokens de notificación para enviar avisos
        relacionados con reservas y operación del negocio. El permiso puede
        desactivarse desde la configuración del dispositivo.
      </p>

      <h2 className="h4 fw-bold mt-4">5. Proveedores de servicio</h2>
      <p>
        Para operar la plataforma podemos utilizar proveedores tecnológicos,
        incluyendo servicios de alojamiento, base de datos, despliegue,
        notificaciones, correo, mensajería y pagos. Entre ellos pueden encontrarse
        Microsoft Azure, Neon, Vercel, Expo, Google Firebase, Resend, Meta/WhatsApp
        y PayPal. Estos proveedores procesan información únicamente según las
        funciones contratadas y sus respectivos términos y políticas.
      </p>

      <h2 className="h4 fw-bold mt-4">6. Compartición y venta de datos</h2>
      <p>
        Barbería SaaS no vende datos personales. Podemos compartir información con
        proveedores necesarios para prestar el servicio, cuando exista obligación
        legal o cuando sea necesario para proteger derechos, seguridad o integridad
        de la plataforma.
      </p>

      <h2 className="h4 fw-bold mt-4">7. Conservación de información</h2>
      <p>
        Conservamos la información mientras la cuenta se encuentre activa o sea
        necesaria para prestar el servicio. Tras una solicitud válida de
        eliminación, los datos asociados serán eliminados o anonimizados, salvo
        aquellos que deban conservarse temporalmente por obligaciones legales,
        fiscales, seguridad, prevención de fraude, resolución de disputas o defensa
        de derechos.
      </p>

      <h2 className="h4 fw-bold mt-4">8. Eliminación de cuenta y datos</h2>
      <p>
        Los usuarios pueden iniciar una solicitud desde la aplicación o desde
        <a href="/eliminar-cuenta" className="ms-1">barberiasaas.com/eliminar-cuenta</a>.
        La solicitud puede requerir verificación de identidad antes de completarse.
        Si la cuenta pertenece a un empleado de un negocio, algunos registros
        operativos del negocio podrán conservarse anonimizados cuando sean
        necesarios para la integridad contable u operativa.
      </p>

      <h2 className="h4 fw-bold mt-4">9. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas razonables para proteger la
        información, incluyendo autenticación, cifrado en tránsito, control de
        acceso y separación lógica de datos por negocio. Ningún sistema puede
        garantizar seguridad absoluta.
      </p>

      <h2 className="h4 fw-bold mt-4">10. Menores de edad</h2>
      <p>
        Barbería SaaS está dirigida a negocios y personas con capacidad para
        contratar servicios. No está diseñada para que menores creen cuentas de
        negocio por cuenta propia.
      </p>

      <h2 className="h4 fw-bold mt-4">11. Cambios a esta política</h2>
      <p>
        Podemos actualizar esta política cuando cambien nuestras funciones,
        proveedores o requisitos legales. La fecha de última actualización se
        mostrará en esta página.
      </p>

      <h2 className="h4 fw-bold mt-4">12. Contacto</h2>
      <p>
        Para consultas sobre privacidad o derechos relacionados con datos personales,
        puedes escribir a <a href="mailto:soporte@barberiasaas.com">soporte@barberiasaas.com</a>.
      </p>
    </LegalLayout>
  );
}
