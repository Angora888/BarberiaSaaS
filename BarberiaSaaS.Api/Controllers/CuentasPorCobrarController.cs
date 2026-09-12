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
    public class CuentasPorCobrarController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public CuentasPorCobrarController(
            AppDbContext context,
            ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
        }

        [HttpGet]
        public async Task<IActionResult> Get(
            int? sucursalId = null,
            string? estado = null,
            int? clienteId = null)
        {
            var tenantId = _tenantContext.TenantId;

            var query = _context.Set<CuentaPorCobrar>()
                .AsNoTracking()
                .Where(x => x.TenantId == tenantId);

            if (sucursalId.HasValue)
            {
                query = query.Where(x =>
                    x.SucursalId == sucursalId.Value);
            }

            if (clienteId.HasValue)
            {
                query = query.Where(x =>
                    x.ClienteId == clienteId.Value);
            }

            if (!string.IsNullOrWhiteSpace(estado))
            {
                query = query.Where(x =>
                    x.Estado == estado);
            }

            var cuentas = await query
                .OrderBy(x =>
                    x.Estado == EstadosCuentaPorCobrar.Pagada ||
                    x.Estado == EstadosCuentaPorCobrar.Anulada)
                .ThenByDescending(x => x.FechaCreacion)
                .Select(x => new
                {
                    x.Id,
                    x.SucursalId,
                    Sucursal = x.Sucursal.Nombre,
                    x.ClienteId,
                    Cliente = new
                    {
                        x.Cliente.Id,
                        x.Cliente.Nombre,
                        x.Cliente.Apellidos,
                        x.Cliente.Telefono
                    },
                    x.CitaId,
                    x.VentaId,
                    x.MontoOriginal,
                    MontoPagado = x.MontoOriginal - x.SaldoPendiente,
                    x.SaldoPendiente,
                    x.Estado,
                    x.Notas,
                    x.FechaCreacion,
                    x.FechaActualizacion,
                    CantidadAbonos = x.Abonos.Count()
                })
                .ToListAsync();

            return Ok(cuentas);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var tenantId = _tenantContext.TenantId;

            var cuenta = await _context.Set<CuentaPorCobrar>()
                .AsNoTracking()
                .Where(x =>
                    x.Id == id &&
                    x.TenantId == tenantId)
                .Select(x => new
                {
                    x.Id,
                    x.SucursalId,
                    Sucursal = x.Sucursal.Nombre,
                    x.ClienteId,
                    Cliente = new
                    {
                        x.Cliente.Id,
                        x.Cliente.Nombre,
                        x.Cliente.Apellidos,
                        x.Cliente.Telefono,
                        x.Cliente.Email
                    },
                    x.CitaId,
                    x.VentaId,
                    x.MontoOriginal,
                    MontoPagado = x.MontoOriginal - x.SaldoPendiente,
                    x.SaldoPendiente,
                    x.Estado,
                    x.Notas,
                    x.FechaCreacion,
                    x.FechaActualizacion,
                    Abonos = x.Abonos
                        .OrderByDescending(a => a.FechaPago)
                        .Select(a => new
                        {
                            a.Id,
                            a.Monto,
                            a.MetodoPago,
                            a.FechaPago,
                            a.Notas,
                            a.UsuarioId
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync();

            if (cuenta == null)
            {
                return NotFound(new
                {
                    mensaje = "Cuenta por cobrar no encontrada."
                });
            }

            return Ok(cuenta);
        }

        [HttpPost("registrar-cobro-cita")]
        public async Task<IActionResult> RegistrarCobroCita(
            RegistrarCobroCitaRequest request)
        {
            var tenantId = _tenantContext.TenantId;

            if (request.CitaId <= 0)
            {
                return BadRequest(new
                {
                    mensaje = "La cita es requerida."
                });
            }

            if (request.MontoPagado < 0)
            {
                return BadRequest(new
                {
                    mensaje = "El monto pagado no puede ser negativo."
                });
            }

            if (request.Descuento < 0)
            {
                return BadRequest(new
                {
                    mensaje = "El descuento no puede ser negativo."
                });
            }

            var cita = await _context.Citas
                .Include(x => x.Cliente)
                .FirstOrDefaultAsync(x =>
                    x.Id == request.CitaId &&
                    x.TenantId == tenantId);

            if (cita == null)
            {
                return NotFound(new
                {
                    mensaje = "Cita no encontrada."
                });
            }

            if (cita.Estado != EstadosCita.Completada)
            {
                return BadRequest(new
                {
                    mensaje = "La cita debe estar completada antes de registrar el cobro."
                });
            }

            var cuentaExistente = await _context.Set<CuentaPorCobrar>()
                .AnyAsync(x =>
                    x.TenantId == tenantId &&
                    x.CitaId == cita.Id);

            if (cuentaExistente)
            {
                return Conflict(new
                {
                    mensaje = "Esta cita ya tiene un cobro registrado."
                });
            }

            if (request.Descuento > cita.Precio)
            {
                return BadRequest(new
                {
                    mensaje = "El descuento no puede superar el precio original de la cita."
                });
            }

            var totalCobrar = decimal.Round(
                cita.Precio - request.Descuento,
                2,
                MidpointRounding.AwayFromZero);

            if (request.MontoPagado > totalCobrar)
            {
                return BadRequest(new
                {
                    mensaje = "El monto pagado no puede superar el total a cobrar después del descuento."
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

            var saldo = totalCobrar - request.MontoPagado;

            var estado = saldo <= 0
                ? EstadosCuentaPorCobrar.Pagada
                : request.MontoPagado > 0
                    ? EstadosCuentaPorCobrar.Parcial
                    : EstadosCuentaPorCobrar.Pendiente;

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            var cuenta = new CuentaPorCobrar
            {
                TenantId = tenantId,
                SucursalId = cita.SucursalId,
                ClienteId = cita.ClienteId,
                CitaId = cita.Id,
                MontoOriginal = totalCobrar,
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
                cuenta.Id,
                cuenta.CitaId,
                cuenta.ClienteId,
                PrecioOriginal = cita.Precio,
                Descuento = request.Descuento,
                TotalCobrar = totalCobrar,
                cuenta.MontoOriginal,
                MontoPagado = request.MontoPagado,
                cuenta.SaldoPendiente,
                cuenta.Estado
            });
        }

        [HttpPost("{id:int}/abonos")]
        public async Task<IActionResult> RegistrarAbono(
            int id,
            RegistrarAbonoRequest request)
        {
            var tenantId = _tenantContext.TenantId;

            if (request.Monto <= 0)
            {
                return BadRequest(new
                {
                    mensaje = "El monto del abono debe ser mayor a cero."
                });
            }

            if (!MetodoPagoValido(request.MetodoPago))
            {
                return BadRequest(new
                {
                    mensaje = "Selecciona un método de pago válido."
                });
            }

            var cuenta = await _context.Set<CuentaPorCobrar>()
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.TenantId == tenantId);

            if (cuenta == null)
            {
                return NotFound(new
                {
                    mensaje = "Cuenta por cobrar no encontrada."
                });
            }

            if (cuenta.Estado == EstadosCuentaPorCobrar.Anulada)
            {
                return BadRequest(new
                {
                    mensaje = "No se pueden registrar abonos en una cuenta anulada."
                });
            }

            if (
                cuenta.Estado == EstadosCuentaPorCobrar.Pagada ||
                cuenta.SaldoPendiente <= 0)
            {
                return BadRequest(new
                {
                    mensaje = "Esta cuenta ya está pagada."
                });
            }

            if (request.Monto > cuenta.SaldoPendiente)
            {
                return BadRequest(new
                {
                    mensaje = "El abono no puede superar el saldo pendiente."
                });
            }

            var abono = new AbonoCuentaPorCobrar
            {
                TenantId = tenantId,
                CuentaPorCobrarId = cuenta.Id,
                UsuarioId = _tenantContext.UsuarioId,
                Monto = request.Monto,
                MetodoPago = request.MetodoPago!.Trim(),
                FechaPago = DateTime.UtcNow,
                Notas = LimpiarTexto(request.Notas),
                FechaCreacion = DateTime.UtcNow
            };

            cuenta.SaldoPendiente -= request.Monto;
            cuenta.Estado = cuenta.SaldoPendiente <= 0
                ? EstadosCuentaPorCobrar.Pagada
                : EstadosCuentaPorCobrar.Parcial;
            cuenta.FechaActualizacion = DateTime.UtcNow;

            _context.Set<AbonoCuentaPorCobrar>().Add(abono);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                cuenta.Id,
                AbonoId = abono.Id,
                abono.Monto,
                abono.MetodoPago,
                abono.FechaPago,
                cuenta.SaldoPendiente,
                cuenta.Estado
            });
        }

        [HttpPut("{id:int}/anular")]
        public async Task<IActionResult> Anular(int id)
        {
            var tenantId = _tenantContext.TenantId;

            var cuenta = await _context.Set<CuentaPorCobrar>()
                .Include(x => x.Abonos)
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.TenantId == tenantId);

            if (cuenta == null)
            {
                return NotFound(new
                {
                    mensaje = "Cuenta por cobrar no encontrada."
                });
            }

            if (cuenta.Abonos.Any())
            {
                return BadRequest(new
                {
                    mensaje = "No se puede anular una cuenta que ya tiene pagos registrados."
                });
            }

            cuenta.Estado = EstadosCuentaPorCobrar.Anulada;
            cuenta.FechaActualizacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                cuenta.Id,
                cuenta.Estado
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

        public class RegistrarCobroCitaRequest
        {
            public int CitaId { get; set; }

            public decimal MontoPagado { get; set; }

            public decimal Descuento { get; set; }

            public string? MetodoPago { get; set; }

            public string? Notas { get; set; }
        }

        public class RegistrarAbonoRequest
        {
            public decimal Monto { get; set; }

            public string? MetodoPago { get; set; }

            public string? Notas { get; set; }
        }
    }
}
