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
    public class DisponibilidadController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;
        private readonly ITimeZoneService _timeZoneService;

        public DisponibilidadController(
            AppDbContext context,
            ITenantContext tenantContext,
            ITimeZoneService timeZoneService)
        {
            _context = context;
            _tenantContext = tenantContext;
            _timeZoneService = timeZoneService;
        }

        // ============================================================
        // CONSULTAR DISPONIBILIDAD
        //
        // POST:
        // /api/Disponibilidad/consultar
        // ============================================================

        [HttpPost("consultar")]
        public async Task<IActionResult> Consultar(
            ConsultarDisponibilidadDto request)
        {
            var tenantId =
                _tenantContext.TenantId;

            // ========================================================
            // VALIDACIONES BÁSICAS
            // ========================================================

            if (request.ProfesionalId <= 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El profesional es requerido."
                });
            }

            if (request.ServicioId <= 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El servicio es requerido."
                });
            }

            if (request.DuracionMinutos <= 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "La duración de la cita debe ser mayor a cero."
                });
            }

            // ========================================================
            // VALIDAR PROFESIONAL
            // ========================================================

            var profesional =
                await _context.Profesionales
                    .Where(x =>
                        x.Id == request.ProfesionalId &&
                        x.TenantId == tenantId &&
                        x.Activo)
                    .Select(x => new
                    {
                        x.Id,
                        x.Nombre,
                        x.Apellidos,
                        x.SucursalId
                    })
                    .FirstOrDefaultAsync();

            if (profesional == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "Profesional no encontrado."
                });
            }

            // ========================================================
            // VALIDAR SERVICIO
            // ========================================================

            var servicio =
                await _context.Servicios
                    .Where(x =>
                        x.Id == request.ServicioId &&
                        x.TenantId == tenantId &&
                        x.Activo)
                    .Select(x => new
                    {
                        x.Id,
                        x.Nombre,
                        x.Precio
                    })
                    .FirstOrDefaultAsync();

            if (servicio == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "Servicio no encontrado."
                });
            }

            // ========================================================
            // VALIDAR QUE EL PROFESIONAL HAGA EL SERVICIO
            // ========================================================

            var profesionalRealizaServicio =
                await _context.ProfesionalServicios
                    .AnyAsync(x =>
                        x.ProfesionalId ==
                            request.ProfesionalId &&
                        x.ServicioId ==
                            request.ServicioId);

            if (!profesionalRealizaServicio)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El profesional seleccionado no realiza este servicio."
                });
            }

            // ========================================================
            // FECHA LOCAL DEL NEGOCIO
            // ========================================================

            var fechaLocal =
                DateTime.SpecifyKind(
                    request.Fecha.Date,
                    DateTimeKind.Unspecified);

            var diaSemana =
                fechaLocal.DayOfWeek;

            // ========================================================
            // HORARIOS LABORALES DEL PROFESIONAL
            // ========================================================

            var horarios =
                await _context.HorariosProfesionales
                    .Where(x =>
                        x.TenantId == tenantId &&
                        x.ProfesionalId ==
                            request.ProfesionalId &&
                        x.DiaSemana ==
                            diaSemana &&
                        x.Activo)
                    .OrderBy(x =>
                        x.HoraInicio)
                    .ToListAsync();

            if (horarios.Count == 0)
            {
                return Ok(new List<object>());
            }

            // ========================================================
            // RANGO COMPLETO DEL DÍA LOCAL
            // ========================================================

            var inicioDiaLocal =
                fechaLocal.Date;

            var finDiaLocal =
                fechaLocal.Date.AddDays(1);

            var inicioDiaUtc =
                await _timeZoneService
                    .LocalAUtcAsync(
                        tenantId,
                        inicioDiaLocal);

            var finDiaUtc =
                await _timeZoneService
                    .LocalAUtcAsync(
                        tenantId,
                        finDiaLocal);

            // ========================================================
            // CITAS EXISTENTES
            // ========================================================

            var citas =
                await _context.Citas
                    .Where(x =>
                        x.TenantId == tenantId &&
                        x.ProfesionalId ==
                            request.ProfesionalId &&
                        x.Estado !=
                            EstadosCita.Cancelada &&
                        x.FechaInicio <
                            finDiaUtc &&
                        x.FechaFin >
                            inicioDiaUtc)
                    .Select(x => new
                    {
                        x.FechaInicio,
                        x.FechaFin
                    })
                    .ToListAsync();

            // ========================================================
            // BLOQUEOS
            // ========================================================

            var bloqueos =
                await _context.BloqueosProfesionales
                    .Where(x =>
                        x.TenantId == tenantId &&
                        x.ProfesionalId ==
                            request.ProfesionalId &&
                        x.FechaInicio <
                            finDiaUtc &&
                        x.FechaFin >
                            inicioDiaUtc)
                    .Select(x => new
                    {
                        x.FechaInicio,
                        x.FechaFin
                    })
                    .ToListAsync();

            // ========================================================
            // CONFIGURACIÓN DEL TENANT
            // ========================================================

            var duracionSlot =
                await _context.ConfiguracionesTenant
                    .Where(x =>
                        x.TenantId == tenantId)
                    .Select(x =>
                        x.DuracionSlotMinutos)
                    .FirstOrDefaultAsync();

            if (duracionSlot <= 0)
            {
                duracionSlot = 15;
            }

            // ========================================================
            // GENERAR HORARIOS DISPONIBLES
            // ========================================================

            var resultado =
                new List<object>();

            foreach (var horario in horarios)
            {
                var inicioHorarioLocal =
                    fechaLocal.Date
                        .Add(horario.HoraInicio);

                var finHorarioLocal =
                    fechaLocal.Date
                        .Add(horario.HoraFin);

                var candidatoLocal =
                    inicioHorarioLocal;

                while (
                    candidatoLocal
                        .AddMinutes(
                            request.DuracionMinutos)
                    <= finHorarioLocal)
                {
                    var candidatoFinLocal =
                        candidatoLocal
                            .AddMinutes(
                                request.DuracionMinutos);

                    var candidatoInicioUtc =
                        await _timeZoneService
                            .LocalAUtcAsync(
                                tenantId,
                                candidatoLocal);

                    var candidatoFinUtc =
                        await _timeZoneService
                            .LocalAUtcAsync(
                                tenantId,
                                candidatoFinLocal);

                    var chocaConCita =
                        citas.Any(x =>
                            candidatoInicioUtc <
                                x.FechaFin &&
                            candidatoFinUtc >
                                x.FechaInicio);

                    var chocaConBloqueo =
                        bloqueos.Any(x =>
                            candidatoInicioUtc <
                                x.FechaFin &&
                            candidatoFinUtc >
                                x.FechaInicio);

                    if (
                        !chocaConCita &&
                        !chocaConBloqueo)
                    {
                        resultado.Add(new
                        {
                            horaInicio =
                                candidatoLocal
                                    .ToString("HH:mm"),

                            horaFin =
                                candidatoFinLocal
                                    .ToString("HH:mm"),

                            fechaInicioLocal =
                                candidatoLocal,

                            fechaFinLocal =
                                candidatoFinLocal,

                            fechaInicioUtc =
                                candidatoInicioUtc,

                            fechaFinUtc =
                                candidatoFinUtc,

                            duracionMinutos =
                                request.DuracionMinutos
                        });
                    }

                    candidatoLocal =
                        candidatoLocal
                            .AddMinutes(
                                duracionSlot);
                }
            }

            return Ok(resultado);
        }
    }
}