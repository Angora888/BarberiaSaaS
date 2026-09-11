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
    [Route("api/profesionales/{profesionalId:int}/horarios")]
    [Authorize]
    public class HorariosProfesionalesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public HorariosProfesionalesController(
            AppDbContext context,
            ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        [HttpGet]
        public async Task<IActionResult> Get(int profesionalId)
        {
            var tenantId = _tenantContext.TenantId;

            var profesionalExiste = await _context.Profesionales
                .AnyAsync(x =>
                    x.Id == profesionalId &&
                    x.TenantId == tenantId);

            if (!profesionalExiste)
            {
                return NotFound(new
                {
                    mensaje = "Profesional no encontrado."
                });
            }

            var horarios = await _context.HorariosProfesionales
                .Where(x =>
                    x.ProfesionalId == profesionalId &&
                    x.TenantId == tenantId)
                .OrderBy(x => x.DiaSemana)
                .ThenBy(x => x.HoraInicio)
                .Select(x => new
                {
                    x.Id,
                    diaSemana = (int)x.DiaSemana,
                    nombreDia = x.DiaSemana.ToString(),
                    x.HoraInicio,
                    x.HoraFin,
                    x.Activo
                })
                .ToListAsync();

            return Ok(horarios);
        }

        [HttpPost]
        public async Task<IActionResult> Crear(
            int profesionalId,
            CrearHorarioProfesionalDto request)
        {
            var tenantId = _tenantContext.TenantId;

            if (request.DiaSemana < 0 || request.DiaSemana > 6)
            {
                return BadRequest(new
                {
                    mensaje = "DiaSemana debe estar entre 0 y 6."
                });
            }

            if (request.HoraFin <= request.HoraInicio)
            {
                return BadRequest(new
                {
                    mensaje = "HoraFin debe ser mayor que HoraInicio."
                });
            }

            var profesional = await _context.Profesionales
                .FirstOrDefaultAsync(x =>
                    x.Id == profesionalId &&
                    x.TenantId == tenantId &&
                    x.Activo);

            if (profesional == null)
            {
                return NotFound(new
                {
                    mensaje = "Profesional no encontrado."
                });
            }

            var dia = (DayOfWeek)request.DiaSemana;

            var existeTraslape = await _context.HorariosProfesionales
                .AnyAsync(x =>
                    x.TenantId == tenantId &&
                    x.ProfesionalId == profesionalId &&
                    x.DiaSemana == dia &&
                    x.Activo &&
                    request.HoraInicio < x.HoraFin &&
                    request.HoraFin > x.HoraInicio);

            if (existeTraslape)
            {
                return Conflict(new
                {
                    mensaje = "El horario se traslapa con otro horario existente."
                });
            }

            var horario = new HorarioProfesional
            {
                TenantId = tenantId,
                ProfesionalId = profesionalId,
                DiaSemana = dia,
                HoraInicio = request.HoraInicio,
                HoraFin = request.HoraFin,
                Activo = true
            };

            _context.HorariosProfesionales.Add(horario);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Horario creado correctamente.",
                horario.Id,
                diaSemana = (int)horario.DiaSemana,
                horario.HoraInicio,
                horario.HoraFin
            });
        }
    }
}