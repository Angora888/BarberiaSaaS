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
    public class CobrosVentasController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public CobrosVentasController(
            AppDbContext context,
            ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        [HttpPost("registrar")]
        public async Task<IActionResult> Registrar(
            RegistrarCobroVentaRequest request)
        {
            var tenantId = _tenantContext.TenantId;

            if (request.VentaId <= 0)
            {
                return BadRequest(new
                {
                    mensaje = "La venta es requerida."
                });
            }

            if (request.MontoPagado < 0)
            {
                return BadRequest(new
                {
                    mensaje = "El monto pagado no puede ser negativo."
                });
            }

            var venta = await _context.Ventas
                .FirstOrDefaultAsync(x =>
                    x.Id == request.VentaId &&
                    x.TenantId == tenantId);

            if (venta == null)
            {
                return NotFound(new
                {
                    mensaje = "Venta no encontrada."
                });
            }

            if (venta.Estado != EstadosVenta.Completada)
            {
                return BadRequest(new
                {
                    mensaje = "Solo se puede registrar el cobro de una venta completada."
                });
            }

            var cuentaExistente = await _context.Set<CuentaPorCobrar>()
                .AnyAsync(x =>
                    x.TenantId == tenantId &&
                    x.VentaId == venta.Id);

            if (cuentaExistente)
            {
                return Conflict(new
                {
                    mensaje = "Esta venta ya tiene un cobro registrado."
                });
            }

            if (request.MontoPagado > venta.Total)
            {
                return BadRequest(new
                {
                    mensaje = "El monto pagado no puede superar el total de la venta."
                });
            }

            if (
                request.MontoPagado > 0 &&
                !MetodoPagoValido(request.MetodoPago))
            {
                return BadRequest(new
                {
                    mensaje = "Selecciona un método de pago válido."
                });
            }

            var saldo = venta.Total - request.MontoPagado;

            if (
                saldo > 0 &&
                !venta.ClienteId.HasValue)
            {
                return BadRequest(new
                {
                    mensaje = "Para dejar un saldo pendiente en una venta debes seleccionar un cliente."
                });
            }

            var estado = saldo <= 0
                ? EstadosCuentaPorCobrar.Pagada
                : request.MontoPagado > 0
                    ? EstadosCuentaPorCobrar.Parcial
                    : EstadosCuentaPorCobrar.Pendiente;

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            if (
                request.MontoPagado > 0 &&
                MetodoPagoValido(request.MetodoPago))
            {
                venta.MetodoPago = request.MetodoPago!.Trim();
            }

            if (!venta.ClienteId.HasValue)
            {
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    CuentaId = (int?)null,
                    venta.Id,
                    VentaId = venta.Id,
                    venta.ClienteId,
                    MontoOriginal = venta.Total,
                    MontoPagado = request.MontoPagado,
                    SaldoPendiente = saldo,
                    Estado = estado,
                    SinCuentaPorCobrar = true
                });
            }

            var cuenta = new CuentaPorCobrar
            {
                TenantId = tenantId,
                SucursalId = venta.SucursalId,
                ClienteId = venta.ClienteId.Value,
                VentaId = venta.Id,
                MontoOriginal = venta.Total,
                SaldoPendiente = saldo,
                Estado = estado,
                Notas = LimpiarTexto(request.Notas),
                FechaCreacion = DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow
            };

            _context.Set<CuentaPorCobrar>().Add(cuenta);
            await _context.SaveChangesAsync();

            if (request.MontoPagado > 0)
            {
                var abono = new AbonoCuentaPorCobrar
                {
                    TenantId = tenantId,
                    CuentaPorCobrarId = cuenta.Id,
                    UsuarioId = _tenantContext.UsuarioId,
                    Monto = request.MontoPagado,
                    MetodoPago = request.MetodoPago!.Trim(),
                    FechaPago = DateTime.UtcNow,
                    Notas = LimpiarTexto(request.Notas),
                    FechaCreacion = DateTime.UtcNow
                };

                _context.Set<AbonoCuentaPorCobrar>().Add(abono);
                await _context.SaveChangesAsync();
            }

            await transaction.CommitAsync();

            return Ok(new
            {
                CuentaId = cuenta.Id,
                VentaId = venta.Id,
                cuenta.ClienteId,
                cuenta.MontoOriginal,
                MontoPagado = request.MontoPagado,
                cuenta.SaldoPendiente,
                cuenta.Estado,
                SinCuentaPorCobrar = false
            });
        }

        private static bool MetodoPagoValido(string? metodoPago)
        {
            if (string.IsNullOrWhiteSpace(metodoPago))
            {
                return false;
            }

            var metodo = metodoPago.Trim();

            return metodo == MetodosPago.Efectivo ||
                   metodo == MetodosPago.SinpeMovil ||
                   metodo == MetodosPago.Tarjeta ||
                   metodo == MetodosPago.Transferencia;
        }

        private static string? LimpiarTexto(string? valor)
        {
            return string.IsNullOrWhiteSpace(valor)
                ? null
                : valor.Trim();
        }

        public class RegistrarCobroVentaRequest
        {
            public int VentaId { get; set; }

            public decimal MontoPagado { get; set; }

            public string? MetodoPago { get; set; }

            public string? Notas { get; set; }
        }
    }
}
