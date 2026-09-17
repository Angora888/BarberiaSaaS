using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Controllers;

[ApiController]
[Route("api/admin/suscripciones")]
[Authorize(Roles = RolesUsuario.SuperAdmin)]
public class AdminSuscripcionesController : ControllerBase
{
    private readonly AppDbContext _db;
    public AdminSuscripcionesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Listar(CancellationToken cancellationToken)
    {
        var ahora = DateTime.UtcNow;
        var tenants = await _db.Tenants.AsNoTracking()
            .OrderBy(x => x.Nombre)
            .Select(x => new
            {
                x.Id,
                x.Nombre,
                x.Email,
                x.FechaActivacion,
                x.FechaCreacion,
                x.PayPalSubscriptionStatus,
                x.PayPalSubscriptionId,
                x.PayPalNextBillingTime,
                x.MetodoSuscripcion,
                x.SuscripcionHasta,
                x.AccesoCortesia,
                x.NotaSuscripcion
            })
            .ToListAsync(cancellationToken);

        var resultado = tenants.Select(x =>
        {
            var finPrueba = (x.FechaActivacion ?? x.FechaCreacion).AddDays(31);
            var paypal = string.Equals(x.PayPalSubscriptionStatus, "ACTIVE", StringComparison.OrdinalIgnoreCase);
            var manual = x.SuscripcionHasta.HasValue && ahora < x.SuscripcionHasta.Value;
            var acceso = ahora < finPrueba || paypal || manual || x.AccesoCortesia;
            return new
            {
                x.Id, x.Nombre, x.Email,
                trialEndsAt = finPrueba,
                accesoActivo = acceso,
                x.PayPalSubscriptionStatus, x.PayPalSubscriptionId, x.PayPalNextBillingTime,
                x.MetodoSuscripcion, x.SuscripcionHasta, x.AccesoCortesia, x.NotaSuscripcion
            };
        });

        return Ok(resultado);
    }

    [HttpPut("{tenantId:int}")]
    public async Task<IActionResult> Actualizar(int tenantId, [FromBody] ActualizarSuscripcionManualRequest request, CancellationToken cancellationToken)
    {
        var tenant = await _db.Tenants.FirstOrDefaultAsync(x => x.Id == tenantId, cancellationToken);
        if (tenant is null) return NotFound(new { message = "Negocio no encontrado." });

        var metodo = request.MetodoSuscripcion?.Trim();
        if (!string.IsNullOrWhiteSpace(metodo) &&
            !new[] { "SINPE", "Efectivo", "Transferencia", "Cortesia", "Otro" }.Contains(metodo, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { message = "Método de suscripción no válido." });

        tenant.MetodoSuscripcion = string.IsNullOrWhiteSpace(metodo) ? null : metodo;
        tenant.SuscripcionHasta = request.SuscripcionHasta?.ToUniversalTime();
        tenant.AccesoCortesia = request.AccesoCortesia;
        tenant.NotaSuscripcion = string.IsNullOrWhiteSpace(request.NotaSuscripcion) ? null : request.NotaSuscripcion.Trim();

        if (tenant.AccesoCortesia)
        {
            tenant.MetodoSuscripcion = "Cortesia";
            tenant.SuscripcionHasta = null;
        }

        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Suscripción actualizada.", tenant.Id, tenant.MetodoSuscripcion, tenant.SuscripcionHasta, tenant.AccesoCortesia, tenant.NotaSuscripcion });
    }
}

public sealed class ActualizarSuscripcionManualRequest
{
    public string? MetodoSuscripcion { get; set; }
    public DateTime? SuscripcionHasta { get; set; }
    public bool AccesoCortesia { get; set; }
    public string? NotaSuscripcion { get; set; }
}
