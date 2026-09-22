using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Models;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Controllers;

[ApiController]
[Route("api/whatsapp/webhook")]
public sealed class WhatsAppWebhookController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<WhatsAppWebhookController> _logger;
    private readonly IPushNotificationService _push;

    public WhatsAppWebhookController(AppDbContext db, IConfiguration config, ILogger<WhatsAppWebhookController> logger, IPushNotificationService push)
    {
        _db = db; _config = config; _logger = logger; _push = push;
    }

    [HttpGet]
    public IActionResult Verificar([FromQuery(Name = "hub.mode")] string? mode, [FromQuery(Name = "hub.verify_token")] string? token, [FromQuery(Name = "hub.challenge")] string? challenge)
    {
        var esperado = _config["WHATSAPP_WEBHOOK_VERIFY_TOKEN"];
        if (mode == "subscribe" && !string.IsNullOrWhiteSpace(esperado) && token == esperado)
            return Content(challenge ?? string.Empty, "text/plain");
        return Forbid();
    }

    [HttpPost]
    public async Task<IActionResult> Recibir(CancellationToken ct)
    {
        using var reader = new StreamReader(Request.Body, Encoding.UTF8);
        var raw = await reader.ReadToEndAsync(ct);
        if (!FirmaValida(raw)) return Unauthorized();

        try
        {
            using var doc = JsonDocument.Parse(raw);
            var payload = doc.RootElement;
            if (!payload.TryGetProperty("entry", out var entries)) return Ok();

            foreach (var entry in entries.EnumerateArray())
            {
                if (!entry.TryGetProperty("changes", out var changes)) continue;
                foreach (var change in changes.EnumerateArray())
                {
                    if (!change.TryGetProperty("value", out var value) || !value.TryGetProperty("messages", out var messages)) continue;
                    foreach (var message in messages.EnumerateArray())
                    {
                        var payloadBoton = ObtenerPayloadBoton(message);
                        if (payloadBoton == null || !payloadBoton.StartsWith("confirmar_cita:", StringComparison.Ordinal)) continue;
                        if (!int.TryParse(payloadBoton["confirmar_cita:".Length..], out var citaId)) continue;

                        var cita = await _db.Citas.Include(x => x.Cliente).Include(x => x.Servicio).FirstOrDefaultAsync(x => x.Id == citaId, ct);
                        if (cita != null && cita.Estado == EstadosCita.Pendiente)
                        {
                            cita.Estado = EstadosCita.Confirmada;
                            await _db.SaveChangesAsync(ct);
                            _logger.LogInformation("Cita {CitaId} confirmada desde WhatsApp.", citaId);
                            var cliente = $"{cita.Cliente.Nombre} {cita.Cliente.Apellidos}".Trim();
                            await _push.EnviarTenantAsync(cita.TenantId, "✅ Cita confirmada", $"{cliente} confirmó su cita de {cita.Servicio.Nombre}.", new { tipo = "cita_confirmada", citaId = cita.Id }, ct);
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando webhook de WhatsApp.");
        }
        return Ok();
    }

    private bool FirmaValida(string raw)
    {
        var secret = _config["WHATSAPP_APP_SECRET"];
        if (string.IsNullOrWhiteSpace(secret)) return false;
        var header = Request.Headers["X-Hub-Signature-256"].ToString();
        if (!header.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase)) return false;

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var esperado = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(raw))).ToLowerInvariant();
        var recibido = header["sha256=".Length..].ToLowerInvariant();
        return CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(esperado), Encoding.ASCII.GetBytes(recibido));
    }

    private static string? ObtenerPayloadBoton(JsonElement message)
    {
        if (message.TryGetProperty("button", out var button) && button.TryGetProperty("payload", out var payload))
            return payload.GetString();
        if (message.TryGetProperty("interactive", out var interactive) && interactive.TryGetProperty("button_reply", out var reply) && reply.TryGetProperty("id", out var id))
            return id.GetString();
        return null;
    }
}
