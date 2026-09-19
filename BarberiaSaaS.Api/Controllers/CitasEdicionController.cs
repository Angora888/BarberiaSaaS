using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Models;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Controllers
{
    [ApiController]
    [Route("api/Citas")]
    [Authorize]
    public class CitasEdicionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;
        private readonly ITimeZoneService _timeZoneService;

        public CitasEdicionController(
            AppDbContext context,
            ITenantContext tenantContext,
            ITimeZoneService timeZoneService)
        {
            _context = context;
            _tenantContext = tenantContext;
            _timeZoneService = timeZoneService;
        }

        [HttpPut("{id:int}/editar")]
        public async Task<IActionResult> Editar(
            int id,
            EditarCitaDto request)
        {
            var tenantId = _tenantContext.TenantId;

            if (request.ServicioId <= 0 ||
                request.ProfesionalId <= 0 ||
                request.SucursalId <= 0 ||
                request.DuracionMinutos <= 0)
            {
                return BadRequest(new
                {
                    mensaje = "Completa servicio, profesional, sucursal y duración."
                });
            }

            var cita = await _context.Citas
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.TenantId == tenantId);

            if (cita == null)
            {
                return NotFound(new
                {
                    mensaje = "Cita no encontrada."
                });
            }

            if (cita.Estado == EstadosCita.Completada ||
                cita.Estado == EstadosCita.Cancelada)
            {
                return BadRequest(new
                {
                    mensaje = "No se puede editar una cita completada o cancelada."
                });
            }

            var sucursal = await _context.Sucursales
                .FirstOrDefaultAsync(x =>
                    x.Id == request.SucursalId &&
                    x.TenantId == tenantId &&
                    x.Activa);

            if (sucursal == null)
            {
                return BadRequest(new
                {
                    mensaje = "La sucursal seleccionada no es válida."
                });
            }

            var profesional = await _context.Profesionales
                .FirstOrDefaultAsync(x =>
                    x.Id == request.ProfesionalId &&
                    x.TenantId == tenantId &&
                    x.Activo);

            if (profesional == null)
            {
                return BadRequest(new
                {
                    mensaje = "El profesional seleccionado no es válido."
                });
            }

            if (profesional.SucursalId.HasValue &&
                profesional.SucursalId.Value != sucursal.Id)
            {
                return BadRequest(new
                {
                    mensaje = "El profesional no pertenece a la sucursal seleccionada."
                });
            }

            var servicio = await _context.Servicios
                .FirstOrDefaultAsync(x =>
                    x.Id == request.ServicioId &&
                    x.TenantId == tenantId &&
                    x.Activo);

            if (servicio == null)
            {
                return BadRequest(new
                {
                    mensaje = "El servicio seleccionado no es válido."
                });
            }

            var realizaServicio = await _context.ProfesionalServicios
                .AnyAsync(x =>
                    x.ProfesionalId == profesional.Id &&
                    x.ServicioId == servicio.Id);

            if (!realizaServicio)
            {
                return BadRequest(new
                {
                    mensaje = "El profesional seleccionado no realiza este servicio."
                });
            }

            ServicioVariante? variante = null;

            if (request.ServicioVarianteId.HasValue)
            {
                variante = await _context.ServicioVariantes
                    .FirstOrDefaultAsync(x =>
                        x.Id == request.ServicioVarianteId.Value &&
                        x.TenantId == tenantId &&
                        x.ServicioId == servicio.Id &&
                        x.Activo);

                if (variante == null)
                {
                    return BadRequest(new
                    {
                        mensaje = "La variante seleccionada no es válida para este servicio."
                    });
                }
            }

            var inicioLocal = DateTime.SpecifyKind(
                request.FechaInicio,
                DateTimeKind.Unspecified);

            var finLocal = inicioLocal.AddMinutes(request.DuracionMinutos);

            var inicioUtc = await _timeZoneService.LocalAUtcAsync(
                tenantId,
                inicioLocal);

            var finUtc = await _timeZoneService.LocalAUtcAsync(
                tenantId,
                finLocal);

            var horarioValido = await _context.HorariosProfesionales
                .AnyAsync(x =>
                    x.TenantId == tenantId &&
                    x.ProfesionalId == profesional.Id &&
                    x.Activo &&
                    x.DiaSemana == inicioLocal.DayOfWeek &&
                    x.HoraInicio <= inicioLocal.TimeOfDay &&
                    x.HoraFin >= finLocal.TimeOfDay);

            if (!horarioValido)
            {
                return Conflict(new
                {
                    mensaje = "La nueva hora no cabe dentro del horario laboral del profesional."
                });
            }

            var chocaConAlmuerzo = await _context.AlmuerzosProfesionales
                .AnyAsync(x =>
                    x.TenantId == tenantId &&
                    x.ProfesionalId == profesional.Id &&
                    x.DiaSemana == inicioLocal.DayOfWeek &&
                    x.Activo &&
                    inicioLocal.TimeOfDay < x.HoraFin &&
                    finLocal.TimeOfDay > x.HoraInicio);

            if (chocaConAlmuerzo)
            {
                return Conflict(new { mensaje = "La nueva hora coincide con la hora de almuerzo del profesional." });
            }

            var chocaConCita = await _context.Citas
                .AnyAsync(x =>
                    x.Id != cita.Id &&
                    x.TenantId == tenantId &&
                    x.ProfesionalId == profesional.Id &&
                    x.Estado != EstadosCita.Cancelada &&
                    inicioUtc < x.FechaFin &&
                    finUtc > x.FechaInicio);

            if (chocaConCita)
            {
                return Conflict(new
                {
                    mensaje = "El nuevo horario choca con otra cita."
                });
            }

            var chocaConBloqueo = await _context.BloqueosProfesionales
                .AnyAsync(x =>
                    x.TenantId == tenantId &&
                    x.ProfesionalId == profesional.Id &&
                    inicioUtc < x.FechaFin &&
                    finUtc > x.FechaInicio);

            if (chocaConBloqueo)
            {
                return Conflict(new
                {
                    mensaje = "El nuevo horario choca con un bloqueo del profesional."
                });
            }

            cita.SucursalId = sucursal.Id;
            cita.ProfesionalId = profesional.Id;
            cita.ServicioId = servicio.Id;
            cita.ServicioVarianteId = variante?.Id;
            cita.FechaInicio = inicioUtc;
            cita.DuracionMinutos = request.DuracionMinutos;
            cita.FechaFin = finUtc;
            cita.Precio = variante?.Precio ?? servicio.Precio;
            cita.Notas = string.IsNullOrWhiteSpace(request.Notas)
                ? null
                : request.Notas.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Cita actualizada correctamente.",
                cita.Id,
                cita.ServicioId,
                cita.ServicioVarianteId,
                cita.ProfesionalId,
                cita.SucursalId,
                cita.DuracionMinutos,
                cita.Precio,
                fechaInicioLocal = inicioLocal,
                fechaFinLocal = finLocal,
                cita.Estado
            });
        }
    }

    public class EditarCitaDto
    {
        public int ServicioId { get; set; }
        public int? ServicioVarianteId { get; set; }
        public int ProfesionalId { get; set; }
        public int SucursalId { get; set; }
        public DateTime FechaInicio { get; set; }
        public int DuracionMinutos { get; set; }
        public string? Notas { get; set; }
    }
}
