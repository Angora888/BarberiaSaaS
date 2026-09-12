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
    public class InventarioController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public InventarioController(
            AppDbContext context,
            ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetInventario(
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

            var inventario =
                await _context.InventariosSucursal
                    .Where(x =>
                        x.TenantId == tenantId &&
                        (!sucursalId.HasValue ||
                         x.SucursalId ==
                            sucursalId.Value))
                    .OrderBy(x =>
                        x.Producto.Nombre)
                    .Select(x => new
                    {
                        x.Id,
                        x.SucursalId,
                        Sucursal =
                            x.Sucursal.Nombre,
                        x.ProductoId,
                        Producto =
                            x.Producto.Nombre,
                        x.Producto.Codigo,
                        x.Producto.CodigoBarras,
                        x.Producto.Costo,
                        x.Producto.PrecioVenta,
                        x.Producto.StockMinimo,
                        x.Cantidad,

                        StockBajo =
                            x.Cantidad <=
                            x.Producto.StockMinimo,

                        x.FechaActualizacion
                    })
                    .ToListAsync();

            return Ok(inventario);
        }

        [HttpGet("movimientos")]
        public async Task<IActionResult> GetMovimientos(
            int? sucursalId = null,
            int? productoId = null,
            int limite = 100)
        {
            var tenantId = _tenantContext.TenantId;

            limite = Math.Clamp(limite, 1, 500);

            var query =
                _context.MovimientosInventario
                    .Where(x =>
                        x.TenantId == tenantId);

            if (sucursalId.HasValue)
            {
                query = query.Where(x =>
                    x.SucursalId ==
                        sucursalId.Value);
            }

            if (productoId.HasValue)
            {
                query = query.Where(x =>
                    x.ProductoId ==
                        productoId.Value);
            }

            var movimientos =
                await query
                    .OrderByDescending(x =>
                        x.Fecha)
                    .Take(limite)
                    .Select(x => new
                    {
                        x.Id,
                        x.SucursalId,
                        Sucursal =
                            x.Sucursal.Nombre,
                        x.ProductoId,
                        Producto =
                            x.Producto.Nombre,
                        x.Tipo,
                        x.Cantidad,
                        x.CantidadAnterior,
                        x.CantidadNueva,
                        x.Motivo,
                        x.UsuarioId,

                        Usuario =
                            x.Usuario != null
                                ? x.Usuario.Nombre + " " +
                                  x.Usuario.Apellidos
                                : null,

                        x.Fecha
                    })
                    .ToListAsync();

            return Ok(movimientos);
        }

        [HttpPost("ajustar")]
        public async Task<IActionResult> Ajustar(
            AjustarInventarioDto request)
        {
            var tenantId = _tenantContext.TenantId;
            var usuarioId = _tenantContext.UsuarioId;

            if (request.Cantidad < 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "La cantidad no puede ser negativa."
                });
            }

            var tipo =
                request.Tipo
                    ?.Trim()
                    .ToLowerInvariant();

            if (tipo != "entrada" &&
                tipo != "salida" &&
                tipo != "ajuste")
            {
                return BadRequest(new
                {
                    mensaje =
                        "El tipo debe ser Entrada, Salida o Ajuste."
                });
            }

            var sucursal =
                await _context.Sucursales
                    .FirstOrDefaultAsync(x =>
                        x.Id == request.SucursalId &&
                        x.TenantId == tenantId);

            if (sucursal == null)
            {
                return BadRequest(new
                {
                    mensaje =
                        "La sucursal indicada no pertenece al negocio."
                });
            }

            var producto =
                await _context.Productos
                    .FirstOrDefaultAsync(x =>
                        x.Id == request.ProductoId &&
                        x.TenantId == tenantId);

            if (producto == null)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El producto indicado no pertenece al negocio."
                });
            }

            var inventario =
                await _context.InventariosSucursal
                    .FirstOrDefaultAsync(x =>
                        x.TenantId == tenantId &&
                        x.SucursalId ==
                            request.SucursalId &&
                        x.ProductoId ==
                            request.ProductoId);

            if (inventario == null)
            {
                inventario =
                    new InventarioSucursal
                    {
                        TenantId = tenantId,
                        SucursalId =
                            request.SucursalId,
                        ProductoId =
                            request.ProductoId,
                        Cantidad = 0,
                        FechaActualizacion =
                            DateTime.UtcNow
                    };

                _context.InventariosSucursal.Add(
                    inventario);
            }

            var cantidadAnterior =
                inventario.Cantidad;

            decimal cantidadNueva;

            if (tipo == "entrada")
            {
                if (request.Cantidad <= 0)
                {
                    return BadRequest(new
                    {
                        mensaje =
                            "La cantidad de entrada debe ser mayor que cero."
                    });
                }

                cantidadNueva =
                    cantidadAnterior +
                    request.Cantidad;
            }
            else if (tipo == "salida")
            {
                if (request.Cantidad <= 0)
                {
                    return BadRequest(new
                    {
                        mensaje =
                            "La cantidad de salida debe ser mayor que cero."
                    });
                }

                cantidadNueva =
                    cantidadAnterior -
                    request.Cantidad;

                if (cantidadNueva < 0)
                {
                    return BadRequest(new
                    {
                        mensaje =
                            "No hay inventario suficiente para realizar la salida."
                    });
                }
            }
            else
            {
                cantidadNueva =
                    request.Cantidad;
            }

            inventario.Cantidad =
                cantidadNueva;

            inventario.FechaActualizacion =
                DateTime.UtcNow;

            var movimiento =
                new MovimientoInventario
                {
                    TenantId = tenantId,
                    SucursalId =
                        request.SucursalId,
                    ProductoId =
                        request.ProductoId,
                    Tipo =
                        tipo switch
                        {
                            "entrada" => "Entrada",
                            "salida" => "Salida",
                            _ => "Ajuste"
                        },
                    Cantidad =
                        request.Cantidad,
                    CantidadAnterior =
                        cantidadAnterior,
                    CantidadNueva =
                        cantidadNueva,
                    Motivo =
                        string.IsNullOrWhiteSpace(
                            request.Motivo)
                            ? null
                            : request.Motivo.Trim(),
                    UsuarioId =
                        usuarioId,
                    Fecha =
                        DateTime.UtcNow
                };

            _context.MovimientosInventario.Add(
                movimiento);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje =
                    "Inventario actualizado correctamente.",
                inventario.Id,
                inventario.SucursalId,
                inventario.ProductoId,
                movimiento.Tipo,
                movimiento.Cantidad,
                movimiento.CantidadAnterior,
                movimiento.CantidadNueva,
                inventario.FechaActualizacion
            });
        }
    }
}
