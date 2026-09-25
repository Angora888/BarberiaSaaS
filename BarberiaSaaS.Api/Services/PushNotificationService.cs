using System.Net.Http.Json;
using BarberiaSaaS.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Services;

public interface IPushNotificationService
{
    Task EnviarTenantAsync(int tenantId, string titulo, string cuerpo, object? data = null, CancellationToken ct = default);
}

public sealed class ExpoPushNotificationService : IPushNotificationService
{
    private readonly AppDbContext _db;
    private readonly HttpClient _http;
    private readonly ILogger<ExpoPushNotificationService> _logger;

    public ExpoPushNotificationService(AppDbContext db, HttpClient http, ILogger<ExpoPushNotificationService> logger)
    {
        _db = db;
        _http = http;
        _logger = logger;
    }

    public async Task EnviarTenantAsync(int tenantId, string titulo, string cuerpo, object? data = null, CancellationToken ct = default)
    {
        try
        {
            var tokens = await _db.PushTokens
                .AsNoTracking()
                .Where(x => x.TenantId == tenantId && x.Activo)
                .Select(x => x.Token)
                .Distinct()
                .ToListAsync(ct);

            if (tokens.Count == 0)
            {
                _logger.LogWarning("Expo Push: no hay tokens activos para tenant {TenantId}.", tenantId);
                return;
            }

            _logger.LogWarning("Expo Push DIAGNOSTIC: enviando {TokenCount} notificación(es) para tenant {TenantId}.", tokens.Count, tenantId);

            var mensajes = tokens.Select(token => new
            {
                to = token,
                sound = "default",
                title = titulo,
                body = cuerpo,
                data
            }).ToArray();

            using var response = await _http.PostAsJsonAsync("https://exp.host/--/api/v2/push/send", mensajes, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Expo Push respondió HTTP {StatusCode} para tenant {TenantId}. Body: {ResponseBody}",
                    (int)response.StatusCode,
                    tenantId,
                    responseBody);
                return;
            }

            _logger.LogWarning(
                "Expo Push DIAGNOSTIC: respondió HTTP {StatusCode} para tenant {TenantId}. Body: {ResponseBody}",
                (int)response.StatusCode,
                tenantId,
                responseBody);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "No fue posible procesar Expo Push para tenant {TenantId}. La operación principal continuará.",
                tenantId);
        }
    }
}
