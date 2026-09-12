import { useEffect, useRef } from "react";

const STORAGE_KEY =
  "barberiaSaaS.agendaHoraPreseleccionada";

function AgendaQuickTimeSelection() {
  const estadoRef = useRef({
    clave: "",
    solicitudEnviada: false,
    finalizado: false
  });

  useEffect(() => {
    const leerPendiente = () => {
      try {
        const valor =
          sessionStorage.getItem(
            STORAGE_KEY
          );

        if (!valor) {
          return null;
        }

        const pendiente =
          JSON.parse(valor);

        if (
          !pendiente?.fecha ||
          !pendiente?.hora ||
          !pendiente?.creadoEn
        ) {
          sessionStorage.removeItem(
            STORAGE_KEY
          );

          return null;
        }

        if (
          Date.now() -
            Number(pendiente.creadoEn) >
          15 * 60 * 1000
        ) {
          sessionStorage.removeItem(
            STORAGE_KEY
          );

          return null;
        }

        return pendiente;
      } catch {
        sessionStorage.removeItem(
          STORAGE_KEY
        );

        return null;
      }
    };

    const obtenerModalNuevaCita = () => {
      return Array.from(
        document.querySelectorAll(
          ".custom-modal"
        )
      ).find(
        (modal) =>
          modal.querySelector(
            'select[name="servicioId"]'
          ) &&
          modal.querySelector(
            'input[name="fecha"]'
          )
      );
    };

    const limpiarAvisos = (
      modal
    ) => {
      modal
        ?.querySelectorAll(
          ".quick-time-feedback"
        )
        .forEach(
          (elemento) =>
            elemento.remove()
        );
    };

    const mostrarAviso = (
      modal,
      mensaje,
      tipo = "success"
    ) => {
      limpiarAvisos(modal);

      const referencia =
        modal.querySelector(
          ".availability-grid"
        ) ||
        modal.querySelector(
          ".availability-empty"
        ) ||
        modal.querySelector(
          ".availability-loading"
        );

      if (!referencia) {
        return;
      }

      const aviso =
        document.createElement(
          "div"
        );

      aviso.className =
        `quick-time-feedback alert ${
          tipo === "danger"
            ? "alert-danger"
            : "alert-success"
        } mt-3 mb-0`;

      aviso.textContent =
        mensaje;

      referencia.insertAdjacentElement(
        "afterend",
        aviso
      );
    };

    const obtenerHoraSlot = (
      boton
    ) => {
      return (
        boton
          .querySelector("strong")
          ?.textContent
          ?.trim() ||
        boton.textContent?.trim() ||
        ""
      );
    };

    const intentarAplicar = () => {
      const pendiente =
        leerPendiente();

      if (!pendiente) {
        return;
      }

      const clave =
        `${pendiente.fecha}|${pendiente.hora}|${pendiente.creadoEn}`;

      if (
        estadoRef.current.clave !==
        clave
      ) {
        estadoRef.current = {
          clave,
          solicitudEnviada: false,
          finalizado: false
        };
      }

      if (
        estadoRef.current.finalizado
      ) {
        return;
      }

      const modal =
        obtenerModalNuevaCita();

      if (!modal) {
        return;
      }

      const fecha =
        modal.querySelector(
          'input[name="fecha"]'
        );

      if (
        fecha?.value &&
        fecha.value !== pendiente.fecha
      ) {
        sessionStorage.removeItem(
          STORAGE_KEY
        );

        estadoRef.current.finalizado =
          true;

        return;
      }

      const servicio =
        modal.querySelector(
          'select[name="servicioId"]'
        );

      const variante =
        modal.querySelector(
          'select[name="servicioVarianteId"]'
        );

      const profesional =
        modal.querySelector(
          'select[name="profesionalId"]'
        );

      if (
        !servicio?.value ||
        !profesional?.value ||
        !fecha?.value ||
        (variante && !variante.value)
      ) {
        return;
      }

      const slots =
        Array.from(
          modal.querySelectorAll(
            ".availability-slot"
          )
        );

      if (slots.length > 0) {
        const slotObjetivo =
          slots.find(
            (slot) =>
              obtenerHoraSlot(slot) ===
              pendiente.hora
          );

        if (slotObjetivo) {
          if (
            !slotObjetivo.classList.contains(
              "selected"
            )
          ) {
            slotObjetivo.click();
          }

          mostrarAviso(
            modal,
            `Hora ${pendiente.hora} preseleccionada desde la vista semanal.`
          );

          sessionStorage.removeItem(
            STORAGE_KEY
          );

          estadoRef.current.finalizado =
            true;

          return;
        }

        mostrarAviso(
          modal,
          `La hora ${pendiente.hora} ya no está disponible con el profesional y duración seleccionados. Elige uno de los horarios disponibles.`,
          "danger"
        );

        sessionStorage.removeItem(
          STORAGE_KEY
        );

        estadoRef.current.finalizado =
          true;

        return;
      }

      const cargando =
        modal.querySelector(
          ".availability-loading"
        );

      if (cargando) {
        return;
      }

      const botonDisponibilidad =
        Array.from(
          modal.querySelectorAll(
            "button"
          )
        ).find(
          (boton) =>
            boton.textContent
              ?.toLowerCase()
              .includes(
                "ver horas disponibles"
              )
        );

      if (
        estadoRef.current.solicitudEnviada
      ) {
        const vacio =
          modal.querySelector(
            ".availability-empty"
          );

        if (
          vacio &&
          botonDisponibilidad &&
          !botonDisponibilidad.disabled
        ) {
          mostrarAviso(
            modal,
            `La hora ${pendiente.hora} no está disponible con el profesional y duración seleccionados.`,
            "danger"
          );

          sessionStorage.removeItem(
            STORAGE_KEY
          );

          estadoRef.current.finalizado =
            true;
        }

        return;
      }

      if (
        botonDisponibilidad &&
        !botonDisponibilidad.disabled
      ) {
        estadoRef.current.solicitudEnviada =
          true;

        botonDisponibilidad.click();
      }
    };

    const manejarCambio = (
      evento
    ) => {
      if (
        !evento.target.closest(
          ".custom-modal"
        )
      ) {
        return;
      }

      if (
        [
          "servicioId",
          "servicioVarianteId",
          "profesionalId",
          "fecha",
          "duracionHoras",
          "duracionMinutos"
        ].includes(
          evento.target.name
        )
      ) {
        estadoRef.current.solicitudEnviada =
          false;
        estadoRef.current.finalizado =
          false;

        const modal =
          obtenerModalNuevaCita();

        limpiarAvisos(modal);

        window.setTimeout(
          intentarAplicar,
          80
        );
      }
    };

    const manejarClick = (
      evento
    ) => {
      const boton =
        evento.target.closest(
          "button"
        );

      if (!boton) {
        return;
      }

      const texto =
        boton.textContent
          ?.trim()
          .toLowerCase() || "";

      if (
        texto === "cancelar" ||
        boton.classList.contains(
          "modal-close"
        )
      ) {
        sessionStorage.removeItem(
          STORAGE_KEY
        );

        estadoRef.current = {
          clave: "",
          solicitudEnviada: false,
          finalizado: false
        };
      }
    };

    document.addEventListener(
      "change",
      manejarCambio
    );

    document.addEventListener(
      "click",
      manejarClick
    );

    const intervalo =
      window.setInterval(
        intentarAplicar,
        300
      );

    intentarAplicar();

    return () => {
      document.removeEventListener(
        "change",
        manejarCambio
      );

      document.removeEventListener(
        "click",
        manejarClick
      );

      window.clearInterval(
        intervalo
      );
    };
  }, []);

  return null;
}

export default AgendaQuickTimeSelection;
