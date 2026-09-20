using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace BarberiaSaaS.Api.Services;

public interface IWhatsAppService
{
    bool EstaConfigurado { get; }
    Task EnviarRecordatorioCitaAsync(string telefono, string cliente, string negocio, string fecha, string hora, string servicio, string profesional, int citaId, CancellationToken ct = default);
}

public sealed class MetaWhatsAppService : IWhatsAppService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;

    public MetaWhatsAppService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _config = config;
    }

    public bool EstaConfigurado =>
        !string.IsNullOrWhiteSpace(_config["WHATSAPP_ACCESS_TOKEN"]) &&
        !string.IsNullOrWhiteSpace(_config["WHATSAPP_PHONE_NUMBER_ID"]);

    public async Task EnviarRecordatorioCitaAsync(string telefono, string cliente, string negocio, string fecha, string hora, string servicio, string profesional, int citaId, CancellationToken ct = default)
    {
        var token = _config["WHATSAPP_ACCESS_TOKEN"] ?? throw new InvalidOperationException("WHATSAPP_ACCESS_TOKEN no está configurado.");
        var phoneNumberId = _config["WHATSAPP_PHONE_NUMBER_ID"] ?? throw new InvalidOperationException("WHATSAPP_PHONE_NUMBER_ID no está configurado.");
        var version = _config["WHATSAPP_API_VERSION"] ?? "v23.0";
        var template = _config["WHATSAPP_TEMPLATE_RECORDATORIO"] ?? "recordatorio_cita";
        var language = await ObtenerIdiomaPlantillaAsync(token, version, template, ct);

        using var request = new HttpRequestMessage(HttpMethod.Post, $"https://graph.facebook.com/{version}/{phoneNumberId}/messages");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new
        {
            messaging_product = "whatsapp",
            to = telefono,
            type = "template",
            template = new
            {
                name = template,
                language = new { code = language },
                components = new object[]
                {
                    new
                    {
                        type = "body",
                        parameters = new object[]
                        {
                            new { type = "text", text = cliente },
                            new { type = "text", text = negocio },
                            new { type = "text", text = fecha },
                            new { type = "text", text = hora },
                            new { type = "text", text = servicio },
                            new { type = "text", text = profesional }
                        }
                    },
                    new
                    {
                        type = "button",
                        sub_type = "quick_reply",
                        index = "0",
                        parameters = new object[] { new { type = "payload", payload = $"confirmar_cita:{citaId}" } }
                    }
                }
            }
        });

        using var response = await _http.SendAsync(request, ct);
        var body = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Meta WhatsApp respondió {(int)response.StatusCode}: {body}");

        using var json = JsonDocument.Parse(body);
        if (!json.RootElement.TryGetProperty("messages", out _))
            throw new InvalidOperationException("Meta no devolvió un identificador de mensaje.");
    }

    private async Task<string> ObtenerIdiomaPlantillaAsync(string token, string version, string template, CancellationToken ct)
    {
        var wabaId = _config["WHATSAPP_WABA_ID"];
        if (string.IsNullOrWhiteSpace(wabaId))
            throw new InvalidOperationException("WHATSAPP_WABA_ID no está configurado.");

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"https://graph.facebook.com/{version}/{wabaId}/message_templates?name={Uri.EscapeDataString(template)}&fields=name,language,status");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var response = await _http.SendAsync(request, ct);
        var body = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"Meta no pudo consultar la plantilla {(int)response.StatusCode}: {body}");

        using var json = JsonDocument.Parse(body);
        if (!json.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array)
            throw new InvalidOperationException($"Meta no devolvió datos para la plantilla {template}.");

        foreach (var item in data.EnumerateArray())
        {
            if (!item.TryGetProperty("name", out var name) ||
                !string.Equals(name.GetString(), template, StringComparison.Ordinal))
                continue;

            if (item.TryGetProperty("status", out var status) &&
                !string.Equals(status.GetString(), "APPROVED", StringComparison.OrdinalIgnoreCase))
                continue;

            if (item.TryGetProperty("language", out var language) && !string.IsNullOrWhiteSpace(language.GetString()))
                return language.GetString()!;
        }

        var encontradas = data.EnumerateArray()
            .Select(item =>
            {
                var nombre = item.TryGetProperty("name", out var n) ? n.GetString() : null;
                var idioma = item.TryGetProperty("language", out var l) ? l.GetString() : null;
                var estado = item.TryGetProperty("status", out var s) ? s.GetString() : null;
                return $"{nombre ?? "(sin nombre)"}|{idioma ?? "(sin idioma)"}|{estado ?? "(sin estado)"}";
            })
            .Take(10)
            .ToArray();

        var detalle = encontradas.Length == 0 ? "Meta devolvió data vacío." : string.Join(", ", encontradas);
        throw new InvalidOperationException(
            $"No se encontró una versión aprobada de la plantilla {template} en el WABA configurado. Respuesta: {detalle}");
    }
}
