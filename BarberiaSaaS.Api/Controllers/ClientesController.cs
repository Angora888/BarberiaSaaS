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

        public ClientesController(
            AppDbContext context,
            ITenantContext tenantContext)
        {
            _context = context;
            _tenantContext = tenantContext;
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
                    x.Email,
                    x.FechaNacimiento,
                    x.Notas,
                    x.Activo
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
                    x.Email,
                    x.FechaNacimiento,
                    x.Notas,
                    x.Activo,
                    x.FechaCreacion
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

            var cliente = new Cliente
            {
                TenantId = tenantId,

                Nombre = request.Nombre.Trim(),

                Apellidos =
                    request.Apellidos?.Trim() ?? string.Empty,

                Telefono =
                    request.Telefono?.Trim(),

                Email =
                    request.Email?.Trim().ToLowerInvariant(),

                FechaNacimiento =
                    request.FechaNacimiento,

                Notas =
                    request.Notas?.Trim(),

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

            cliente.Nombre =
                request.Nombre.Trim();

            cliente.Apellidos =
                request.Apellidos?.Trim() ?? string.Empty;

            cliente.Telefono =
                request.Telefono?.Trim();

            cliente.Email =
                request.Email?
                    .Trim()
                    .ToLowerInvariant();

            cliente.FechaNacimiento =
                request.FechaNacimiento;

            cliente.Notas =
                request.Notas?.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Cliente actualizado correctamente.",
                cliente.Id,
                cliente.Nombre,
                cliente.Apellidos,
                cliente.Telefono,
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
                    cliente.Notas
                },

                resumen = new
                {
                    totalCitas,
                    citasCompletadas,
                    canceladas,
                    noAsistio,
                    totalGastado
                },

                citas
            });
        }
    }
}
