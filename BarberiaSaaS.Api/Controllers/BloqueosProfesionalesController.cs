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
    [Route("api/profesionales/{profesionalId:int}/bloqueos")]
    [Authorize]
    public class BloqueosProfesionalesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;
        private readonly ITimeZoneService _timeZoneService;

        public BloqueosProfesionalesController(
            AppDbContext context,
            ITenantContext tenantContext,
            ITimeZoneService timeZoneService)
        {
            _context = context;
            _tenantContext = tenantContext;
            _timeZoneService = timeZoneService;
        }

        // ============================================================
        // LISTAR BLOQUEOS
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> Get(
            int profesionalId)
        {
            var tenantId =
                _tenantContext.TenantId;

            var profesionalExiste =
                await _context.Profesionales
                    .AnyAsync(x =>
                        x.Id == profesionalId &&
                        x.TenantId == tenantId);

            if (!profesionalExiste)
            {
                return NotFound(new
                {
                    mensaje =
                        "Profesional no encontrado."
                });
            }

            var registros =
                await _context.BloqueosProfesionales
                    .Where(x =>
                        x.TenantId == tenantId &&
                        x.ProfesionalId ==
                            profesionalId)
                    .OrderBy(x =>
                        x.FechaInicio)
                    .ToListAsync();

            var resultado =
                new List<object>();

            foreach (var bloqueo in registros)
            {
                var inicioLocal =
                    await _timeZoneService
                        .UtcALocalAsync(
                            tenantId,
                            bloqueo.FechaInicio);

                var finLocal =
                    await _timeZoneService
                        .UtcALocalAsync(
                            tenantId,
                            bloqueo.FechaFin);

                resultado.Add(new
                {
                    bloqueo.Id,

                    fechaInicioUtc =
                        bloqueo.FechaInicio,

                    fechaFinUtc =
                        bloqueo.FechaFin,

                    fechaInicioLocal =
                        inicioLocal,

                    fechaFinLocal =
                        finLocal,

                    bloqueo.Motivo
                });
            }

            return Ok(resultado);
        }

        // ============================================================
        // CREAR BLOQUEO
        // ============================================================

        [HttpPost]
        public async Task<IActionResult> Crear(
            int profesionalId,
            CrearBloqueoProfesionalDto request)
        {
            var tenantId =
                _tenantContext.TenantId;

            if (request.FechaFin <=
                request.FechaInicio)
            {
                return BadRequest(new
                {
                    mensaje =
                        "La fecha final debe ser posterior a la fecha inicial."
                });
            }

            var profesionalExiste =
                await _context.Profesionales
                    .AnyAsync(x =>
                        x.Id == profesionalId &&
                        x.TenantId == tenantId &&
                        x.Activo);

            if (!profesionalExiste)
            {
                return NotFound(new
                {
                    mensaje =
                        "Profesional no encontrado."
                });
            }

            var fechaInicioUtc =
                await _timeZoneService
                    .LocalAUtcAsync(
                        tenantId,
                        request.FechaInicio);

            var fechaFinUtc =
                await _timeZoneService
                    .LocalAUtcAsync(
                        tenantId,
                        request.FechaFin);

            if (fechaFinUtc <=
                fechaInicioUtc)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El rango del bloqueo no es válido."
                });
            }

            var existeBloqueo =
                await _context
                    .BloqueosProfesionales
                    .AnyAsync(x =>
                        x.TenantId == tenantId &&
                        x.ProfesionalId ==
                            profesionalId &&
                        fechaInicioUtc <
                            x.FechaFin &&
                        fechaFinUtc >
                            x.FechaInicio);

            if (existeBloqueo)
            {
                return Conflict(new
                {
                    mensaje =
                        "Ya existe un bloqueo que coincide con ese horario."
                });
            }

            var bloqueo =
                new BloqueoProfesional
                {
                    TenantId =
                        tenantId,

                    ProfesionalId =
                        profesionalId,

                    FechaInicio =
                        fechaInicioUtc,

                    FechaFin =
                        fechaFinUtc,

                    Motivo =
                        request.Motivo?.Trim(),

                    FechaCreacion =
                        DateTime.UtcNow
                };

            _context
                .BloqueosProfesionales
                .Add(bloqueo);

            await _context
                .SaveChangesAsync();

            return Ok(new
            {
                mensaje =
                    "Bloqueo creado correctamente.",

                bloqueo.Id,

                fechaInicioLocal =
                    request.FechaInicio,

                fechaFinLocal =
                    request.FechaFin,

                fechaInicioUtc,

                fechaFinUtc,

                bloqueo.Motivo
            });
        }

        // ============================================================
        // ELIMINAR BLOQUEO
        // ============================================================

        [HttpDelete("{bloqueoId:int}")]
        public async Task<IActionResult> Eliminar(
            int profesionalId,
            int bloqueoId)
        {
            var tenantId =
                _tenantContext.TenantId;

            var bloqueo =
                await _context
                    .BloqueosProfesionales
                    .FirstOrDefaultAsync(x =>
                        x.Id == bloqueoId &&
                        x.ProfesionalId ==
                            profesionalId &&
                        x.TenantId ==
                            tenantId);

            if (bloqueo == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "Bloqueo no encontrado."
                });
            }

            _context
                .BloqueosProfesionales
                .Remove(bloqueo);

            await _context
                .SaveChangesAsync();

            return Ok(new
            {
                mensaje =
                    "Bloqueo eliminado correctamente."
            });
        }
    }
}