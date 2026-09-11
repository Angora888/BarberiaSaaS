using BarberiaSaaS.Api.Data;
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
        public async Task<IActionResult> Get()
        {
            var tenantId =
                _tenantContext.TenantId;

            var sucursales =
                await _context.Sucursales
                    .Where(x =>
                        x.TenantId ==
                            tenantId &&
                        x.Activa)
                    .OrderBy(x =>
                        x.Nombre)
                    .Select(x => new
                    {
                        x.Id,
                        x.Nombre,
                        x.Direccion,
                        x.Telefono,
                        x.Email,
                        x.Activa
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
                        x.TenantId ==
                            tenantId)
                    .Select(x => new
                    {
                        x.Id,
                        x.Nombre,
                        x.Direccion,
                        x.Telefono,
                        x.Email,
                        x.Activa
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
    }
}