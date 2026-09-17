using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace BarberiaSaaS.Api.Services
{
    public interface IEmailService
    {
        Task EnviarAsync(
            string destino,
            string nombreRemitente,
            string asunto,
            string html,
            CancellationToken cancellationToken = default);
    }

    public class ResendEmailService : IEmailService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ResendEmailService> _logger;

        public ResendEmailService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<ResendEmailService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task EnviarAsync(
            string destino,
            string nombreRemitente,
            string asunto,
            string html,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(destino))
                throw new ArgumentException("El destino del correo es requerido.", nameof(destino));

            var apiKey = _configuration["RESEND_API_KEY"];
            var fromEmail = _configuration["RESEND_FROM_EMAIL"];

            if (string.IsNullOrWhiteSpace(apiKey))
                throw new InvalidOperationException("RESEND_API_KEY no está configurado.");

            if (string.IsNullOrWhiteSpace(fromEmail))
                throw new InvalidOperationException("RESEND_FROM_EMAIL no está configurado.");

            var remitenteSeguro = string.IsNullOrWhiteSpace(nombreRemitente)
                ? "Barbería SaaS"
                : nombreRemitente.Trim();

            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                "https://api.resend.com/emails");

            request.Headers.Authorization =
                new AuthenticationHeaderValue("Bearer", apiKey);

            request.Content = JsonContent.Create(new
            {
                from = $"{remitenteSeguro} | Barbería SaaS <{fromEmail}>",
                to = new[] { destino.Trim() },
                subject = asunto,
                html
            });

            using var response =
                await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError(
                    "Resend rechazó el correo a {Destino}. HTTP {Status}: {Body}",
                    destino,
                    (int)response.StatusCode,
                    body);

                throw new InvalidOperationException(
                    $"Resend respondió HTTP {(int)response.StatusCode}.");
            }
        }
    }
}
