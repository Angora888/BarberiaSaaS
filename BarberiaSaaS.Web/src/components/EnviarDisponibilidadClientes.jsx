import { useEffect, useMemo, useState } from "react";
import {
  FaCalendarCheck,
  FaTimes,
  FaWhatsapp
} from "react-icons/fa";

import api from "../services/api";
import { useConfiguracion } from "../context/ConfiguracionContext";
import "./EnviarDisponibilidadClientes.css";

function EnviarDisponibilidadClientes() {
  const { nombreNegocio } = useConfiguracion();

  const [mostrar, setMostrar] =
    useState(false);

  const [clientes, setClientes] =
    useState([]);

  const [servicios, setServicios] =
    useState([]);

  const [profesionales, setProfesionales] =
    useState([]);

  const [cargandoDatos, setCargandoDatos] =
    useState(false);

  const [enviando, setEnviando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [formulario, setFormulario] =
    useState({
      clienteId: "",
      servicioId: "",
      profesionalId: "",
      duracionHoras: "1",
      duracionMinutos: "0"
    });

  useEffect(() => {
    if (!mostrar) {
      return;
    }

    cargarDatos();
  }, [mostrar]);

  const cargarDatos = async () => {
    try {
      setCargandoDatos(true);
      setError("");

      const [
        clientesResponse,
        serviciosResponse,
        profesionalesResponse
      ] = await Promise.all([
        api.get("/Clientes"),
        api.get("/Servicios"),
        api.get("/Profesionales")
      ]);

      setClientes(
        clientesResponse.data || []
      );

      setServicios(
        serviciosResponse.data || []
      );

      setProfesionales(
        profesionalesResponse.data || []
      );
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        "No fue posible cargar la información para consultar disponibilidad."
      );
    } finally {
      setCargandoDatos(false);
    }
  };

  const duracionTotalMinutos =
    useMemo(() => {
      const horas =
        Number(formulario.duracionHoras) || 0;

      const minutos =
        Number(formulario.duracionMinutos) || 0;

      return horas * 60 + minutos;
    }, [
      formulario.duracionHoras,
      formulario.duracionMinutos
    ]);

  const profesionalesDisponibles =
    useMemo(() => {
      if (!formulario.servicioId) {
        return profesionales.filter(
          (profesional) =>
            profesional.activo !== false
        );
      }

      const servicioId =
        Number(formulario.servicioId);

      return profesionales
        .filter(
          (profesional) =>
            profesional.activo !== false
        )
        .filter(
          (profesional) =>
            (profesional.servicios || [])
              .some(
                (servicio) =>
                  servicio.id === servicioId
              )
        );
    }, [
      profesionales,
      formulario.servicioId
    ]);

  const abrir = () => {
    setError("");
    setFormulario({
      clienteId: "",
      servicioId: "",
      profesionalId: "",
      duracionHoras: "1",
      duracionMinutos: "0"
    });
    setMostrar(true);
  };

  const cerrar = () => {
    if (enviando) {
      return;
    }

    setMostrar(false);
    setError("");
  };

  const cambiarCampo = (e) => {
    const { name, value } = e.target;

    setError("");

    setFormulario(
      (anterior) => ({
        ...anterior,
        [name]: value,
        ...(name === "servicioId"
          ? { profesionalId: "" }
          : {})
      })
    );
  };

  const enviarDisponibilidad = async (e) => {
    e.preventDefault();

    const cliente = clientes.find(
      (item) =>
        item.id === Number(formulario.clienteId)
    );

    const servicio = servicios.find(
      (item) =>
        item.id === Number(formulario.servicioId)
    );

    if (!cliente) {
      setError("Selecciona un cliente.");
      return;
    }

    if (!cliente.telefono) {
      setError(
        "El cliente seleccionado no tiene teléfono registrado."
      );
      return;
    }

    if (!servicio) {
      setError("Selecciona un servicio.");
      return;
    }

    if (duracionTotalMinutos <= 0) {
      setError(
        "Selecciona una duración mayor a cero."
      );
      return;
    }

    try {
      setEnviando(true);
      setError("");

      const response = await api.post(
        "/Disponibilidad/semana-siguiente",
        {
          servicioId: Number(formulario.servicioId),
          duracionMinutos: duracionTotalMinutos,
          profesionalId:
            formulario.profesionalId
              ? Number(formulario.profesionalId)
              : null
        }
      );

      const mensaje = construirMensaje(
        response.data,
        cliente,
        servicio,
        formulario.profesionalId
          ? profesionales.find(
              (profesional) =>
                profesional.id ===
                Number(formulario.profesionalId)
            )
          : null,
        nombreNegocio
      );

      const telefono =
        normalizarTelefonoWhatsApp(
          cliente.telefono
        );

      if (!telefono) {
        setError(
          "No fue posible interpretar el teléfono del cliente."
        );
        return;
      }

      const url =
        `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

      window.location.href = url;
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        error.response?.data?.title ||
        "No fue posible consultar la disponibilidad de los próximos 15 días."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="client-availability-fab"
        onClick={abrir}
      >
        <FaWhatsapp />
        <span>Enviar disponibilidad</span>
      </button>

      {mostrar && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal custom-modal-large client-availability-modal">
            <div className="custom-modal-header">
              <div>
                <h4>
                  Enviar disponibilidad
                </h4>

                <p className="text-muted mb-0">
                  Consulta desde hoy los próximos 15 días y abre WhatsApp con los horarios disponibles.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={cerrar}
                disabled={enviando}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={enviarDisponibilidad}>
              <div className="custom-modal-body">
                {error && (
                  <div className="alert alert-danger mb-4">
                    {error}
                  </div>
                )}

                {cargandoDatos ? (
                  <div className="client-availability-loading">
                    <div
                      className="spinner-border spinner-border-sm"
                      role="status"
                    />
                    Cargando clientes, servicios y profesionales...
                  </div>
                ) : (
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">
                        Cliente *
                      </label>

                      <select
                        name="clienteId"
                        className="form-select"
                        value={formulario.clienteId}
                        onChange={cambiarCampo}
                        required
                      >
                        <option value="">
                          Seleccionar cliente
                        </option>

                        {[...clientes]
                          .sort((a, b) =>
                            `${a.nombre || ""} ${a.apellidos || ""}`
                              .localeCompare(
                                `${b.nombre || ""} ${b.apellidos || ""}`,
                                "es"
                              )
                          )
                          .map((cliente) => (
                            <option
                              key={cliente.id}
                              value={cliente.id}
                            >
                              {cliente.nombre}{" "}
                              {cliente.apellidos || ""}
                              {cliente.telefono
                                ? ` - ${cliente.telefono}`
                                : " - sin teléfono"}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Servicio *
                      </label>

                      <select
                        name="servicioId"
                        className="form-select"
                        value={formulario.servicioId}
                        onChange={cambiarCampo}
                        required
                      >
                        <option value="">
                          Seleccionar servicio
                        </option>

                        {servicios
                          .filter(
                            (servicio) =>
                              servicio.activo !== false
                          )
                          .sort((a, b) =>
                            (a.nombre || "")
                              .localeCompare(
                                b.nombre || "",
                                "es"
                              )
                          )
                          .map((servicio) => (
                            <option
                              key={servicio.id}
                              value={servicio.id}
                            >
                              {servicio.nombre}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Profesional
                      </label>

                      <select
                        name="profesionalId"
                        className="form-select"
                        value={formulario.profesionalId}
                        onChange={cambiarCampo}
                        disabled={!formulario.servicioId}
                      >
                        <option value="">
                          Cualquier profesional disponible
                        </option>

                        {profesionalesDisponibles.map(
                          (profesional) => (
                            <option
                              key={profesional.id}
                              value={profesional.id}
                            >
                              {profesional.nombre}{" "}
                              {profesional.apellidos || ""}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label">
                        Duración estimada *
                      </label>

                      <div className="row g-2">
                        <div className="col-6">
                          <div className="input-group">
                            <select
                              name="duracionHoras"
                              className="form-select"
                              value={formulario.duracionHoras}
                              onChange={cambiarCampo}
                            >
                              {Array.from(
                                { length: 13 },
                                (_, indice) => indice
                              ).map((hora) => (
                                <option
                                  key={hora}
                                  value={hora}
                                >
                                  {hora}
                                </option>
                              ))}
                            </select>
                            <span className="input-group-text">
                              h
                            </span>
                          </div>
                        </div>

                        <div className="col-6">
                          <div className="input-group">
                            <select
                              name="duracionMinutos"
                              className="form-select"
                              value={formulario.duracionMinutos}
                              onChange={cambiarCampo}
                            >
                              {[0, 15, 30, 45].map(
                                (minuto) => (
                                  <option
                                    key={minuto}
                                    value={minuto}
                                  >
                                    {String(minuto).padStart(2, "0")}
                                  </option>
                                )
                              )}
                            </select>
                            <span className="input-group-text">
                              min
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="form-text">
                        El mensaje se calcula con espacios donde cabe completa una cita de esta duración.
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="client-availability-tip">
                        <FaCalendarCheck />
                        <span>
                          Se revisan automáticamente los próximos 15 días desde hoy, incluyendo esta semana y la siguiente, tomando en cuenta horarios normales, citas existentes y bloqueos.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="custom-modal-footer">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={cerrar}
                  disabled={enviando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={
                    enviando ||
                    cargandoDatos ||
                    !formulario.clienteId ||
                    !formulario.servicioId ||
                    duracionTotalMinutos <= 0
                  }
                >
                  <FaWhatsapp className="me-2" />
                  {enviando
                    ? "Consultando..."
                    : "Abrir WhatsApp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function construirMensaje(
  datos,
  cliente,
  servicio,
  profesional,
  nombreNegocio
) {
  const nombreCliente =
    cliente.nombre || "";

  const negocio =
    nombreNegocio || "nuestro negocio";

  const lineas = [
    `Hola ${nombreCliente} 😊`,
    "",
    `Te compartimos la disponibilidad de *${negocio}* para los próximos 15 días para *${servicio.nombre}*${
      profesional
        ? ` con *${profesional.nombre} ${profesional.apellidos || ""}*`
        : ""
    }:`,
    ""
  ];

  const diasConDisponibilidad =
    (datos.dias || [])
      .map((dia) => {
        const horas = profesional
          ? obtenerHorasProfesional(
              dia,
              profesional.id
            )
          : obtenerHorasGenerales(dia);

        return {
          ...dia,
          horas
        };
      })
      .filter(
        (dia) =>
          dia.horas.length > 0
      );

  if (diasConDisponibilidad.length === 0) {
    lineas.push(
      "Por el momento no tenemos espacios disponibles en los próximos 15 días para este servicio."
    );
  } else {
    diasConDisponibilidad.forEach(
      (dia) => {
        const rangos =
          compactarHoras(
            dia.horas,
            Number(datos.duracionSlotMinutos) || 15
          );

        lineas.push(
          `📅 *${formatearDia(dia.fecha)}*: ${rangos.join(", ")}`
        );
      }
    );

    lineas.push(
      "",
      "Si alguno de estos horarios te funciona, me indicas cuál y te ayudo a reservarlo 😊"
    );
  }

  return lineas.join("\n");
}

function obtenerHorasProfesional(
  dia,
  profesionalId
) {
  return (
    dia.profesionales || []
  )
    .find(
      (item) =>
        Number(item.profesionalId) ===
        Number(profesionalId)
    )
    ?.horas || [];
}

function obtenerHorasGenerales(dia) {
  return Array.from(
    new Set(
      (dia.profesionales || [])
        .flatMap(
          (item) =>
            item.horas || []
        )
    )
  ).sort();
}

function compactarHoras(
  horas,
  intervaloMinutos
) {
  if (!horas.length) {
    return [];
  }

  const minutos = horas
    .map(horaAMinutos)
    .filter(
      (valor) =>
        Number.isFinite(valor)
    )
    .sort((a, b) => a - b);

  if (!minutos.length) {
    return [];
  }

  const rangos = [];
  let inicio = minutos[0];
  let anterior = minutos[0];

  for (
    let indice = 1;
    indice < minutos.length;
    indice++
  ) {
    const actual = minutos[indice];

    if (
      actual - anterior ===
      intervaloMinutos
    ) {
      anterior = actual;
      continue;
    }

    rangos.push(
      formatearRango(inicio, anterior)
    );

    inicio = actual;
    anterior = actual;
  }

  rangos.push(
    formatearRango(inicio, anterior)
  );

  return rangos;
}

function formatearRango(inicio, fin) {
  if (inicio === fin) {
    return formatearHora(inicio);
  }

  return `${formatearHora(inicio)}–${formatearHora(fin)}`;
}

function horaAMinutos(hora) {
  const partes =
    String(hora)
      .split(":")
      .map(Number);

  if (
    partes.length < 2 ||
    !Number.isFinite(partes[0]) ||
    !Number.isFinite(partes[1])
  ) {
    return NaN;
  }

  return partes[0] * 60 + partes[1];
}

function formatearHora(totalMinutos) {
  const horas24 =
    Math.floor(totalMinutos / 60);

  const minutos =
    totalMinutos % 60;

  const periodo =
    horas24 >= 12
      ? "p. m."
      : "a. m.";

  const horas12 =
    horas24 % 12 || 12;

  return `${horas12}:${String(minutos).padStart(2, "0")} ${periodo}`;
}

function formatearDia(fechaTexto) {
  const [anio, mes, dia] =
    fechaTexto
      .split("-")
      .map(Number);

  const fecha =
    new Date(
      anio,
      mes - 1,
      dia,
      12,
      0,
      0
    );

  const texto =
    new Intl.DateTimeFormat(
      "es-CR",
      {
        weekday: "long",
        day: "numeric",
        month: "short"
      }
    ).format(fecha);

  return texto
    .charAt(0)
    .toUpperCase() +
    texto.slice(1);
}

function normalizarTelefonoWhatsApp(
  telefono
) {
  if (!telefono) {
    return "";
  }

  let digitos =
    telefono
      .toString()
      .replace(/\D/g, "");

  if (digitos.startsWith("00")) {
    digitos = digitos.substring(2);
  }

  if (digitos.length === 8) {
    digitos = `506${digitos}`;
  }

  return digitos;
}

export default EnviarDisponibilidadClientes;
