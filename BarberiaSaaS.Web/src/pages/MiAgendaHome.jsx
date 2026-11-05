import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaCalendarCheck, FaCheckCircle, FaClock, FaCut, FaHeart, FaSpa, FaUsers } from "react-icons/fa";
import "./MiAgendaHome.css";

const sections = [
  { icon: <FaCalendarCheck />, title: "Una agenda que se adapta a vos", detail: "Organizá citas, servicios, profesionales y horarios desde un solo lugar." },
  { icon: <FaClock />, title: "Reservas en cualquier momento", detail: "Compartí tu página de reservas para que tus clientes soliciten citas online." },
  { icon: <FaUsers />, title: "Tus clientes, más cerca", detail: "Mantené sus datos e historial organizados para ofrecerles una mejor atención." }
];

export default function MiAgendaHome() {
  useEffect(() => {
    const originalTitle = document.title;
    const description = document.querySelector('meta[name="description"]');
    const originalDescription = description?.getAttribute("content");
    document.title = "Mi Agenda CR | Citas bonitas, negocio organizado";
    description?.setAttribute("content", "Mi Agenda CR: citas, clientes, servicios y horarios en un solo lugar. Para salones, uñas, barberías, spas y cualquier negocio que atienda con cita.");
    return () => {
      document.title = originalTitle;
      if (originalDescription != null) description?.setAttribute("content", originalDescription);
    };
  }, []);

  return (
    <div className="ma-home">
      <header className="ma-header">
        <Link to="/" className="ma-brand" aria-label="Mi Agenda CR - Inicio">
          <span className="ma-brand-icon"><FaCalendarCheck /></span>
          <span>Mi Agenda <strong>CR</strong></span>
        </Link>
        <nav aria-label="Navegación principal">
          <a href="#beneficios">Beneficios</a>
          <a href="#negocios">Para quién es</a>
          <Link to="/login" className="ma-signin">Iniciar sesión</Link>
          <Link to="/prueba" className="ma-nav-cta">Probar gratis <FaArrowRight /></Link>
        </nav>
      </header>

      <main>
        <section className="ma-hero">
          <div className="ma-hero-copy">
            <span className="ma-eyebrow"><FaHeart /> Hecha para negocios que cuidan cada detalle</span>
            <h1>Tu negocio merece una agenda <em>tan especial como vos.</em></h1>
            <p>Organizá tus citas, clientes y horarios de una forma simple y bonita. Menos complicaciones, más tiempo para lo que amás hacer.</p>
            <div className="ma-actions">
              <Link to="/prueba" className="ma-button ma-button-primary">Comenzar mis 30 días gratis <FaArrowRight /></Link>
              <a href="#beneficios" className="ma-button ma-button-outline">Conocer beneficios</a>
            </div>
            <div className="ma-trust"><FaCheckCircle /> Tus clientes reservan gratis · Sin complicaciones</div>
          </div>
          <div className="ma-preview" aria-label="Vista ilustrativa de una agenda de citas">
            <div className="ma-float ma-float-top"><FaHeart /> Tu día, más organizado</div>
            <div className="ma-sample">
              <div className="ma-sample-header"><div><small>MI AGENDA CR</small><h2>Mi agenda</h2></div><span className="ma-sample-icon"><FaCalendarCheck /></span></div>
              <div className="ma-sample-sub">Un día lleno de oportunidades ✨</div>
              <div className="ma-sample-date">Agenda de hoy <span>Vista de ejemplo</span></div>
              <div className="ma-appointment"><span>9:00 a. m.</span><div><strong>Servicio de belleza</strong><small>Cliente · Confirmada</small></div><FaCheckCircle /></div>
              <div className="ma-appointment"><span>11:00 a. m.</span><div><strong>Sesión personalizada</strong><small>Cliente · Confirmada</small></div><FaCheckCircle /></div>
              <div className="ma-appointment"><span>2:30 p. m.</span><div><strong>Próxima cita</strong><small>Cliente · Pendiente</small></div><FaClock /></div>
              <div className="ma-sample-footer"><FaCalendarCheck /> Todo en un solo lugar</div>
            </div>
            <div className="ma-float ma-float-bottom"><FaCheckCircle /> Citas bajo control</div>
          </div>
        </section>

        <section className="ma-benefits" id="beneficios">
          <span className="ma-kicker">PENSADA PARA VOS</span>
          <h2>Más organización. <em>Más tranquilidad.</em></h2>
          <p className="ma-section-desc">Todo lo que necesitás para dedicarte a tus clientes y hacer crecer tu negocio.</p>
          <div className="ma-benefit-grid">
            {sections.map((item) => <article className="ma-benefit" key={item.title}><span className="ma-benefit-icon">{item.icon}</span><h3>{item.title}</h3><p>{item.detail}</p></article>)}
          </div>
        </section>

        <section className="ma-business" id="negocios">
          <div><span className="ma-kicker">UNA AGENDA, MUCHAS POSIBILIDADES</span><h2>Tu pasión es única.<br/><em>Tu agenda también.</em></h2><p>Ideal para salones, uñas, spas, barberías y otros negocios que trabajan con citas.</p><Link className="ma-button ma-button-primary" to="/prueba">Quiero probar Mi Agenda CR <FaArrowRight /></Link></div>
          <div className="ma-business-tags"><span><FaSpa /> Spa y bienestar</span><span><FaHeart /> Uñas y belleza</span><span><FaCut /> Salones y barberías</span><span><FaCalendarCheck /> Servicios con cita</span></div>
        </section>
      </main>

      <footer className="ma-footer"><strong>Mi Agenda CR</strong><span>Hecho con cariño en Costa Rica ♡</span><div><Link to="/privacidad">Privacidad</Link><Link to="/terminos">Términos</Link><Link to="/login">Ingresar</Link></div></footer>
    </div>
  );
}
