using System.Data;
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
    public class VentasController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public VentasController(
            AppDbContext context,
            ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        // ============================================================
        // LISTAR VENTAS
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> GetVentas(
            int limite = 200)
        {
            var tenantId = _tenantContext.TenantId;

            limite = Math.Clamp(
                limite,
                1,
                500);

            var ventas =
                await _context.Ventas
                    .Where(x =>
                        x.TenantId == tenantId)
                    .OrderByDescending(x =>
                        x.Fecha)
                    .Take(limite)
                    .Select(x => new
                    {
                        x.Id,
                        x.SucursalId,
                        Sucursal =
                            x.Sucursal.Nombre,
                        x.ClienteId,

                        Cliente =
                            x.Cliente != null
                                ? x.Cliente.Nombre + " " +
                                  x.Cliente.Apellidos
                                : null,

                        x.UsuarioId,

                        Usuario =
                            x.Usuario.Nombre + " " +
                            x.Usuario.Apellidos,

                        x.MetodoPago,
                        x.Subtotal,
                        x.Descuento,
                        x.Total,
                        x.Estado,
                        x.Notas,
                        x.Fecha,

                        CantidadProductos =
                            x.Detalles.Sum(d =>
                                (decimal?)d.Cantidad)
                            ?? 0
                    })
                    .ToListAsync();

            return Ok(ventas);
        }

        // ============================================================
        // OBTENER VENTA
        // ============================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetVenta(
            int id)
        {
            var tenantId = _tenantContext.TenantId;

            var venta =
                await _context.Ventas
                    .Where(x =>
                        x.Id == id &&
                        x.TenantId == tenantId)
                    .Select(x => new
                    {
                        x.Id,
                        x.SucursalId,
                        Sucursal =
                            x.Sucursal.Nombre,
                        x.ClienteId,

                        Cliente =
                            x.Cliente != null
                                ? x.Cliente.Nombre + " " +
                                  x.Cliente.Apellidos
                                : null,

                        x.UsuarioId,

                        Usuario =
                            x.Usuario.Nombre + " " +
                            x.Usuario.Apellidos,

                        x.MetodoPago,
                        x.Subtotal,
                        x.Descuento,
                        x.Total,
                        x.Estado,
                        x.Notas,
                        x.Fecha,

                        Detalles =
                            x.Detalles
                                .OrderBy(d =>
                                    d.Id)
                                .Select(d => new
                                {
                                    d.Id,
                                    d.ProductoId,
                                    Producto =
                                        d.Producto.Nombre,
                                    d.Cantidad,
                                    d.PrecioUnitario,
                                    d.CostoUnitario,
                                    d.Subtotal
                                })
                                .ToList()
                    })
                    .FirstOrDefaultAsync();

            if (venta == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "Venta no encontrada."
                });
            }

            return Ok(venta);
        }

        // ============================================================
        // CREAR VENTA
        // ============================================================

        [HttpPost]
        public async Task<IActionResult> Crear(
            CrearVentaDto request)
        {
            var tenantId =
                _tenantContext.TenantId;

            var usuarioId =
                _tenantContext.UsuarioId;

            if (request.SucursalId <= 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "Debe indicar una sucursal válida."
                });
            }

            if (request.Detalles == null ||
                request.Detalles.Count == 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "La venta debe contener al menos un producto."
                });
            }

            if (request.Descuento < 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "El descuento no puede ser negativo."
                });
            }

            if (!MetodoPagoValido(
                request.MetodoPago))
            {
                return BadRequest(new
                {
                    mensaje =
                        "El método de pago no es válido. Use Efectivo, SINPE Movil, Tarjeta o Transferencia."
                });
            }

            var detallesAgrupados =
                request.Detalles
                    .GroupBy(x =>
                        x.ProductoId)
                    .Select(x => new
                    {
                        ProductoId =
                            x.Key,

                        Cantidad =
                            x.Sum(d =>
                                d.Cantidad)
                    })
                    .ToList();

            if (detallesAgrupados.Any(x =>
                x.ProductoId <= 0 ||
                x.Cantidad <= 0))
            {
                return BadRequest(new
                {
                    mensaje =
                        "Todos los productos deben tener un identificador válido y una cantidad mayor que cero."
                });
            }

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync(
                        IsolationLevel.Serializable);

            try
            {
                var sucursal =
                    await _context.Sucursales
                        .FirstOrDefaultAsync(x =>
                            x.Id ==
                                request.SucursalId &&
                            x.TenantId ==
                                tenantId &&
                            x.Activa);

                if (sucursal == null)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        mensaje =
                            "La sucursal indicada no existe, no pertenece al negocio o está inactiva."
                    });
                }

                if (request.ClienteId.HasValue)
                {
                    var clienteExiste =
                        await _context.Clientes
                            .AnyAsync(x =>
                                x.Id ==
                                    request.ClienteId.Value &&
                                x.TenantId ==
                                    tenantId &&
                                x.Activo);

                    if (!clienteExiste)
                    {
                        await transaction.RollbackAsync();

                        return BadRequest(new
                        {
                            mensaje =
                                "El cliente indicado no existe, no pertenece al negocio o está inactivo."
                        });
                    }
                }

                var usuarioExiste =
                    await _context.Usuarios
                        .AnyAsync(x =>
                            x.Id ==
                                usuarioId &&
                            x.TenantId ==
                                tenantId &&
                            x.Activo);

                if (!usuarioExiste)
                {
                    await transaction.RollbackAsync();

                    return Unauthorized(new
                    {
                        mensaje =
                            "El usuario autenticado no es válido."
                    });
                }

                var productoIds =
                    detallesAgrupados
                        .Select(x =>
                            x.ProductoId)
                        .ToList();

                var productos =
                    await _context.Productos
                        .Where(x =>
                            x.TenantId ==
                                tenantId &&
                            x.Activo &&
                            productoIds.Contains(
                                x.Id))
                        .ToDictionaryAsync(
                            x => x.Id);

                if (productos.Count !=
                    productoIds.Count)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        mensaje =
                            "Uno o más productos no existen, no pertenecen al negocio o están inactivos."
                    });
                }

                var inventarios =
                    await _context
                        .InventariosSucursal
                        .Where(x =>
                            x.TenantId ==
                                tenantId &&
                            x.SucursalId ==
                                request.SucursalId &&
                            productoIds.Contains(
                                x.ProductoId))
                        .ToDictionaryAsync(
                            x => x.ProductoId);

                foreach (var detalle in
                    detallesAgrupados)
                {
                    if (!inventarios.TryGetValue(
                        detalle.ProductoId,
                        out var inventario))
                    {
                        await transaction.RollbackAsync();

                        return BadRequest(new
                        {
                            mensaje =
                                $"El producto '{productos[detalle.ProductoId].Nombre}' no tiene inventario registrado en esta sucursal."
                        });
                    }

                    if (inventario.Cantidad <
                        detalle.Cantidad)
                    {
                        await transaction.RollbackAsync();

                        return BadRequest(new
                        {
                            mensaje =
                                $"Inventario insuficiente para '{productos[detalle.ProductoId].Nombre}'. Disponible: {inventario.Cantidad}."
                        });
                    }
                }

                decimal subtotal = 0;

                foreach (var detalle in
                    detallesAgrupados)
                {
                    var producto =
                        productos[
                            detalle.ProductoId];

                    subtotal +=
                        producto.PrecioVenta *
                        detalle.Cantidad;
                }

                subtotal =
                    decimal.Round(
                        subtotal,
                        2,
                        MidpointRounding.AwayFromZero);

                if (request.Descuento >
                    subtotal)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        mensaje =
                            "El descuento no puede ser mayor que el subtotal de la venta."
                    });
                }

                var total =
                    decimal.Round(
                        subtotal -
                        request.Descuento,
                        2,
                        MidpointRounding.AwayFromZero);

                var fecha =
                    DateTime.UtcNow;

                var venta =
                    new Venta
                    {
                        TenantId =
                            tenantId,

                        SucursalId =
                            request.SucursalId,

                        ClienteId =
                            request.ClienteId,

                        UsuarioId =
                            usuarioId,

                        MetodoPago =
                            NormalizarMetodoPago(
                                request.MetodoPago),

                        Subtotal =
                            subtotal,

                        Descuento =
                            request.Descuento,

                        Total =
                            total,

                        Estado =
                            EstadosVenta.Completada,

                        Notas =
                            string.IsNullOrWhiteSpace(
                                request.Notas)
                                ? null
                                : request.Notas.Trim(),

                        Fecha =
                            fecha
                    };

                _context.Ventas.Add(
                    venta);

                await _context
                    .SaveChangesAsync();

                foreach (var detalle in
                    detallesAgrupados)
                {
                    var producto =
                        productos[
                            detalle.ProductoId];

                    var inventario =
                        inventarios[
                            detalle.ProductoId];

                    var cantidadAnterior =
                        inventario.Cantidad;

                    var cantidadNueva =
                        cantidadAnterior -
                        detalle.Cantidad;

                    var subtotalDetalle =
                        decimal.Round(
                            producto.PrecioVenta *
                            detalle.Cantidad,
                            2,
                            MidpointRounding
                                .AwayFromZero);

                    var ventaDetalle =
                        new VentaDetalle
                        {
                            TenantId =
                                tenantId,

                            VentaId =
                                venta.Id,

                            ProductoId =
                                producto.Id,

                            Cantidad =
                                detalle.Cantidad,

                            PrecioUnitario =
                                producto.PrecioVenta,

                            CostoUnitario =
                                producto.Costo,

                            Subtotal =
                                subtotalDetalle
                        };

                    inventario.Cantidad =
                        cantidadNueva;

                    inventario
                        .FechaActualizacion =
                            fecha;

                    var movimiento =
                        new MovimientoInventario
                        {
                            TenantId =
                                tenantId,

                            SucursalId =
                                request.SucursalId,

                            ProductoId =
                                producto.Id,

                            Tipo =
                                "Salida",

                            Cantidad =
                                detalle.Cantidad,

                            CantidadAnterior =
                                cantidadAnterior,

                            CantidadNueva =
                                cantidadNueva,

                            Motivo =
                                $"Venta #{venta.Id}",

                            UsuarioId =
                                usuarioId,

                            Fecha =
                                fecha
                        };

                    _context.VentaDetalles.Add(
                        ventaDetalle);

                    _context
                        .MovimientosInventario
                        .Add(
                            movimiento);
                }

                await _context
                    .SaveChangesAsync();

                await transaction
                    .CommitAsync();

                return Ok(new
                {
                    mensaje =
                        "Venta registrada correctamente.",

                    venta.Id,
                    venta.SucursalId,
                    venta.ClienteId,
                    venta.UsuarioId,
                    venta.MetodoPago,
                    venta.Subtotal,
                    venta.Descuento,
                    venta.Total,
                    venta.Estado,
                    venta.Fecha
                });
            }
            catch
            {
                await transaction.RollbackAsync();

                throw;
            }
        }

        // ============================================================
        // ANULAR VENTA
        // ============================================================

        [HttpPost("{id:int}/anular")]
        public async Task<IActionResult> Anular(
            int id,
            AnularVentaDto request)
        {
            var tenantId =
                _tenantContext.TenantId;

            var usuarioId =
                _tenantContext.UsuarioId;

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync(
                        IsolationLevel.Serializable);

            try
            {
                var venta =
                    await _context.Ventas
                        .Include(x =>
                            x.Detalles)
                        .ThenInclude(x =>
                            x.Producto)
                        .FirstOrDefaultAsync(x =>
                            x.Id == id &&
                            x.TenantId ==
                                tenantId);

                if (venta == null)
                {
                    await transaction.RollbackAsync();

                    return NotFound(new
                    {
                        mensaje =
                            "Venta no encontrada."
                    });
                }

                if (venta.Estado ==
                    EstadosVenta.Anulada)
                {
                    await transaction.RollbackAsync();

                    return Conflict(new
                    {
                        mensaje =
                            "La venta ya se encuentra anulada."
                    });
                }

                if (venta.Estado !=
                    EstadosVenta.Completada)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        mensaje =
                            "Solo se pueden anular ventas completadas."
                    });
                }

                var productoIds =
                    venta.Detalles
                        .Select(x =>
                            x.ProductoId)
                        .Distinct()
                        .ToList();

                var inventarios =
                    await _context
                        .InventariosSucursal
                        .Where(x =>
                            x.TenantId ==
                                tenantId &&
                            x.SucursalId ==
                                venta.SucursalId &&
                            productoIds.Contains(
                                x.ProductoId))
                        .ToDictionaryAsync(
                            x => x.ProductoId);

                var fecha =
                    DateTime.UtcNow;

                foreach (var detalle in
                    venta.Detalles)
                {
                    if (!inventarios.TryGetValue(
                        detalle.ProductoId,
                        out var inventario))
                    {
                        inventario =
                            new InventarioSucursal
                            {
                                TenantId =
                                    tenantId,

                                SucursalId =
                                    venta.SucursalId,

                                ProductoId =
                                    detalle.ProductoId,

                                Cantidad =
                                    0,

                                FechaActualizacion =
                                    fecha
                            };

                        _context
                            .InventariosSucursal
                            .Add(
                                inventario);

                        inventarios[
                            detalle.ProductoId] =
                                inventario;
                    }

                    var cantidadAnterior =
                        inventario.Cantidad;

                    var cantidadNueva =
                        cantidadAnterior +
                        detalle.Cantidad;

                    inventario.Cantidad =
                        cantidadNueva;

                    inventario
                        .FechaActualizacion =
                            fecha;

                    var motivoAdicional =
                        string.IsNullOrWhiteSpace(
                            request.Motivo)
                            ? string.Empty
                            : $" - {request.Motivo.Trim()}";

                    var movimiento =
                        new MovimientoInventario
                        {
                            TenantId =
                                tenantId,

                            SucursalId =
                                venta.SucursalId,

                            ProductoId =
                                detalle.ProductoId,

                            Tipo =
                                "Entrada",

                            Cantidad =
                                detalle.Cantidad,

                            CantidadAnterior =
                                cantidadAnterior,

                            CantidadNueva =
                                cantidadNueva,

                            Motivo =
                                $"Anulación venta #{venta.Id}{motivoAdicional}",

                            UsuarioId =
                                usuarioId,

                            Fecha =
                                fecha
                        };

                    _context
                        .MovimientosInventario
                        .Add(
                            movimiento);
                }

                venta.Estado =
                    EstadosVenta.Anulada;

                if (!string.IsNullOrWhiteSpace(
                    request.Motivo))
                {
                    var notaAnulacion =
                        $"Anulación: {request.Motivo.Trim()}";

                    venta.Notas =
                        string.IsNullOrWhiteSpace(
                            venta.Notas)
                            ? notaAnulacion
                            : $"{venta.Notas} | {notaAnulacion}";
                }

                await _context
                    .SaveChangesAsync();

                await transaction
                    .CommitAsync();

                return Ok(new
                {
                    mensaje =
                        "Venta anulada correctamente. El inventario fue restaurado.",

                    venta.Id,
                    venta.Estado
                });
            }
            catch
            {
                await transaction.RollbackAsync();

                throw;
            }
        }

        // ============================================================
        // MÉTODOS DE PAGO
        // ============================================================

        [HttpGet("metodos-pago")]
        public IActionResult GetMetodosPago()
        {
            return Ok(new[]
            {
                MetodosPago.Efectivo,
                MetodosPago.SinpeMovil,
                MetodosPago.Tarjeta,
                MetodosPago.Transferencia
            });
        }

        private static bool MetodoPagoValido(
            string? metodoPago)
        {
            if (string.IsNullOrWhiteSpace(
                metodoPago))
            {
                return false;
            }

            var metodo =
                metodoPago.Trim();

            return
                metodo.Equals(
                    MetodosPago.Efectivo,
                    StringComparison
                        .OrdinalIgnoreCase) ||
                metodo.Equals(
                    MetodosPago.SinpeMovil,
                    StringComparison
                        .OrdinalIgnoreCase) ||
                metodo.Equals(
                    MetodosPago.Tarjeta,
                    StringComparison
                        .OrdinalIgnoreCase) ||
                metodo.Equals(
                    MetodosPago.Transferencia,
                    StringComparison
                        .OrdinalIgnoreCase);
        }

        private static string NormalizarMetodoPago(
            string metodoPago)
        {
            var metodo =
                metodoPago.Trim();

            if (metodo.Equals(
                MetodosPago.Efectivo,
                StringComparison.OrdinalIgnoreCase))
            {
                return MetodosPago.Efectivo;
            }

            if (metodo.Equals(
                MetodosPago.SinpeMovil,
                StringComparison.OrdinalIgnoreCase))
            {
                return MetodosPago.SinpeMovil;
            }

            if (metodo.Equals(
                MetodosPago.Tarjeta,
                StringComparison.OrdinalIgnoreCase))
            {
                return MetodosPago.Tarjeta;
            }

            return MetodosPago.Transferencia;
        }
    }
}
