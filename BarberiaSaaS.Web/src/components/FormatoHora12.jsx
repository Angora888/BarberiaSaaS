import { useEffect } from "react";

const REGEX_HORA_24 = /\b([01]?\d|2[0-3]):([0-5]\d)\b/g;

function convertirHora12(horaTexto) {
  const match = String(horaTexto || "").match(
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

function transformarTexto(texto) {
  const valor = String(texto || "");

  if (!valor.trim()) {
    return valor;
  }

  if (/\b(?:AM|PM)\b/i.test(valor)) {
    return valor;
  }

  return valor.replace(
    REGEX_HORA_24,
    (hora) => convertirHora12(hora)
  );
}

function debeIgnorarNodo(nodo) {
  const padre = nodo?.parentElement;

  if (!padre) {
    return true;
  }

  const etiqueta = padre.tagName?.toLowerCase();

  return [
    "script",
    "style",
    "textarea",
    "input",
    "option"
  ].includes(etiqueta);
}

function convertirNodoTexto(nodo) {
  if (
    !nodo ||
    nodo.nodeType !== Node.TEXT_NODE ||
    debeIgnorarNodo(nodo)
  ) {
    return;
  }

  const original = nodo.nodeValue || "";
  const convertido = transformarTexto(original);

  if (convertido !== original) {
    nodo.nodeValue = convertido;
  }
}

function recorrerNodo(raiz) {
  if (!raiz) {
    return;
  }

  if (raiz.nodeType === Node.TEXT_NODE) {
    convertirNodoTexto(raiz);
    return;
  }

  if (raiz.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const walker = document.createTreeWalker(
    raiz,
    NodeFilter.SHOW_TEXT
  );

  let nodo = walker.nextNode();

  while (nodo) {
    convertirNodoTexto(nodo);
    nodo = walker.nextNode();
  }
}

function obtenerModalNuevaCita() {
  return Array.from(
    document.querySelectorAll(".custom-modal")
  ).find(
    (modal) =>
      modal.querySelector(
        'select[name="servicioId"]'
      ) &&
      modal.querySelector(
        'input[name="fecha"]'
      )
  );
}

function aplicarFormatoNuevaCita() {
  const modal = obtenerModalNuevaCita();

  if (!modal) {
    return;
  }

  recorrerNodo(modal);
}

function FormatoHora12() {
  useEffect(() => {
    aplicarFormatoNuevaCita();

    let programado = false;

    const observer = new MutationObserver(() => {
      if (programado) {
        return;
      }

      programado = true;

      requestAnimationFrame(() => {
        programado = false;
        aplicarFormatoNuevaCita();
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}

export default FormatoHora12;
