import { useEffect } from "react";

function ReservaPublicaTelefonoCR() {
  useEffect(() => {
    const prepararCampo = () => {
      const input = document.getElementById(
        "reserva-telefono"
      );

      if (!input) {
        return;
      }

      input.setAttribute("maxlength", "8");
      input.setAttribute("minlength", "8");
      input.setAttribute("pattern", "[0-9]{8}");
      input.setAttribute("inputmode", "numeric");
      input.setAttribute("autocomplete", "tel-national");
      input.setAttribute("placeholder", "88888888");
      input.setAttribute(
        "title",
        "Ingresa exactamente 8 dígitos, sin +506."
      );

      const contenedor = input.closest(
        ".landing-reserva-field"
      );

      if (
        contenedor &&
        !contenedor.querySelector(
          ".landing-reserva-telefono-ayuda"
        )
      ) {
        const ayuda = document.createElement("small");
        ayuda.className =
          "landing-reserva-telefono-ayuda";
        ayuda.textContent =
          "Ingresa 8 dígitos. Guardaremos el número con el prefijo +506.";
        ayuda.style.display = "block";
        ayuda.style.marginTop = "6px";
        ayuda.style.color = "#6b7280";
        ayuda.style.fontSize = "12px";
        contenedor.appendChild(ayuda);
      }
    };

    const sanitizar = (evento) => {
      const input = evento.target;

      if (
        !(input instanceof HTMLInputElement) ||
        input.id !== "reserva-telefono"
      ) {
        return;
      }

      const limpio = String(input.value || "")
        .replace(/\D/g, "")
        .slice(0, 8);

      if (input.value !== limpio) {
        input.value = limpio;
      }
    };

    document.addEventListener(
      "input",
      sanitizar,
      true
    );

    prepararCampo();

    const observer = new MutationObserver(
      prepararCampo
    );

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      document.removeEventListener(
        "input",
        sanitizar,
        true
      );
      observer.disconnect();
    };
  }, []);

  return null;
}

export default ReservaPublicaTelefonoCR;
