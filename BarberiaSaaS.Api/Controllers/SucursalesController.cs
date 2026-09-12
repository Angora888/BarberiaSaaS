using BarberiaSaaS.Api.Data;
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
    public class SucursalesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public SucursalesController(
            AppDbContext context,
            ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        // ============================================================
        // LISTAR SUCURSALES
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] bool incluirInactivas = false)
        {
            var tenantId =
                _tenantContext.TenantId;

            var query =
                _context.Sucursales
                    .Where(x =>
                        x.TenantId == tenantId);

            if (!incluirInactivas)
            {
                query = query.Where(x => x.Activa);
            }

            var sucursales =
                await query
                    .OrderByDescending(x => x.Activa)
                    .ThenBy(x => x.Nombre)
                    .Select(x => new
                    {
                        x.Id,
                        x.Nombre,
                        x.Direccion,
                        x.Telefono,
                        x.Email,
                        x.Activa,
                        x.FechaCreacion
                    })
                    .ToListAsync();

            return Ok(sucursales);
        }

        // ============================================================
        // OBTENER SUCURSAL
        // ============================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(
            int id)
        {
            var tenantId =
                _tenantContext.TenantId;

            var sucursal =
                await _context.Sucursales
                    .Where(x =>
                        x.Id == id &&
                        x.TenantId == tenantId)
                    .Select(x => new
                    {
                        x.Id,
                        x.Nombre,
                        x.Direccion,
                        x.Telefono,
                        x.Email,
                        x.Activa,
                        x.FechaCreacion
                    })
                    .FirstOrDefaultAsync();

            if (sucursal == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "Sucursal no encontrada."
                });
            }

            return Ok(sucursal);
        }

        // ============================================================
        // CREAR SUCURSAL
        // ============================================================

        [HttpPost]
        public async Task<IActionResult> Post(
            [FromBody] SucursalRequest request)
        {
            var tenantId =
                _tenantContext.TenantId;

            var nombre =
                request.Nombre?.Trim();

            if (string.IsNullOrWhiteSpace(nombre))
            {
                return BadRequest(new
                {
                    mensaje =
                        "El nombre de la sucursal es obligatorio."
                });
            }

            var nombreNormalizado =
                nombre.ToLower();

            var existe =
                await _context.Sucursales
                    .AnyAsync(x =>
                        x.TenantId == tenantId &&
                        x.Nombre.ToLower() ==
                            nombreNormalizado);

            if (existe)
            {
                return BadRequest(new
                {
                    mensaje =
                        "Ya existe una sucursal con ese nombre."
                });
            }

            var sucursal =
                new Sucursal
                {
                    TenantId = tenantId,
                    Nombre = nombre,
                    Direccion =
                        LimpiarTexto(request.Direccion),
                    Telefono =
                        LimpiarTexto(request.Telefono),
                    Email =
                        LimpiarTexto(request.Email),
                    Activa = true,
                    FechaCreacion = DateTime.UtcNow
                };

            _context.Sucursales.Add(sucursal);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                sucursal.Id,
                sucursal.Nombre,
                sucursal.Direccion,
                sucursal.Telefono,
                sucursal.Email,
                sucursal.Activa,
                sucursal.FechaCreacion
            });
        }

        // ============================================================
        // ACTUALIZAR SUCURSAL
        // ============================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Put(
            int id,
            [FromBody] SucursalRequest request)
        {
            var tenantId =
                _tenantContext.TenantId;

            var sucursal =
                await _context.Sucursales
                    .FirstOrDefaultAsync(x =>
                        x.Id == id &&
                        x.TenantId == tenantId);

            if (sucursal == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "Sucursal no encontrada."
                });
            }

            var nombre =
                request.Nombre?.Trim();

            if (string.IsNullOrWhiteSpace(nombre))
            {
                return BadRequest(new
                {
                    mensaje =
                        "El nombre de la sucursal es obligatorio."
                });
            }

            var nombreNormalizado =
                nombre.ToLower();

            var existe =
                await _context.Sucursales
                    .AnyAsync(x =>
                        x.TenantId == tenantId &&
                        x.Id != id &&
                        x.Nombre.ToLower() ==
                            nombreNormalizado);

            if (existe)
            {
                return BadRequest(new
                {
                    mensaje =
                        "Ya existe otra sucursal con ese nombre."
                });
            }

            sucursal.Nombre = nombre;
            sucursal.Direccion =
                LimpiarTexto(request.Direccion);
            sucursal.Telefono =
                LimpiarTexto(request.Telefono);
            sucursal.Email =
                LimpiarTexto(request.Email);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                sucursal.Id,
                sucursal.Nombre,
                sucursal.Direccion,
                sucursal.Telefono,
                sucursal.Email,
                sucursal.Activa,
                sucursal.FechaCreacion
            });
        }

        // ============================================================
        // ACTIVAR / DESACTIVAR SUCURSAL
        // ============================================================

        [HttpPatch("{id:int}/estado")]
        public async Task<IActionResult> CambiarEstado(
            int id,
            [FromBody] CambiarEstadoSucursalRequest request)
        {
            var tenantId =
                _tenantContext.TenantId;

            var sucursal =
                await _context.Sucursales
                    .FirstOrDefaultAsync(x =>
                        x.Id == id &&
                        x.TenantId == tenantId);

            if (sucursal == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "Sucursal no encontrada."
                });
            }

            if (!request.Activa)
            {
                var cantidadActivas =
                    await _context.Sucursales
                        .CountAsync(x =>
                            x.TenantId == tenantId &&
                            x.Activa);

                if (sucursal.Activa &&
                    cantidadActivas <= 1)
                {
                    return BadRequest(new
                    {
                        mensaje =
                            "El negocio debe mantener al menos una sucursal activa."
                    });
                }
            }

            sucursal.Activa = request.Activa;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                sucursal.Id,
                sucursal.Nombre,
                sucursal.Activa
            });
        }

        private static string? LimpiarTexto(
            string? valor)
        {
            return string.IsNullOrWhiteSpace(valor)
                ? null
                : valor.Trim();
        }

        public class SucursalRequest
        {
            public string Nombre { get; set; }
                = string.Empty;

            public string? Direccion { get; set; }

            public string? Telefono { get; set; }

            public string? Email { get; set; }
        }

        public class CambiarEstadoSucursalRequest
        {
            public bool Activa { get; set; }
        }
    }
}
