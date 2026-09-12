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

            var validacion = ValidarHorario(request);
            if (validacion != null)
            {
                return validacion;
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
                horario.HoraFin,
                horario.Activo
            });
        }

        [HttpPut("{horarioId:int}")]
        public async Task<IActionResult> Actualizar(
            int profesionalId,
            int horarioId,
            CrearHorarioProfesionalDto request)
        {
            var tenantId = _tenantContext.TenantId;

            var validacion = ValidarHorario(request);
            if (validacion != null)
            {
                return validacion;
            }

            var horario = await _context.HorariosProfesionales
                .FirstOrDefaultAsync(x =>
                    x.Id == horarioId &&
                    x.ProfesionalId == profesionalId &&
                    x.TenantId == tenantId);

            if (horario == null)
            {
                return NotFound(new
                {
                    mensaje = "Horario no encontrado."
                });
            }

            var dia = (DayOfWeek)request.DiaSemana;

            var existeTraslape = await _context.HorariosProfesionales
                .AnyAsync(x =>
                    x.Id != horarioId &&
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

            horario.DiaSemana = dia;
            horario.HoraInicio = request.HoraInicio;
            horario.HoraFin = request.HoraFin;
            horario.Activo = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Horario actualizado correctamente.",
                horario.Id,
                diaSemana = (int)horario.DiaSemana,
                horario.HoraInicio,
                horario.HoraFin,
                horario.Activo
            });
        }

        [HttpDelete("{horarioId:int}")]
        public async Task<IActionResult> Eliminar(
            int profesionalId,
            int horarioId)
        {
            var tenantId = _tenantContext.TenantId;

            var horario = await _context.HorariosProfesionales
                .FirstOrDefaultAsync(x =>
                    x.Id == horarioId &&
                    x.ProfesionalId == profesionalId &&
                    x.TenantId == tenantId);

            if (horario == null)
            {
                return NotFound(new
                {
                    mensaje = "Horario no encontrado."
                });
            }

            _context.HorariosProfesionales.Remove(horario);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Horario eliminado correctamente."
            });
        }

        private BadRequestObjectResult? ValidarHorario(
            CrearHorarioProfesionalDto request)
        {
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

            return null;
        }
    }
}