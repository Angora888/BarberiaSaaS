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
    public class CategoriasProductosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public CategoriasProductosController(
            AppDbContext context,
            ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategorias()
        {
            var tenantId = _tenantContext.TenantId;

            var categorias =
                await _context.CategoriasProducto
                    .Where(x => x.TenantId == tenantId)
                    .OrderBy(x => x.Nombre)
                    .Select(x => new
                    {
                        x.Id,
                        x.Nombre,
                        x.Descripcion,
                        x.Activa,
                        CantidadProductos =
                            x.Productos.Count(p =>
                                p.TenantId == tenantId &&
                                p.Activo)
                    })
                    .ToListAsync();

            return Ok(categorias);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetCategoria(int id)
        {
            var tenantId = _tenantContext.TenantId;

            var categoria =
                await _context.CategoriasProducto
                    .Where(x =>
                        x.Id == id &&
                        x.TenantId == tenantId)
                    .Select(x => new
                    {
                        x.Id,
                        x.Nombre,
                        x.Descripcion,
                        x.Activa,
                        x.FechaCreacion
                    })
                    .FirstOrDefaultAsync();

            if (categoria == null)
            {
                return NotFound(new
                {
                    mensaje = "Categoría no encontrada."
                });
            }

            return Ok(categoria);
        }

        [HttpPost]
        public async Task<IActionResult> Crear(
            CrearCategoriaProductoDto request)
        {
            var tenantId = _tenantContext.TenantId;

            if (string.IsNullOrWhiteSpace(request.Nombre))
            {
                return BadRequest(new
                {
                    mensaje =
                        "El nombre de la categoría es requerido."
                });
            }

            var nombre = request.Nombre.Trim();

            var existe =
                await _context.CategoriasProducto
                    .AnyAsync(x =>
                        x.TenantId == tenantId &&
                        x.Nombre.ToLower() ==
                            nombre.ToLower());

            if (existe)
            {
                return Conflict(new
                {
                    mensaje =
                        "Ya existe una categoría con ese nombre."
                });
            }

            var categoria =
                new CategoriaProducto
                {
                    TenantId = tenantId,
                    Nombre = nombre,
                    Descripcion =
                        request.Descripcion?.Trim(),
                    Activa = true,
                    FechaCreacion = DateTime.UtcNow
                };

            _context.CategoriasProducto.Add(categoria);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje =
                    "Categoría creada correctamente.",
                categoria.Id,
                categoria.Nombre,
                categoria.Descripcion,
                categoria.Activa
            });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Actualizar(
            int id,
            ActualizarCategoriaProductoDto request)
        {
            var tenantId = _tenantContext.TenantId;

            if (string.IsNullOrWhiteSpace(request.Nombre))
            {
                return BadRequest(new
                {
                    mensaje =
                        "El nombre de la categoría es requerido."
                });
            }

            var categoria =
                await _context.CategoriasProducto
                    .FirstOrDefaultAsync(x =>
                        x.Id == id &&
                        x.TenantId == tenantId);

            if (categoria == null)
            {
                return NotFound(new
                {
                    mensaje = "Categoría no encontrada."
                });
            }

            var nombre = request.Nombre.Trim();

            var existe =
                await _context.CategoriasProducto
                    .AnyAsync(x =>
                        x.Id != id &&
                        x.TenantId == tenantId &&
                        x.Nombre.ToLower() ==
                            nombre.ToLower());

            if (existe)
            {
                return Conflict(new
                {
                    mensaje =
                        "Ya existe otra categoría con ese nombre."
                });
            }

            categoria.Nombre = nombre;
            categoria.Descripcion =
                request.Descripcion?.Trim();
            categoria.Activa = request.Activa;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje =
                    "Categoría actualizada correctamente.",
                categoria.Id,
                categoria.Nombre,
                categoria.Descripcion,
                categoria.Activa
            });
        }
    }
}
