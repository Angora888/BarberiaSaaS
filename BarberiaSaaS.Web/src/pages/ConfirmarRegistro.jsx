import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaSpa
} from "react-icons/fa";
import api from "../services/api";

function ConfirmarRegistro() {
  const { token } = useParams();
  const ejecutado = useRef(false);
  const [estado, setEstado] = useState("cargando");
  const [mensaje, setMensaje] = useState(
    "Estamos validando tu enlace de confirmación..."
  );

  useEffect(() => {
    if (ejecutado.current) {
      return;
    }

    ejecutado.current = true;

    const confirmar = async () => {
      if (!token) {
        setEstado("error");
        setMensaje(
          "El enlace de confirmación no es válido."
        );
        return;
      }

      try {
        const response = await api.post(
          "/Auth/confirmar-registro",
          { token }
        );

        setEstado("exito");
        setMensaje(
          response.data?.mensaje ||
            "Tu negocio fue confirmado correctamente."
        );
      } catch (err) {
        setEstado("error");
        setMensaje(
          err.response?.data?.mensaje ||
            "No fue posible confirmar el negocio. El enlace puede haber expirado."
        );
      }
    };

    confirmar();
  }, [token]);

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{
        background:
          "linear-gradient(145deg, #f7f8fa 0%, #eef1f5 100%)"
      }}
    >
      <div
        className="bg-white border shadow-sm text-center p-4 p-md-5"
        style={{
          width: "100%",
          maxWidth: 620,
          borderRadius: 26
        }}
      >
        <div
          className="mx-auto mb-4 d-flex align-items-center justify-content-center text-white"
          style={{
            width: 58,
            height: 58,
            borderRadius: 17,
            background:
              "linear-gradient(135deg, #111827 0%, #374151 100%)",
            fontSize: 24
          }}
        >
          <FaSpa />
        </div>

        <div className="text-secondary fw-semibold mb-2">
          Barbería SaaS
        </div>

        {estado === "cargando" && (
          <>
            <FaSpinner
              className="fa-spin text-secondary mb-3"
              size={42}
            />
            <h1 className="h3 fw-bold mb-3">
              Confirmando tu negocio
            </h1>
          </>
        )}

        {estado === "exito" && (
          <>
            <FaCheckCircle
              className="text-success mb-3"
              size={54}
            />
            <h1 className="h3 fw-bold mb-3">
              ¡Negocio activado!
            </h1>
          </>
        )}

        {estado === "error" && (
          <>
            <FaExclamationTriangle
              className="text-warning mb-3"
              size={50}
            />
            <h1 className="h3 fw-bold mb-3">
              No pudimos confirmar el registro
            </h1>
          </>
        )}

        <p className="text-secondary mb-4">
          {mensaje}
        </p>

        {estado === "exito" && (
          <Link
            to="/login"
            className="btn btn-dark btn-lg px-4"
          >
            Iniciar sesión
          </Link>
        )}

        {estado === "error" && (
          <Link
            to="/prueba"
            className="btn btn-outline-dark px-4"
          >
            Volver al registro
          </Link>
        )}
      </div>
    </div>
  );
}

export default ConfirmarRegistro;
