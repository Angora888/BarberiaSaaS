import { FaPlus } from "react-icons/fa";
import "./AgendaSemanaCompacta.css";

function AgendaSemanaCompacta({
  diasSemana,
  citasSemanaPorDia,
  configuracionAgenda,
  zonaHoraria,
  profesionalFiltro,
  obtenerMinutosCita,
  obtenerDuracionCita,
  obtenerClaseEstadoVisual,
  obtenerNombreServicio,
  obtenerNombreCliente,
  obtenerNombreProfesional,
  abrirDetalleCita,
  abrirNuevaCitaParaFechaYHora,
  abrirDia
}) {
  const altoAgenda =
    (configuracionAgenda.minutoFin -
      configuracionAgenda.minutoInicio) *
    configuracionAgenda.pixelesPorMinutoSemana;

  const manejarClickDia = (
    evento,
    fecha
  ) => {
    if (
      evento.target.closest(
        ".compact-week-appointment"
      )
    ) {
      return;
    }

    const rect =
      evento.currentTarget.getBoundingClientRect();

    const posicionY =
      evento.clientY - rect.top;

    const minutosDesdeInicio =
      posicionY /
      configuracionAgenda.pixelesPorMinutoSemana;

    const minutoCalculado =
      configuracionAgenda.minutoInicio +
      minutosDesdeInicio;

    const intervalo = 15;

    let minutoInicio =
      Math.round(
        minutoCalculado / intervalo
      ) * intervalo;

    minutoInicio = Math.max(
      configuracionAgenda.minutoInicio,
      minutoInicio
    );

    minutoInicio = Math.min(
      configuracionAgenda.minutoFin - intervalo,
      minutoInicio
    );

    abrirNuevaCitaParaFechaYHora(
      fecha,
      minutoInicio
    );
  };

  return (
    <div className="compact-week-wrapper">
      <div className="compact-week-help">
        <span>
          Toca un espacio vacío para crear una cita.
        </span>

        {profesionalFiltro === "todos" && (
          <small>
            Puedes filtrar un profesional arriba para dejarlo preseleccionado.
          </small>
        )}
      </div>

      <div className="compact-week-calendar">
        <div className="compact-week-header">
          <div className="compact-week-time-header">
            Hora
          </div>

          {diasSemana.map((dia) => {
            const esHoy =
              dia.fecha === obtenerFechaHoyCompacto();

            return (
              <button
                key={dia.fecha}
                type="button"
                className={
                  esHoy
                    ? "compact-week-day-header today"
                    : "compact-week-day-header"
                }
                onClick={() => abrirDia(dia.fecha)}
                title="Abrir vista del día"
              >
                <span>{dia.nombreCorto}</span>
                <strong>{dia.numeroDia}</strong>
              </button>
            );
          })}
        </div>

        <div className="compact-week-body">
          <div
            className="compact-week-time-column"
            style={{ height: `${altoAgenda}px` }}
          >
            {configuracionAgenda.horas.map(
              (minuto) => {
                const top =
                  (minuto -
                    configuracionAgenda.minutoInicio) *
                  configuracionAgenda.pixelesPorMinutoSemana;

                return (
                  <div
                    key={minuto}
                    className="compact-week-time-label"
                    style={{ top: `${top}px` }}
                  >
                    {formatearHoraCompacta(minuto)}
                  </div>
                );
              }
            )}
          </div>

          {diasSemana.map((dia) => {
            const citasDia =
              citasSemanaPorDia.get(dia.fecha) || [];

            const esHoy =
              dia.fecha === obtenerFechaHoyCompacto();

            return (
              <div
                key={dia.fecha}
                className={
                  esHoy
                    ? "compact-week-day-column today"
                    : "compact-week-day-column"
                }
                style={{ height: `${altoAgenda}px` }}
                onClick={(evento) =>
                  manejarClickDia(
                    evento,
                    dia.fecha
                  )
                }
                title="Toca un espacio para crear una cita"
              >
                {configuracionAgenda.horas.map(
                  (minuto) => {
                    const top =
                      (minuto -
                        configuracionAgenda.minutoInicio) *
                      configuracionAgenda.pixelesPorMinutoSemana;

                    return (
                      <div
                        key={minuto}
                        className="compact-week-hour-line"
                        style={{ top: `${top}px` }}
                      />
                    );
                  }
                )}

                {citasDia.map((cita) => {
                  const minutoInicio =
                    obtenerMinutosCita(
                      cita,
                      zonaHoraria
                    );

                  if (minutoInicio === null) {
                    return null;
                  }

                  const duracion =
                    obtenerDuracionCita(cita);

                  const top =
                    (minutoInicio -
                      configuracionAgenda.minutoInicio) *
                    configuracionAgenda.pixelesPorMinutoSemana;

                  const alto = Math.max(
                    duracion *
                      configuracionAgenda.pixelesPorMinutoSemana,
                    24
                  );

                  return (
                    <button
                      key={cita.id}
                      type="button"
                      className={`compact-week-appointment ${obtenerClaseEstadoVisual(
                        cita.estado
                      )}`}
                      style={{
                        top: `${top}px`,
                        height: `${alto}px`
                      }}
                      onClick={(evento) => {
                        evento.stopPropagation();
                        abrirDetalleCita(cita);
                      }}
                      title={`${obtenerNombreCliente(cita)} · ${obtenerNombreServicio(cita)} · ${obtenerNombreProfesional(cita)}`}
                    >
                      <strong>
                        {obtenerNombreCliente(cita)}
                      </strong>

                      <span>
                        {obtenerNombreServicio(cita)}
                      </span>
                    </button>
                  );
                })}

                {citasDia.length === 0 && (
                  <div className="compact-week-empty-hint">
                    <FaPlus />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatearHoraCompacta(minutos) {
  const hora24 =
    Math.floor(minutos / 60);

  const minuto =
    minutos % 60;

  const periodo =
    hora24 >= 12 ? "p. m." : "a. m.";

  const hora12 =
    hora24 % 12 || 12;

  return `${hora12}:${String(minuto).padStart(2, "0")} ${periodo}`;
}

function obtenerFechaHoyCompacto() {
  const fecha = new Date();

  const year =
    fecha.getFullYear();

  const month =
    String(fecha.getMonth() + 1).padStart(2, "0");

  const day =
    String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default AgendaSemanaCompacta;
