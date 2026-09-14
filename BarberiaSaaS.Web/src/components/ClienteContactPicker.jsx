import {
  useEffect,
  useState
} from "react";
import { createPortal } from "react-dom";
import {
  FaAddressBook,
  FaAndroid
} from "react-icons/fa";

function ClienteContactPicker() {
  const [contenedor, setContenedor] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [importando, setImportando] = useState(false);

  const soportaContactPicker =
    typeof navigator !== "undefined" &&
    "contacts" in navigator &&
    typeof navigator.contacts?.select === "function";

  useEffect(() => {
    const buscarContenedor = () => {
      const modales = Array.from(
        document.querySelectorAll(".custom-modal")
      );

      const modalNuevoCliente = modales.find((modal) => {
        const tieneNombre =
          modal.querySelector('input[name="nombre"]');

        const tieneTelefono =
          modal.querySelector('input[name="telefono"]');

        const botonGuardar = Array.from(
          modal.querySelectorAll('button[type="submit"]')
        ).find((boton) =>
          boton.textContent
            ?.toLowerCase()
            .includes("guardar cliente")
        );

        return Boolean(
          tieneNombre &&
          tieneTelefono &&
          botonGuardar
        );
      });

      if (!modalNuevoCliente) {
        setContenedor(null);
        return;
      }

      const cuerpo = modalNuevoCliente.querySelector(
        ".custom-modal-body"
      );

      const bloqueImportacion =
        cuerpo?.querySelector(":scope > .mb-4");

      setContenedor(
        bloqueImportacion || cuerpo || null
      );
    };

    buscarContenedor();

    const intervalId = window.setInterval(
      buscarContenedor,
      350
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!contenedor) {
      setMensaje("");
      setError("");
      setImportando(false);
    }
  }, [contenedor]);

  const actualizarInputReact = (
    selector,
    valor
  ) => {
    if (!contenedor || !valor) {
      return;
    }

    const modal = contenedor.closest(
      ".custom-modal"
    );

    const input = modal?.querySelector(selector);

    if (!input) {
      return;
    }

    const descriptor =
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      );

    descriptor?.set?.call(
      input,
      valor
    );

    input.dispatchEvent(
      new Event("input", {
        bubbles: true
      })
    );

    input.dispatchEvent(
      new Event("change", {
        bubbles: true
      })
    );
  };

  const separarNombre = (nombreCompleto) => {
    const partes = String(
      nombreCompleto || ""
    )
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (partes.length === 0) {
      return {
        nombre: "",
        apellidos: ""
      };
    }

    return {
      nombre: partes[0],
      apellidos: partes
        .slice(1)
        .join(" ")
    };
  };

  const importarContactoAndroid = async () => {
    if (!soportaContactPicker) {
      return;
    }

    try {
      setImportando(true);
      setMensaje("");
      setError("");

      const propiedadesDisponibles =
        typeof navigator.contacts.getProperties === "function"
          ? await navigator.contacts.getProperties()
          : ["name", "tel", "email"];

      const propiedades = [
        "name",
        "tel",
        "email"
      ].filter((propiedad) =>
        propiedadesDisponibles.includes(propiedad)
      );

      if (propiedades.length === 0) {
        throw new Error(
          "Este navegador no permite compartir nombre, teléfono o correo del contacto."
        );
      }

      const contactos =
        await navigator.contacts.select(
          propiedades,
          {
            multiple: false
          }
        );

      if (!contactos?.length) {
        return;
      }

      const contacto = contactos[0];

      const nombreCompleto =
        contacto.name?.[0] || "";

      const telefono =
        contacto.tel?.[0] || "";

      const email =
        contacto.email?.[0] || "";

      const {
        nombre,
        apellidos
      } = separarNombre(
        nombreCompleto
      );

      actualizarInputReact(
        'input[name="nombre"]',
        nombre
      );

      actualizarInputReact(
        'input[name="apellidos"]',
        apellidos
      );

      actualizarInputReact(
        'input[name="telefono"]',
        telefono
      );

      actualizarInputReact(
        'input[name="email"]',
        email
      );

      setMensaje(
        "Contacto importado. Revisa los datos antes de guardar."
      );
    } catch (error) {
      if (
        error?.name === "AbortError" ||
        error?.name === "NotAllowedError"
      ) {
        return;
      }

      setError(
        error?.message ||
        "No fue posible importar el contacto desde Android."
      );
    } finally {
      setImportando(false);
    }
  };

  if (
    !contenedor ||
    !soportaContactPicker
  ) {
    return null;
  }

  return createPortal(
    <div className="mt-3 pt-3 border-top">
      <button
        type="button"
        className="btn btn-outline-success w-100"
        onClick={importarContactoAndroid}
        disabled={importando}
      >
        {importando ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              aria-hidden="true"
            />
            Abriendo contactos...
          </>
        ) : (
          <>
            <FaAndroid className="me-2" />
            Importar desde contactos de Android
          </>
        )}
      </button>

      <div className="text-muted small mt-2">
        <FaAddressBook className="me-1" />
        Selecciona un contacto del teléfono y se completarán nombre,
        teléfono y correo cuando estén disponibles.
      </div>

      {mensaje && (
        <div className="alert alert-success py-2 mt-3 mb-0">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="alert alert-danger py-2 mt-3 mb-0">
          {error}
        </div>
      )}
    </div>,
    contenedor
  );
}

export default ClienteContactPicker;
