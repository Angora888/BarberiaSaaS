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
    public class ProductosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public ProductosController(
            AppDbContext context,
            ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetProductos(
            int? sucursalId = null)
        {
            var tenantId = _tenantContext.TenantId;

            if (sucursalId.HasValue)
            {
                var sucursalExiste =
                    await _context.Sucursales
                        .AnyAsync(x =>
                            x.Id == sucursalId.Value &&
                            x.TenantId == tenantId);

                if (!sucursalExiste)
                {
                    return BadRequest(new
                    {
                        mensaje =
                            "La sucursal indicada no pertenece al negocio."
                    });
                }
            }

            var productos =
                await _context.Productos
                    .Where(x =>
                        x.TenantId == tenantId)
                    .OrderBy(x => x.Nombre)
                    .Select(x => new
                    {
                        x.Id,
                        x.CategoriaProductoId,

                        Categoria =
                            x.CategoriaProducto != null
                                ? x.CategoriaProducto.Nombre
                                : null,

                        x.Nombre,
                        x.Descripcion,
                        x.Codigo,
                        x.CodigoBarras,
                        x.Costo,
                        x.PrecioVenta,
                        x.StockMinimo,
                        x.ImagenUrl,
                        x.Activo,

                        StockTotal =
                            x.Inventarios
                                .Where(i =>
                                    i.TenantId == tenantId &&
                                    (!sucursalId.HasValue ||
                                     i.SucursalId ==
                                        sucursalId.Value))
                                .Sum(i => (decimal?)i.Cantidad)
                                ?? 0,

                        Inventarios =
                            x.Inventarios
                                .Where(i =>
                                    i.TenantId == tenantId &&
                                    (!sucursalId.HasValue ||
                                     i.SucursalId ==
                                        sucursalId.Value))
                                .OrderBy(i =>
                                    i.Sucursal.Nombre)
                                .Select(i => new
                                {
                                    i.SucursalId,
                                    Sucursal =
                                        i.Sucursal.Nombre,
                                    i.Cantidad,
                                    i.FechaActualizacion
                                })
                                .ToList()
                    })
                    .ToListAsync();

            return Ok(productos);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetProducto(int id)
        {
            var tenantId = _tenantContext.TenantId;

            var producto =
                await _context.Productos
                    .Where(x =>
                        x.Id == id &&
                        x.TenantId == tenantId)
                    .Select(x => new
                    {
                        x.Id,
                        x.CategoriaProductoId,

                        Categoria =
                            x.CategoriaProducto != null
                                ? x.CategoriaProducto.Nombre
                                : null,

                        x.Nombre,
                        x.Descripcion,
                        x.Codigo,
                        x.CodigoBarras,
                        x.Costo,
                        x.PrecioVenta,
                        x.StockMinimo,
                        x.ImagenUrl,
                        x.Activo,
                        x.FechaCreacion,

                        StockTotal =
                            x.Inventarios
                                .Where(i =>
                                    i.TenantId == tenantId)
                                .Sum(i => (decimal?)i.Cantidad)
                                ?? 0,

                        Inventarios =
                            x.Inventarios
                                .Where(i =>
                                    i.TenantId == tenantId)
                                .OrderBy(i =>
                                    i.Sucursal.Nombre)
                                .Select(i => new
                                {
                                    i.SucursalId,
                                    Sucursal =
                                        i.Sucursal.Nombre,
                                    i.Cantidad,
                                    i.FechaActualizacion
                                })
                                .ToList()
                    })
                    .FirstOrDefaultAsync();

            if (producto == null)
            {
                return NotFound(new
                {
                    mensaje = "Producto no encontrado."
                });
            }

            return Ok(producto);
        }

        [HttpPost]
        public async Task<IActionResult> Crear(
            CrearProductoDto request)
        {
            var tenantId = _tenantContext.TenantId;

            var validacion =
                await ValidarProductoAsync(
                    tenantId,
                    null,
                    request.CategoriaProductoId,
                    request.Nombre,
                    request.Codigo,
                    request.CodigoBarras,
                    request.Costo,
                    request.PrecioVenta,
                    request.StockMinimo);

            if (validacion != null)
            {
                return validacion;
            }

            var producto =
                new Producto
                {
                    TenantId = tenantId,
                    CategoriaProductoId =
                        request.CategoriaProductoId,
                    Nombre = request.Nombre.Trim(),
                    Descripcion =
                        request.Descripcion?.Trim(),
                    Codigo =
                        NormalizarTextoOpcional(
                            request.Codigo),
                    CodigoBarras =
                        NormalizarTextoOpcional(
                            request.CodigoBarras),
                    Costo = request.Costo,
                    PrecioVenta = request.PrecioVenta,
                    StockMinimo = request.StockMinimo,
                    ImagenUrl =
                        NormalizarTextoOpcional(
                            request.ImagenUrl),
                    Activo = true,
                    FechaCreacion = DateTime.UtcNow
                };

            _context.Productos.Add(producto);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje =
                    "Producto creado correctamente.",
                producto.Id,
                producto.Nombre,
                producto.PrecioVenta,
                producto.Activo
            });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Actualizar(
            int id,
            ActualizarProductoDto request)
        {
            var tenantId = _tenantContext.TenantId;

            var producto =
                await _context.Productos
                    .FirstOrDefaultAsync(x =>
                        x.Id == id &&
                        x.TenantId == tenantId);

            if (producto == null)
            {
                return NotFound(new
                {
                    mensaje = "Producto no encontrado."
                });
            }

            var validacion =
                await ValidarProductoAsync(
                    tenantId,
                    id,
                    request.CategoriaProductoId,
                    request.Nombre,
                    request.Codigo,
                    request.CodigoBarras,
                    request.Costo,
                    request.PrecioVenta,
                    request.StockMinimo);

            if (validacion != null)
            {
                return validacion;
            }

            producto.CategoriaProductoId =
                request.CategoriaProductoId;

            producto.Nombre =
                request.Nombre.Trim();

            producto.Descripcion =
                request.Descripcion?.Trim();

            producto.Codigo =
                NormalizarTextoOpcional(
                    request.Codigo);

            producto.CodigoBarras =
                NormalizarTextoOpcional(
                    request.CodigoBarras);

            producto.Costo =
                request.Costo;

            producto.PrecioVenta =
                request.PrecioVenta;

            producto.StockMinimo =
                request.StockMinimo;

            producto.ImagenUrl =
                NormalizarTextoOpcional(
                    request.ImagenUrl);

            producto.Activo =
                request.Activo;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje =
                    "Producto actualizado correctamente.",
                producto.Id,
                producto.Nombre,
                producto.Costo,
                producto.PrecioVenta,
                producto.StockMinimo,
                producto.Activo
            });
        }

        private async Task<IActionResult?> ValidarProductoAsync(
            int tenantId,
            int? productoId,
            int? categoriaProductoId,
            string nombre,
            string? codigo,
            string? codigoBarras,
            decimal costo,
            decimal precioVenta,
            decimal stockMinimo)
        {
            if (string.IsNullOrWhiteSpace(nombre))
            {
                return BadRequest(new
                {
                    mensaje =
                        "El nombre del producto es requerido."
                });
            }

            if (costo < 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El costo no puede ser negativo."
                });
            }

            if (precioVenta < 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El precio de venta no puede ser negativo."
                });
            }

            if (stockMinimo < 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El stock mínimo no puede ser negativo."
                });
            }

            if (categoriaProductoId.HasValue)
            {
                var categoriaExiste =
                    await _context.CategoriasProducto
                        .AnyAsync(x =>
                            x.Id ==
                                categoriaProductoId.Value &&
                            x.TenantId == tenantId);

                if (!categoriaExiste)
                {
                    return BadRequest(new
                    {
                        mensaje =
                            "La categoría indicada no pertenece al negocio."
                    });
                }
            }

            var codigoNormalizado =
                NormalizarTextoOpcional(codigo);

            if (codigoNormalizado != null)
            {
                var existeCodigo =
                    await _context.Productos
                        .AnyAsync(x =>
                            x.TenantId == tenantId &&
                            x.Id != productoId &&
                            x.Codigo ==
                                codigoNormalizado);

                if (existeCodigo)
                {
                    return Conflict(new
                    {
                        mensaje =
                            "Ya existe un producto con ese código."
                    });
                }
            }

            var codigoBarrasNormalizado =
                NormalizarTextoOpcional(
                    codigoBarras);

            if (codigoBarrasNormalizado != null)
            {
                var existeCodigoBarras =
                    await _context.Productos
                        .AnyAsync(x =>
                            x.TenantId == tenantId &&
                            x.Id != productoId &&
                            x.CodigoBarras ==
                                codigoBarrasNormalizado);

                if (existeCodigoBarras)
                {
                    return Conflict(new
                    {
                        mensaje =
                            "Ya existe un producto con ese código de barras."
                    });
                }
            }

            return null;
        }

        private static string? NormalizarTextoOpcional(
            string? valor)
        {
            return string.IsNullOrWhiteSpace(valor)
                ? null
                : valor.Trim();
        }
    }
}
