import { useEffect } from "react";

const STORAGE_KEY =
  "barberiaSaaS.turnstileRegistro";

const SCRIPT_ID =
  "barberia-saas-turnstile-script";

function TurnstileRegistro() {
  useEffect(() => {
    const siteKey =
      import.meta.env.VITE_TURNSTILE_SITE_KEY;

    sessionStorage.removeItem(STORAGE_KEY);

    if (!siteKey) {
      console.error(
        "VITE_TURNSTILE_SITE_KEY no está configurado."
      );
      return undefined;
    }

    let widgetId = null;
    let contenedor = null;
    let mensaje = null;
    let observer = null;

    const renderizar = () => {
      const form = document.querySelector(
        '.trial-form-card form'
      );

      if (
        !form ||
        !window.turnstile ||
        form.querySelector(
          "[data-barberia-turnstile]"
        )
      ) {
        return;
      }

      const boton = form.querySelector(
        'button[type="submit"]'
      );

      if (!boton) {
        return;
      }

      const bloque = document.createElement("div");
      bloque.setAttribute(
        "data-barberia-turnstile",
        "true"
      );
      bloque.style.marginTop = "20px";
      bloque.style.display = "flex";
      bloque.style.flexDirection = "column";
      bloque.style.alignItems = "center";
      bloque.style.gap = "8px";

      contenedor = document.createElement("div");
      mensaje = document.createElement("div");
      mensaje.className =
        "small text-secondary text-center";
      mensaje.textContent =
        "Verificación de seguridad";

      bloque.appendChild(contenedor);
      bloque.appendChild(mensaje);
      boton.parentNode.insertBefore(
        bloque,
        boton
      );

      widgetId = window.turnstile.render(
        contenedor,
        {
          sitekey: siteKey,
          theme: "light",
          callback: (token) => {
            sessionStorage.setItem(
              STORAGE_KEY,
              token
            );
            mensaje.textContent =
              "Verificación completada ✓";
            mensaje.className =
              "small text-success text-center";
          },
          "expired-callback": () => {
            sessionStorage.removeItem(
              STORAGE_KEY
            );
            mensaje.textContent =
              "La verificación expiró. Complétala nuevamente.";
            mensaje.className =
              "small text-danger text-center";
          },
          "error-callback": () => {
            sessionStorage.removeItem(
              STORAGE_KEY
            );
            mensaje.textContent =
              "No fue posible completar la verificación. Intenta nuevamente.";
            mensaje.className =
              "small text-danger text-center";
          }
        }
      );
    };

    const validarSubmit = (event) => {
      const form = event.target;

      if (
        !(form instanceof HTMLFormElement) ||
        !form.closest(".trial-form-card")
      ) {
        return;
      }

      if (!sessionStorage.getItem(STORAGE_KEY)) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (mensaje) {
          mensaje.textContent =
            "Completa la verificación de seguridad antes de crear tu negocio.";
          mensaje.className =
            "small text-danger text-center";
        }
      }
    };

    document.addEventListener(
      "submit",
      validarSubmit,
      true
    );

    const iniciar = () => {
      renderizar();
      observer = new MutationObserver(
        renderizar
      );
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    };

    const existente =
      document.getElementById(SCRIPT_ID);

    if (window.turnstile) {
      iniciar();
    } else if (existente) {
      existente.addEventListener(
        "load",
        iniciar,
        { once: true }
      );
    } else {
      const script =
        document.createElement("script");
      script.id = SCRIPT_ID;
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.addEventListener(
        "load",
        iniciar,
        { once: true }
      );
      document.head.appendChild(script);
    }

    return () => {
      document.removeEventListener(
        "submit",
        validarSubmit,
        true
      );

      observer?.disconnect();

      if (
        widgetId !== null &&
        window.turnstile
      ) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // El widget puede haber sido removido al cambiar de ruta.
        }
      }

      sessionStorage.removeItem(STORAGE_KEY);
    };
  }, []);

  return null;
}

export default TurnstileRegistro;
