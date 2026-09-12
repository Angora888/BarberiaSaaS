using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.DTOs;
using BarberiaSaaS.Api.Models;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

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

        [HttpPut]
        public async Task<IActionResult> Actualizar(
            ActualizarConfiguracionDto request)
        {
            var tenantId = _tenantContext.TenantId;

            var tenant = await _context.Tenants
                .Include(x => x.Configuracion)
                .FirstOrDefaultAsync(x =>
                    x.Id == tenantId &&
                    x.Activo);

            if (tenant == null)
            {
                return NotFound(new
                {
                    mensaje = "Negocio no encontrado."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Nombre))
            {
                return BadRequest(new
                {
                    mensaje = "El nombre del negocio es requerido."
                });
            }

            if (!EsColorHexValido(request.ColorPrimario) ||
                !EsColorHexValido(request.ColorSecundario) ||
                !EsColorHexValido(request.ColorFondo))
            {
                return BadRequest(new
                {
                    mensaje = "Los colores deben tener formato hexadecimal válido, por ejemplo #C62864."
                });
            }

            if (request.DuracionSlotMinutos <= 0 ||
                request.DuracionSlotMinutos > 120)
            {
                return BadRequest(new
                {
                    mensaje = "La duración del slot debe estar entre 1 y 120 minutos."
                });
            }

            if (request.PorcentajeDeposito < 0 ||
                request.PorcentajeDeposito > 100)
            {
                return BadRequest(new
                {
                    mensaje = "El porcentaje de depósito debe estar entre 0 y 100."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Moneda))
            {
                return BadRequest(new
                {
                    mensaje = "La moneda es requerida."
                });
            }

            if (string.IsNullOrWhiteSpace(request.ZonaHoraria))
            {
                return BadRequest(new
                {
                    mensaje = "La zona horaria es requerida."
                });
            }

            tenant.Nombre = request.Nombre.Trim();
            tenant.NombreComercial = Limpiar(request.NombreComercial);
            tenant.Identificacion = Limpiar(request.Identificacion);
            tenant.Telefono = Limpiar(request.Telefono);
            tenant.Email = Limpiar(request.Email);

            if (tenant.Configuracion == null)
            {
                tenant.Configuracion = new ConfiguracionTenant
                {
                    TenantId = tenantId
                };
            }

            var configuracion = tenant.Configuracion;

            configuracion.LogoUrl = Limpiar(request.LogoUrl);
            configuracion.ColorPrimario = request.ColorPrimario.Trim();
            configuracion.ColorSecundario = request.ColorSecundario.Trim();
            configuracion.ColorFondo = request.ColorFondo.Trim();
            configuracion.Moneda = request.Moneda.Trim().ToUpperInvariant();
            configuracion.ZonaHoraria = request.ZonaHoraria.Trim();
            configuracion.Idioma = string.IsNullOrWhiteSpace(request.Idioma)
                ? "es"
                : request.Idioma.Trim().ToLowerInvariant();
            configuracion.DuracionSlotMinutos = request.DuracionSlotMinutos;
            configuracion.PermitirReservaOnline = request.PermitirReservaOnline;
            configuracion.MostrarPrecios = request.MostrarPrecios;
            configuracion.RequiereDeposito = request.RequiereDeposito;
            configuracion.PorcentajeDeposito = request.RequiereDeposito
                ? request.PorcentajeDeposito
                : 0;
            configuracion.Instagram = Limpiar(request.Instagram);
            configuracion.Facebook = Limpiar(request.Facebook);
            configuracion.WhatsApp = Limpiar(request.WhatsApp);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Configuración actualizada correctamente."
            });
        }

        private static string? Limpiar(string? valor)
        {
            return string.IsNullOrWhiteSpace(valor)
                ? null
                : valor.Trim();
        }

        private static bool EsColorHexValido(string? color)
        {
            if (string.IsNullOrWhiteSpace(color))
            {
                return false;
            }

            return Regex.IsMatch(
                color.Trim(),
                "^#[0-9A-Fa-f]{6}$");
        }
    }
}
