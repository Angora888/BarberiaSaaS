using System.Net;
using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Models;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Controllers;

[ApiController]
[Route("api/public-citas")]
[AllowAnonymous]
public sealed class CitasPublicasGestionController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPublicAppointmentLinkService _links;
    private readonly ITimeZoneService _timeZone;
    private readonly INotificacionCitaService _notificaciones;
    private readonly IPushNotificationService _push;
    private readonly IEmailService _email;
    private readonly ILogger<CitasPublicasGestionController> _logger;

    public CitasPublicasGestionController(
        AppDbContext db,
        IPublicAppointmentLinkService links,
        ITimeZoneService timeZone,
        INotificacionCitaService notificaciones,
        IPushNotificationService push,
        IEmailService email,
        ILogger<CitasPublicasGestionController> logger)
    {
        _db = db;
        _links = links;
        _timeZone = timeZone;
        _notificaciones = notificaciones;
        _push = push;
        _email = email;
        _logger = logger;
    }

    [HttpGet("manage")]
    public async Task<IActionResult> Obtener([FromQuery] string? token, CancellationToken ct)
    {
        if (!_links.TryValidarToken(token, out var tenantId, out var citaId))
            return BadRequest(new { mensaje = "El enlace de la cita no es válido o ya expiró." });

        var cita = await _db.Citas
            .AsNoTracking()
            .Include(x => x.Tenant)
            .Include(x => x.Cliente)
            .Include(x => x.Servicio)
            .Include(x => x.Profesional)
            .FirstOrDefaultAsync(x => x.Id == citaId && x.TenantId == tenantId, ct);

        if (cita == null)
            return NotFound(new { mensaje = "No encontramos esta cita." });

        var local = await _timeZone.UtcALocalAsync(tenantId, cita.FechaInicio);
        var cancelable = (cita.Estado == EstadosCita.Pendiente || cita.Estado == EstadosCita.Confirmada)
            && cita.FechaInicio > DateTime.UtcNow;

        return Ok(new
        {
            citaId = cita.Id,
            negocio = string.IsNullOrWhiteSpace(cita.Tenant.NombreComercial)
                ? cita.Tenant.Nombre
                : cita.Tenant.NombreComercial,
            cliente = $"{cita.Cliente.Nombre} {cita.Cliente.Apellidos}".Trim(),
            servicio = cita.Servicio.Nombre,
            profesional = $"{cita.Profesional.Nombre} {cita.Profesional.Apellidos}".Trim(),
            fecha = local.ToString("yyyy-MM-dd"),
            hora = local.ToString("HH:mm"),
            duracionMinutos = cita.DuracionMinutos,
            estado = cita.Estado,
            cancelable,
            mensaje = cancelable
                ? "Puedes cancelar esta cita desde aquí."
                : cita.Estado == EstadosCita.Cancelada
                    ? "Esta cita ya fue cancelada."
                    : "Esta cita ya no puede cancelarse desde este enlace."
        });
    }

    [HttpPost("cancel")]
    public async Task<IActionResult> Cancelar([FromBody] CancelarCitaPublicaRequest request, CancellationToken ct)
    {
        if (!_links.TryValidarToken(request.Token, out var tenantId, out var citaId))
            return BadRequest(new { mensaje = "El enlace de la cita no es válido o ya expiró." });

        var cita = await _db.Citas
            .Include(x => x.Tenant)
            .Include(x => x.Cliente)
            .Include(x => x.Servicio)
            .Include(x => x.Profesional)
            .FirstOrDefaultAsync(x => x.Id == citaId && x.TenantId == tenantId, ct);

        if (cita == null)
            return NotFound(new { mensaje = "No encontramos esta cita." });

        if (cita.Estado == EstadosCita.Cancelada)
            return Ok(new { mensaje = "Esta cita ya estaba cancelada.", estado = cita.Estado });

        if (cita.Estado != EstadosCita.Pendiente && cita.Estado != EstadosCita.Confirmada)
            return Conflict(new { mensaje = "Esta cita ya no puede cancelarse desde este enlace." });

        if (cita.FechaInicio <= DateTime.UtcNow)
            return Conflict(new { mensaje = "Una cita pasada no puede cancelarse desde este enlace." });

        cita.Estado = EstadosCita.Cancelada;
        var notaCancelacion = $"Cancelada por la clienta desde el enlace de autogestión el {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC.";
        cita.Notas = string.IsNullOrWhiteSpace(cita.Notas)
            ? notaCancelacion
            : $"{cita.Notas}\n{notaCancelacion}";

        await _db.SaveChangesAsync(ct);
        await _notificaciones.CancelarRecordatoriosAsync(tenantId, cita.Id, ct);

        var local = await _timeZone.UtcALocalAsync(tenantId, cita.FechaInicio);
        var clienteNombre = $"{cita.Cliente.Nombre} {cita.Cliente.Apellidos}".Trim();
        var negocioNombre = string.IsNullOrWhiteSpace(cita.Tenant.NombreComercial)
            ? cita.Tenant.Nombre
            : cita.Tenant.NombreComercial;

        await _push.EnviarTenantAsync(
            tenantId,
            "❌ Cita cancelada",
            $"{clienteNombre} canceló su cita de {cita.Servicio.Nombre} del {local:dd/MM/yyyy HH:mm}.",
            new { tipo = "cita_cancelada_cliente", citaId = cita.Id },
            ct);

        if (!string.IsNullOrWhiteSpace(cita.Tenant.Email))
        {
            try
            {
                await _email.EnviarAsync(
                    cita.Tenant.Email,
                    negocioNombre,
                    $"Cita cancelada: {clienteNombre} - {local:dd/MM HH:mm}",
                    $"""
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222">
                      <h2>❌ Cita cancelada por la clienta</h2>
                      <p><strong>{WebUtility.HtmlEncode(clienteNombre)}</strong> canceló su cita desde el enlace de autogestión.</p>
                      <div style="background:#f7f7f8;border-radius:12px;padding:18px;margin:18px 0">
                        <p><strong>Servicio:</strong> {WebUtility.HtmlEncode(cita.Servicio.Nombre)}</p>
                        <p><strong>Profesional:</strong> {WebUtility.HtmlEncode($"{cita.Profesional.Nombre} {cita.Profesional.Apellidos}".Trim())}</p>
                        <p><strong>Fecha:</strong> {local:dd/MM/yyyy}</p>
                        <p><strong>Hora:</strong> {local:HH:mm}</p>
                      </div>
                      <p style="color:#666;font-size:13px">Cita #{cita.Id} · Barbería SaaS</p>
                    </div>
                    """,
                    ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "No se pudo enviar email de cancelación al tenant {TenantId}.", tenantId);
            }
        }

        var emailCliente = NotificacionCitaService.NormalizarEmail(cita.Cliente.Email);
        if (emailCliente != null)
        {
            try
            {
                await _email.EnviarAsync(
                    emailCliente,
                    negocioNombre,
                    $"Tu cita en {negocioNombre} fue cancelada",
                    $"""
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#222">
                      <h2>Tu cita fue cancelada</h2>
                      <p>Hola <strong>{WebUtility.HtmlEncode(clienteNombre)}</strong>.</p>
                      <p>Tu cita en <strong>{WebUtility.HtmlEncode(negocioNombre)}</strong> quedó cancelada correctamente.</p>
                      <div style="background:#f7f7f8;border-radius:12px;padding:18px;margin:18px 0">
                        <p><strong>Servicio:</strong> {WebUtility.HtmlEncode(cita.Servicio.Nombre)}</p>
                        <p><strong>Fecha:</strong> {local:dd/MM/yyyy}</p>
                        <p><strong>Hora:</strong> {local:HH:mm}</p>
                      </div>
                    </div>
                    """,
                    ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "No se pudo enviar confirmación de cancelación de cita {CitaId}.", cita.Id);
            }
        }

        return Ok(new
        {
            mensaje = "Tu cita fue cancelada correctamente.",
            estado = cita.Estado
        });
    }
}

public sealed class CancelarCitaPublicaRequest
{
    public string Token { get; set; } = string.Empty;
}
