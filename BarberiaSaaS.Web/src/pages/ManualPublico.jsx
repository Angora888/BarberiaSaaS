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
            <span><FaBookOpen /></span>
            <div><strong>Barbería SaaS</strong><small>Manual de la aplicación</small></div>
          </Link>
          <div className="manual-header-actions">
            <Link to="/" className="manual-secondary-btn">Inicio</Link>
            <Link to="/login" className="manual-primary-btn">Iniciar sesión</Link>
          </div>
        </div>
      </header>

      <section className="manual-hero">
        <div className="manual-shell">
          <span className="manual-kicker">GUÍA COMPLETA</span>
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
