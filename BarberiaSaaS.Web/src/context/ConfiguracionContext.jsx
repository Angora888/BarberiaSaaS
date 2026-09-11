import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";
import api from "../services/api";

const ConfiguracionContext =
  createContext(null);

export function ConfiguracionProvider({
  children
}) {
  const [tenant, setTenant] =
    useState(null);

  const [cargandoConfiguracion,
    setCargandoConfiguracion] =
    useState(true);

  const [errorConfiguracion,
    setErrorConfiguracion] =
    useState("");

  // ============================================================
  // CARGAR CONFIGURACIÓN
  // ============================================================

  const cargarConfiguracion = async () => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      setTenant(null);
      setCargandoConfiguracion(false);
      return;
    }

    try {
      setCargandoConfiguracion(true);
      setErrorConfiguracion("");

      const response =
        await api.get("/Configuracion");

      setTenant(response.data);
    } catch (error) {
      setErrorConfiguracion(
        error.response?.data?.mensaje ||
        "No fue posible cargar la configuración del negocio."
      );
    } finally {
      setCargandoConfiguracion(false);
    }
  };

  // ============================================================
  // CARGA INICIAL
  // ============================================================

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  // ============================================================
  // APLICAR COLORES DEL TENANT
  // ============================================================

  useEffect(() => {
    if (!tenant?.configuracion) {
      return;
    }

    const configuracion =
      tenant.configuracion;

    const root =
      document.documentElement;

    root.style.setProperty(
      "--primary",
      configuracion.colorPrimario ||
      "#C62864"
    );

    root.style.setProperty(
      "--soft-pink",
      configuracion.colorSecundario ||
      "#F8E7EE"
    );

    root.style.setProperty(
      "--tenant-background",
      configuracion.colorFondo ||
      "#FFFFFF"
    );
  }, [tenant]);

  // ============================================================
  // DATOS DERIVADOS
  // ============================================================

  const nombreNegocio =
    tenant?.nombreComercial ||
    tenant?.nombre ||
    "Mi negocio";

  const moneda =
    tenant?.configuracion?.moneda ||
    "CRC";

  const zonaHoraria =
    tenant?.configuracion?.zonaHoraria ||
    "America/Costa_Rica";

  const idioma =
    tenant?.configuracion?.idioma ||
    "es";

  const logoUrl =
    tenant?.configuracion?.logoUrl ||
    null;

  // ============================================================
  // FORMATEAR MONEDA
  // ============================================================

  const formatearMoneda = (
    valor
  ) => {
    try {
      return new Intl.NumberFormat(
        idioma === "es"
          ? "es-CR"
          : idioma,
        {
          style: "currency",
          currency: moneda,
          maximumFractionDigits: 0
        }
      ).format(valor || 0);
    } catch {
      return `${moneda} ${valor || 0}`;
    }
  };

  // ============================================================
  // FORMATEAR FECHA/HORA
  // ============================================================

  const formatearFechaHora = (
    fecha
  ) => {
    if (!fecha) {
      return "-";
    }

    return new Intl.DateTimeFormat(
      idioma === "es"
        ? "es-CR"
        : idioma,
      {
        timeZone: zonaHoraria,
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }
    ).format(
      new Date(fecha)
    );
  };

  const value = {
    tenant,

    configuracion:
      tenant?.configuracion || null,

    cargandoConfiguracion,

    errorConfiguracion,

    nombreNegocio,

    moneda,

    zonaHoraria,

    idioma,

    logoUrl,

    cargarConfiguracion,

    formatearMoneda,

    formatearFechaHora
  };

  return (
    <ConfiguracionContext.Provider
      value={value}
    >
      {children}
    </ConfiguracionContext.Provider>
  );
}

export function useConfiguracion() {
  const context =
    useContext(
      ConfiguracionContext
    );

  if (!context) {
    throw new Error(
      "useConfiguracion debe utilizarse dentro de ConfiguracionProvider."
    );
  }

  return context;
}