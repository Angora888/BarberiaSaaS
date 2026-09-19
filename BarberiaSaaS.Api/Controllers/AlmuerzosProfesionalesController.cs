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
        public int DiaSemana { get; set; }
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
            if (request.DiaSemana < 0 || request.DiaSemana > 6)
                return BadRequest(new { mensaje = "DiaSemana debe estar entre 0 y 6." });
            if (request.HoraFin <= request.HoraInicio)
                return BadRequest(new { mensaje = "La hora final debe ser posterior a la hora inicial." });

            if (!await _context.Profesionales.AnyAsync(x => x.Id == profesionalId && x.TenantId == tenantId && x.Activo))
                return NotFound(new { mensaje = "Profesional no encontrado." });

            var dia = (DayOfWeek)request.DiaSemana;
            var dentroHorario = await _context.HorariosProfesionales.AnyAsync(x =>
                x.TenantId == tenantId && x.ProfesionalId == profesionalId && x.DiaSemana == dia && x.Activo &&
                request.HoraInicio >= x.HoraInicio && request.HoraFin <= x.HoraFin);

            if (!dentroHorario)
                return BadRequest(new { mensaje = "La hora de almuerzo debe estar dentro del horario laboral de ese día." });

            var almuerzo = await _context.AlmuerzosProfesionales
                .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.ProfesionalId == profesionalId && x.DiaSemana == dia);

            if (almuerzo == null)
            {
                almuerzo = new AlmuerzoProfesional { TenantId = tenantId, ProfesionalId = profesionalId, DiaSemana = dia };
                _context.AlmuerzosProfesionales.Add(almuerzo);
            }

            almuerzo.HoraInicio = request.HoraInicio;
            almuerzo.HoraFin = request.HoraFin;
            almuerzo.Activo = true;
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Hora de almuerzo guardada.", almuerzo.Id, diaSemana = (int)almuerzo.DiaSemana, almuerzo.HoraInicio, almuerzo.HoraFin });
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