using System.Text.Json;
using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Models;
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

    public WhatsAppWebhookController(AppDbContext db, IConfiguration config, ILogger<WhatsAppWebhookController> logger)
    {
        _db = db; _config = config; _logger = logger;
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
    public async Task<IActionResult> Recibir([FromBody] JsonElement payload, CancellationToken ct)
    {
        try
        {
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

                        var cita = await _db.Citas.FirstOrDefaultAsync(x => x.Id == citaId, ct);
                        if (cita != null && cita.Estado == EstadosCita.Pendiente)
                        {
                            cita.Estado = EstadosCita.Confirmada;
                            await _db.SaveChangesAsync(ct);
                            _logger.LogInformation("Cita {CitaId} confirmada desde WhatsApp.", citaId);
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

    private static string? ObtenerPayloadBoton(JsonElement message)
    {
        if (message.TryGetProperty("button", out var button) && button.TryGetProperty("payload", out var payload))
            return payload.GetString();

        if (message.TryGetProperty("interactive", out var interactive) &&
            interactive.TryGetProperty("button_reply", out var reply) &&
            reply.TryGetProperty("id", out var id))
            return id.GetString();

        return null;
    }
}
