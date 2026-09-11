using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.DTOs;
using BarberiaSaaS.Api.Models;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CitasController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;
        private readonly ITimeZoneService _timeZoneService;

        public CitasController(
            AppDbContext context,
            ITenantContext tenantContext,
            ITimeZoneService timeZoneService)
        {
            _context = context;
            _tenantContext = tenantContext;
            _timeZoneService = timeZoneService;
        }

        // ============================================================
        // LISTAR CITAS
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> GetCitas(
            DateTime? desde,
            DateTime? hasta)
        {
            var tenantId =
                _tenantContext.TenantId;

            DateTime? desdeUtc = null;
            DateTime? hastaUtc = null;

            if (desde.HasValue)
            {
                desdeUtc =
                    await _timeZoneService
                        .LocalAUtcAsync(
                            tenantId,
                            desde.Value);
            }

            if (hasta.HasValue)
            {
                hastaUtc =
                    await _timeZoneService
                        .LocalAUtcAsync(
                            tenantId,
                            hasta.Value);
            }

            var query =
                _context.Citas
                    .Where(x =>
                        x.TenantId == tenantId);

            if (desdeUtc.HasValue)
            {
                query = query.Where(x =>
                    x.FechaInicio >=
                    desdeUtc.Value);
            }

            if (hastaUtc.HasValue)
            {
                query = query.Where(x =>
                    x.FechaInicio <=
                    hastaUtc.Value);
            }

            var citas =
                await query
                    .OrderBy(x =>
                        x.FechaInicio)
                    .Select(x => new
                    {
                        x.Id,
                        x.FechaInicio,
                        x.FechaFin,
                        x.DuracionMinutos,
                        x.Precio,
                        x.Estado,
                        x.Notas,

                        Cliente = new
                        {
                            x.Cliente.Id,
                            x.Cliente.Nombre,
                            x.Cliente.Apellidos,
                            x.Cliente.Telefono
                        },

                        Profesional = new
                        {
                            x.Profesional.Id,
                            x.Profesional.Nombre,
                            x.Profesional.Apellidos
                        },

                        Servicio = new
                        {
                            x.Servicio.Id,
                            x.Servicio.Nombre
                        },

                        ServicioVariante =
                            x.ServicioVariante == null
                                ? null
                                : new
                                {
                                    x.ServicioVariante.Id,
                                    x.ServicioVariante.Nombre,
                                    x.ServicioVariante.Precio
                                },

                        Sucursal = new
                        {
                            x.Sucursal.Id,
                            x.Sucursal.Nombre
                        }
                    })
                    .ToListAsync();

            return Ok(citas);
        }

        // ============================================================
        // OBTENER CITA
        // ============================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetCita(
            int id)
        {
            var tenantId =
                _tenantContext.TenantId;

            var cita =
                await _context.Citas
                    .Where(x =>
                        x.Id == id &&
                        x.TenantId == tenantId)
                    .Select(x => new
                    {
                        x.Id,
                        x.FechaInicio,
                        x.FechaFin,
                        x.DuracionMinutos,
                        x.Precio,
                        x.Estado,
                        x.Notas,

                        Cliente = new
                        {
                            x.Cliente.Id,
                            x.Cliente.Nombre,
                            x.Cliente.Apellidos,
                            x.Cliente.Telefono,
                            x.Cliente.Email
                        },

                        Profesional = new
                        {
                            x.Profesional.Id,
                            x.Profesional.Nombre,
                            x.Profesional.Apellidos
                        },

                        Servicio = new
                        {
                            x.Servicio.Id,
                            x.Servicio.Nombre
                        },

                        ServicioVariante =
                            x.ServicioVariante == null
                                ? null
                                : new
                                {
                                    x.ServicioVariante.Id,
                                    x.ServicioVariante.Nombre,
                                    x.ServicioVariante.Precio
                                },

                        Sucursal = new
                        {
                            x.Sucursal.Id,
                            x.Sucursal.Nombre
                        }
                    })
                    .FirstOrDefaultAsync();

            if (cita == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "Cita no encontrada."
                });
            }

            return Ok(cita);
        }

        // ============================================================
        // CREAR CITA
        // ============================================================

        [HttpPost]
        public async Task<IActionResult> Crear(
            CrearCitaDto request)
        {
            var tenantId =
                _tenantContext.TenantId;

            if (request.DuracionMinutos <= 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "La duración de la cita debe ser mayor a cero."
                });
            }

            var cliente =
                await _context.Clientes
                    .FirstOrDefaultAsync(x =>
                        x.Id ==
                            request.ClienteId &&
                        x.TenantId ==
                            tenantId &&
                        x.Activo);

            if (cliente == null)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El cliente seleccionado no es válido."
                });
            }

            var sucursal =
                await _context.Sucursales
                    .FirstOrDefaultAsync(x =>
                        x.Id ==
                            request.SucursalId &&
                        x.TenantId ==
                            tenantId &&
                        x.Activa);

            if (sucursal == null)
            {
                return BadRequest(new
                {
                    mensaje =
                        "La sucursal seleccionada no es válida."
                });
            }

            var profesional =
                await _context.Profesionales
                    .FirstOrDefaultAsync(x =>
                        x.Id ==
                            request.ProfesionalId &&
                        x.TenantId ==
                            tenantId &&
                        x.Activo);

            if (profesional == null)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El profesional seleccionado no es válido."
                });
            }

            if (profesional.SucursalId.HasValue &&
                profesional.SucursalId.Value !=
                sucursal.Id)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El profesional no pertenece a la sucursal seleccionada."
                });
            }

            var servicio =
                await _context.Servicios
                    .FirstOrDefaultAsync(x =>
                        x.Id ==
                            request.ServicioId &&
                        x.TenantId ==
                            tenantId &&
                        x.Activo);

            if (servicio == null)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El servicio seleccionado no es válido."
                });
            }

            var realizaServicio =
                await _context
                    .ProfesionalServicios
                    .AnyAsync(x =>
                        x.ProfesionalId ==
                            profesional.Id &&
                        x.ServicioId ==
                            servicio.Id);

            if (!realizaServicio)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El profesional seleccionado no realiza este servicio."
                });
            }

            // ========================================================
            // VARIANTE Y PRECIO
            // ========================================================

            var tieneVariantesActivas =
                await _context.ServicioVariantes
                    .AnyAsync(x =>
                        x.TenantId == tenantId &&
                        x.ServicioId == servicio.Id &&
                        x.Activo);

            ServicioVariante? variante = null;

            if (tieneVariantesActivas)
            {
                if (!request.ServicioVarianteId.HasValue)
                {
                    return BadRequest(new
                    {
                        mensaje =
                            "Selecciona una variante para este servicio."
                    });
                }

                variante =
                    await _context.ServicioVariantes
                        .FirstOrDefaultAsync(x =>
                            x.Id ==
                                request.ServicioVarianteId.Value &&
                            x.TenantId ==
                                tenantId &&
                            x.ServicioId ==
                                servicio.Id &&
                            x.Activo);

                if (variante == null)
                {
                    return BadRequest(new
                    {
                        mensaje =
                            "La variante seleccionada no es válida para este servicio."
                    });
                }
            }
            else if (request.ServicioVarianteId.HasValue)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El servicio seleccionado no utiliza variantes."
                });
            }

            var precioCita =
                variante?.Precio ??
                servicio.Precio;

            // ========================================================
            // HORA LOCAL DEL NEGOCIO
            // ========================================================

            var fechaInicioLocal =
                DateTime.SpecifyKind(
                    request.FechaInicio,
                    DateTimeKind.Unspecified);

            var fechaFinLocal =
                fechaInicioLocal.AddMinutes(
                    request.DuracionMinutos);

            // ========================================================
            // UTC PARA POSTGRESQL
            // ========================================================

            var fechaInicioUtc =
                await _timeZoneService
                    .LocalAUtcAsync(
                        tenantId,
                        fechaInicioLocal);

            var fechaFinUtc =
                await _timeZoneService
                    .LocalAUtcAsync(
                        tenantId,
                        fechaFinLocal);

            var validacion =
                await ValidarDisponibilidad(
                    tenantId,
                    profesional.Id,
                    fechaInicioLocal,
                    fechaFinLocal,
                    fechaInicioUtc,
                    fechaFinUtc,
                    null);

            if (!validacion.EsValido)
            {
                return Conflict(new
                {
                    mensaje =
                        validacion.Mensaje
                });
            }

            var cita =
                new Cita
                {
                    TenantId =
                        tenantId,

                    SucursalId =
                        sucursal.Id,

                    ClienteId =
                        cliente.Id,

                    ProfesionalId =
                        profesional.Id,

                    ServicioId =
                        servicio.Id,

                    ServicioVarianteId =
                        variante?.Id,

                    FechaInicio =
                        fechaInicioUtc,

                    DuracionMinutos =
                        request.DuracionMinutos,

                    FechaFin =
                        fechaFinUtc,

                    Precio =
                        precioCita,

                    Estado =
                        EstadosCita.Pendiente,

                    Notas =
                        request.Notas?.Trim(),

                    FechaCreacion =
                        DateTime.UtcNow
                };

            _context.Citas.Add(cita);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje =
                    "Cita creada correctamente.",

                cita.Id,

                cita.ServicioId,

                cita.ServicioVarianteId,

                variante =
                    variante?.Nombre,

                cita.DuracionMinutos,

                fechaInicioLocal,

                fechaFinLocal,

                fechaInicioUtc,

                fechaFinUtc,

                cita.Precio,

                cita.Estado
            });
        }

        // ============================================================
        // CAMBIAR ESTADO
        // ============================================================

        [HttpPut("{id:int}/estado")]
        public async Task<IActionResult> ActualizarEstado(
            int id,
            ActualizarEstadoCitaDto request)
        {
            var tenantId =
                _tenantContext.TenantId;

            var cita =
                await _context.Citas
                    .FirstOrDefaultAsync(x =>
                        x.Id == id &&
                        x.TenantId ==
                            tenantId);

            if (cita == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "Cita no encontrada."
                });
            }

            var estadosValidos =
                new[]
                {
                    EstadosCita.Pendiente,
                    EstadosCita.Confirmada,
                    EstadosCita.EnProceso,
                    EstadosCita.Completada,
                    EstadosCita.Cancelada,
                    EstadosCita.NoAsistio
                };

            var estado =
                estadosValidos
                    .FirstOrDefault(x =>
                        x.Equals(
                            request.Estado,
                            StringComparison
                                .OrdinalIgnoreCase));

            if (estado == null)
            {
                return BadRequest(new
                {
                    mensaje =
                        "Estado de cita no válido."
                });
            }

            cita.Estado = estado;

            if (!string.IsNullOrWhiteSpace(
                request.Notas))
            {
                cita.Notas =
                    request.Notas.Trim();
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje =
                    "Estado actualizado correctamente.",

                cita.Id,
                cita.Estado
            });
        }

        // ============================================================
        // REPROGRAMAR
        // ============================================================

        [HttpPut("{id:int}/reprogramar")]
        public async Task<IActionResult> Reprogramar(
            int id,
            ReprogramarCitaDto request)
        {
            var tenantId =
                _tenantContext.TenantId;

            var cita =
                await _context.Citas
                    .FirstOrDefaultAsync(x =>
                        x.Id == id &&
                        x.TenantId ==
                            tenantId);

            if (cita == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "Cita no encontrada."
                });
            }

            if (cita.Estado ==
                EstadosCita.Cancelada)
            {
                return BadRequest(new
                {
                    mensaje =
                        "No se puede reprogramar una cita cancelada."
                });
            }

            if (cita.Estado ==
                EstadosCita.Completada)
            {
                return BadRequest(new
                {
                    mensaje =
                        "No se puede reprogramar una cita completada."
                });
            }

            if (cita.DuracionMinutos <= 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "La cita no tiene una duración válida."
                });
            }

            var inicioLocal =
                DateTime.SpecifyKind(
                    request.NuevaFechaInicio,
                    DateTimeKind.Unspecified);

            var finLocal =
                inicioLocal.AddMinutes(
                    cita.DuracionMinutos);

            var inicioUtc =
                await _timeZoneService
                    .LocalAUtcAsync(
                        tenantId,
                        inicioLocal);

            var finUtc =
                await _timeZoneService
                    .LocalAUtcAsync(
                        tenantId,
                        finLocal);

            var validacion =
                await ValidarDisponibilidad(
                    tenantId,
                    cita.ProfesionalId,
                    inicioLocal,
                    finLocal,
                    inicioUtc,
                    finUtc,
                    cita.Id);

            if (!validacion.EsValido)
            {
                return Conflict(new
                {
                    mensaje =
                        validacion.Mensaje
                });
            }

            cita.FechaInicio =
                inicioUtc;

            cita.FechaFin =
                finUtc;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje =
                    "Cita reprogramada correctamente.",

                cita.Id,

                cita.DuracionMinutos,

                fechaInicioLocal =
                    inicioLocal,

                fechaFinLocal =
                    finLocal,

                fechaInicioUtc =
                    cita.FechaInicio,

                fechaFinUtc =
                    cita.FechaFin,

                cita.Estado
            });
        }

        // ============================================================
        // ACCIONES RÁPIDAS
        // ============================================================

        [HttpPut("{id:int}/confirmar")]
        public async Task<IActionResult> Confirmar(
            int id)
        {
            return await CambiarEstadoRapido(
                id,
                EstadosCita.Confirmada,
                "Cita confirmada correctamente.");
        }

        [HttpPut("{id:int}/cancelar")]
        public async Task<IActionResult> Cancelar(
            int id)
        {
            return await CambiarEstadoRapido(
                id,
                EstadosCita.Cancelada,
                "Cita cancelada correctamente.");
        }

        [HttpPut("{id:int}/completar")]
        public async Task<IActionResult> Completar(
            int id)
        {
            return await CambiarEstadoRapido(
                id,
                EstadosCita.Completada,
                "Cita completada correctamente.");
        }

        [HttpPut("{id:int}/no-asistio")]
        public async Task<IActionResult> NoAsistio(
            int id)
        {
            return await CambiarEstadoRapido(
                id,
                EstadosCita.NoAsistio,
                "Cita marcada como no asistió.");
        }

        // ============================================================
        // CAMBIO DE ESTADO
        // ============================================================

        private async Task<IActionResult>
            CambiarEstadoRapido(
                int id,
                string nuevoEstado,
                string mensaje)
        {
            var tenantId =
                _tenantContext.TenantId;

            var cita =
                await _context.Citas
                    .FirstOrDefaultAsync(x =>
                        x.Id == id &&
                        x.TenantId ==
                            tenantId);

            if (cita == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "Cita no encontrada."
                });
            }

            cita.Estado =
                nuevoEstado;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje,
                cita.Id,
                cita.Estado
            });
        }

        // ============================================================
        // VALIDAR DISPONIBILIDAD
        // ============================================================

        private async Task<(bool EsValido, string Mensaje)>
            ValidarDisponibilidad(
                int tenantId,
                int profesionalId,
                DateTime fechaInicioLocal,
                DateTime fechaFinLocal,
                DateTime fechaInicioUtc,
                DateTime fechaFinUtc,
                int? citaExcluirId)
        {
            var diaSemana =
                fechaInicioLocal.DayOfWeek;

            var horaInicio =
                fechaInicioLocal.TimeOfDay;

            var horaFin =
                fechaFinLocal.TimeOfDay;

            // Por ahora las citas deben comenzar y terminar
            // dentro del mismo día laboral.
            if (fechaInicioLocal.Date !=
                fechaFinLocal.Date)
            {
                return (
                    false,
                    "La cita no puede finalizar en otro día."
                );
            }

            var horarioValido =
                await _context
                    .HorariosProfesionales
                    .AnyAsync(x =>
                        x.TenantId ==
                            tenantId &&
                        x.ProfesionalId ==
                            profesionalId &&
                        x.DiaSemana ==
                            diaSemana &&
                        x.Activo &&
                        horaInicio >=
                            x.HoraInicio &&
                        horaFin <=
                            x.HoraFin);

            if (!horarioValido)
            {
                return (
                    false,
                    "La cita está fuera del horario laboral del profesional."
                );
            }

            var existeBloqueo =
                await _context
                    .BloqueosProfesionales
                    .AnyAsync(x =>
                        x.TenantId ==
                            tenantId &&
                        x.ProfesionalId ==
                            profesionalId &&
                        fechaInicioUtc <
                            x.FechaFin &&
                        fechaFinUtc >
                            x.FechaInicio);

            if (existeBloqueo)
            {
                return (
                    false,
                    "El profesional tiene un bloqueo en ese horario."
                );
            }

            var existeChoque =
                await _context.Citas
                    .AnyAsync(x =>
                        x.TenantId ==
                            tenantId &&
                        x.ProfesionalId ==
                            profesionalId &&
                        x.Estado !=
                            EstadosCita.Cancelada &&
                        (!citaExcluirId.HasValue ||
                         x.Id !=
                            citaExcluirId.Value) &&
                        fechaInicioUtc <
                            x.FechaFin &&
                        fechaFinUtc >
                            x.FechaInicio);

            if (existeChoque)
            {
                return (
                    false,
                    "El profesional ya tiene una cita en ese horario."
                );
            }

            return (
                true,
                string.Empty
            );
        }
    }
}
