import axios from "axios";

const SUCURSAL_STORAGE_KEY =
  "barberiaSaaS.sucursalSeleccionada";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5215/api"
});

function obtenerSucursalSeleccionada() {
  const valor =
    localStorage.getItem(
      SUCURSAL_STORAGE_KEY
    );

  if (!valor) {
    return null;
  }

  const numero = Number(valor);

  return Number.isFinite(numero) &&
    numero > 0
    ? numero
    : null;
}

function obtenerRuta(config) {
  return String(config?.url || "")
    .split("?")[0]
    .toLowerCase();
}

function esGet(config) {
  return String(
    config?.method || "get"
  ).toLowerCase() === "get";
}

function debeAgregarSucursalComoParametro(
  ruta
) {
  return [
    "/productos",
    "/inventario",
    "/resumenfinanciero/diario"
  ].includes(ruta);
}

function filtrarRespuestaPorSucursal(
  response,
  sucursalId
) {
  if (
    !sucursalId ||
    !esGet(response?.config) ||
    !Array.isArray(response?.data)
  ) {
    return response;
  }

  const ruta =
    obtenerRuta(response.config);

  if (ruta === "/citas") {
    response.data =
      response.data.filter(
        (item) =>
          Number(
            item?.sucursalId ??
            item?.sucursal?.id
          ) === sucursalId
      );
  }

  if (ruta === "/profesionales") {
    response.data =
      response.data.filter(
        (item) =>
          Number(item?.sucursalId) ===
          sucursalId
      );
  }

  if (ruta === "/ventas") {
    response.data =
      response.data.filter(
        (item) =>
          Number(item?.sucursalId) ===
          sucursalId
      );
  }

  return response;
}

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    const sucursalId =
      obtenerSucursalSeleccionada();

    if (
      sucursalId &&
      esGet(config)
    ) {
      const ruta =
        obtenerRuta(config);

      if (
        debeAgregarSucursalComoParametro(
          ruta
        )
      ) {
        config.params = {
          ...(config.params || {})
        };

        if (
          config.params.sucursalId ===
            undefined ||
          config.params.sucursalId ===
            null ||
          config.params.sucursalId === ""
        ) {
          config.params.sucursalId =
            sucursalId;
        }
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const sucursalId =
      obtenerSucursalSeleccionada();

    return filtrarRespuestaPorSucursal(
      response,
      sucursalId
    );
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      localStorage.removeItem(
        SUCURSAL_STORAGE_KEY
      );

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
