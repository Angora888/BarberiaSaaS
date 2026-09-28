import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState
} from "react";

const AppDialogContext = createContext(null);

const estadoInicial = {
  abierto: false,
  tipo: "confirm",
  titulo: "",
  mensaje: "",
  confirmarTexto: "Aceptar",
  cancelarTexto: "Cancelar",
  peligroso: false,
  valor: "",
  soloLectura: false
};

export function AppDialogProvider({ children }) {
  const [dialogo, setDialogo] = useState(estadoInicial);
  const resolverRef = useRef(null);

  const abrir = useCallback((opciones) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogo({
        ...estadoInicial,
        abierto: true,
        ...opciones
      });
    });
  }, []);

  const confirmar = useCallback(
    ({
      titulo = "Confirmar acción",
      mensaje,
      confirmarTexto = "Confirmar",
      cancelarTexto = "Cancelar",
      peligroso = false
    }) =>
      abrir({
        tipo: "confirm",
        titulo,
        mensaje,
        confirmarTexto,
        cancelarTexto,
        peligroso
      }),
    [abrir]
  );

  const alertar = useCallback(
    ({
      titulo = "Barbería SaaS",
      mensaje,
      confirmarTexto = "Aceptar"
    }) =>
      abrir({
        tipo: "alert",
        titulo,
        mensaje,
        confirmarTexto,
        cancelarTexto: ""
      }),
    [abrir]
  );

  const solicitarTexto = useCallback(
    ({
      titulo = "Barbería SaaS",
      mensaje,
      valor = "",
      confirmarTexto = "Listo",
      cancelarTexto = "",
      soloLectura = false
    }) =>
      abrir({
        tipo: "prompt",
        titulo,
        mensaje,
        valor,
        confirmarTexto,
        cancelarTexto,
        soloLectura
      }),
    [abrir]
  );

  const cerrar = useCallback((resultado) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setDialogo(estadoInicial);
    resolver?.(resultado);
  }, []);

  const confirmarDialogo = () => {
    if (dialogo.tipo === "prompt") {
      cerrar(dialogo.valor);
      return;
    }

    if (dialogo.tipo === "confirm") {
      cerrar(true);
      return;
    }

    cerrar(undefined);
  };

  const cancelarDialogo = () => {
    if (dialogo.tipo === "confirm") {
      cerrar(false);
      return;
    }

    if (dialogo.tipo === "prompt") {
      cerrar(null);
      return;
    }

    cerrar(undefined);
  };

  return (
    <AppDialogContext.Provider
      value={{
        confirm: confirmar,
        alert: alertar,
        prompt: solicitarTexto
      }}
    >
      {children}

      {dialogo.abierto && (
        <div
          className="modal fade show d-block"
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-dialog-title"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.58)",
            zIndex: 2000
          }}
        >
          <div className="modal-dialog modal-dialog-centered px-2">
            <div
              className="modal-content border-0 shadow-lg"
              style={{ borderRadius: 22, overflow: "hidden" }}
            >
              <div className="modal-body p-4 p-md-5">
                <div
                  className="mb-3"
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    background: dialogo.peligroso
                      ? "#fff1f2"
                      : "var(--soft-pink, #f8e7ee)",
                    color: dialogo.peligroso
                      ? "#b42318"
                      : "var(--primary, #c62864)",
                    fontSize: 22
                  }}
                >
                  {dialogo.peligroso ? "!" : "✓"}
                </div>

                <h4 id="app-dialog-title" className="fw-bold mb-2">
                  {dialogo.titulo}
                </h4>

                {dialogo.mensaje && (
                  <p
                    className="text-muted mb-0"
                    style={{ whiteSpace: "pre-line" }}
                  >
                    {dialogo.mensaje}
                  </p>
                )}

                {dialogo.tipo === "prompt" && (
                  <input
                    autoFocus
                    type="text"
                    className="form-control mt-3"
                    value={dialogo.valor}
                    readOnly={dialogo.soloLectura}
                    onFocus={(event) => event.target.select()}
                    onChange={(event) =>
                      setDialogo((actual) => ({
                        ...actual,
                        valor: event.target.value
                      }))
                    }
                  />
                )}

                <div className="d-flex justify-content-end gap-2 mt-4">
                  {dialogo.cancelarTexto && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={cancelarDialogo}
                    >
                      {dialogo.cancelarTexto}
                    </button>
                  )}

                  <button
                    type="button"
                    autoFocus={dialogo.tipo !== "prompt"}
                    className={
                      dialogo.peligroso
                        ? "btn btn-danger"
                        : "btn btn-primary"
                    }
                    onClick={confirmarDialogo}
                  >
                    {dialogo.confirmarTexto}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppDialogContext.Provider>
  );
}

export function useAppDialog() {
  const contexto = useContext(AppDialogContext);

  if (!contexto) {
    throw new Error(
      "useAppDialog debe utilizarse dentro de AppDialogProvider."
    );
  }

  return contexto;
}
