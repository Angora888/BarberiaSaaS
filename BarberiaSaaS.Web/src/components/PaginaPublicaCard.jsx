import { useState } from "react";
import {
  FaCheck,
  FaCopy,
  FaExternalLinkAlt,
  FaShareAlt,
  FaGlobeAmericas
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useConfiguracion } from "../context/ConfiguracionContext";

function PaginaPublicaCard({ modo = "dashboard" }) {
  const { tenant, nombreNegocio } = useConfiguracion();
  const [copiado, setCopiado] = useState(false);

  const slug = tenant?.slugPublico || "";
  const activa = tenant?.landingPublicaActiva === true;
  const url = slug
    ? `${window.location.origin}/negocio/${slug}`
    : "";

  const copiar = async () => {
    if (!url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2200);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2200);
    }
  };

  const compartir = async () => {
    if (!url) {
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: nombreNegocio,
          text: `Consulta los servicios y disponibilidad de ${nombreNegocio}.`,
          url
        });
        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }
      }
    }

    await copiar();
  };

  return (
    <div className={modo === "configuracion" ? "content-card p-4 mt-4" : "dashboard-card mt-4"}>
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div className="d-flex align-items-start gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
            style={{
              width: "48px",
              height: "48px",
              background: "var(--soft-pink, #f3f4f6)",
              color: "var(--primary, #334155)"
            }}
          >
            <FaGlobeAmericas size={22} />
          </div>

          <div>
            <div className="dashboard-label">Página pública</div>
            <h5 className="mb-1 mt-1">Tu landing para clientes</h5>
            <p className="text-muted mb-0">
              Comparte este enlace para que tus clientes vean servicios y disponibilidad.
            </p>
          </div>
        </div>

        {slug && (
          <span className={`badge ${activa ? "text-bg-success" : "text-bg-secondary"}`}>
            {activa ? "Activa" : "Inactiva"}
          </span>
        )}
      </div>

      {slug ? (
        <>
          <div className="input-group mt-4">
            <input
              type="text"
              className="form-control"
              value={url}
              readOnly
              aria-label="URL de la página pública"
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={copiar}
            >
              {copiado ? <FaCheck className="me-2" /> : <FaCopy className="me-2" />}
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>

          <div className="d-flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={compartir}
            >
              <FaShareAlt className="me-2" />
              Compartir
            </button>

            <a
              className="btn btn-outline-primary"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              <FaExternalLinkAlt className="me-2" />
              Abrir página
            </a>
          </div>

          {!activa && (
            <div className="alert alert-warning mt-3 mb-0">
              La landing está configurada, pero actualmente se encuentra inactiva.
            </div>
          )}
        </>
      ) : (
        <div className="alert alert-light border mt-4 mb-0">
          <strong>Tu página pública aún no está configurada.</strong>{" "}
          {modo === "dashboard" ? (
            <>
              Revisa la sección de <Link to="/configuracion">Configuración</Link>.
            </>
          ) : (
            "Cuando el negocio tenga un enlace público asignado, aparecerá aquí listo para compartir."
          )}
        </div>
      )}
    </div>
  );
}

export default PaginaPublicaCard;
