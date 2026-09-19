using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Models;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Controllers
{
    [ApiController]
    [Route("api/Publico/{slug}/disponibilidad")]
    [AllowAnonymous]
    public class DisponibilidadPublicaController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITimeZoneService _timeZoneService;

        public DisponibilidadPublicaController(
            AppDbContext context,
            ITimeZoneService timeZoneService)
        {
            _context = context;
            _timeZoneService = timeZoneService;
        }

        // ============================================================
        // GET
        // /api/Publico/{slug}/disponibilidad
        //
        // Ejemplo:
        // /api/Publico/jana-beauty-studio/disponibilidad
        // ?servicioId=1
        // &duracionMinutos=60
        // &desde=2026-09-13
        // &dias=30
        // &profesionalId=2
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> Consultar(
            string slug,
            [FromQuery] int servicioId,
            [FromQuery] int duracionMinutos,
            [FromQuery] DateTime? desde,
            [FromQuery] int dias = 30,
            [FromQuery] int? profesionalId = null)
        {
            // ========================================================
            // VALIDACIONES
            // ========================================================

            if (string.IsNullOrWhiteSpace(slug))
            {
                return BadRequest(new
                {
                    mensaje = "El slug es obligatorio."
                });
            }

            if (servicioId <= 0)
            {
                return BadRequest(new
                {
                    mensaje = "El servicio es obligatorio."
                });
            }

            if (duracionMinutos <= 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "La duración debe ser mayor a cero."
                });
            }

            if (dias <= 0)
            {
                dias = 30;
            }

            if (dias > 62)
            {
                dias = 62;
            }

            slug = slug
                .Trim()
                .ToLowerInvariant();

            // ========================================================
            // TENANT PÚBLICO
            // ========================================================

            var tenant = await _context.Tenants
                .AsNoTracking()
                .Where(x =>
                    x.Activo &&
                    x.LandingPublicaActiva &&
                    x.SlugPublico != null &&
                    x.SlugPublico.ToLower() == slug)
                .Select(x => new
                {
                    x.Id,
                    x.Nombre,
                    x.NombreComercial
                })
                .FirstOrDefaultAsync();

            if (tenant == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "La página pública del negocio no está disponible."
                });
            }

            var tenantId = tenant.Id;

            // ========================================================
            // SERVICIO
            // ========================================================

            var servicio = await _context.Servicios
                .AsNoTracking()
                .Where(x =>
                    x.Id == servicioId &&
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
            // PROFESIONALES QUE REALIZAN EL SERVICIO
            // ========================================================

            var profesionalesQuery =
                from profesional in _context.Profesionales
                join relacion in _context.ProfesionalServicios
                    on profesional.Id equals relacion.ProfesionalId
                where
                    profesional.TenantId == tenantId &&
                    profesional.Activo &&
                    relacion.ServicioId == servicioId
                select profesional;

            if (profesionalId.HasValue)
            {
                profesionalesQuery =
                    profesionalesQuery.Where(x =>
                        x.Id == profesionalId.Value);
            }

            var profesionales =
                await profesionalesQuery
                    .AsNoTracking()
                    .Distinct()
                    .Select(x => new
                    {
                        x.Id,
                        x.Nombre,
                        x.Apellidos,
                        x.Especialidad,
                        x.FotoUrl,
                        x.SucursalId
                    })
                    .OrderBy(x => x.Nombre)
                    .ThenBy(x => x.Apellidos)
                    .ToListAsync();

            if (profesionales.Count == 0)
            {
                return Ok(new
                {
                    negocio = new
                    {
                        id = tenant.Id,

                        nombre =
                            string.IsNullOrWhiteSpace(
                                tenant.NombreComercial)
                                ? tenant.Nombre
                                : tenant.NombreComercial
                    },

                    servicio,

                    desde = (string?)null,

                    hasta = (string?)null,

                    dias = new List<object>()
                });
            }

            // ========================================================
            // FECHA / HORA ACTUAL LOCAL Y FECHA INICIAL LOCAL
            // ========================================================

            var ahoraLocal =
                await _timeZoneService
                    .UtcALocalAsync(
                        tenantId,
                        DateTime.UtcNow);

            ahoraLocal = DateTime.SpecifyKind(
                ahoraLocal,
                DateTimeKind.Unspecified);

            DateTime fechaInicialLocal;

            if (desde.HasValue)
            {
                fechaInicialLocal =
                    DateTime.SpecifyKind(
                        desde.Value.Date,
                        DateTimeKind.Unspecified);
            }
            else
            {
                fechaInicialLocal =
                    DateTime.SpecifyKind(
                        ahoraLocal.Date,
                        DateTimeKind.Unspecified);
            }

            var fechaFinalExclusiva =
                fechaInicialLocal.AddDays(dias);

            var fechaInicioUtc =
                await _timeZoneService
                    .LocalAUtcAsync(
                        tenantId,
                        fechaInicialLocal);

            var fechaFinUtc =
                await _timeZoneService
                    .LocalAUtcAsync(
                        tenantId,
                        fechaFinalExclusiva);

            var profesionalIds =
                profesionales
                    .Select(x => x.Id)
                    .ToList();

            // ========================================================
            // HORARIOS
            // ========================================================

            var horarios =
                await _context.HorariosProfesionales
                    .AsNoTracking()
                    .Where(x =>
                        x.TenantId == tenantId &&
                        profesionalIds.Contains(
                            x.ProfesionalId) &&
                        x.Activo)
                    .Select(x => new
                    {
                        x.ProfesionalId,
                        x.DiaSemana,
                        x.HoraInicio,
                        x.HoraFin
                    })
                    .ToListAsync();

            var almuerzos = await _context.AlmuerzosProfesionales
                .AsNoTracking()
                .Where(x => x.TenantId == tenantId && profesionalIds.Contains(x.ProfesionalId) && x.Activo)
                .Select(x => new { x.ProfesionalId, x.DiaSemana, x.HoraInicio, x.HoraFin })
                .ToListAsync();

            // ========================================================
            // CITAS
            // ========================================================

            var citas =
                await _context.Citas
                    .AsNoTracking()
                    .Where(x =>
                        x.TenantId == tenantId &&
                        profesionalIds.Contains(
                            x.ProfesionalId) &&
                        x.Estado !=
                            EstadosCita.Cancelada &&
                        x.FechaInicio <
                            fechaFinUtc &&
                        x.FechaFin >
                            fechaInicioUtc)
                    .Select(x => new
                    {
                        x.ProfesionalId,
                        x.FechaInicio,
                        x.FechaFin
                    })
                    .ToListAsync();

            // ========================================================
            // BLOQUEOS
            // ========================================================

            var bloqueos =
                await _context.BloqueosProfesionales
                    .AsNoTracking()
                    .Where(x =>
                        x.TenantId == tenantId &&
                        profesionalIds.Contains(
                            x.ProfesionalId) &&
                        x.FechaInicio <
                            fechaFinUtc &&
                        x.FechaFin >
                            fechaInicioUtc)
                    .Select(x => new
                    {
                        x.ProfesionalId,
                        x.FechaInicio,
                        x.FechaFin
                    })
                    .ToListAsync();

            // ========================================================
            // DURACIÓN DEL SLOT
            // ========================================================

            var duracionSlot =
                await _context.ConfiguracionesTenant
                    .AsNoTracking()
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
            // GENERAR DISPONIBILIDAD
            // ========================================================

            var diasResultado =
                new List<object>();

            for (
                var indiceDia = 0;
                indiceDia < dias;
                indiceDia++)
            {
                var fechaLocal =
                    fechaInicialLocal
                        .AddDays(indiceDia);

                var profesionalesDia =
                    new List<object>();

                var totalHorasDia = 0;

                foreach (
                    var profesional
                    in profesionales)
                {
                    var horariosDia =
                        horarios
                            .Where(x =>
                                x.ProfesionalId ==
                                    profesional.Id &&
                                x.DiaSemana ==
                                    fechaLocal.DayOfWeek)
                            .OrderBy(x =>
                                x.HoraInicio)
                            .ToList();

                    var horasDisponibles =
                        new List<string>();

                    foreach (
                        var horario
                        in horariosDia)
                    {
                        var candidatoLocal =
                            fechaLocal.Date
                                .Add(
                                    horario.HoraInicio);

                        var finHorarioLocal =
                            fechaLocal.Date
                                .Add(
                                    horario.HoraFin);

                        while (
                            candidatoLocal
                                .AddMinutes(
                                    duracionMinutos)
                            <= finHorarioLocal)
                        {
                            var candidatoFinLocal =
                                candidatoLocal
                                    .AddMinutes(
                                        duracionMinutos);

                            // En la landing pública nunca mostramos
                            // espacios cuyo inicio ya quedó en el pasado.
                            // Esto se evalúa con la zona horaria del negocio.
                            var estaEnElPasado =
                                candidatoLocal < ahoraLocal;

                            if (estaEnElPasado)
                            {
                                candidatoLocal =
                                    candidatoLocal
                                        .AddMinutes(
                                            duracionSlot);

                                continue;
                            }

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
                                    x.ProfesionalId ==
                                        profesional.Id &&
                                    candidatoInicioUtc <
                                        x.FechaFin &&
                                    candidatoFinUtc >
                                        x.FechaInicio);

                            var chocaConBloqueo =
                                bloqueos.Any(x =>
                                    x.ProfesionalId ==
                                        profesional.Id &&
                                    candidatoInicioUtc <
                                        x.FechaFin &&
                                    candidatoFinUtc >
                                        x.FechaInicio);

                            var chocaConAlmuerzo = almuerzos.Any(x =>
                                x.ProfesionalId == profesional.Id &&
                                x.DiaSemana == fechaLocal.DayOfWeek &&
                                candidatoLocal.TimeOfDay < x.HoraFin &&
                                candidatoFinLocal.TimeOfDay > x.HoraInicio);

                            if (
                                !chocaConCita &&
                                !chocaConBloqueo &&
                                !chocaConAlmuerzo)
                            {
                                horasDisponibles.Add(
                                    candidatoLocal
                                        .ToString(
                                            "HH:mm"));
                            }

                            candidatoLocal =
                                candidatoLocal
                                    .AddMinutes(
                                        duracionSlot);
                        }
                    }

                    var horasFinales =
                        horasDisponibles
                            .Distinct()
                            .OrderBy(x => x)
                            .ToList();

                    if (horasFinales.Count > 0)
                    {
                        totalHorasDia +=
                            horasFinales.Count;

                        profesionalesDia.Add(
                            new
                            {
                                profesionalId =
                                    profesional.Id,

                                profesionalNombre =
                                    $"{profesional.Nombre} {profesional.Apellidos}"
                                        .Trim(),

                                profesional.Especialidad,

                                profesional.FotoUrl,

                                profesional.SucursalId,

                                horas =
                                    horasFinales
                            });
                    }
                }

                diasResultado.Add(new
                {
                    fecha =
                        fechaLocal
                            .ToString(
                                "yyyy-MM-dd"),

                    diaSemana =
                        (int)fechaLocal.DayOfWeek,

                    tieneDisponibilidad =
                        totalHorasDia > 0,

                    cantidadHorarios =
                        totalHorasDia,

                    profesionales =
                        profesionalesDia
                });
            }

            // ========================================================
            // RESPUESTA
            // ========================================================

            return Ok(new
            {
                negocio = new
                {
                    id = tenant.Id,

                    nombre =
                        string.IsNullOrWhiteSpace(
                            tenant.NombreComercial)
                            ? tenant.Nombre
                            : tenant.NombreComercial
                },

                servicio = new
                {
                    servicio.Id,
                    servicio.Nombre,
                    servicio.Precio
                },

                profesionalId,

                duracionMinutos,

                duracionSlotMinutos =
                    duracionSlot,

                desde =
                    fechaInicialLocal
                        .ToString(
                            "yyyy-MM-dd"),

                hasta =
                    fechaFinalExclusiva
                        .AddDays(-1)
                        .ToString(
                            "yyyy-MM-dd"),

                dias =
                    diasResultado
            });
        }
    }
}