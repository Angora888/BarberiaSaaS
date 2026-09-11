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
    public class ProfesionalesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public ProfesionalesController(
            AppDbContext context,
            ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetProfesionales()
        {
            var tenantId = _tenantContext.TenantId;

            var profesionales = await _context.Profesionales
                .Where(x => x.TenantId == tenantId)
                .OrderBy(x => x.Nombre)
                .Select(x => new
                {
                    x.Id,
                    x.Nombre,
                    x.Apellidos,
                    x.Telefono,
                    x.Email,
                    x.Especialidad,
                    x.FotoUrl,
                    x.Activo,
                    x.SucursalId,

                    Sucursal =
                        x.Sucursal != null
                            ? x.Sucursal.Nombre
                            : null,

                    Servicios =
                        x.Servicios.Select(ps => new
                        {
                            ps.Servicio.Id,
                            ps.Servicio.Nombre,
                            ps.Servicio.Precio
                        })
                        .ToList()
                })
                .ToListAsync();

            return Ok(profesionales);
        }

        [HttpPost]
        public async Task<IActionResult> Crear(
            CrearProfesionalDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
            {
                return BadRequest(new
                {
                    mensaje = "El nombre del profesional es requerido."
                });
            }

            var tenantId = _tenantContext.TenantId;

            if (request.SucursalId.HasValue)
            {
                var sucursalValida =
                    await _context.Sucursales.AnyAsync(x =>
                        x.Id == request.SucursalId.Value &&
                        x.TenantId == tenantId &&
                        x.Activa);

                if (!sucursalValida)
                {
                    return BadRequest(new
                    {
                        mensaje =
                            "La sucursal seleccionada no es válida."
                    });
                }
            }

            var servicioIds =
                request.ServicioIds
                    .Distinct()
                    .ToList();

            var serviciosValidos =
                await _context.Servicios
                    .Where(x =>
                        x.TenantId == tenantId &&
                        x.Activo &&
                        servicioIds.Contains(x.Id))
                    .Select(x => x.Id)
                    .ToListAsync();

            if (serviciosValidos.Count != servicioIds.Count)
            {
                return BadRequest(new
                {
                    mensaje =
                        "Uno o más servicios seleccionados no pertenecen al negocio."
                });
            }

            var profesional = new Profesional
            {
                TenantId = tenantId,
                SucursalId = request.SucursalId,
                Nombre = request.Nombre.Trim(),
                Apellidos =
                    request.Apellidos?.Trim() ??
                    string.Empty,
                Telefono =
                    request.Telefono?.Trim(),
                Email =
                    request.Email?
                        .Trim()
                        .ToLowerInvariant(),
                Especialidad =
                    request.Especialidad?.Trim(),
                FotoUrl =
                    request.FotoUrl?.Trim(),
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            foreach (var servicioId in serviciosValidos)
            {
                profesional.Servicios.Add(
                    new ProfesionalServicio
                    {
                        ServicioId = servicioId
                    });
            }

            _context.Profesionales.Add(profesional);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje =
                    "Profesional creado correctamente.",
                profesional.Id,
                profesional.Nombre,
                profesional.Apellidos
            });
        }
    }
}