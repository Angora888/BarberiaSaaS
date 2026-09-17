import { useEffect } from "react";

function convertirHora12(horaTexto) {
  const match = String(horaTexto || "").trim().match(
    /^([01]?\d|2[0-3]):([0-5]\d)$/
  );

  if (!match) {
    return horaTexto;
  }

  const horas24 = Number(match[1]);
  const minutos = match[2];
  const periodo = horas24 >= 12 ? "PM" : "AM";
  const horas12 = horas24 % 12 || 12;

  return `${horas12}:${minutos} ${periodo}`;
}

function transformarMensajeWhatsApp(valor) {
  const texto = String(valor ?? "");

  const esMensajeCita =
    texto.includes("Fecha:") &&
    texto.includes("Hora:") &&
    texto.includes("Servicio:") &&
    (
      texto.includes("ha sido confirmada") ||
      texto.includes("Te recordamos tu cita")
    );

  if (!esMensajeCita) {
    return valor;
  }

  let resultado = texto.replace(
    /(Hora:\s*)([01]?\d|2[0-3]):([0-5]\d)\b/g,
    (_, prefijo, horas, minutos) =>
      `${prefijo}${convertirHora12(`${horas}:${minutos}`)}`
  );

  resultado = resultado.replace(
    /(Servicio:\s*)([^\n·]+)(?:\s*·[^\n]*)?/g,
    (_, prefijo, servicio) =>
      `${prefijo}${servicio.trim()}`
  );

  return resultado;
}

function formatearElementoHora(elemento) {
  if (!elemento) {
    return;
  }

  const actual = elemento.textContent?.trim() || "";

  if (!actual || /\b(?:AM|PM)\b/i.test(actual)) {
    return;
  }

  const convertido = convertirHora12(actual);

  if (convertido !== actual) {
    elemento.textContent = convertido;
  }
}

function formatearHorasAgenda() {
  // Vista diaria visual: columna de horas y hora dentro de cada cita.
  document
    .querySelectorAll(
      ".visual-agenda-time-label, .visual-appointment-time"
    )
    .forEach(formatearElementoHora);

  // Vista diaria en lista: hora principal de cada tarjeta.
  document
    .querySelectorAll(".appointment-time strong")
    .forEach(formatearElementoHora);
}

function formatearHoraVisibleDetalle() {
  const modales = Array.from(
    document.querySelectorAll(".custom-modal")
  );

  const modalDetalle = modales.find(
    (modal) =>
      modal.querySelector("h4")?.textContent?.trim() ===
      "Detalle de la cita"
  );

  if (!modalDetalle) {
    return;
  }

  const etiquetas = Array.from(
    modalDetalle.querySelectorAll("small")
  );

  const etiquetaHora = etiquetas.find(
    (elemento) =>
      elemento.textContent?.trim() === "Hora"
  );

  const tarjetaHora = etiquetaHora?.parentElement;
  const valorHora = tarjetaHora?.querySelector("strong");

  formatearElementoHora(valorHora);
}

function AgendaWhatsAppFormato12() {
  useEffect(() => {
    const encodeOriginal =
      globalThis.encodeURIComponent;

    const encodePersonalizado = (valor) =>
      encodeOriginal(
        transformarMensajeWhatsApp(valor)
      );

    globalThis.encodeURIComponent =
      encodePersonalizado;

    const formatearHorasVisibles = () => {
      formatearHorasAgenda();
      formatearHoraVisibleDetalle();
    };

    formatearHorasVisibles();

    let pendiente = false;

    const observer = new MutationObserver(() => {
      if (pendiente) {
        return;
      }

      pendiente = true;

      requestAnimationFrame(() => {
        pendiente = false;
        formatearHorasVisibles();
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      observer.disconnect();

      if (
        globalThis.encodeURIComponent ===
        encodePersonalizado
      ) {
        globalThis.encodeURIComponent =
          encodeOriginal;
      }
    };
  }, []);

  return null;
}

export default AgendaWhatsAppFormato12;
