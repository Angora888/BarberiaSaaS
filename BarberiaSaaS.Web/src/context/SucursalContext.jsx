import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import api from "../services/api";

const SucursalContext =
  createContext(null);

const STORAGE_KEY =
  "barberiaSaaS.sucursalSeleccionada";

export function SucursalProvider({
  children
}) {
  const [sucursales, setSucursales] =
    useState([]);

  const [sucursalId, setSucursalId] =
    useState(() =>
      localStorage.getItem(STORAGE_KEY) || ""
    );

  const [cargandoSucursales,
    setCargandoSucursales] =
    useState(true);

  const [errorSucursales,
    setErrorSucursales] =
    useState("");

  const cargarSucursales = async () => {
    try {
      setCargandoSucursales(true);
      setErrorSucursales("");

      const response =
        await api.get("/Sucursales");

      const lista =
        Array.isArray(response.data)
          ? response.data
          : [];

      setSucursales(lista);

      if (
        sucursalId &&
        !lista.some(
          (sucursal) =>
            Number(sucursal.id) ===
            Number(sucursalId)
        )
      ) {
        seleccionarSucursal("");
      }
    } catch (error) {
      setErrorSucursales(
        error.response?.data?.mensaje ||
        "No fue posible cargar las sucursales."
      );
    } finally {
      setCargandoSucursales(false);
    }
  };

  useEffect(() => {
    cargarSucursales();
  }, []);

  const seleccionarSucursal = (
    nuevoSucursalId
  ) => {
    const valor =
      nuevoSucursalId
        ? String(nuevoSucursalId)
        : "";

    setSucursalId(valor);

    if (valor) {
      localStorage.setItem(
        STORAGE_KEY,
        valor
      );
    } else {
      localStorage.removeItem(
        STORAGE_KEY
      );
    }
  };

  const sucursalSeleccionada =
    useMemo(() => {
      if (!sucursalId) {
        return null;
      }

      return (
        sucursales.find(
          (sucursal) =>
            Number(sucursal.id) ===
            Number(sucursalId)
        ) || null
      );
    }, [
      sucursales,
      sucursalId
    ]);

  const value = {
    sucursales,
    sucursalId,
    sucursalIdNumero:
      sucursalId
        ? Number(sucursalId)
        : null,
    sucursalSeleccionada,
    todasLasSucursales:
      !sucursalId,
    cargandoSucursales,
    errorSucursales,
    seleccionarSucursal,
    cargarSucursales
  };

  return (
    <SucursalContext.Provider
      value={value}
    >
      {children}
    </SucursalContext.Provider>
  );
}

export function useSucursal() {
  const context =
    useContext(SucursalContext);

  if (!context) {
    throw new Error(
      "useSucursal debe utilizarse dentro de SucursalProvider."
    );
  }

  return context;
}
