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
    public class ClientesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;
        private readonly IInternacionalizacionService _internacionalizacion;

        public ClientesController(
            AppDbContext context,
            ITenantContext tenantContext,
            IInternacionalizacionService internacionalizacion)
        {
            _context = context;
            _tenantContext = tenantContext;
            _internacionalizacion = internacionalizacion;
        }

        // ============================================================
        // LISTAR CLIENTES
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> GetClientes()
        {
            var tenantId = _tenantContext.TenantId;

            var clientes = await _context.Clientes
                .Where(x =>
                    x.TenantId == tenantId &&
                    x.Activo)
                .OrderBy(x => x.Nombre)
                .Select(x => new
                {
                    x.Id,
                    x.Nombre,
                    x.Apellidos,
                    x.Telefono,
                    x.PaisCodigoTelefono,
                    x.Email,
                    x.FechaNacimiento,
                    x.Notas,
                    x.Activo,
                    Deuda = _context.Set<CuentaPorCobrar>()
                        .Where(c =>
                            c.TenantId == tenantId &&
                            c.ClienteId == x.Id &&
                            c.Estado != EstadosCuentaPorCobrar.Anulada &&
                            c.SaldoPendiente > 0)
                        .Sum(c => (decimal?)c.SaldoPendiente) ?? 0
                })
                .ToListAsync();

            return Ok(clientes);
        }

        // ============================================================
        // OBTENER CLIENTE
        // ============================================================

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetCliente(int id)
        {
            var tenantId = _tenantContext.TenantId;

            var cliente = await _context.Clientes
                .Where(x =>
                    x.Id == id &&
                    x.TenantId == tenantId)
                .Select(x => new
                {
                    x.Id,
                    x.Nombre,
                    x.Apellidos,
                    x.Telefono,
                    x.PaisCodigoTelefono,
                    x.Email,
                    x.FechaNacimiento,
                    x.Notas,
                    x.Activo,
                    x.FechaCreacion,
                    Deuda = _context.Set<CuentaPorCobrar>()
                        .Where(c =>
                            c.TenantId == tenantId &&
                            c.ClienteId == x.Id &&
                            c.Estado != EstadosCuentaPorCobrar.Anulada &&
                            c.SaldoPendiente > 0)
                        .Sum(c => (decimal?)c.SaldoPendiente) ?? 0
                })
                .FirstOrDefaultAsync();

            if (cliente == null)
            {
                return NotFound(new
                {
                    mensaje = "Cliente no encontrado."
                });
            }

            return Ok(cliente);
        }

        // ============================================================
        // CREAR CLIENTE
        // ============================================================

        [HttpPost]
        public async Task<IActionResult> Crear(
            CrearClienteDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
            {
                return BadRequest(new
                {
                    mensaje = "El nombre del cliente es requerido."
                });
            }

            var tenantId = _tenantContext.TenantId;

            var paisTenant = await _context.Tenants
                .Where(x => x.Id == tenantId)
                .Select(x => x.PaisCodigo)
                .FirstAsync();

            var paisTelefono = string.IsNullOrWhiteSpace(request.PaisCodigoTelefono)
                ? paisTenant
                : request.PaisCodigoTelefono.Trim().ToUpperInvariant();

            string? telefonoE164 = null;
            if (!string.IsNullOrWhiteSpace(request.Telefono))
            {
                if (!_internacionalizacion.TryNormalizarTelefono(
                        request.Telefono,
                        paisTelefono,
                        out telefonoE164,
                        out var errorTelefono))
                {
                    return BadRequest(new { mensaje = errorTelefono });
                }
            }

            var cliente = new Cliente
            {
                TenantId = tenantId,
                Nombre = request.Nombre.Trim(),
                Apellidos = request.Apellidos?.Trim() ?? string.Empty,
                Telefono = telefonoE164,
                PaisCodigoTelefono = telefonoE164 == null ? null : paisTelefono,
                Email = request.Email?.Trim().ToLowerInvariant(),
                FechaNacimiento = request.FechaNacimiento,
                Notas = request.Notas?.Trim(),
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Cliente creado correctamente.",
                cliente.Id,
                cliente.Nombre,
                cliente.Apellidos
            });
        }

        // ============================================================
        // ACTUALIZAR CLIENTE
        // ============================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Actualizar(
            int id,
            ActualizarClienteDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
            {
                return BadRequest(new
                {
                    mensaje = "El nombre del cliente es requerido."
                });
            }

            var tenantId = _tenantContext.TenantId;

            var cliente = await _context.Clientes
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.TenantId == tenantId);

            if (cliente == null)
            {
                return NotFound(new
                {
                    mensaje = "Cliente no encontrado."
                });
            }

            var paisTenant = await _context.Tenants
                .Where(x => x.Id == tenantId)
                .Select(x => x.PaisCodigo)
                .FirstAsync();

            var paisTelefono = string.IsNullOrWhiteSpace(request.PaisCodigoTelefono)
                ? paisTenant
                : request.PaisCodigoTelefono.Trim().ToUpperInvariant();

            string? telefonoE164 = null;
            if (!string.IsNullOrWhiteSpace(request.Telefono))
            {
                if (!_internacionalizacion.TryNormalizarTelefono(
                        request.Telefono,
                        paisTelefono,
                        out telefonoE164,
                        out var errorTelefono))
                {
                    return BadRequest(new { mensaje = errorTelefono });
                }
            }

            cliente.Nombre = request.Nombre.Trim();
            cliente.Apellidos = request.Apellidos?.Trim() ?? string.Empty;
            cliente.Telefono = telefonoE164;
            cliente.PaisCodigoTelefono = telefonoE164 == null ? null : paisTelefono;
            cliente.Email = request.Email?.Trim().ToLowerInvariant();
            cliente.FechaNacimiento = request.FechaNacimiento;
            cliente.Notas = request.Notas?.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Cliente actualizado correctamente.",
                cliente.Id,
                cliente.Nombre,
                cliente.Apellidos,
                cliente.Telefono,
                cliente.PaisCodigoTelefono,
                cliente.Email,
                cliente.FechaNacimiento,
                cliente.Notas
            });
        }

        // ============================================================
        // HISTORIAL DEL CLIENTE
        // ============================================================

        [HttpGet("{id:int}/historial")]
        public async Task<IActionResult> Historial(int id)
        {
            var tenantId = _tenantContext.TenantId;

            var cliente = await _context.Clientes
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.TenantId == tenantId);

            if (cliente == null)
            {
                return NotFound(new
                {
                    mensaje = "Cliente no encontrado."
                });
            }

            var citas = await _context.Citas
                .Where(x =>
                    x.TenantId == tenantId &&
                    x.ClienteId == id)
                .OrderByDescending(x => x.FechaInicio)
                .Select(x => new
                {
                    x.Id,
                    x.FechaInicio,
                    x.FechaFin,
                    x.Precio,
                    x.Estado,
                    x.Notas,
                    Servicio = new
                    {
                        x.Servicio.Id,
                        x.Servicio.Nombre
                    },
                    Profesional = new
                    {
                        x.Profesional.Id,
                        x.Profesional.Nombre,
                        x.Profesional.Apellidos
                    },
                    Sucursal = new
                    {
                        x.Sucursal.Id,
                        x.Sucursal.Nombre
                    }
                })
                .ToListAsync();

            var totalCitas = citas.Count;
            var citasCompletadas = citas.Count(x =>
                x.Estado == EstadosCita.Completada);
            var canceladas = citas.Count(x =>
                x.Estado == EstadosCita.Cancelada);
            var noAsistio = citas.Count(x =>
                x.Estado == EstadosCita.NoAsistio);
            var totalGastado = citas
                .Where(x =>
                    x.Estado == EstadosCita.Completada)
                .Sum(x => x.Precio);

            var deuda = await _context.Set<CuentaPorCobrar>()
                .Where(x =>
                    x.TenantId == tenantId &&
                    x.ClienteId == id &&
                    x.Estado != EstadosCuentaPorCobrar.Anulada &&
                    x.SaldoPendiente > 0)
                .SumAsync(x => (decimal?)x.SaldoPendiente) ?? 0;

            return Ok(new
            {
                cliente = new
                {
                    cliente.Id,
                    cliente.Nombre,
                    cliente.Apellidos,
                    cliente.Telefono,
                    cliente.Email,
                    cliente.FechaNacimiento,
                    cliente.Notas,
                    deuda
                },
                resumen = new
                {
                    totalCitas,
                    citasCompletadas,
                    canceladas,
                    noAsistio,
                    totalGastado,
                    deuda
                },
                citas
            });
        }
    }
}
