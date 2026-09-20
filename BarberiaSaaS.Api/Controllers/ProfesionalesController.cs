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
    public class ProfesionalesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;
        private readonly IInternacionalizacionService _internacionalizacion;

        public ProfesionalesController(
            AppDbContext context,
            ITenantContext tenantContext,
            IInternacionalizacionService internacionalizacion)
        {
            _context = context;
            _tenantContext = tenantContext;
            _internacionalizacion = internacionalizacion;
        }

        // ============================================================
        // LISTAR PROFESIONALES
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> GetProfesionales()
        {
            var tenantId =
                _tenantContext.TenantId;

            var profesionales =
                await _context.Profesionales
                    .Where(x =>
                        x.TenantId == tenantId)
                    .OrderBy(x =>
                        x.Nombre)
                    .Select(x => new
                    {
                        x.Id,
                        x.Nombre,
                        x.Apellidos,
                        x.Telefono,
                        x.PaisCodigoTelefono,
                        x.Email,
                        x.Especialidad,
                        x.FotoUrl,
                        x.Activo,
                        x.SucursalId,

                        Sucursal =
                            x.Sucursal != null
                                ? x.Sucursal.Nombre
                                : null,

                        Servicios =
                            x.Servicios
                                .Select(ps => new
                                {
                                    ps.Servicio.Id,
                                    ps.Servicio.Nombre,
                                    ps.Servicio.Precio
                                })
                                .ToList()
                    })
                    .ToListAsync();

            return Ok(profesionales);
        }

        // ============================================================
        // CREAR PROFESIONAL
        // ============================================================

        [HttpPost]
        public async Task<IActionResult> Crear(
            CrearProfesionalDto request)
        {
            if (string.IsNullOrWhiteSpace(
                request.Nombre))
            {
                return BadRequest(new
                {
                    mensaje =
                        "El nombre del profesional es requerido."
                });
            }

            var tenantId =
                _tenantContext.TenantId;

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

            if (request.SucursalId.HasValue)
            {
                var sucursalValida =
                    await _context.Sucursales
                        .AnyAsync(x =>
                            x.Id ==
                                request.SucursalId.Value &&
                            x.TenantId ==
                                tenantId &&
                            x.Activa);

                if (!sucursalValida)
                {
                    return BadRequest(new
                    {
                        mensaje =
                            "La sucursal seleccionada no es válida."
                    });
                }
            }

            var servicioIds =
                request.ServicioIds
                    .Distinct()
                    .ToList();

            var serviciosValidos =
                await _context.Servicios
                    .Where(x =>
                        x.TenantId ==
                            tenantId &&
                        x.Activo &&
                        servicioIds.Contains(
                            x.Id))
                    .Select(x =>
                        x.Id)
                    .ToListAsync();

            if (
                serviciosValidos.Count !=
                servicioIds.Count)
            {
                return BadRequest(new
                {
                    mensaje =
                        "Uno o más servicios seleccionados no pertenecen al negocio."
                });
            }

            var profesional =
                new Profesional
                {
                    TenantId =
                        tenantId,

                    SucursalId =
                        request.SucursalId,

                    Nombre =
                        request.Nombre.Trim(),

                    Apellidos =
                        request.Apellidos?.Trim() ??
                        string.Empty,

                    Telefono = telefonoE164,

                    PaisCodigoTelefono = telefonoE164 == null ? null : paisTelefono,

                    Email =
                        request.Email?
                            .Trim()
                            .ToLowerInvariant(),

                    Especialidad =
                        request.Especialidad?.Trim(),

                    FotoUrl =
                        request.FotoUrl?.Trim(),

                    Activo =
                        true,

                    FechaCreacion =
                        DateTime.UtcNow
                };

            foreach (
                var servicioId in
                serviciosValidos)
            {
                profesional.Servicios.Add(
                    new ProfesionalServicio
                    {
                        ServicioId =
                            servicioId
                    });
            }

            _context.Profesionales.Add(
                profesional);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje =
                    "Profesional creado correctamente.",

                profesional.Id,
                profesional.Nombre,
                profesional.Apellidos
            });
        }

        // ============================================================
        // ACTUALIZAR PROFESIONAL
        // ============================================================

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Actualizar(
            int id,
            ActualizarProfesionalDto request)
        {
            if (string.IsNullOrWhiteSpace(
                request.Nombre))
            {
                return BadRequest(new
                {
                    mensaje =
                        "El nombre del profesional es requerido."
                });
            }

            if (
                request.ServicioIds == null ||
                request.ServicioIds.Count == 0)
            {
                return BadRequest(new
                {
                    mensaje =
                        "Selecciona al menos un servicio."
                });
            }

            var tenantId =
                _tenantContext.TenantId;

            var profesional =
                await _context.Profesionales
                    .Include(x =>
                        x.Servicios)
                    .FirstOrDefaultAsync(x =>
                        x.Id == id &&
                        x.TenantId == tenantId);

            if (profesional == null)
            {
                return NotFound(new
                {
                    mensaje =
                        "Profesional no encontrado."
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

            if (request.SucursalId.HasValue)
            {
                var sucursalValida =
                    await _context.Sucursales
                        .AnyAsync(x =>
                            x.Id ==
                                request.SucursalId.Value &&
                            x.TenantId ==
                                tenantId &&
                            x.Activa);

                if (!sucursalValida)
                {
                    return BadRequest(new
                    {
                        mensaje =
                            "La sucursal seleccionada no es válida."
                    });
                }
            }

            var servicioIds =
                request.ServicioIds
                    .Distinct()
                    .ToList();

            var serviciosValidos =
                await _context.Servicios
                    .Where(x =>
                        x.TenantId ==
                            tenantId &&
                        servicioIds.Contains(
                            x.Id))
                    .Select(x =>
                        x.Id)
                    .ToListAsync();

            if (
                serviciosValidos.Count !=
                servicioIds.Count)
            {
                return BadRequest(new
                {
                    mensaje =
                        "Uno o más servicios seleccionados no pertenecen al negocio."
                });
            }

            profesional.SucursalId =
                request.SucursalId;

            profesional.Nombre =
                request.Nombre.Trim();

            profesional.Apellidos =
                request.Apellidos?.Trim() ??
                string.Empty;

            profesional.Telefono = telefonoE164;

            profesional.PaisCodigoTelefono = telefonoE164 == null ? null : paisTelefono;

            profesional.Email =
                request.Email?
                    .Trim()
                    .ToLowerInvariant();

            profesional.Especialidad =
                request.Especialidad?.Trim();

            profesional.FotoUrl =
                request.FotoUrl?.Trim();

            profesional.Activo =
                request.Activo;

            _context.Set<ProfesionalServicio>()
                .RemoveRange(
                    profesional.Servicios);

            profesional.Servicios =
                new List<ProfesionalServicio>();

            foreach (
                var servicioId in
                serviciosValidos)
            {
                profesional.Servicios.Add(
                    new ProfesionalServicio
                    {
                        ProfesionalId =
                            profesional.Id,

                        ServicioId =
                            servicioId
                    });
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje =
                    "Profesional actualizado correctamente.",

                profesional.Id,
                profesional.Nombre,
                profesional.Apellidos,
                profesional.Telefono,
                profesional.PaisCodigoTelefono,
                profesional.Email,
                profesional.Especialidad,
                profesional.FotoUrl,
                profesional.SucursalId,
                profesional.Activo,

                ServicioIds =
                    serviciosValidos
            });
        }
    }
}
