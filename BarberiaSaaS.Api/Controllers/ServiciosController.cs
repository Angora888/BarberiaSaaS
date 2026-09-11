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

        // ============================================================
        // LISTAR SERVICIOS
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> GetServicios()
        {
            var tenantId =
                _tenantContext.TenantId;

            var servicios =
                await _context.Servicios
                    .Where(x =>
                        x.TenantId == tenantId)
                    .OrderBy(x =>
                        x.Nombre)
                    .Select(x => new
                    {
                        x.Id,
                        x.Nombre,
                        x.Descripcion,
                        x.Precio,
                        x.Activo,

                        Variantes =
                            x.Variantes
                                .OrderBy(v =>
                                    v.Orden)
                                .ThenBy(v =>
                                    v.Nombre)
                                .Select(v => new
                                {
                                    v.Id,
                                    v.Nombre,
                                    v.Precio,
                                    v.Orden,
                                    v.Activo
                                })
                                .ToList()
                    })
                    .ToListAsync();

            return Ok(servicios);
        }

        // ============================================================
        // OBTENER SERVICIO
        // ============================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetServicio(
            int id)
        {
            var tenantId =
                _tenantContext.TenantId;

            var servicio =
                await _context.Servicios
                    .Where(x =>
                        x.Id == id &&
                        x.TenantId == tenantId)
                    .Select(x => new
                    {
                        x.Id,
                        x.Nombre,
                        x.Descripcion,
                        x.Precio,
                        x.Activo,

                        Variantes =
                            x.Variantes
                                .OrderBy(v =>
                                    v.Orden)
                                .ThenBy(v =>
                                    v.Nombre)
                                .Select(v => new
                                {
                                    v.Id,
                                    v.Nombre,
                                    v.Precio,
                                    v.Orden,
                                    v.Activo
                                })
                                .ToList()
                    })
                    .FirstOrDefaultAsync();

            if (servicio == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "Servicio no encontrado."
                });
            }

            return Ok(servicio);
        }

        // ============================================================
        // CREAR SERVICIO
        // ============================================================

        [HttpPost]
        public async Task<IActionResult> Crear(
            CrearServicioDto request)
        {
            if (string.IsNullOrWhiteSpace(
                request.Nombre))
            {
                return BadRequest(new
                {
                    mensaje =
                        "El nombre del servicio es requerido."
                });
            }

            if (request.Precio < 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El precio no puede ser negativo."
                });
            }

            var tenantId =
                _tenantContext.TenantId;

            var servicio =
                new Servicio
                {
                    TenantId =
                        tenantId,

                    Nombre =
                        request.Nombre.Trim(),

                    Descripcion =
                        request.Descripcion?.Trim(),

                    Precio =
                        request.Precio,

                    Activo =
                        true,

                    FechaCreacion =
                        DateTime.UtcNow
                };

            _context.Servicios.Add(
                servicio);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje =
                    "Servicio creado correctamente.",

                servicio.Id,
                servicio.Nombre,
                servicio.Precio
            });
        }

        // ============================================================
        // LISTAR VARIANTES DE UN SERVICIO
        // ============================================================

        [HttpGet("{servicioId:int}/variantes")]
        public async Task<IActionResult> GetVariantes(
            int servicioId)
        {
            var tenantId =
                _tenantContext.TenantId;

            var servicioExiste =
                await _context.Servicios
                    .AnyAsync(x =>
                        x.Id == servicioId &&
                        x.TenantId == tenantId);

            if (!servicioExiste)
            {
                return NotFound(new
                {
                    mensaje =
                        "Servicio no encontrado."
                });
            }

            var variantes =
                await _context.ServicioVariantes
                    .Where(x =>
                        x.TenantId == tenantId &&
                        x.ServicioId == servicioId)
                    .OrderBy(x =>
                        x.Orden)
                    .ThenBy(x =>
                        x.Nombre)
                    .Select(x => new
                    {
                        x.Id,
                        x.ServicioId,
                        x.Nombre,
                        x.Precio,
                        x.Orden,
                        x.Activo
                    })
                    .ToListAsync();

            return Ok(variantes);
        }

        // ============================================================
        // CREAR VARIANTE
        // ============================================================

        [HttpPost("{servicioId:int}/variantes")]
        public async Task<IActionResult> CrearVariante(
            int servicioId,
            CrearServicioVarianteDto request)
        {
            var tenantId =
                _tenantContext.TenantId;

            if (string.IsNullOrWhiteSpace(
                request.Nombre))
            {
                return BadRequest(new
                {
                    mensaje =
                        "El nombre de la variante es requerido."
                });
            }

            if (request.Precio < 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El precio de la variante no puede ser negativo."
                });
            }

            if (request.Orden < 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El orden no puede ser negativo."
                });
            }

            var servicio =
                await _context.Servicios
                    .FirstOrDefaultAsync(x =>
                        x.Id == servicioId &&
                        x.TenantId == tenantId);

            if (servicio == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "Servicio no encontrado."
                });
            }

            var nombre =
                request.Nombre.Trim();

            var existeNombre =
                await _context.ServicioVariantes
                    .AnyAsync(x =>
                        x.TenantId == tenantId &&
                        x.ServicioId == servicioId &&
                        x.Nombre.ToLower() ==
                            nombre.ToLower());

            if (existeNombre)
            {
                return Conflict(new
                {
                    mensaje =
                        "Ya existe una variante con ese nombre para este servicio."
                });
            }

            var variante =
                new ServicioVariante
                {
                    TenantId =
                        tenantId,

                    ServicioId =
                        servicioId,

                    Nombre =
                        nombre,

                    Precio =
                        request.Precio,

                    Orden =
                        request.Orden,

                    Activo =
                        true,

                    FechaCreacion =
                        DateTime.UtcNow
                };

            _context.ServicioVariantes.Add(
                variante);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje =
                    "Variante creada correctamente.",

                variante.Id,
                variante.ServicioId,
                variante.Nombre,
                variante.Precio,
                variante.Orden,
                variante.Activo
            });
        }

        // ============================================================
        // ACTUALIZAR VARIANTE
        // ============================================================

        [HttpPut("{servicioId:int}/variantes/{varianteId:int}")]
        public async Task<IActionResult> ActualizarVariante(
            int servicioId,
            int varianteId,
            ActualizarServicioVarianteDto request)
        {
            var tenantId =
                _tenantContext.TenantId;

            if (string.IsNullOrWhiteSpace(
                request.Nombre))
            {
                return BadRequest(new
                {
                    mensaje =
                        "El nombre de la variante es requerido."
                });
            }

            if (request.Precio < 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El precio de la variante no puede ser negativo."
                });
            }

            if (request.Orden < 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El orden no puede ser negativo."
                });
            }

            var variante =
                await _context.ServicioVariantes
                    .FirstOrDefaultAsync(x =>
                        x.Id == varianteId &&
                        x.ServicioId == servicioId &&
                        x.TenantId == tenantId);

            if (variante == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "Variante no encontrada."
                });
            }

            var nombre =
                request.Nombre.Trim();

            var existeNombre =
                await _context.ServicioVariantes
                    .AnyAsync(x =>
                        x.Id != varianteId &&
                        x.TenantId == tenantId &&
                        x.ServicioId == servicioId &&
                        x.Nombre.ToLower() ==
                            nombre.ToLower());

            if (existeNombre)
            {
                return Conflict(new
                {
                    mensaje =
                        "Ya existe otra variante con ese nombre para este servicio."
                });
            }

            variante.Nombre =
                nombre;

            variante.Precio =
                request.Precio;

            variante.Orden =
                request.Orden;

            variante.Activo =
                request.Activo;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje =
                    "Variante actualizada correctamente.",

                variante.Id,
                variante.ServicioId,
                variante.Nombre,
                variante.Precio,
                variante.Orden,
                variante.Activo
            });
        }
    }
}
