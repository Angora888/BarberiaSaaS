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
    public class ServiciosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public ServiciosController(
            AppDbContext context,
            ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetServicios()
        {
            var tenantId = _tenantContext.TenantId;

            var servicios = await _context.Servicios
                .Where(x => x.TenantId == tenantId)
                .OrderBy(x => x.Nombre)
                .Select(x => new
                {
                    x.Id,
                    x.Nombre,
                    x.Descripcion,
                    x.Precio,
                    x.Activo
                })
                .ToListAsync();

            return Ok(servicios);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetServicio(int id)
        {
            var tenantId = _tenantContext.TenantId;

            var servicio = await _context.Servicios
                .Where(x =>
                    x.Id == id &&
                    x.TenantId == tenantId)
                .Select(x => new
                {
                    x.Id,
                    x.Nombre,
                    x.Descripcion,
                    x.Precio,
                    x.Activo
                })
                .FirstOrDefaultAsync();

            if (servicio == null)
            {
                return NotFound(new
                {
                    mensaje = "Servicio no encontrado."
                });
            }

            return Ok(servicio);
        }

        [HttpPost]
        public async Task<IActionResult> Crear(
            CrearServicioDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
            {
                return BadRequest(new
                {
                    mensaje = "El nombre del servicio es requerido."
                });
            }

            if (request.Precio < 0)
            {
                return BadRequest(new
                {
                    mensaje = "El precio no puede ser negativo."
                });
            }

            var tenantId = _tenantContext.TenantId;

            var servicio = new Servicio
            {
                TenantId = tenantId,
                Nombre = request.Nombre.Trim(),
                Descripcion = request.Descripcion?.Trim(),
                Precio = request.Precio,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            _context.Servicios.Add(servicio);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Servicio creado correctamente.",
                servicio.Id,
                servicio.Nombre,
                servicio.Precio
            });
        }
    }
}