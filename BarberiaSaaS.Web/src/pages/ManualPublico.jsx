import { Link } from "react-router-dom";
import {
  FaBookOpen,
  FaCalendarAlt,
  FaCashRegister,
  FaChartBar,
  FaCheckCircle,
  FaCut,
  FaExclamationTriangle,
  FaGlobe,
  FaMoneyBillWave,
  FaShoppingBag,
  FaStore,
  FaUsers,
  FaUserTie
} from "react-icons/fa";
import "./ManualPublico.css";

const BRAND_LOGO = "data:image/webp;base64,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";

const indice = [
  ["inicio", "Primeros pasos"],
  ["configuracion", "Configuración"],
  ["servicios", "Servicios"],
  ["profesionales", "Profesionales"],
  ["clientes", "Clientes"],
  ["agenda", "Agenda y citas"],
  ["cobros", "Cobros"],
  ["productos", "Productos e inventario"],
  ["cuentas", "Cuentas por cobrar"],
  ["reportes", "Dashboard y reportes"],
  ["landing", "Página pública"],
  ["checklist", "Checklist inicial"]
];

function Bloque({ id, numero, icono, titulo, children }) {
  return (
    <section id={id} className="manual-section">
      <div className="manual-section-heading">
        <span className="manual-section-icon">{icono}</span>
        <div><small>{numero}</small><h2>{titulo}</h2></div>
      </div>
      {children}
    </section>
  );
}

function ManualPublico() {
  return (
    <div className="manual-page">
      <header className="manual-header">
        <div className="manual-shell manual-header-inner">
          <Link to="/" className="manual-brand">
            <img src={BRAND_LOGO} alt="Barbería SaaS" className="manual-brand-logo" />
            <div><strong>Barbería <em>SaaS</em></strong><small>Manual de la aplicación</small></div>
          </Link>
          <div className="manual-header-actions">
            <Link to="/" className="manual-secondary-btn">Inicio</Link>
            <Link to="/login" className="manual-primary-btn">Iniciar sesión</Link>
          </div>
        </div>
      </header>

      <section className="manual-hero">
        <div className="manual-shell">
          <div className="manual-hero-brand">
            <img src={BRAND_LOGO} alt="" className="manual-hero-logo" />
            <span className="manual-kicker">GUÍA COMPLETA</span>
          </div>
          <h1>Aprende a usar Barbería SaaS paso a paso</h1>
          <p>
            Una guía práctica para configurar y operar barberías, salones y centros de belleza:
            agenda, clientes, profesionales, servicios, productos, cobros, inventario y reportes.
          </p>
        </div>
      </section>

      <div className="manual-shell manual-layout">
        <aside className="manual-sidebar">
          <div className="manual-index-card">
            <strong>Contenido</strong>
            <nav>{indice.map(([id, texto]) => <a href={`#${id}`} key={id}>{texto}</a>)}</nav>
          </div>
        </aside>

        <main className="manual-content">
          <Bloque id="inicio" numero="01" icono={<FaBookOpen />} titulo="Primeros pasos">
            <p>Después de crear el negocio, configura el sistema en este orden recomendado:</p>
            <ol className="manual-steps">
              <li>Configuración general del negocio.</li>
              <li>Sucursales.</li>
              <li>Servicios y variantes.</li>
              <li>Profesionales.</li>
              <li>Asociar servicios a profesionales.</li>
              <li>Horarios de profesionales.</li>
              <li>Clientes.</li>
              <li>Productos e inventario.</li>
              <li>Citas, ventas y cobros.</li>
            </ol>
            <div className="manual-alert">
              <FaExclamationTriangle />
              <div><strong>Regla fundamental</strong><p>Crear un servicio nuevo no lo habilita automáticamente para todos los profesionales. Debes asociarlo a cada profesional que realmente realiza ese servicio.</p></div>
            </div>
          </Bloque>

          <Bloque id="configuracion" numero="02" icono={<FaStore />} titulo="Configuración y sucursales">
            <p>Configura logo, colores, moneda, zona horaria, idioma, WhatsApp y redes sociales. Cada negocio inicia con una sucursal principal y puede agregar más sucursales.</p>
            <div className="manual-tip">Antes de crear citas, vender o cargar inventario, verifica que estás trabajando con la sucursal correcta.</div>
          </Bloque>

          <Bloque id="servicios" numero="03" icono={<FaCut />} titulo="Servicios y variantes">
            <p>Crea los servicios que ofrece el negocio y usa variantes cuando el precio cambia según el trabajo, por ejemplo cabello corto, medio o largo.</p>
            <p>La duración se selecciona al crear la cita, porque un mismo servicio puede tomar diferente tiempo según el cliente.</p>
          </Bloque>

          <Bloque id="profesionales" numero="04" icono={<FaUserTie />} titulo="Profesionales">
            <p>Registra cada profesional, su sucursal, especialidad y fotografía. Luego asocia los servicios que realiza y registra sus horarios habituales.</p>
            <div className="manual-flow"><span>Servicio</span><b>→</b><span>Profesional</span><b>→</b><span>Horario</span><b>→</b><span>Disponibilidad</span><b>→</b><span>Cita</span></div>
            <p>Usa bloqueos cuando un profesional no pueda atender durante un periodo específico.</p>
          </Bloque>

          <Bloque id="clientes" numero="05" icono={<FaUsers />} titulo="Clientes">
            <p>La ficha del cliente concentra datos de contacto, notas, historial de citas y deuda pendiente. También puedes consultar disponibilidad y compartirla por WhatsApp.</p>
          </Bloque>

          <Bloque id="agenda" numero="06" icono={<FaCalendarAlt />} titulo="Agenda y citas">
            <p>Para crear una cita selecciona cliente, servicio, variante si aplica, profesional, duración, fecha y una hora disponible.</p>
            <p>La disponibilidad considera servicios asociados, horarios del profesional, citas existentes, bloqueos y duración seleccionada.</p>
            <ol className="manual-steps">
              <li>Selecciona el cliente.</li><li>Selecciona servicio y profesional.</li><li>Define duración y fecha.</li><li>Consulta las horas disponibles.</li><li>Selecciona la hora y crea la cita.</li>
            </ol>
          </Bloque>

          <Bloque id="cobros" numero="07" icono={<FaMoneyBillWave />} titulo="Cobro de servicios">
            <p>Al completar una cita puedes registrar descuento, monto pagado y método de pago. Si queda saldo pendiente, el sistema lo envía a Cuentas por cobrar.</p>
            <div className="manual-example">Precio: ₡20,000 · Descuento: ₡2,000 · Total: ₡18,000 · Pago: ₡10,000 · Saldo: ₡8,000</div>
          </Bloque>

          <Bloque id="productos" numero="08" icono={<FaShoppingBag />} titulo="Productos, inventario y ventas">
            <p>Crea productos, categorías y precios. Luego carga inventario en la sucursal correspondiente. Crear el producto no significa que tenga existencias.</p>
            <div className="manual-flow"><span>Producto</span><b>→</b><span>Inventario</span><b>→</b><span>Venta</span><b>→</b><span>Cobro</span></div>
            <p>Las ventas parciales o pendientes deben relacionarse con un cliente para llevar correctamente la deuda.</p>
          </Bloque>

          <Bloque id="cuentas" numero="09" icono={<FaCashRegister />} titulo="Cuentas por cobrar">
            <p>Aquí se concentran saldos pendientes de servicios y productos. Puedes revisar el detalle, historial de abonos, registrar nuevos pagos o anular una cuenta cuando corresponda.</p>
            <div className="manual-flow"><span>Cliente</span><b>→</b><span>Cuenta</span><b>→</b><span>Abonos</span><b>→</b><span>Saldo</span></div>
          </Bloque>

          <Bloque id="reportes" numero="10" icono={<FaChartBar />} titulo="Dashboard y reportes">
            <p>El Dashboard muestra la operación diaria y Reportes permite revisar periodos mayores. Los ingresos reflejan dinero realmente recibido mediante cobros y abonos.</p>
            <div className="manual-card-grid">
              <div><strong>Servicios</strong><span>Ingresos cobrados</span></div>
              <div><strong>Productos</strong><span>Ingresos cobrados</span></div>
              <div><strong>Métodos de pago</strong><span>Efectivo, SINPE, tarjeta y transferencia</span></div>
              <div><strong>Resultados</strong><span>Citas, ventas y rendimiento</span></div>
            </div>
          </Bloque>

          <Bloque id="landing" numero="11" icono={<FaGlobe />} titulo="Página pública del negocio">
            <p>Cada negocio puede tener una landing pública con identidad visual, servicios, profesionales, productos y disponibilidad real. Los datos privados del negocio y sus clientes nunca se muestran en esta página.</p>
          </Bloque>

          <Bloque id="checklist" numero="12" icono={<FaCheckCircle />} titulo="Checklist para empezar">
            <div className="manual-checklist">
              {[
                "Datos generales configurados",
                "Sucursal revisada",
                "Servicios creados",
                "Profesionales creados",
                "Servicios asociados a profesionales",
                "Horarios registrados",
                "Clientes cargados",
                "Productos con inventario",
                "Agenda lista para usar",
                "Cobros y reportes comprendidos"
              ].map((texto) => <div key={texto}><FaCheckCircle /><span>{texto}</span></div>)}
            </div>
            <div className="manual-final">
              <h3>¿Listo para trabajar?</h3>
              <p>Inicia sesión y empieza a administrar tu negocio.</p>
              <Link to="/login" className="manual-primary-btn">Ir al login</Link>
            </div>
          </Bloque>
        </main>
      </div>

      <footer className="manual-footer">Barbería SaaS · Gestión para barberías, salones y centros de belleza</footer>
    </div>
  );
}

export default ManualPublico;
