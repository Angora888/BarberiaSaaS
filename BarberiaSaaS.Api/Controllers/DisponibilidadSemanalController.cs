using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Models;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Controllers
{
    [ApiController]
    [Route("api/Disponibilidad")]
    [Authorize]
    public class DisponibilidadSemanalController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;
        private readonly ITimeZoneService _timeZoneService;

        public DisponibilidadSemanalController(
            AppDbContext context,
            ITenantContext tenantContext,
            ITimeZoneService timeZoneService)
        {
            _context = context;
            _tenantContext = tenantContext;
            _timeZoneService = timeZoneService;
        }

        [HttpPost("semana-siguiente")]
        public async Task<IActionResult> SemanaSiguiente(
            ConsultarDisponibilidadSemanaDto request)
        {
            var tenantId = _tenantContext.TenantId;

            if (request.ServicioId <= 0)
            {
                return BadRequest(new
                {
                    mensaje = "El servicio es requerido."
                });
            }

            if (request.DuracionMinutos <= 0)
            {
                return BadRequest(new
                {
                    mensaje = "La duración debe ser mayor a cero."
                });
            }

            var servicioExiste = await _context.Servicios
                .AnyAsync(x =>
                    x.Id == request.ServicioId &&
                    x.TenantId == tenantId &&
                    x.Activo);

            if (!servicioExiste)
            {
                return NotFound(new
                {
                    mensaje = "Servicio no encontrado."
                });
            }

            var profesionalesQuery =
                from profesional in _context.Profesionales
                join relacion in _context.ProfesionalServicios
                    on profesional.Id equals relacion.ProfesionalId
                where profesional.TenantId == tenantId &&
                      profesional.Activo &&
                      relacion.ServicioId == request.ServicioId
                select profesional;

            if (request.ProfesionalId.HasValue)
            {
                profesionalesQuery = profesionalesQuery
                    .Where(x => x.Id == request.ProfesionalId.Value);
            }

            var profesionales = await profesionalesQuery
                .Distinct()
                .Select(x => new
                {
                    x.Id,
                    x.Nombre,
                    x.Apellidos,
                    x.SucursalId
                })
                .OrderBy(x => x.Nombre)
                .ThenBy(x => x.Apellidos)
                .ToListAsync();

            if (profesionales.Count == 0)
            {
                return BadRequest(new
                {
                    mensaje = request.ProfesionalId.HasValue
                        ? "El profesional seleccionado no realiza este servicio o no está activo."
                        : "No hay profesionales activos que realicen este servicio."
                });
            }

            var ahoraLocal = await _timeZoneService
                .UtcALocalAsync(
                    tenantId,
                    DateTime.UtcNow);

            var inicioPeriodo = DateTime.SpecifyKind(
                ahoraLocal.Date,
                DateTimeKind.Unspecified);

            const int cantidadDias = 15;

            var finPeriodoExclusivo =
                inicioPeriodo.AddDays(cantidadDias);

            var inicioPeriodoUtc = await _timeZoneService
                .LocalAUtcAsync(
                    tenantId,
                    inicioPeriodo);

            var finPeriodoUtc = await _timeZoneService
                .LocalAUtcAsync(
                    tenantId,
                    finPeriodoExclusivo);

            var profesionalIds = profesionales
                .Select(x => x.Id)
                .ToList();

            var horarios = await _context.HorariosProfesionales
                .Where(x =>
                    x.TenantId == tenantId &&
                    profesionalIds.Contains(x.ProfesionalId) &&
                    x.Activo)
                .Select(x => new
                {
                    x.ProfesionalId,
                    x.DiaSemana,
                    x.HoraInicio,
                    x.HoraFin
                })
                .ToListAsync();

            var citas = await _context.Citas
                .Where(x =>
                    x.TenantId == tenantId &&
                    profesionalIds.Contains(x.ProfesionalId) &&
                    x.Estado != EstadosCita.Cancelada &&
                    x.FechaInicio < finPeriodoUtc &&
                    x.FechaFin > inicioPeriodoUtc)
                .Select(x => new
                {
                    x.ProfesionalId,
                    x.FechaInicio,
                    x.FechaFin
                })
                .ToListAsync();

            var bloqueos = await _context.BloqueosProfesionales
                .Where(x =>
                    x.TenantId == tenantId &&
                    profesionalIds.Contains(x.ProfesionalId) &&
                    x.FechaInicio < finPeriodoUtc &&
                    x.FechaFin > inicioPeriodoUtc)
                .Select(x => new
                {
                    x.ProfesionalId,
                    x.FechaInicio,
                    x.FechaFin
                })
                .ToListAsync();

            var duracionSlot = await _context.ConfiguracionesTenant
                .Where(x => x.TenantId == tenantId)
                .Select(x => x.DuracionSlotMinutos)
                .FirstOrDefaultAsync();

            if (duracionSlot <= 0)
            {
                duracionSlot = 15;
            }

            var dias = new List<object>();

            for (var indiceDia = 0; indiceDia < cantidadDias; indiceDia++)
            {
                var fechaLocal = inicioPeriodo.AddDays(indiceDia);
                var profesionalesDia = new List<object>();

                foreach (var profesional in profesionales)
                {
                    var horariosDia = horarios
                        .Where(x =>
                            x.ProfesionalId == profesional.Id &&
                            x.DiaSemana == fechaLocal.DayOfWeek)
                        .OrderBy(x => x.HoraInicio)
                        .ToList();

                    var horasDisponibles = new List<string>();

                    foreach (var horario in horariosDia)
                    {
                        var candidatoLocal = fechaLocal.Date
                            .Add(horario.HoraInicio);

                        var finHorarioLocal = fechaLocal.Date
                            .Add(horario.HoraFin);

                        while (candidatoLocal
                            .AddMinutes(request.DuracionMinutos) <= finHorarioLocal)
                        {
                            var candidatoFinLocal = candidatoLocal
                                .AddMinutes(request.DuracionMinutos);

                            var esHorarioPasado =
                                fechaLocal.Date == inicioPeriodo.Date &&
                                candidatoLocal <= ahoraLocal;

                            if (!esHorarioPasado)
                            {
                                var candidatoInicioUtc = await _timeZoneService
                                    .LocalAUtcAsync(
                                        tenantId,
                                        candidatoLocal);

                                var candidatoFinUtc = await _timeZoneService
                                    .LocalAUtcAsync(
                                        tenantId,
                                        candidatoFinLocal);

                                var chocaConCita = citas.Any(x =>
                                    x.ProfesionalId == profesional.Id &&
                                    candidatoInicioUtc < x.FechaFin &&
                                    candidatoFinUtc > x.FechaInicio);

                                var chocaConBloqueo = bloqueos.Any(x =>
                                    x.ProfesionalId == profesional.Id &&
                                    candidatoInicioUtc < x.FechaFin &&
                                    candidatoFinUtc > x.FechaInicio);

                                if (!chocaConCita && !chocaConBloqueo)
                                {
                                    horasDisponibles.Add(
                                        candidatoLocal.ToString("HH:mm"));
                                }
                            }

                            candidatoLocal = candidatoLocal
                                .AddMinutes(duracionSlot);
                        }
                    }

                    profesionalesDia.Add(new
                    {
                        profesionalId = profesional.Id,
                        profesionalNombre = $"{profesional.Nombre} {profesional.Apellidos}".Trim(),
                        horas = horasDisponibles
                            .Distinct()
                            .OrderBy(x => x)
                            .ToList()
                    });
                }

                dias.Add(new
                {
                    fecha = fechaLocal.ToString("yyyy-MM-dd"),
                    diaSemana = (int)fechaLocal.DayOfWeek,
                    profesionales = profesionalesDia
                });
            }

            return Ok(new
            {
                desde = inicioPeriodo.ToString("yyyy-MM-dd"),
                hasta = inicioPeriodo.AddDays(cantidadDias - 1).ToString("yyyy-MM-dd"),
                cantidadDias,
                duracionMinutos = request.DuracionMinutos,
                duracionSlotMinutos = duracionSlot,
                servicioId = request.ServicioId,
                profesionalId = request.ProfesionalId,
                dias
            });
        }
    }

    public class ConsultarDisponibilidadSemanaDto
    {
        public int ServicioId { get; set; }
        public int DuracionMinutos { get; set; }
        public int? ProfesionalId { get; set; }
    }
}
