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
    public class ResumenFinancieroController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;
        private readonly ITimeZoneService _timeZoneService;

        public ResumenFinancieroController(
            AppDbContext context,
            ITenantContext tenantContext,
            ITimeZoneService timeZoneService)
        {
            _context = context;
            _tenantContext = tenantContext;
            _timeZoneService = timeZoneService;
        }

        [HttpGet("diario")]
        public async Task<IActionResult> GetDiario(
            DateOnly? fecha = null,
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

            DateOnly fechaLocal;

            if (fecha.HasValue)
            {
                fechaLocal = fecha.Value;
            }
            else
            {
                var ahoraLocal =
                    await _timeZoneService
                        .UtcALocalAsync(
                            tenantId,
                            DateTime.UtcNow);

                fechaLocal =
                    DateOnly.FromDateTime(
                        ahoraLocal);
            }

            var inicioLocal =
                fechaLocal.ToDateTime(
                    TimeOnly.MinValue);

            var finLocal =
                fechaLocal
                    .AddDays(1)
                    .ToDateTime(
                        TimeOnly.MinValue);

            var inicioUtc =
                await _timeZoneService
                    .LocalAUtcAsync(
                        tenantId,
                        inicioLocal);

            var finUtc =
                await _timeZoneService
                    .LocalAUtcAsync(
                        tenantId,
                        finLocal);

            // ============================================================
            // ACTIVIDAD OPERATIVA DEL DÍA
            // ============================================================

            var citasQuery =
                _context.Citas
                    .Where(x =>
                        x.TenantId == tenantId &&
                        x.Estado == EstadosCita.Completada &&
                        x.FechaInicio >= inicioUtc &&
                        x.FechaInicio < finUtc);

            if (sucursalId.HasValue)
            {
                citasQuery =
                    citasQuery.Where(x =>
                        x.SucursalId == sucursalId.Value);
            }

            var ventasQuery =
                _context.Ventas
                    .Where(x =>
                        x.TenantId == tenantId &&
                        x.Estado == EstadosVenta.Completada &&
                        x.Fecha >= inicioUtc &&
                        x.Fecha < finUtc);

            if (sucursalId.HasValue)
            {
                ventasQuery =
                    ventasQuery.Where(x =>
                        x.SucursalId == sucursalId.Value);
            }

            // ============================================================
            // CAJA REAL DEL DÍA
            //
            // Los ingresos se reconocen cuando el dinero realmente entra,
            // usando FechaPago de los abonos. Así un saldo cobrado días
            // después aparece en el día del abono y no en el día de la cita
            // o de la venta original.
            // ============================================================

            var abonosQuery =
                _context.Set<AbonoCuentaPorCobrar>()
                    .Where(x =>
                        x.TenantId == tenantId &&
                        x.FechaPago >= inicioUtc &&
                        x.FechaPago < finUtc &&
                        x.CuentaPorCobrar.Estado !=
                            EstadosCuentaPorCobrar.Anulada);

            if (sucursalId.HasValue)
            {
                abonosQuery =
                    abonosQuery.Where(x =>
                        x.CuentaPorCobrar.SucursalId ==
                            sucursalId.Value);
            }

            var ingresosServicios =
                await abonosQuery
                    .Where(x =>
                        x.CuentaPorCobrar.CitaId != null)
                    .SumAsync(x =>
                        (decimal?)x.Monto)
                ?? 0;

            var ingresosProductos =
                await abonosQuery
                    .Where(x =>
                        x.CuentaPorCobrar.VentaId != null)
                    .SumAsync(x =>
                        (decimal?)x.Monto)
                ?? 0;

            var ingresosTotales =
                ingresosServicios +
                ingresosProductos;

            var cantidadCobros =
                await abonosQuery.CountAsync();

            var cantidadCobrosServicios =
                await abonosQuery
                    .CountAsync(x =>
                        x.CuentaPorCobrar.CitaId != null);

            var cantidadCobrosProductos =
                await abonosQuery
                    .CountAsync(x =>
                        x.CuentaPorCobrar.VentaId != null);

            var cobrosPorMetodoPago =
                await abonosQuery
                    .GroupBy(x => x.MetodoPago)
                    .Select(g => new
                    {
                        MetodoPago = g.Key,
                        CantidadCobros = g.Count(),
                        CantidadVentas = g.Count(),
                        Total = g.Sum(x => x.Monto)
                    })
                    .OrderByDescending(x => x.Total)
                    .ToListAsync();

            // ============================================================
            // MÉTRICAS OPERATIVAS / FACTURADAS
            // ============================================================

            var cantidadCitasCompletadas =
                await citasQuery.CountAsync();

            var facturadoServicios =
                await citasQuery
                    .SumAsync(x =>
                        (decimal?)x.Precio)
                ?? 0;

            var cantidadVentas =
                await ventasQuery.CountAsync();

            var subtotalVentasProductos =
                await ventasQuery
                    .SumAsync(x =>
                        (decimal?)x.Subtotal)
                ?? 0;

            var descuentosProductos =
                await ventasQuery
                    .SumAsync(x =>
                        (decimal?)x.Descuento)
                ?? 0;

            var facturadoProductos =
                await ventasQuery
                    .SumAsync(x =>
                        (decimal?)x.Total)
                ?? 0;

            var costoProductosVendidos =
                await _context.VentaDetalles
                    .Where(d =>
                        d.TenantId == tenantId &&
                        d.Venta.Estado == EstadosVenta.Completada &&
                        d.Venta.Fecha >= inicioUtc &&
                        d.Venta.Fecha < finUtc &&
                        (!sucursalId.HasValue ||
                         d.Venta.SucursalId ==
                            sucursalId.Value))
                    .SumAsync(d =>
                        (decimal?)
                        (d.CostoUnitario * d.Cantidad))
                ?? 0;

            var utilidadBrutaProductos =
                facturadoProductos -
                costoProductosVendidos;

            return Ok(new
            {
                Fecha = fechaLocal,
                SucursalId = sucursalId,

                Servicios = new
                {
                    CantidadCitas =
                        cantidadCitasCompletadas,
                    Facturado =
                        facturadoServicios,
                    Ingresos =
                        ingresosServicios,
                    CantidadCobros =
                        cantidadCobrosServicios
                },

                Productos = new
                {
                    CantidadVentas =
                        cantidadVentas,
                    Subtotal =
                        subtotalVentasProductos,
                    Descuentos =
                        descuentosProductos,
                    Facturado =
                        facturadoProductos,
                    Ingresos =
                        ingresosProductos,
                    CantidadCobros =
                        cantidadCobrosProductos,
                    Costo =
                        costoProductosVendidos,
                    UtilidadBruta =
                        utilidadBrutaProductos
                },

                Caja = new
                {
                    CantidadCobros =
                        cantidadCobros,
                    IngresosServicios =
                        ingresosServicios,
                    IngresosProductos =
                        ingresosProductos,
                    IngresosTotales =
                        ingresosTotales
                },

                IngresosTotales =
                    ingresosTotales,

                CobrosPorMetodoPago =
                    cobrosPorMetodoPago,

                // Se mantiene por compatibilidad con el frontend anterior.
                VentasPorMetodoPago =
                    cobrosPorMetodoPago
            });
        }
    }
}
