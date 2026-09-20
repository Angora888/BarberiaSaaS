using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class PublicoController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IInternacionalizacionService _internacionalizacion;

        public PublicoController(AppDbContext context, IInternacionalizacionService internacionalizacion)
        {
            _context = context;
            _internacionalizacion = internacionalizacion;
        }

        // ============================================================
        // GET /api/Publico/{slug}
        // Landing pública completa del negocio
        // ============================================================

        [HttpGet("{slug}")]
        public async Task<IActionResult> ObtenerLanding(
            string slug)
        {
            if (string.IsNullOrWhiteSpace(slug))
            {
                return BadRequest(new
                {
                    mensaje = "El slug es obligatorio."
                });
            }

            slug = slug
                .Trim()
                .ToLowerInvariant();

            var tenant = await _context.Tenants
                .AsNoTracking()
                .Include(x => x.Configuracion)
                .FirstOrDefaultAsync(x =>
                    x.Activo &&
                    x.LandingPublicaActiva &&
                    x.SlugPublico != null &&
                    x.SlugPublico.ToLower() == slug);

            if (tenant == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "La página pública del negocio no está disponible."
                });
            }

            // ========================================================
            // SUCURSALES
            // ========================================================

            var sucursales = await _context.Sucursales
                .AsNoTracking()
                .Where(x =>
                    x.TenantId == tenant.Id &&
                    x.Activa)
                .OrderBy(x => x.Nombre)
                .Select(x => new
                {
                    x.Id,
                    x.Nombre,
                    x.Direccion,
                    x.Telefono,
                    x.Email
                })
                .ToListAsync();

            // ========================================================
            // SERVICIOS
            // ========================================================

            var servicios = await _context.Servicios
                .AsNoTracking()
                .Where(x =>
                    x.TenantId == tenant.Id &&
                    x.Activo)
                .OrderBy(x => x.Nombre)
                .Select(x => new
                {
                    x.Id,
                    x.Nombre,
                    x.Descripcion,
                    x.Precio,

                    Variantes = x.Variantes
                        .Where(v => v.Activo)
                        .OrderBy(v => v.Orden)
                        .Select(v => new
                        {
                            v.Id,
                            v.Nombre,
                            v.Precio
                        })
                        .ToList()
                })
                .ToListAsync();

            // ========================================================
            // PROFESIONALES
            // ========================================================

            var profesionales = await _context.Profesionales
                .AsNoTracking()
                .Where(x =>
                    x.TenantId == tenant.Id &&
                    x.Activo)
                .OrderBy(x => x.Nombre)
                .ThenBy(x => x.Apellidos)
                .Select(x => new
                {
                    x.Id,
                    x.Nombre,
                    x.Apellidos,
                    x.Especialidad,
                    x.FotoUrl,
                    x.SucursalId,

                    Servicios = x.Servicios
                        .Where(ps =>
                            ps.Servicio.Activo)
                        .Select(ps => new
                        {
                            ps.Servicio.Id,
                            ps.Servicio.Nombre
                        })
                        .OrderBy(s => s.Nombre)
                        .ToList()
                })
                .ToListAsync();

            // ========================================================
            // PRODUCTOS PÚBLICOS
            // ========================================================

            var productos = await _context.Productos
                .AsNoTracking()
                .Where(x =>
                    x.TenantId == tenant.Id &&
                    x.Activo)
                .Select(x => new
                {
                    x.Id,
                    x.Nombre,
                    x.Descripcion,
                    x.PrecioVenta,
                    x.ImagenUrl,

                    Categoria =
                        x.CategoriaProducto != null
                            ? x.CategoriaProducto.Nombre
                            : null,

                    StockTotal = x.Inventarios
                        .Where(i =>
                            i.TenantId == tenant.Id)
                        .Sum(i =>
                            (decimal?)i.Cantidad) ?? 0
                })
                .Where(x =>
                    x.StockTotal > 0)
                .OrderBy(x => x.Nombre)
                .ToListAsync();

            var config = tenant.Configuracion;

            // ========================================================
            // RESPUESTA
            // ========================================================

            return Ok(new
            {
                negocio = new
                {
                    tenant.Id,

                    nombre =
                        string.IsNullOrWhiteSpace(
                            tenant.NombreComercial)
                            ? tenant.Nombre
                            : tenant.NombreComercial,

                    tenant.Telefono,
                    tenant.Email,
                    tenant.SlugPublico,
                    paisCodigo = tenant.PaisCodigo
                },

                branding = new
                {
                    logoUrl =
                        config?.LogoUrl,

                    frasePresentacion =
                        string.IsNullOrWhiteSpace(config?.FrasePresentacion)
                            ? "Belleza • Bienestar • Estilo"
                            : config!.FrasePresentacion,

                    colorPrimario =
                        config?.ColorPrimario
                        ?? "#C62864",

                    colorSecundario =
                        config?.ColorSecundario
                        ?? "#F8E7EE",

                    colorFondo =
                        config?.ColorFondo
                        ?? "#FFFFFF",

                    moneda =
                        config?.Moneda
                        ?? "CRC",

                    idioma =
                        config?.Idioma
                        ?? "es",

                    zonaHoraria =
                        config?.ZonaHoraria
                        ?? "America/Costa_Rica",

                    mostrarPrecios =
                        config?.MostrarPrecios
                        ?? true
                },

                contacto = new
                {
                    instagram =
                        config?.Instagram,

                    facebook =
                        config?.Facebook,

                    whatsapp =
                        config?.WhatsApp
                },

                paisesTelefono = _internacionalizacion.ObtenerPaises(),

                sucursales,

                servicios,

                profesionales,

                productos
            });
        }
    }
}