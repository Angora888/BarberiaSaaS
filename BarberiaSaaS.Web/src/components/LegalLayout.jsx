import { Link } from "react-router-dom";

export default function LegalLayout({ title, subtitle, children }) {
  return (
    <div className="min-vh-100 bg-light">
      <header className="bg-white border-bottom">
        <div className="container py-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
          <Link to="/" className="text-decoration-none text-dark fw-bold fs-4">
            Barbería SaaS
          </Link>
          <div className="d-flex flex-wrap gap-3">
            <Link to="/privacidad" className="text-secondary text-decoration-none">Privacidad</Link>
            <Link to="/terminos" className="text-secondary text-decoration-none">Términos</Link>
            <Link to="/eliminar-cuenta" className="text-secondary text-decoration-none">Eliminar cuenta</Link>
          </div>
        </div>
      </header>

      <main className="container py-5" style={{ maxWidth: 900 }}>
        <div className="bg-white border rounded-4 shadow-sm p-4 p-md-5">
          <h1 className="fw-bold mb-2">{title}</h1>
          {subtitle ? <p className="text-secondary mb-4">{subtitle}</p> : null}
          <div style={{ lineHeight: 1.75 }}>{children}</div>
        </div>
      </main>

      <footer className="border-top bg-white">
        <div className="container py-4 d-flex flex-wrap justify-content-between gap-3 text-secondary">
          <span>© {new Date().getFullYear()} Barbería SaaS</span>
          <Link to="/" className="text-secondary text-decoration-none">Volver al inicio</Link>
        </div>
      </footer>
    </div>
  );
}
