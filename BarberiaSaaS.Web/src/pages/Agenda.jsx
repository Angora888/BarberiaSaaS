import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaBell,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaList,
  FaPlus,
  FaThLarge,
  FaTimes,
  FaUser,
  FaUserTie,
  FaWhatsapp
} from "react-icons/fa";

import api from "../services/api";
import { useConfiguracion } from "../context/ConfiguracionContext";
import "./Agenda.css";

function Agenda() {
  const {
    formatearMoneda,
    zonaHoraria,
    nombreNegocio
  } = useConfiguracion();

  const [fechaSeleccionada, setFechaSeleccionada] =
    useState(obtenerFechaHoy());

  const [modoAgenda, setModoAgenda] =
    useState("semana");

  const [profesionalFiltro, setProfesionalFiltro] =
    useState("todos");

  const [citas, setCitas] =
    useState([]);

  const [vistaAgenda, setVistaAgenda] =
    useState("visual");

  const [citaArrastrada, setCitaArrastrada] =
    useState(null);

  const [profesionalSobre, setProfesionalSobre] =
    useState(null);

  const [reprogramandoCita, setReprogramandoCita] =
    useState(false);

  const [mensajeAgenda, setMensajeAgenda] =
    useState("");

  const ignorarClickHastaRef =
    useRef(0);

  const [clientes, setClientes] =
    useState([]);

  const [servicios, setServicios] =
    useState([]);

  const [profesionales, setProfesionales] =
    useState([]);

  const [sucursales, setSucursales] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState("");

  const [errorModal, setErrorModal] =
    useState("");

  const [citaSeleccionada, setCitaSeleccionada] =
    useState(null);

  const [mostrarDetalleCita, setMostrarDetalleCita] =
    useState(false);

  const [actualizandoEstado, setActualizandoEstado] =
    useState(false);

  const [errorDetalle, setErrorDetalle] =
    useState("");

  const [
    mostrarNuevaCita,
    setMostrarNuevaCita
  ] = useState(false);

  const [guardando, setGuardando] =
    useState(false);

  const [
    consultandoDisponibilidad,
    setConsultandoDisponibilidad
  ] = useState(false);

  const [
    horariosDisponibles,
    setHorariosDisponibles
  ] = useState([]);

  const [formulario, setFormulario] =
    useState({
      clienteId: "",
      servicioId: "",
      servicioVarianteId: "",
      profesionalId: "",
      sucursalId: "",
      fecha: obtenerFechaHoy(),
      duracionHoras: "1",
      duracionMinutos: "0",
      horaInicio: "",
      notas: ""
    });

  // ============================================================
  // CARGA INICIAL
  // ============================================================

  useEffect(() => {
    cargarDatosBase();
  }, []);

  useEffect(() => {
    cargarCitas();
  }, [fechaSeleccionada, modoAgenda]);

  const cargarDatosBase = async () => {
    try {
      setCargando(true);
      setError("");

      const [
        clientesResponse,
        serviciosResponse,
        profesionalesResponse,
        sucursalesResponse
      ] = await Promise.all([
        api.get("/Clientes"),
        api.get("/Servicios"),
        api.get("/Profesionales"),
        api.get("/Sucursales")
      ]);

      setClientes(
        clientesResponse.data
      );

      setServicios(
        serviciosResponse.data
      );

      setProfesionales(
        profesionalesResponse.data
      );

      setSucursales(
        sucursalesResponse.data
      );

      if (
        sucursalesResponse.data.length === 1
      ) {
        setFormulario(
          (anterior) => ({
            ...anterior,

            sucursalId:
              sucursalesResponse
                .data[0]
                .id
                .toString()
          })
        );
      }
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
          "No fue posible cargar la información de la agenda."
      );
    } finally {
      setCargando(false);
    }
  };

  // ============================================================
  // CARGAR CITAS
  // ============================================================

  const cargarCitas = async (
    fechaReferencia = fechaSeleccionada,
    modoReferencia = modoAgenda
  ) => {
    try {
      setError("");

      const rango =
        modoReferencia === "semana"
          ? obtenerRangoSemana(fechaReferencia)
          : {
              inicio: fechaReferencia,
              fin: fechaReferencia
            };

      const desde =
        `${rango.inicio}T00:00:00`;

      const hasta =
        `${rango.fin}T23:59:59`;

      const response =
        await api.get(
          "/Citas",
          {
            params: {
              desde,
              hasta
            }
          }
        );

      setCitas(
        response.data
      );
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
          "No fue posible cargar las citas."
      );
    }
  };

  // ============================================================
  // SERVICIO SELECCIONADO
  // ============================================================

  const servicioSeleccionado =
    useMemo(() => {
      return servicios.find(
        (servicio) =>
          servicio.id ===
          Number(
            formulario.servicioId
          )
      );
    }, [
      servicios,
      formulario.servicioId
    ]);

  // ============================================================
  // VARIANTE DEL SERVICIO
  // ============================================================

  const variantesServicioSeleccionado =
    useMemo(() => {
      if (!servicioSeleccionado) {
        return [];
      }

      return (servicioSeleccionado.variantes || [])
        .filter(
          (variante) =>
            variante.activo !== false
        )
        .sort((a, b) => {
          const ordenA =
            Number(a.orden) || 0;

          const ordenB =
            Number(b.orden) || 0;

          if (ordenA !== ordenB) {
            return ordenA - ordenB;
          }

          return (a.nombre || "")
            .localeCompare(
              b.nombre || "",
              "es"
            );
        });
    }, [servicioSeleccionado]);

  const servicioTieneVariantes =
    variantesServicioSeleccionado.length > 0;

  const varianteSeleccionada =
    useMemo(() => {
      return variantesServicioSeleccionado.find(
        (variante) =>
          variante.id ===
          Number(
            formulario.servicioVarianteId
          )
      );
    }, [
      variantesServicioSeleccionado,
      formulario.servicioVarianteId
    ]);

  const obtenerPrecioDesdeServicio =
    (servicio) => {
      const variantesActivas =
        (servicio?.variantes || [])
          .filter(
            (variante) =>
              variante.activo !== false
          );

      if (
        variantesActivas.length === 0
      ) {
        return Number(
          servicio?.precio || 0
        );
      }

      return Math.min(
        ...variantesActivas.map(
          (variante) =>
            Number(
              variante.precio || 0
            )
        )
      );
    };

  // ============================================================
  // DURACIÓN DE LA CITA
  // ============================================================

  const duracionTotalMinutos =
    useMemo(() => {
      const horas =
        Number(formulario.duracionHoras) || 0;

      const minutos =
        Number(formulario.duracionMinutos) || 0;

      return (horas * 60) + minutos;
    }, [
      formulario.duracionHoras,
      formulario.duracionMinutos
    ]);

  // ============================================================
  // PROFESIONALES QUE HACEN EL SERVICIO
  // ============================================================

  const profesionalesDisponibles =
    useMemo(() => {
      if (
        !formulario.servicioId
      ) {
        return profesionales;
      }

      const servicioId =
        Number(
          formulario.servicioId
        );

      return profesionales.filter(
        (profesional) => {
          if (
            !profesional.servicios
          ) {
            return false;
          }

          return profesional.servicios
            .some(
              (servicio) =>
                servicio.id ===
                servicioId
            );
        }
      );
    }, [
      profesionales,
      formulario.servicioId
    ]);

  // ============================================================
  // FORMULARIO
  // ============================================================

  const cambiarCampo = (e) => {
    const {
      name,
      value
    } = e.target;

    setErrorModal("");

    if (
      name === "servicioId"
    ) {
      setFormulario(
        (anterior) => {
          const profesionalActual =
            profesionales.find(
              (profesional) =>
                profesional.id ===
                Number(
                  anterior.profesionalId
                )
            );

          const servicioId =
            Number(value);

          const profesionalCompatible =
            profesionalActual?.servicios
              ?.some(
                (servicio) =>
                  servicio.id ===
                  servicioId
              ) ||
            false;

          return {
            ...anterior,
            servicioId: value,
            servicioVarianteId: "",
            profesionalId:
              profesionalCompatible
                ? anterior.profesionalId
                : "",
            horaInicio:
              profesionalCompatible
                ? anterior.horaInicio
                : ""
          };
        }
      );

      setHorariosDisponibles([]);

      return;
    }

    if (
      name === "servicioVarianteId" ||
      name === "profesionalId" ||
      name === "fecha" ||
      name === "duracionHoras" ||
      name === "duracionMinutos"
    ) {
      setFormulario(
        (anterior) => ({
          ...anterior,

          [name]: value,
          horaInicio: ""
        })
      );

      setHorariosDisponibles([]);

      return;
    }

    setFormulario(
      (anterior) => ({
        ...anterior,
        [name]: value
      })
    );
  };

  // ============================================================
  // CONSULTAR DISPONIBILIDAD
  // ============================================================

  const consultarDisponibilidad =
    async () => {
      if (
        !formulario.servicioId
      ) {
        setErrorModal(
          "Selecciona un servicio."
        );

        return;
      }

      if (
        servicioTieneVariantes &&
        !formulario.servicioVarianteId
      ) {
        setErrorModal(
          "Selecciona una variante del servicio."
        );

        return;
      }

      if (
        !formulario.profesionalId
      ) {
        setErrorModal(
          "Selecciona un profesional."
        );

        return;
      }

      if (
        !formulario.fecha
      ) {
        setErrorModal(
          "Selecciona una fecha."
        );

        return;
      }

      if (
        duracionTotalMinutos <= 0
      ) {
        setErrorModal(
          "Selecciona una duración mayor a cero."
        );

        return;
      }

      try {
        setConsultandoDisponibilidad(
          true
        );

        setErrorModal("");

        setHorariosDisponibles(
          []
        );

        console.log(
          "Consultando disponibilidad:",
          {
            profesionalId:
              Number(
                formulario.profesionalId
              ),

            servicioId:
              Number(
                formulario.servicioId
              ),

            fecha:
              `${formulario.fecha}T00:00:00`,

            duracionMinutos:
              duracionTotalMinutos
          }
        );

        const response =
          await api.post(
            "/Disponibilidad/consultar",
            {
              profesionalId:
                Number(
                  formulario.profesionalId
                ),

              servicioId:
                Number(
                  formulario.servicioId
                ),

              fecha:
                `${formulario.fecha}T00:00:00`,

              duracionMinutos:
                duracionTotalMinutos
            }
          );

        console.log(
          "Respuesta disponibilidad:",
          response.data
        );

        const datos =
          response.data;

        let horarios = [];

        if (
          Array.isArray(datos)
        ) {
          horarios = datos;
        } else if (
          Array.isArray(
            datos.horarios
          )
        ) {
          horarios =
            datos.horarios;
        } else if (
          Array.isArray(
            datos.horariosDisponibles
          )
        ) {
          horarios =
            datos.horariosDisponibles;
        } else if (
          Array.isArray(
            datos.disponibilidad
          )
        ) {
          horarios =
            datos.disponibilidad;
        } else if (
          Array.isArray(
            datos.disponibilidades
          )
        ) {
          horarios =
            datos.disponibilidades;
        } else if (
          Array.isArray(
            datos.slots
          )
        ) {
          horarios =
            datos.slots;
        }

        setHorariosDisponibles(
          horarios
        );

        if (
          horarios.length === 0
        ) {
          setErrorModal(
            "No hay horarios disponibles para ese profesional en la fecha seleccionada."
          );
        }
      } catch (error) {
        console.error(
          "Error consultando disponibilidad:",
          error
        );

        console.error(
          "Respuesta del servidor:",
          error.response?.data
        );

        console.error(
          "Status:",
          error.response?.status
        );

        setErrorModal(
          error.response?.data?.mensaje ||
          error.response?.data?.title ||
          `No fue posible consultar la disponibilidad${
            error.response?.status
              ? ` (HTTP ${error.response.status})`
              : ""
          }.`
        );
      } finally {
        setConsultandoDisponibilidad(
          false
        );
      }
    };

  // ============================================================
  // CREAR CITA
  // ============================================================

  const guardarCita = async (e) => {
    e.preventDefault();

    if (
      !formulario.clienteId
    ) {
      setErrorModal(
        "Selecciona un cliente."
      );

      return;
    }

    if (
      !formulario.servicioId
    ) {
      setErrorModal(
        "Selecciona un servicio."
      );

      return;
    }

    if (
      servicioTieneVariantes &&
      !formulario.servicioVarianteId
    ) {
      setErrorModal(
        "Selecciona una variante del servicio."
      );

      return;
    }

    if (
      !formulario.profesionalId
    ) {
      setErrorModal(
        "Selecciona un profesional."
      );

      return;
    }

    if (
      !formulario.sucursalId
    ) {
      setErrorModal(
        "Selecciona una sucursal."
      );

      return;
    }

    if (
      !formulario.fecha
    ) {
      setErrorModal(
        "Selecciona una fecha."
      );

      return;
    }

    if (
      duracionTotalMinutos <= 0
    ) {
      setErrorModal(
        "Selecciona una duración mayor a cero."
      );

      return;
    }

    if (
      !formulario.horaInicio
    ) {
      setErrorModal(
        "Selecciona una hora disponible."
      );

      return;
    }

    try {
      setGuardando(true);
      setErrorModal("");

      await api.post(
        "/Citas",
        {
          clienteId:
            Number(
              formulario.clienteId
            ),

          profesionalId:
            Number(
              formulario.profesionalId
            ),

          servicioId:
            Number(
              formulario.servicioId
            ),

          servicioVarianteId:
            formulario.servicioVarianteId
              ? Number(
                  formulario.servicioVarianteId
                )
              : null,

          sucursalId:
            Number(
              formulario.sucursalId
            ),

          fechaInicio:
            `${formulario.fecha}T${formulario.horaInicio}:00`,

          duracionMinutos:
            duracionTotalMinutos,

          notas:
            formulario.notas ||
            null
        }
      );

      const fechaNuevaCita =
        formulario.fecha;

      cerrarNuevaCita();

      setFechaSeleccionada(
        fechaNuevaCita
      );

      await cargarCitas(
        fechaNuevaCita,
        modoAgenda
      );
    } catch (error) {
      console.error(
        "Error creando cita:",
        error.response?.data
      );

      setErrorModal(
        error.response?.data?.mensaje ||
        error.response?.data?.title ||
          "No fue posible crear la cita."
      );
    } finally {
      setGuardando(false);
    }
  };

  // ============================================================
  // MODAL
  // ============================================================

  const abrirNuevaCita = () => {
    setError("");
    setErrorModal("");

    setHorariosDisponibles(
      []
    );

    setFormulario({
      clienteId: "",
      servicioId: "",
      servicioVarianteId: "",
      profesionalId: "",

      sucursalId:
        sucursales.length === 1
          ? sucursales[0]
              .id
              .toString()
          : "",

      fecha:
        fechaSeleccionada,

      duracionHoras: "1",
      duracionMinutos: "0",
      horaInicio: "",

      notas: ""
    });

    setMostrarNuevaCita(
      true
    );
  };

  const abrirNuevaCitaParaFecha = (
    fecha
  ) => {
    setFechaSeleccionada(
      fecha
    );

    setError("");
    setErrorModal("");
    setHorariosDisponibles([]);

    setFormulario({
      clienteId: "",
      servicioId: "",
      servicioVarianteId: "",
      profesionalId:
        profesionalFiltro !== "todos"
          ? profesionalFiltro
          : "",
      sucursalId:
        sucursales.length === 1
          ? sucursales[0].id.toString()
          : "",
      fecha,
      duracionHoras: "1",
      duracionMinutos: "0",
      horaInicio: "",
      notas: ""
    });

    setMostrarNuevaCita(true);
  };

  const abrirNuevaCitaDesdeAgenda = (
    profesional,
    minutoInicio
  ) => {
    setError("");
    setErrorModal("");
    setHorariosDisponibles([]);

    const horaInicio =
      formatearMinutosHora(
        minutoInicio
      );

    const sucursalId =
      profesional.sucursalId
        ? profesional.sucursalId.toString()
        : sucursales.length === 1
          ? sucursales[0].id.toString()
          : "";

    setFormulario({
      clienteId: "",
      servicioId: "",
      servicioVarianteId: "",
      profesionalId:
        profesional.id.toString(),
      sucursalId,
      fecha:
        fechaSeleccionada,
      duracionHoras: "1",
      duracionMinutos: "0",
      horaInicio,
      notas: ""
    });

    setMostrarNuevaCita(true);
  };

  const manejarClickEspacioAgenda = (
    evento,
    profesional
  ) => {
    if (
      Date.now() <
      ignorarClickHastaRef.current
    ) {
      return;
    }

    if (
      evento.target.closest(
        ".visual-appointment"
      )
    ) {
      return;
    }

    const rect =
      evento.currentTarget
        .getBoundingClientRect();

    const posicionY =
      evento.clientY -
      rect.top;

    const minutosDesdeInicio =
      posicionY /
      configuracionAgenda
        .pixelesPorMinuto;

    const minutoCalculado =
      configuracionAgenda
        .minutoInicio +
      minutosDesdeInicio;

    const intervalo = 15;

    let minutoInicio =
      Math.round(
        minutoCalculado /
        intervalo
      ) * intervalo;

    minutoInicio =
      Math.max(
        configuracionAgenda
          .minutoInicio,
        minutoInicio
      );

    minutoInicio =
      Math.min(
        configuracionAgenda
          .minutoFin -
          intervalo,
        minutoInicio
      );

    abrirNuevaCitaDesdeAgenda(
      profesional,
      minutoInicio
    );
  };

  const iniciarArrastreCita = (
    evento,
    cita
  ) => {
    if (reprogramandoCita) {
      evento.preventDefault();
      return;
    }

    const profesionalId =
      cita.profesional?.id ||
      cita.profesionalId;

    const datosArrastre = {
      id: cita.id,
      profesionalId,
      cita
    };

    setMensajeAgenda("");
    setError("");
    setCitaArrastrada(datosArrastre);

    evento.dataTransfer.effectAllowed =
      "move";

    evento.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        id: cita.id,
        profesionalId
      })
    );
  };

  const finalizarArrastreCita = () => {
    setCitaArrastrada(null);
    setProfesionalSobre(null);

    ignorarClickHastaRef.current =
      Date.now() + 300;
  };

  const permitirDropCita = (
    evento,
    profesional
  ) => {
    if (
      !citaArrastrada ||
      reprogramandoCita
    ) {
      return;
    }

    evento.preventDefault();

    const mismoProfesional =
      Number(
        citaArrastrada.profesionalId
      ) ===
      Number(
        profesional.id
      );

    evento.dataTransfer.dropEffect =
      mismoProfesional
        ? "move"
        : "none";

    setProfesionalSobre(
      profesional.id
    );
  };

  const salirZonaDrop = (
    evento
  ) => {
    if (
      evento.currentTarget.contains(
        evento.relatedTarget
      )
    ) {
      return;
    }

    setProfesionalSobre(null);
  };

  const soltarCita = async (
    evento,
    profesional
  ) => {
    evento.preventDefault();
    evento.stopPropagation();

    if (
      !citaArrastrada ||
      reprogramandoCita
    ) {
      return;
    }

    const mismoProfesional =
      Number(
        citaArrastrada.profesionalId
      ) ===
      Number(
        profesional.id
      );

    if (!mismoProfesional) {
      setError(
        "Por ahora solo puedes mover una cita dentro de la columna del mismo profesional."
      );

      finalizarArrastreCita();
      return;
    }

    const rect =
      evento.currentTarget
        .getBoundingClientRect();

    const posicionY =
      evento.clientY -
      rect.top;

    const minutosDesdeInicio =
      posicionY /
      configuracionAgenda
        .pixelesPorMinuto;

    const minutoCalculado =
      configuracionAgenda
        .minutoInicio +
      minutosDesdeInicio;

    const intervalo = 15;

    let minutoInicio =
      Math.round(
        minutoCalculado /
        intervalo
      ) * intervalo;

    minutoInicio =
      Math.max(
        configuracionAgenda
          .minutoInicio,
        minutoInicio
      );

    minutoInicio =
      Math.min(
        configuracionAgenda
          .minutoFin -
          intervalo,
        minutoInicio
      );

    const horaNueva =
      formatearMinutosHora(
        minutoInicio
      );

    const horaActual =
      obtenerHoraCita(
        citaArrastrada.cita,
        zonaHoraria
      );

    if (
      horaActual === horaNueva
    ) {
      finalizarArrastreCita();
      return;
    }

    try {
      setReprogramandoCita(true);
      setError("");
      setMensajeAgenda("");

      await api.put(
        `/Citas/${citaArrastrada.id}/reprogramar`,
        {
          nuevaFechaInicio:
            `${fechaSeleccionada}T${horaNueva}:00`
        }
      );

      setMensajeAgenda(
        `Cita reprogramada de ${horaActual} a ${horaNueva}.`
      );

      await cargarCitas();
    } catch (error) {
      setError(
        error.response?.data?.mensaje ||
        error.response?.data?.title ||
        "No fue posible reprogramar la cita."
      );
    } finally {
      setReprogramandoCita(false);
      finalizarArrastreCita();
    }
  };

  const cerrarNuevaCita = () => {
    setMostrarNuevaCita(
      false
    );

    setErrorModal("");

    setHorariosDisponibles(
      []
    );

    setFormulario({
      clienteId: "",
      servicioId: "",
      servicioVarianteId: "",
      profesionalId: "",

      sucursalId:
        sucursales.length === 1
          ? sucursales[0]
              .id
              .toString()
          : "",

      fecha:
        fechaSeleccionada,

      duracionHoras: "1",
      duracionMinutos: "0",
      horaInicio: "",
      notas: ""
    });
  };

  // ============================================================
  // DETALLE Y ESTADO DE CITA
  // ============================================================

  const abrirDetalleCita = async (cita) => {
    try {
      setErrorDetalle("");
      setCitaSeleccionada(cita);
      setMostrarDetalleCita(true);

      const response =
        await api.get(
          `/Citas/${cita.id}`
        );

      setCitaSeleccionada(
        response.data
      );
    } catch (error) {
      setErrorDetalle(
        error.response?.data?.mensaje ||
        "No fue posible cargar el detalle de la cita."
      );
    }
  };

  const cerrarDetalleCita = () => {
    if (actualizandoEstado) {
      return;
    }

    setMostrarDetalleCita(false);
    setCitaSeleccionada(null);
    setErrorDetalle("");
  };

  const cambiarEstadoCita = async (
    nuevoEstado
  ) => {
    if (!citaSeleccionada) {
      return false;
    }

    if (
      nuevoEstado === "Cancelada" &&
      !window.confirm(
        "¿Seguro que deseas cancelar esta cita? El horario volverá a quedar disponible."
      )
    ) {
      return false;
    }

    try {
      setActualizandoEstado(true);
      setErrorDetalle("");

      const response =
        await api.put(
          `/Citas/${citaSeleccionada.id}/estado`,
          {
            estado: nuevoEstado,
            notas:
              citaSeleccionada.notas ||
              null
          }
        );

      setCitaSeleccionada(
        (anterior) => ({
          ...anterior,
          estado:
            response.data?.estado ||
            nuevoEstado
        })
      );

      await cargarCitas();

      return true;
    } catch (error) {
      setErrorDetalle(
        error.response?.data?.mensaje ||
        error.response?.data?.title ||
        "No fue posible actualizar el estado de la cita."
      );

      return false;
    } finally {
      setActualizandoEstado(false);
    }
  };

  // ============================================================
  // WHATSAPP
  // ============================================================

  const normalizarTelefonoWhatsApp = (
    telefono
  ) => {
    if (!telefono) {
      return "";
    }

    let digitos =
      telefono
        .toString()
        .replace(/\D/g, "");

    if (
      digitos.startsWith("00")
    ) {
      digitos =
        digitos.substring(2);
    }

    if (digitos.length === 8) {
      digitos =
        `506${digitos}`;
    }

    return digitos;
  };

  const obtenerFechaCitaWhatsApp = (
    cita
  ) => {
    const fechaLocal =
      obtenerFechaLocalCita(
        cita,
        zonaHoraria
      );

    if (!fechaLocal) {
      return "";
    }

    try {
      return new Intl.DateTimeFormat(
        "es-CR",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        }
      ).format(
        crearFechaLocal(
          fechaLocal
        )
      );
    } catch {
      return fechaLocal;
    }
  };

  const construirMensajeWhatsApp = (
    tipo,
    cita
  ) => {
    const cliente =
      cita.cliente?.nombre ||
      obtenerNombreCliente(cita);

    const fecha =
      obtenerFechaCitaWhatsApp(
        cita
      );

    const hora =
      obtenerHoraCita(
        cita,
        zonaHoraria
      );

    const servicio =
      obtenerNombreServicio(
        cita
      );

    const profesional =
      obtenerNombreProfesional(
        cita
      );

    const sucursal =
      cita.sucursal?.nombre ||
      "Sucursal";

    const negocio =
      nombreNegocio ||
      "nuestro negocio";

    if (
      tipo === "confirmacion"
    ) {
      return [
        `Hola ${cliente} 😊`,
        "",
        `Tu cita en *${negocio}* ha sido confirmada.`,
        "",
        `📅 Fecha: ${capitalizar(fecha)}`,
        `🕐 Hora: ${hora}`,
        `✨ Servicio: ${servicio}`,
        `👩‍💼 Profesional: ${profesional}`,
        `📍 ${sucursal}`,
        `💰 Precio: ${formatearMoneda(cita.precio)}`,
        "",
        "¡Te esperamos! 💕"
      ].join("\n");
    }

    return [
      `Hola ${cliente} 😊`,
      "",
      `Te recordamos tu cita en *${negocio}*.`,
      "",
      `📅 Fecha: ${capitalizar(fecha)}`,
      `🕐 Hora: ${hora}`,
      `✨ Servicio: ${servicio}`,
      `👩‍💼 Profesional: ${profesional}`,
      `📍 ${sucursal}`,
      "",
      "¡Te esperamos! 💕"
    ].join("\n");
  };

  const construirUrlWhatsApp = (
    tipo,
    cita
  ) => {
    const telefono =
      normalizarTelefonoWhatsApp(
        cita.cliente?.telefono
      );

    if (!telefono) {
      return "";
    }

    const mensaje =
      construirMensajeWhatsApp(
        tipo,
        cita
      );

    return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  };

  const enviarRecordatorioWhatsApp =
    () => {
      if (!citaSeleccionada) {
        return;
      }

      const url =
        construirUrlWhatsApp(
          "recordatorio",
          citaSeleccionada
        );

      if (!url) {
        setErrorDetalle(
          "Este cliente no tiene un número de teléfono registrado para enviar el recordatorio por WhatsApp."
        );

        return;
      }

      setErrorDetalle("");

      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );
    };

  const enviarConfirmacionWhatsApp =
    () => {
      if (!citaSeleccionada) {
        return;
      }

      const url =
        construirUrlWhatsApp(
          "confirmacion",
          citaSeleccionada
        );

      if (!url) {
        setErrorDetalle(
          "Este cliente no tiene un número de teléfono registrado para enviar la confirmación por WhatsApp."
        );

        return;
      }

      setErrorDetalle("");

      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );
    };

  // ============================================================
  // NAVEGACIÓN FECHAS / SEMANAS
  // ============================================================

  const cambiarPeriodo =
    (cantidad) => {
      const fecha =
        crearFechaLocal(
          fechaSeleccionada
        );

      const salto =
        modoAgenda === "semana"
          ? cantidad * 7
          : cantidad;

      fecha.setDate(
        fecha.getDate() +
        salto
      );

      setFechaSeleccionada(
        convertirFechaInput(
          fecha
        )
      );
    };

  const irHoy = () => {
    setFechaSeleccionada(
      obtenerFechaHoy()
    );
  };

  // ============================================================
  // RANGO Y TÍTULO
  // ============================================================

  const rangoSemana =
    useMemo(() => {
      return obtenerRangoSemana(
        fechaSeleccionada
      );
    }, [fechaSeleccionada]);

  const diasSemana =
    useMemo(() => {
      return obtenerDiasSemana(
        fechaSeleccionada
      );
    }, [fechaSeleccionada]);

  const tituloPeriodo =
    useMemo(() => {
      if (
        modoAgenda === "semana"
      ) {
        const inicio =
          crearFechaLocal(
            rangoSemana.inicio
          );

        const fin =
          crearFechaLocal(
            rangoSemana.fin
          );

        const mismoMes =
          inicio.getMonth() ===
            fin.getMonth() &&
          inicio.getFullYear() ===
            fin.getFullYear();

        const mismoAnio =
          inicio.getFullYear() ===
          fin.getFullYear();

        if (mismoMes) {
          return `${inicio.getDate()} - ${fin.getDate()} de ${
            new Intl.DateTimeFormat(
              "es-CR",
              {
                month: "long"
              }
            ).format(inicio)
          } de ${inicio.getFullYear()}`;
        }

        if (mismoAnio) {
          return `${
            new Intl.DateTimeFormat(
              "es-CR",
              {
                day: "numeric",
                month: "short"
              }
            ).format(inicio)
          } - ${
            new Intl.DateTimeFormat(
              "es-CR",
              {
                day: "numeric",
                month: "short"
              }
            ).format(fin)
          } de ${inicio.getFullYear()}`;
        }

        return `${
          new Intl.DateTimeFormat(
            "es-CR",
            {
              day: "numeric",
              month: "short",
              year: "numeric"
            }
          ).format(inicio)
        } - ${
          new Intl.DateTimeFormat(
            "es-CR",
            {
              day: "numeric",
              month: "short",
              year: "numeric"
            }
          ).format(fin)
        }`;
      }

      const fecha =
        crearFechaLocal(
          fechaSeleccionada
        );

      return new Intl.DateTimeFormat(
        "es-CR",
        {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        }
      ).format(fecha);
    }, [
      fechaSeleccionada,
      modoAgenda,
      rangoSemana
    ]);

  // ============================================================
  // HORAS DISPONIBLES
  // ============================================================

  const obtenerHoraDisponible =
    (slot) => {
      if (
        typeof slot === "string"
      ) {
        if (
          slot.includes("T")
        ) {
          return slot.substring(
            11,
            16
          );
        }

        return slot.substring(
          0,
          5
        );
      }

      if (
        slot.horaInicio
      ) {
        return slot.horaInicio
          .substring(0, 5);
      }

      if (
        slot.fechaInicioLocal
      ) {
        return slot
          .fechaInicioLocal
          .substring(11, 16);
      }

      if (
        slot.inicioLocal
      ) {
        return slot
          .inicioLocal
          .substring(11, 16);
      }

      if (
        slot.fechaInicio
      ) {
        return slot
          .fechaInicio
          .substring(11, 16);
      }

      return "";
    };

  const obtenerHoraFinDisponible =
    (slot) => {
      if (
        typeof slot === "string"
      ) {
        return "";
      }

      if (
        slot.horaFin
      ) {
        return slot.horaFin
          .substring(0, 5);
      }

      if (
        slot.fechaFinLocal
      ) {
        return slot
          .fechaFinLocal
          .substring(11, 16);
      }

      if (
        slot.finLocal
      ) {
        return slot
          .finLocal
          .substring(11, 16);
      }

      if (
        slot.fechaFin
      ) {
        return slot
          .fechaFin
          .substring(11, 16);
      }

      return "";
    };

  // ============================================================
  // INFORMACIÓN DE CITAS
  // ============================================================

  const obtenerNombreCliente =
    (cita) => {
      if (
        cita.cliente?.nombre
      ) {
        return `${cita.cliente.nombre} ${
          cita.cliente.apellidos ||
          ""
        }`;
      }

      if (
        cita.clienteNombre
      ) {
        return cita.clienteNombre;
      }

      return "Cliente";
    };

  const obtenerNombreProfesional =
    (cita) => {
      if (
        cita.profesional?.nombre
      ) {
        return `${cita.profesional.nombre} ${
          cita.profesional.apellidos ||
          ""
        }`;
      }

      if (
        cita.profesionalNombre
      ) {
        return cita.profesionalNombre;
      }

      return "Profesional";
    };

  const obtenerNombreServicio =
    (cita) => {
      const nombreServicio =
        cita.servicio?.nombre ||
        cita.servicioNombre ||
        "Servicio";

      const nombreVariante =
        cita.servicioVariante?.nombre ||
        cita.variante?.nombre ||
        cita.servicioVarianteNombre ||
        "";

      return nombreVariante
        ? `${nombreServicio} · ${nombreVariante}`
        : nombreServicio;
    };

  const obtenerClaseEstado =
    (estado) => {
      switch (estado) {
        case "Confirmada":
          return "appointment-status confirmed";

        case "Completada":
          return "appointment-status completed";

        case "Cancelada":
          return "appointment-status cancelled";

        case "NoAsistio":
          return "appointment-status absent";

        case "EnProceso":
          return "appointment-status in-progress";

        default:
          return "appointment-status pending";
      }
    };

  // ============================================================
  // AGENDA VISUAL
  // ============================================================

  const profesionalesAgenda =
    useMemo(() => {
      return profesionales
        .filter(
          (profesional) =>
            profesional.activo !== false
        )
        .filter(
          (profesional) =>
            profesionalFiltro === "todos" ||
            profesional.id ===
              Number(
                profesionalFiltro
              )
        )
        .sort((a, b) =>
          `${a.nombre || ""} ${a.apellidos || ""}`.localeCompare(
            `${b.nombre || ""} ${b.apellidos || ""}`,
            "es"
          )
        );
    }, [
      profesionales,
      profesionalFiltro
    ]);

  const configuracionAgenda =
    useMemo(() => {
      const horaInicioBase = 7;
      const horaFinBase = 20;

      let minutoInicio =
        horaInicioBase * 60;

      let minutoFin =
        horaFinBase * 60;

      citas.forEach((cita) => {
        const inicio =
          obtenerMinutosCita(
            cita,
            zonaHoraria
          );

        if (inicio === null) {
          return;
        }

        const duracion =
          obtenerDuracionCita(cita);

        minutoInicio =
          Math.min(
            minutoInicio,
            Math.floor(inicio / 60) * 60
          );

        minutoFin =
          Math.max(
            minutoFin,
            Math.ceil(
              (inicio + duracion) / 60
            ) * 60
          );
      });

      const horas = [];

      for (
        let minuto = minutoInicio;
        minuto <= minutoFin;
        minuto += 60
      ) {
        horas.push(minuto);
      }

      return {
        minutoInicio,
        minutoFin,
        horas,
        pixelesPorMinuto: 1.15
      };
    }, [
      citas,
      zonaHoraria
    ]);

  const citasPorProfesional =
    useMemo(() => {
      const mapa = new Map();

      profesionalesAgenda.forEach(
        (profesional) => {
          mapa.set(
            profesional.id,
            []
          );
        }
      );

      citas.forEach((cita) => {
        const profesionalId =
          cita.profesional?.id ||
          cita.profesionalId;

        if (!profesionalId) {
          return;
        }

        if (!mapa.has(profesionalId)) {
          mapa.set(
            profesionalId,
            []
          );
        }

        mapa.get(profesionalId).push(cita);
      });

      return mapa;
    }, [
      citas,
      profesionalesAgenda
    ]);

  const citasSemanaPorDia =
    useMemo(() => {
      const mapa =
        new Map();

      diasSemana.forEach(
        (dia) => {
          mapa.set(
            dia.fecha,
            []
          );
        }
      );

      citas.forEach(
        (cita) => {
          const profesionalId =
            cita.profesional?.id ||
            cita.profesionalId;

          if (
            profesionalFiltro !== "todos" &&
            Number(
              profesionalId
            ) !==
              Number(
                profesionalFiltro
              )
          ) {
            return;
          }

          const fechaLocal =
            obtenerFechaLocalCita(
              cita,
              zonaHoraria
            );

          if (
            !fechaLocal ||
            !mapa.has(
              fechaLocal
            )
          ) {
            return;
          }

          mapa.get(
            fechaLocal
          ).push(
            cita
          );
        }
      );

      mapa.forEach(
        (citasDia) => {
          citasDia.sort(
            (a, b) => {
              const minutosA =
                obtenerMinutosCita(
                  a,
                  zonaHoraria
                ) ?? 0;

              const minutosB =
                obtenerMinutosCita(
                  b,
                  zonaHoraria
                ) ?? 0;

              return (
                minutosA -
                minutosB
              );
            }
          );
        }
      );

      return mapa;
    }, [
      citas,
      diasSemana,
      profesionalFiltro,
      zonaHoraria
    ]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="agenda-page">

      {/* HEADER */}

      <div className="page-header">

        <div>

          <h1 className="page-title">
            Agenda
          </h1>

          <p className="text-muted mb-0">
            Administra las citas del negocio.
          </p>

        </div>

        <div className="agenda-header-actions">

          <div className="agenda-view-toggle">

            <button
              type="button"
              className={
                modoAgenda === "semana"
                  ? "agenda-view-button active"
                  : "agenda-view-button"
              }
              onClick={() =>
                setModoAgenda("semana")
              }
              title="Vista semanal"
            >
              <FaCalendarAlt />
              <span>Semana</span>
            </button>

            <button
              type="button"
              className={
                modoAgenda === "dia"
                  ? "agenda-view-button active"
                  : "agenda-view-button"
              }
              onClick={() =>
                setModoAgenda("dia")
              }
              title="Vista diaria"
            >
              <FaThLarge />
              <span>Día</span>
            </button>

          </div>

          {modoAgenda === "dia" && (

            <div className="agenda-view-toggle">

              <button
                type="button"
                className={
                  vistaAgenda === "visual"
                    ? "agenda-view-button active"
                    : "agenda-view-button"
                }
                onClick={() =>
                  setVistaAgenda("visual")
                }
                title="Vista visual"
              >
                <FaThLarge />
                <span>Visual</span>
              </button>

              <button
                type="button"
                className={
                  vistaAgenda === "lista"
                    ? "agenda-view-button active"
                    : "agenda-view-button"
                }
                onClick={() =>
                  setVistaAgenda("lista")
                }
                title="Vista de lista"
              >
                <FaList />
                <span>Lista</span>
              </button>

            </div>

          )}

          <button
            className="btn btn-primary"
            onClick={
              abrirNuevaCita
            }
          >
            <FaPlus className="me-2" />

            Nueva cita
          </button>

        </div>

      </div>

      {/* ERROR GENERAL */}

      {error && (

        <div className="alert alert-danger mt-4">
          {error}
        </div>

      )}

      {mensajeAgenda && (

        <div className="alert alert-success mt-4">
          {mensajeAgenda}
        </div>

      )}

      {/* SELECTOR DE FECHA */}

      <div className="agenda-toolbar mt-4">

        <div className="agenda-date-navigation">

          <button
            type="button"
            className="agenda-navigation-button"
            onClick={() =>
              cambiarPeriodo(-1)
            }
          >
            <FaChevronLeft />
          </button>

          <button
            type="button"
            className="btn btn-light"
            onClick={
              irHoy
            }
          >
            Hoy
          </button>

          <button
            type="button"
            className="agenda-navigation-button"
            onClick={() =>
              cambiarPeriodo(1)
            }
          >
            <FaChevronRight />
          </button>

        </div>

        <div className="agenda-current-date">

          <FaCalendarAlt />

          <strong>
            {capitalizar(
              tituloPeriodo
            )}
          </strong>

        </div>

        <select
          className="form-select agenda-professional-filter"
          value={profesionalFiltro}
          onChange={(e) =>
            setProfesionalFiltro(
              e.target.value
            )
          }
          aria-label="Filtrar por profesional"
        >
          <option value="todos">
            Todos los profesionales
          </option>

          {profesionales
            .filter(
              (profesional) =>
                profesional.activo !== false
            )
            .sort((a, b) =>
              `${a.nombre || ""} ${a.apellidos || ""}`.localeCompare(
                `${b.nombre || ""} ${b.apellidos || ""}`,
                "es"
              )
            )
            .map(
              (profesional) => (
                <option
                  key={profesional.id}
                  value={profesional.id}
                >
                  {profesional.nombre}{" "}
                  {profesional.apellidos}
                </option>
              )
            )}
        </select>

        <input
          type="date"
          className="form-control agenda-date-input"
          value={
            fechaSeleccionada
          }
          onChange={(e) =>
            setFechaSeleccionada(
              e.target.value
            )
          }
        />

      </div>

      {/* CITAS */}

      <div
        className={
          modoAgenda === "semana"
            ? "agenda-content agenda-content-week"
            : vistaAgenda === "visual"
              ? "agenda-content agenda-content-visual"
              : "agenda-content"
        }
      >

        {cargando ? (

          <div className="agenda-empty">
            Cargando agenda...
          </div>

        ) : modoAgenda === "semana" ? (

          <div className="week-agenda-wrapper">

            <div className="week-agenda">

              {diasSemana.map(
                (dia) => {

                  const citasDia =
                    citasSemanaPorDia.get(
                      dia.fecha
                    ) || [];

                  const esHoy =
                    dia.fecha ===
                    obtenerFechaHoy();

                  return (

                    <section
                      key={dia.fecha}
                      className={
                        esHoy
                          ? "week-day-column today"
                          : "week-day-column"
                      }
                    >

                      <div className="week-day-header">

                        <button
                          type="button"
                          className="week-day-title"
                          onClick={() => {
                            setFechaSeleccionada(
                              dia.fecha
                            );
                            setModoAgenda(
                              "dia"
                            );
                          }}
                          title="Abrir este día"
                        >
                          <span>
                            {dia.nombreCorto}
                          </span>

                          <strong>
                            {dia.numeroDia}
                          </strong>
                        </button>

                        <span className="week-day-count">
                          {citasDia.length}
                        </span>

                      </div>

                      <div className="week-day-body">

                        <button
                          type="button"
                          className="week-add-appointment"
                          onClick={() =>
                            abrirNuevaCitaParaFecha(
                              dia.fecha
                            )
                          }
                        >
                          <FaPlus />
                          <span>Nueva cita</span>
                        </button>

                        {citasDia.length === 0 ? (

                          <div className="week-day-empty">
                            Sin citas
                          </div>

                        ) : (

                          citasDia.map(
                            (cita) => (

                              <button
                                key={cita.id}
                                type="button"
                                className={
                                  `week-appointment ${obtenerClaseEstadoVisual(
                                    cita.estado
                                  )}`
                                }
                                onClick={() =>
                                  abrirDetalleCita(
                                    cita
                                  )
                                }
                              >

                                <div className="week-appointment-top">

                                  <strong>
                                    {obtenerHoraCita(
                                      cita,
                                      zonaHoraria
                                    )}
                                  </strong>

                                  <span>
                                    {formatearEstado(
                                      cita.estado
                                    )}
                                  </span>

                                </div>

                                <div className="week-appointment-service">
                                  {obtenerNombreServicio(
                                    cita
                                  )}
                                </div>

                                <div className="week-appointment-client">
                                  <FaUser />
                                  <span>
                                    {obtenerNombreCliente(
                                      cita
                                    )}
                                  </span>
                                </div>

                                <div className="week-appointment-professional">
                                  <FaUserTie />
                                  <span>
                                    {obtenerNombreProfesional(
                                      cita
                                    )}
                                  </span>
                                </div>

                              </button>

                            )
                          )

                        )}

                      </div>

                    </section>

                  );
                }
              )}

            </div>

          </div>

        ) : vistaAgenda === "visual" ? (

          profesionalesAgenda.length === 0 ? (

            <div className="agenda-empty">

              <FaUserTie
                size={36}
              />

              <h5>
                No hay profesionales activos
              </h5>

              <p>
                Agrega profesionales para comenzar
                a utilizar la agenda visual.
              </p>

            </div>

          ) : (

            <div className="visual-agenda-wrapper">

              <div
                className="visual-agenda"
                style={{
                  "--agenda-body-height":
                    `${
                      (
                        configuracionAgenda.minutoFin -
                        configuracionAgenda.minutoInicio
                      ) *
                      configuracionAgenda.pixelesPorMinuto
                    }px`
                }}
              >

                <div className="visual-agenda-header">

                  <div className="visual-agenda-time-header">
                    Hora
                  </div>

                  {profesionalesAgenda.map(
                    (profesional) => (

                      <div
                        key={profesional.id}
                        className="visual-agenda-professional-header"
                      >

                        <div className="visual-agenda-professional-avatar">
                          {(profesional.nombre || "P")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {profesional.nombre}{" "}
                            {profesional.apellidos}
                          </strong>

                          {profesional.especialidad && (
                            <span>
                              {profesional.especialidad}
                            </span>
                          )}
                        </div>

                      </div>

                    )
                  )}

                </div>

                <div className="visual-agenda-body">

                  <div
                    className="visual-agenda-time-column"
                    style={{
                      height:
                        `${
                          (
                            configuracionAgenda.minutoFin -
                            configuracionAgenda.minutoInicio
                          ) *
                          configuracionAgenda.pixelesPorMinuto
                        }px`
                    }}
                  >

                    {configuracionAgenda.horas.map(
                      (minuto) => {

                        const top =
                          (
                            minuto -
                            configuracionAgenda.minutoInicio
                          ) *
                          configuracionAgenda.pixelesPorMinuto;

                        return (

                          <div
                            key={minuto}
                            className="visual-agenda-time-label"
                            style={{
                              top: `${top}px`
                            }}
                          >
                            {formatearMinutosHora(minuto)}
                          </div>

                        );
                      }
                    )}

                  </div>

                  {profesionalesAgenda.map(
                    (profesional) => (

                      <div
                        key={profesional.id}
                        className={
                          profesionalSobre ===
                            profesional.id
                            ? "visual-agenda-professional-column drag-over"
                            : "visual-agenda-professional-column"
                        }
                        style={{
                          height:
                            `${
                              (
                                configuracionAgenda.minutoFin -
                                configuracionAgenda.minutoInicio
                              ) *
                              configuracionAgenda.pixelesPorMinuto
                            }px`
                        }}
                        onClick={(evento) =>
                          manejarClickEspacioAgenda(
                            evento,
                            profesional
                          )
                        }
                        onDragOver={(evento) =>
                          permitirDropCita(
                            evento,
                            profesional
                          )
                        }
                        onDragLeave={
                          salirZonaDrop
                        }
                        onDrop={(evento) =>
                          soltarCita(
                            evento,
                            profesional
                          )
                        }
                        title={
                          citaArrastrada
                            ? "Suelta aquí para reprogramar"
                            : "Haz clic en un espacio para crear una cita"
                        }
                      >

                        {configuracionAgenda.horas.map(
                          (minuto) => {

                            const top =
                              (
                                minuto -
                                configuracionAgenda.minutoInicio
                              ) *
                              configuracionAgenda.pixelesPorMinuto;

                            return (

                              <div
                                key={minuto}
                                className="visual-agenda-hour-line"
                                style={{
                                  top: `${top}px`
                                }}
                              />

                            );
                          }
                        )}

                        {(citasPorProfesional.get(
                          profesional.id
                        ) || []).map(
                          (cita) => {

                            const minutoInicio =
                              obtenerMinutosCita(
                                cita,
                                zonaHoraria
                              );

                            if (
                              minutoInicio === null
                            ) {
                              return null;
                            }

                            const duracion =
                              obtenerDuracionCita(
                                cita
                              );

                            const top =
                              (
                                minutoInicio -
                                configuracionAgenda.minutoInicio
                              ) *
                              configuracionAgenda.pixelesPorMinuto;

                            const alto =
                              Math.max(
                                duracion *
                                  configuracionAgenda.pixelesPorMinuto,
                                42
                              );

                            return (

                              <button
                                key={cita.id}
                                type="button"
                                draggable={
                                  cita.estado !== "Cancelada" &&
                                  cita.estado !== "Completada" &&
                                  !reprogramandoCita
                                }
                                className={
                                  `visual-appointment ${obtenerClaseEstadoVisual(
                                    cita.estado
                                  )}${
                                    citaArrastrada?.id ===
                                    cita.id
                                      ? " dragging"
                                      : ""
                                  }`
                                }
                                style={{
                                  top: `${top}px`,
                                  height: `${alto}px`
                                }}
                                onDragStart={(evento) =>
                                  iniciarArrastreCita(
                                    evento,
                                    cita
                                  )
                                }
                                onDragEnd={
                                  finalizarArrastreCita
                                }
                                onClick={(evento) => {
                                  evento.stopPropagation();

                                  if (
                                    Date.now() <
                                    ignorarClickHastaRef.current
                                  ) {
                                    return;
                                  }

                                  abrirDetalleCita(cita);
                                }}
                                title={
                                  cita.estado === "Cancelada" ||
                                  cita.estado === "Completada"
                                    ? "Esta cita no se puede reprogramar arrastrando"
                                    : "Arrastra para reprogramar"
                                }
                              >

                                <div className="visual-appointment-time">
                                  {obtenerHoraCita(
                                    cita,
                                    zonaHoraria
                                  )}
                                </div>

                                <strong>
                                  {obtenerNombreServicio(
                                    cita
                                  )}
                                </strong>

                                <span>
                                  {obtenerNombreCliente(
                                    cita
                                  )}
                                </span>

                                <small>
                                  {formatearEstado(
                                    cita.estado
                                  )}
                                </small>

                              </button>

                            );
                          }
                        )}

                      </div>

                    )
                  )}

                </div>

              </div>

            </div>

          )

        ) : citas.length === 0 ? (

          <div className="agenda-empty">

            <FaCalendarAlt
              size={36}
            />

            <h5>
              No hay citas para este día
            </h5>

            <p>
              Puedes crear una nueva cita
              usando el botón superior.
            </p>

            <button
              className="btn btn-primary"
              onClick={
                abrirNuevaCita
              }
            >
              <FaPlus className="me-2" />

              Nueva cita
            </button>

          </div>

        ) : (

          <div className="appointment-list">

            {citas.map(
              (cita) => (

                <div
                  className="appointment-card"
                  key={cita.id}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    abrirDetalleCita(cita)
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" ||
                      e.key === " "
                    ) {
                      e.preventDefault();
                      abrirDetalleCita(cita);
                    }
                  }}
                  style={{
                    cursor: "pointer"
                  }}
                >

                  <div className="appointment-time">

                    <FaClock />

                    <strong>
                      {obtenerHoraCita(
                        cita,
                        zonaHoraria
                      )}
                    </strong>

                  </div>

                  <div className="appointment-main">

                    <div className="appointment-title">

                      {obtenerNombreServicio(
                        cita
                      )}

                    </div>

                    <div className="appointment-details">

                      <span>
                        <FaUser />

                        {obtenerNombreCliente(
                          cita
                        )}
                      </span>

                      <span>
                        <FaUserTie />

                        {obtenerNombreProfesional(
                          cita
                        )}
                      </span>

                    </div>

                    {cita.notas && (

                      <div className="appointment-notes">
                        {cita.notas}
                      </div>

                    )}

                  </div>

                  <div className="appointment-side">

                    <span
                      className={
                        obtenerClaseEstado(
                          cita.estado
                        )
                      }
                    >
                      {formatearEstado(
                        cita.estado
                      )}
                    </span>

                    <strong className="appointment-price">

                      {formatearMoneda(
                        cita.precio
                      )}

                    </strong>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* ============================================================
          MODAL NUEVA CITA
          ============================================================ */}

      {mostrarNuevaCita && (

        <div className="custom-modal-backdrop">

          <div className="custom-modal custom-modal-large">

            <div className="custom-modal-header">

              <div>

                <h4>
                  Nueva cita
                </h4>

                <p className="text-muted mb-0">
                  Selecciona cliente,
                  servicio, profesional
                  y horario.
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  cerrarNuevaCita
                }
              >
                <FaTimes />
              </button>

            </div>

            <form
              onSubmit={
                guardarCita
              }
            >

              <div className="custom-modal-body">

                {errorModal && (

                  <div className="alert alert-danger mb-4">

                    {errorModal}

                  </div>

                )}

                <div className="row g-3">

                  <div className="col-md-6">

                    <label className="form-label">
                      Cliente *
                    </label>

                    <select
                      name="clienteId"
                      className="form-select"
                      value={
                        formulario.clienteId
                      }
                      onChange={
                        cambiarCampo
                      }
                      required
                    >

                      <option value="">
                        Seleccionar cliente
                      </option>

                      {clientes.map(
                        (cliente) => (

                          <option
                            key={cliente.id}
                            value={cliente.id}
                          >
                            {cliente.nombre}{" "}
                            {cliente.apellidos}

                            {cliente.telefono
                              ? ` - ${cliente.telefono}`
                              : ""}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                  <div className="col-md-6">

                    <label className="form-label">
                      Sucursal *
                    </label>

                    <select
                      name="sucursalId"
                      className="form-select"
                      value={
                        formulario.sucursalId
                      }
                      onChange={
                        cambiarCampo
                      }
                      required
                    >

                      <option value="">
                        Seleccionar sucursal
                      </option>

                      {sucursales.map(
                        (sucursal) => (

                          <option
                            key={sucursal.id}
                            value={sucursal.id}
                          >
                            {sucursal.nombre}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                  <div className="col-md-6">

                    <label className="form-label">
                      Servicio *
                    </label>

                    <select
                      name="servicioId"
                      className="form-select"
                      value={
                        formulario.servicioId
                      }
                      onChange={
                        cambiarCampo
                      }
                      required
                    >

                      <option value="">
                        Seleccionar servicio
                      </option>

                      {servicios
                        .filter(
                          (servicio) =>
                            servicio.activo !==
                            false
                        )
                        .map(
                          (servicio) => (

                            <option
                              key={
                                servicio.id
                              }
                              value={
                                servicio.id
                              }
                            >
                              {servicio.nombre}
                              {
                                (servicio.variantes || [])
                                  .some(
                                    (variante) =>
                                      variante.activo !== false
                                  )
                                  ? " — Desde "
                                  : " — "
                              }
                              {formatearMoneda(
                                obtenerPrecioDesdeServicio(
                                  servicio
                                )
                              )}
                            </option>

                          )
                        )}

                    </select>

                  </div>

                  {servicioTieneVariantes && (

                    <div className="col-md-6">

                      <label className="form-label">
                        Variante *
                      </label>

                      <select
                        name="servicioVarianteId"
                        className="form-select"
                        value={
                          formulario.servicioVarianteId
                        }
                        onChange={
                          cambiarCampo
                        }
                        required
                      >
                        <option value="">
                          Selecciona una variante
                        </option>

                        {variantesServicioSeleccionado.map(
                          (variante) => (

                            <option
                              key={variante.id}
                              value={variante.id}
                            >
                              {variante.nombre} —{" "}
                              {formatearMoneda(
                                variante.precio
                              )}
                            </option>

                          )
                        )}

                      </select>

                      {varianteSeleccionada && (

                        <div className="form-text">
                          Precio:{" "}
                          <strong>
                            {formatearMoneda(
                              varianteSeleccionada.precio
                            )}
                          </strong>
                        </div>

                      )}

                    </div>

                  )}

                  <div className="col-md-6">

                    <label className="form-label">
                      Profesional *
                    </label>

                    <select
                      name="profesionalId"
                      className="form-select"
                      value={
                        formulario.profesionalId
                      }
                      onChange={
                        cambiarCampo
                      }
                      required
                      disabled={
                        !formulario.servicioId
                      }
                    >

                      <option value="">
                        Seleccionar profesional
                      </option>

                      {profesionalesDisponibles.map(
                        (profesional) => (

                          <option
                            key={
                              profesional.id
                            }
                            value={
                              profesional.id
                            }
                          >
                            {profesional.nombre}{" "}
                            {profesional.apellidos}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                  <div className="col-md-6">

                    <label className="form-label">
                      Fecha *
                    </label>

                    <input
                      type="date"
                      name="fecha"
                      className="form-control"
                      value={
                        formulario.fecha
                      }
                      onChange={
                        cambiarCampo
                      }
                      required
                    />

                  </div>

                  <div className="col-md-6">

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
                            {[0, 15, 30, 45].map((minuto) => (
                              <option
                                key={minuto}
                                value={minuto}
                              >
                                {minuto.toString().padStart(2, "0")}
                              </option>
                            ))}
                          </select>
                          <span className="input-group-text">
                            min
                          </span>
                        </div>
                      </div>

                    </div>

                    <div className="form-text">
                      Duración seleccionada: {formatearDuracionMinutos(duracionTotalMinutos)}
                    </div>

                  </div>

                  <div className="col-md-6 d-flex align-items-end">

                    <button
                      type="button"
                      className="btn btn-outline-primary w-100"
                      onClick={
                        consultarDisponibilidad
                      }
                      disabled={
                        consultandoDisponibilidad ||
                        !formulario.servicioId ||
                        !formulario.profesionalId ||
                        !formulario.fecha ||
                        duracionTotalMinutos <= 0
                      }
                    >

                      <FaClock className="me-2" />

                      {consultandoDisponibilidad
                        ? "Consultando..."
                        : "Ver horas disponibles"}

                    </button>

                  </div>

                  {servicioSeleccionado && (

                    <div className="col-12">

                      <div className="appointment-service-summary">

                        <div>

                          <span>
                            Servicio
                          </span>

                          <strong>
                            {servicioSeleccionado.nombre}
                          </strong>

                        </div>

                        <div>

                          <span>
                            Duración estimada
                          </span>

                          <strong>
                            {formatearDuracionMinutos(duracionTotalMinutos)}
                          </strong>

                        </div>

                        <div>

                          <span>
                            Precio
                          </span>

                          <strong>
                            {formatearMoneda(
                              varianteSeleccionada
                                ? varianteSeleccionada.precio
                                : servicioSeleccionado.precio
                            )}
                          </strong>

                        </div>

                      </div>

                    </div>

                  )}

                  <div className="col-12">

                    <label className="form-label">
                      Hora disponible *
                    </label>

                    {consultandoDisponibilidad ? (

                      <div className="availability-loading">

                        <div
                          className="spinner-border spinner-border-sm"
                          role="status"
                        />

                        Consultando disponibilidad...

                      </div>

                    ) : horariosDisponibles.length === 0 ? (

                      <div className="availability-empty">

                        <FaClock />

                        <span>
                          Selecciona servicio,
                          profesional y fecha,
                          luego presiona
                          "Ver horas disponibles".
                        </span>

                      </div>

                    ) : (

                      <div className="availability-grid">

                        {horariosDisponibles.map(
                          (slot, index) => {

                            const horaInicio =
                              obtenerHoraDisponible(
                                slot
                              );

                            const horaFin =
                              obtenerHoraFinDisponible(
                                slot
                              );

                            const seleccionado =
                              formulario.horaInicio ===
                              horaInicio;

                            if (!horaInicio) {
                              return null;
                            }

                            return (

                              <button
                                key={
                                  `${horaInicio}-${index}`
                                }
                                type="button"
                                className={
                                  seleccionado
                                    ? "availability-slot selected"
                                    : "availability-slot"
                                }
                                onClick={() => {

                                  setFormulario(
                                    (anterior) => ({
                                      ...anterior,

                                      horaInicio
                                    })
                                  );

                                  setErrorModal("");

                                }}
                              >

                                <strong>
                                  {horaInicio}
                                </strong>

                                {horaFin && (

                                  <span>
                                    hasta {horaFin}
                                  </span>

                                )}

                              </button>

                            );
                          }
                        )}

                      </div>

                    )}

                  </div>

                  <div className="col-12">

                    <label className="form-label">
                      Notas
                    </label>

                    <textarea
                      name="notas"
                      className="form-control"
                      rows="3"
                      value={
                        formulario.notas
                      }
                      onChange={
                        cambiarCampo
                      }
                      placeholder="Observaciones de la cita..."
                    />

                  </div>

                </div>

              </div>

              <div className="custom-modal-footer">

                <button
                  type="button"
                  className="btn btn-light"
                  onClick={
                    cerrarNuevaCita
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    guardando ||
                    !formulario.horaInicio
                  }
                >
                  {guardando
                    ? "Guardando..."
                    : "Crear cita"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ============================================================
          MODAL DETALLE DE CITA
          ============================================================ */}

      {mostrarDetalleCita && citaSeleccionada && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal custom-modal-large">
            <div className="custom-modal-header">
              <div>
                <h4>Detalle de la cita</h4>
                <p className="text-muted mb-0">
                  Consulta la información y actualiza el estado.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={cerrarDetalleCita}
                disabled={actualizandoEstado}
              >
                <FaTimes />
              </button>
            </div>

            <div className="custom-modal-body">
              {errorDetalle && (
                <div className="alert alert-danger mb-4">
                  {errorDetalle}
                </div>
              )}

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="p-3 border rounded-3 h-100">
                    <small className="text-muted d-block mb-1">
                      Cliente
                    </small>

                    <strong>
                      {obtenerNombreCliente(citaSeleccionada)}
                    </strong>

                    {citaSeleccionada.cliente?.telefono && (
                      <div className="text-muted small mt-1">
                        {citaSeleccionada.cliente.telefono}
                      </div>
                    )}

                    {citaSeleccionada.cliente?.email && (
                      <div className="text-muted small">
                        {citaSeleccionada.cliente.email}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 border rounded-3 h-100">
                    <small className="text-muted d-block mb-1">
                      Servicio
                    </small>

                    <strong>
                      {obtenerNombreServicio(citaSeleccionada)}
                    </strong>

                    {citaSeleccionada.duracionMinutos > 0 && (
                      <div className="text-muted small mt-1">
                        Duración:{" "}
                        {formatearDuracionMinutos(
                          citaSeleccionada.duracionMinutos
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 border rounded-3 h-100">
                    <small className="text-muted d-block mb-1">
                      Profesional
                    </small>

                    <strong>
                      {obtenerNombreProfesional(citaSeleccionada)}
                    </strong>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 border rounded-3 h-100">
                    <small className="text-muted d-block mb-1">
                      Sucursal
                    </small>

                    <strong>
                      {citaSeleccionada.sucursal?.nombre || "Sucursal"}
                    </strong>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 border rounded-3 h-100">
                    <small className="text-muted d-block mb-1">
                      Hora
                    </small>

                    <strong>
                      {obtenerHoraCita(
                        citaSeleccionada,
                        zonaHoraria
                      )}
                    </strong>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 border rounded-3 h-100">
                    <small className="text-muted d-block mb-1">
                      Precio
                    </small>

                    <strong>
                      {formatearMoneda(
                        citaSeleccionada.precio
                      )}
                    </strong>
                  </div>
                </div>

                <div className="col-12">
                  <div className="p-3 border rounded-3">
                    <small className="text-muted d-block mb-2">
                      Estado actual
                    </small>

                    <span
                      className={
                        obtenerClaseEstado(
                          citaSeleccionada.estado
                        )
                      }
                    >
                      {formatearEstado(
                        citaSeleccionada.estado
                      )}
                    </span>
                  </div>
                </div>

                <div className="col-12">
                  <div className="p-3 border rounded-3">
                    <small className="text-muted d-block mb-1">
                      Notas
                    </small>

                    <div>
                      {citaSeleccionada.notas || "Sin notas."}
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Cambiar estado
                  </label>

                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={
                        actualizandoEstado ||
                        citaSeleccionada.estado === "Pendiente"
                      }
                      onClick={() =>
                        cambiarEstadoCita(
                          "Pendiente"
                        )
                      }
                    >
                      Pendiente
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      disabled={
                        actualizandoEstado ||
                        citaSeleccionada.estado === "Confirmada"
                      }
                      onClick={() =>
                        cambiarEstadoCita(
                          "Confirmada"
                        )
                      }
                    >
                      Confirmar
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-success"
                      disabled={
                        actualizandoEstado ||
                        citaSeleccionada.estado === "Cancelada" ||
                        citaSeleccionada.estado === "Completada" ||
                        citaSeleccionada.estado === "NoAsistio"
                      }
                      onClick={
                        enviarConfirmacionWhatsApp
                      }
                    >
                      <FaWhatsapp className="me-2" />
                      Enviar confirmación
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-warning"
                      disabled={
                        actualizandoEstado ||
                        citaSeleccionada.estado === "Cancelada" ||
                        citaSeleccionada.estado === "Completada" ||
                        citaSeleccionada.estado === "NoAsistio"
                      }
                      onClick={
                        enviarRecordatorioWhatsApp
                      }
                    >
                      <FaBell className="me-2" />
                      Recordatorio
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-success"
                      disabled={
                        actualizandoEstado ||
                        citaSeleccionada.estado === "Completada"
                      }
                      onClick={() =>
                        cambiarEstadoCita(
                          "Completada"
                        )
                      }
                    >
                      Completada
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-dark"
                      disabled={
                        actualizandoEstado ||
                        citaSeleccionada.estado === "NoAsistio"
                      }
                      onClick={() =>
                        cambiarEstadoCita(
                          "NoAsistio"
                        )
                      }
                    >
                      No asistió
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      disabled={
                        actualizandoEstado ||
                        citaSeleccionada.estado === "Cancelada"
                      }
                      onClick={() =>
                        cambiarEstadoCita(
                          "Cancelada"
                        )
                      }
                    >
                      Cancelar cita
                    </button>
                  </div>

                  <div className="text-muted small mt-3">
                    <FaWhatsapp className="me-1" />
                    Confirmar solo cambia el estado de la cita.
                    Enviar confirmación y Recordatorio abren WhatsApp
                    con el mensaje listo para enviar y no modifican el
                    estado.
                  </div>
                </div>
              </div>
            </div>

            <div className="custom-modal-footer">
              <button
                type="button"
                className="btn btn-light"
                onClick={cerrarDetalleCita}
                disabled={actualizandoEstado}
              >
                Cerrar
              </button>

              {actualizandoEstado && (
                <div className="d-flex align-items-center gap-2 text-muted">
                  <div
                    className="spinner-border spinner-border-sm"
                    role="status"
                  />
                  Actualizando...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function obtenerRangoSemana(
  fechaReferencia
) {
  const fecha =
    crearFechaLocal(
      fechaReferencia
    );

  const diaSemana =
    fecha.getDay();

  const desplazamientoLunes =
    diaSemana === 0
      ? -6
      : 1 - diaSemana;

  const inicio =
    new Date(
      fecha
    );

  inicio.setDate(
    inicio.getDate() +
    desplazamientoLunes
  );

  const fin =
    new Date(
      inicio
    );

  fin.setDate(
    inicio.getDate() + 6
  );

  return {
    inicio:
      convertirFechaInput(
        inicio
      ),
    fin:
      convertirFechaInput(
        fin
      )
  };
}

function obtenerDiasSemana(
  fechaReferencia
) {
  const rango =
    obtenerRangoSemana(
      fechaReferencia
    );

  const inicio =
    crearFechaLocal(
      rango.inicio
    );

  return Array.from(
    {
      length: 7
    },
    (_, indice) => {
      const fecha =
        new Date(
          inicio
        );

      fecha.setDate(
        inicio.getDate() +
        indice
      );

      return {
        fecha:
          convertirFechaInput(
            fecha
          ),
        numeroDia:
          fecha.getDate(),
        nombreCorto:
          capitalizar(
            new Intl.DateTimeFormat(
              "es-CR",
              {
                weekday: "short"
              }
            )
              .format(
                fecha
              )
              .replace(
                ".",
                ""
              )
          )
      };
    }
  );
}

function obtenerFechaLocalCita(
  cita,
  zonaHoraria
) {
  if (
    cita.fechaInicioLocal &&
    typeof cita.fechaInicioLocal === "string" &&
    cita.fechaInicioLocal.includes("T")
  ) {
    return cita.fechaInicioLocal.substring(
      0,
      10
    );
  }

  if (!cita.fechaInicio) {
    return "";
  }

  try {
    let fechaUtc =
      cita.fechaInicio;

    if (
      typeof fechaUtc === "string" &&
      !fechaUtc.endsWith("Z") &&
      !/[+-]\d{2}:\d{2}$/.test(
        fechaUtc
      )
    ) {
      fechaUtc =
        `${fechaUtc}Z`;
    }

    const fecha =
      new Date(
        fechaUtc
      );

    if (
      Number.isNaN(
        fecha.getTime()
      )
    ) {
      return "";
    }

    const partes =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone:
            zonaHoraria ||
            "America/Costa_Rica",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }
      ).formatToParts(
        fecha
      );

    const year =
      partes.find(
        (parte) =>
          parte.type === "year"
      )?.value;

    const month =
      partes.find(
        (parte) =>
          parte.type === "month"
      )?.value;

    const day =
      partes.find(
        (parte) =>
          parte.type === "day"
      )?.value;

    if (
      !year ||
      !month ||
      !day
    ) {
      return "";
    }

    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

function obtenerFechaHoy() {
  const fecha =
    new Date();

  const year =
    fecha.getFullYear();

  const month =
    String(
      fecha.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      fecha.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function crearFechaLocal(
  fechaTexto
) {
  const [
    year,
    month,
    day
  ] = fechaTexto
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0
  );
}

function convertirFechaInput(
  fecha
) {
  const year =
    fecha.getFullYear();

  const month =
    String(
      fecha.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      fecha.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function capitalizar(
  texto
) {
  if (!texto) {
    return "";
  }

  return (
    texto
      .charAt(0)
      .toUpperCase() +
    texto.slice(1)
  );
}

function normalizarFechaUtc(
  fechaUtc
) {
  if (!fechaUtc) {
    return null;
  }

  let valor =
    fechaUtc;

  if (
    typeof valor === "string" &&
    !valor.endsWith("Z") &&
    !/[+-]\d{2}:\d{2}$/.test(valor)
  ) {
    valor = `${valor}Z`;
  }

  const fecha =
    new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return null;
  }

  return fecha;
}

function obtenerMinutosCita(
  cita,
  zonaHoraria
) {
  if (
    cita.fechaInicioLocal &&
    typeof cita.fechaInicioLocal === "string" &&
    cita.fechaInicioLocal.includes("T")
  ) {
    const horaTexto =
      cita.fechaInicioLocal.substring(
        11,
        16
      );

    const [
      hora,
      minuto
    ] = horaTexto
      .split(":")
      .map(Number);

    if (
      Number.isFinite(hora) &&
      Number.isFinite(minuto)
    ) {
      return hora * 60 + minuto;
    }
  }

  const fecha =
    normalizarFechaUtc(
      cita.fechaInicioUtc ||
      cita.fechaInicio
    );

  if (!fecha) {
    return null;
  }

  try {
    const partes =
      new Intl.DateTimeFormat(
        "es-CR",
        {
          timeZone:
            zonaHoraria ||
            "America/Costa_Rica",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }
      ).formatToParts(fecha);

    const hora =
      Number(
        partes.find(
          (parte) =>
            parte.type === "hour"
        )?.value
      );

    const minuto =
      Number(
        partes.find(
          (parte) =>
            parte.type === "minute"
        )?.value
      );

    if (
      !Number.isFinite(hora) ||
      !Number.isFinite(minuto)
    ) {
      return null;
    }

    return hora * 60 + minuto;
  } catch {
    return null;
  }
}

function formatearDuracionMinutos(
  totalMinutos
) {
  const total =
    Number(totalMinutos);

  if (
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return "0 min";
  }

  const horas =
    Math.floor(total / 60);

  const minutos =
    total % 60;

  if (horas > 0 && minutos > 0) {
    return `${horas} h ${minutos} min`;
  }

  if (horas > 0) {
    return `${horas} h`;
  }

  return `${minutos} min`;
}

function obtenerDuracionCita(
  cita
) {
  const duracionCita =
    Number(
      cita.duracionMinutos
    );

  if (
    Number.isFinite(
      duracionCita
    ) &&
    duracionCita > 0
  ) {
    return duracionCita;
  }

  const inicio =
    normalizarFechaUtc(
      cita.fechaInicioUtc ||
      cita.fechaInicio
    );

  const fin =
    normalizarFechaUtc(
      cita.fechaFinUtc ||
      cita.fechaFin
    );

  if (
    inicio &&
    fin
  ) {
    const minutos =
      Math.round(
        (
          fin.getTime() -
          inicio.getTime()
        ) /
        60000
      );

    if (
      Number.isFinite(minutos) &&
      minutos > 0
    ) {
      return minutos;
    }
  }

  return 30;
}

function formatearMinutosHora(
  minutos
) {
  const hora =
    Math.floor(
      minutos / 60
    );

  const minuto =
    minutos % 60;

  return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}

function obtenerClaseEstadoVisual(
  estado
) {
  switch (estado) {
    case "Confirmada":
      return "visual-confirmed";

    case "Completada":
      return "visual-completed";

    case "Cancelada":
      return "visual-cancelled";

    case "NoAsistio":
      return "visual-absent";

    case "EnProceso":
      return "visual-in-progress";

    default:
      return "visual-pending";
  }
}

function formatearEstado(estado) {
  if (estado === "NoAsistio") {
    return "No asistió";
  }

  if (estado === "EnProceso") {
    return "En proceso";
  }

  return estado || "Pendiente";
}

function obtenerHoraCita(
  cita,
  zonaHoraria
) {
  if (
    cita.fechaInicioLocal &&
    typeof cita.fechaInicioLocal === "string" &&
    cita.fechaInicioLocal.includes("T")
  ) {
    return cita.fechaInicioLocal.substring(
      11,
      16
    );
  }

  if (!cita.fechaInicio) {
    return "--:--";
  }

  try {
    let fechaUtc =
      cita.fechaInicio;

    if (
      typeof fechaUtc === "string" &&
      !fechaUtc.endsWith("Z") &&
      !/[+-]\d{2}:\d{2}$/.test(fechaUtc)
    ) {
      fechaUtc =
        `${fechaUtc}Z`;
    }

    const fecha =
      new Date(fechaUtc);

    if (
      Number.isNaN(
        fecha.getTime()
      )
    ) {
      return "--:--";
    }

    return new Intl.DateTimeFormat(
      "es-CR",
      {
        timeZone:
          zonaHoraria ||
          "America/Costa_Rica",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }
    ).format(fecha);
  } catch {
    return "--:--";
  }
}

export default Agenda;
