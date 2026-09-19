using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Models;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Controllers
{
    public class GuardarAlmuerzoProfesionalDto
    {
        public TimeSpan HoraInicio { get; set; }
        public TimeSpan HoraFin { get; set; }
    }

    [ApiController]
    [Route("api/profesionales/{profesionalId:int}/almuerzos")]
    [Authorize]
    public class AlmuerzosProfesionalesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public AlmuerzosProfesionalesController(AppDbContext context, ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        [HttpGet]
        public async Task<IActionResult> Get(int profesionalId)
        {
            var tenantId = _tenantContext.TenantId;
            if (!await _context.Profesionales.AnyAsync(x => x.Id == profesionalId && x.TenantId == tenantId))
                return NotFound(new { mensaje = "Profesional no encontrado." });

            var almuerzos = await _context.AlmuerzosProfesionales
                .Where(x => x.TenantId == tenantId && x.ProfesionalId == profesionalId && x.Activo)
                .OrderBy(x => x.DiaSemana).ThenBy(x => x.HoraInicio)
                .Select(x => new { x.Id, diaSemana = (int)x.DiaSemana, x.HoraInicio, x.HoraFin, x.Activo })
                .ToListAsync();

            return Ok(almuerzos);
        }

        [HttpPost]
        public async Task<IActionResult> Guardar(int profesionalId, GuardarAlmuerzoProfesionalDto request)
        {
            var tenantId = _tenantContext.TenantId;
            if (request.HoraFin <= request.HoraInicio)
                return BadRequest(new { mensaje = "La hora final debe ser posterior a la hora inicial." });

            if (!await _context.Profesionales.AnyAsync(x => x.Id == profesionalId && x.TenantId == tenantId && x.Activo))
                return NotFound(new { mensaje = "Profesional no encontrado." });

            var horarios = await _context.HorariosProfesionales
                .Where(x => x.TenantId == tenantId && x.ProfesionalId == profesionalId && x.Activo)
                .Select(x => new { x.DiaSemana, x.HoraInicio, x.HoraFin })
                .ToListAsync();

            var diasAplicables = horarios
                .Where(x => request.HoraInicio >= x.HoraInicio && request.HoraFin <= x.HoraFin)
                .Select(x => x.DiaSemana)
                .Distinct()
                .ToList();

            if (diasAplicables.Count == 0)
                return BadRequest(new { mensaje = "La hora de almuerzo no coincide con ninguno de los días laborales del profesional." });

            var existentes = await _context.AlmuerzosProfesionales
                .Where(x => x.TenantId == tenantId && x.ProfesionalId == profesionalId)
                .ToListAsync();

            _context.AlmuerzosProfesionales.RemoveRange(
                existentes.Where(x => !diasAplicables.Contains(x.DiaSemana)));

            foreach (var dia in diasAplicables)
            {
                var almuerzo = existentes.FirstOrDefault(x => x.DiaSemana == dia);
                if (almuerzo == null)
                {
                    almuerzo = new AlmuerzoProfesional
                    {
                        TenantId = tenantId,
                        ProfesionalId = profesionalId,
                        DiaSemana = dia
                    };
                    _context.AlmuerzosProfesionales.Add(almuerzo);
                }

                almuerzo.HoraInicio = request.HoraInicio;
                almuerzo.HoraFin = request.HoraFin;
                almuerzo.Activo = true;
            }

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Hora de almuerzo guardada para los días laborales.", dias = diasAplicables.Select(x => (int)x) });
        }

        [HttpDelete]
        public async Task<IActionResult> EliminarTodos(int profesionalId)
        {
            var tenantId = _tenantContext.TenantId;
            var almuerzos = await _context.AlmuerzosProfesionales
                .Where(x => x.ProfesionalId == profesionalId && x.TenantId == tenantId)
                .ToListAsync();

            if (almuerzos.Count > 0)
            {
                _context.AlmuerzosProfesionales.RemoveRange(almuerzos);
                await _context.SaveChangesAsync();
            }

            return Ok(new { mensaje = "Hora de almuerzo desactivada." });
        }

        [HttpDelete("{almuerzoId:int}")]
        public async Task<IActionResult> Eliminar(int profesionalId, int almuerzoId)
        {
            var tenantId = _tenantContext.TenantId;
            var almuerzo = await _context.AlmuerzosProfesionales.FirstOrDefaultAsync(x =>
                x.Id == almuerzoId && x.ProfesionalId == profesionalId && x.TenantId == tenantId);
            if (almuerzo == null) return NotFound(new { mensaje = "Hora de almuerzo no encontrada." });

            _context.AlmuerzosProfesionales.Remove(almuerzo);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Hora de almuerzo eliminada." });
        }
    }
}
