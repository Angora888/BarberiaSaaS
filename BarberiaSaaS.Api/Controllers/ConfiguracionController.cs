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
    public class ConfiguracionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public ConfiguracionController(
            AppDbContext context,
            ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        // ============================================================
        // OBTENER CONFIGURACIÓN DEL NEGOCIO
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var tenantId = _tenantContext.TenantId;

            var tenant = await _context.Tenants
                .Where(x =>
                    x.Id == tenantId &&
                    x.Activo)
                .Select(x => new
                {
                    x.Id,
                    x.Nombre,
                    x.NombreComercial,
                    x.Identificacion,
                    x.Telefono,
                    x.Email,

                    Configuracion = x.Configuracion == null
                        ? null
                        : new
                        {
                            x.Configuracion.LogoUrl,
                            x.Configuracion.ColorPrimario,
                            x.Configuracion.ColorSecundario,
                            x.Configuracion.ColorFondo,
                            x.Configuracion.Moneda,
                            x.Configuracion.ZonaHoraria,
                            x.Configuracion.Idioma,
                            x.Configuracion.DuracionSlotMinutos,
                            x.Configuracion.PermitirReservaOnline,
                            x.Configuracion.MostrarPrecios,
                            x.Configuracion.RequiereDeposito,
                            x.Configuracion.PorcentajeDeposito,
                            x.Configuracion.Instagram,
                            x.Configuracion.Facebook,
                            x.Configuracion.WhatsApp
                        }
                })
                .FirstOrDefaultAsync();

            if (tenant == null)
            {
                return NotFound(new
                {
                    mensaje = "Negocio no encontrado."
                });
            }

            return Ok(tenant);
        }
    }
}