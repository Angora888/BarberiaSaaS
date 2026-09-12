import { useEffect } from "react";

function AgendaAvailabilityFeedback() {
  useEffect(() => {
    let observer = null;
    let framePendiente = null;

    const actualizarMensaje = () => {
      const modal = document.querySelector(
        ".custom-modal"
      );

      if (!modal) {
        return;
      }

      const contenedorDisponibilidad =
        modal.querySelector(
          ".availability-empty"
        );

      const errorPrincipal =
        modal.querySelector(
          ".custom-modal-body > .alert-danger"
        );

      const mensajeAnterior =
        modal.querySelector(
          ".availability-inline-error"
        );

      if (
        !contenedorDisponibilidad ||
        !errorPrincipal
      ) {
        if (mensajeAnterior) {
          mensajeAnterior.remove();
        }

        return;
      }

      const mensaje =
        errorPrincipal.textContent?.trim() || "";

      if (!mensaje) {
        if (mensajeAnterior) {
          mensajeAnterior.remove();
        }

        return;
      }

      let aviso = mensajeAnterior;

      if (!aviso) {
        aviso = document.createElement("div");
        aviso.className =
          "availability-inline-error alert alert-danger mt-3 mb-0";

        aviso.textContent = mensaje;

        contenedorDisponibilidad.insertAdjacentElement(
          "afterend",
          aviso
        );

        return;
      }

      if (
        aviso.textContent?.trim() !== mensaje
      ) {
        aviso.textContent = mensaje;
      }
    };

    const programarActualizacion = () => {
      if (framePendiente !== null) {
        return;
      }

      framePendiente =
        window.requestAnimationFrame(() => {
          framePendiente = null;
          actualizarMensaje();
        });
    };

    actualizarMensaje();

    observer = new MutationObserver(
      programarActualizacion
    );

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true,
        characterData: true
      }
    );

    return () => {
      if (observer) {
        observer.disconnect();
      }

      if (framePendiente !== null) {
        window.cancelAnimationFrame(
          framePendiente
        );
      }

      document
        .querySelectorAll(
          ".availability-inline-error"
        )
        .forEach((elemento) =>
          elemento.remove()
        );
    };
  }, []);

  return null;
}

export default AgendaAvailabilityFeedback;
