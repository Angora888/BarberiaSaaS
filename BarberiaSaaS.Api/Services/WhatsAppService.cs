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
                language = new { code = "es" },
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
}
