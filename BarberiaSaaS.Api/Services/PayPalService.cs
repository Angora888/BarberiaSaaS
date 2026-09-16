using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace BarberiaSaaS.Api.Services;

public interface IPayPalService
{
    Task<PayPalCatalogSetupResult> EnsureMonthlyPlanAsync(CancellationToken cancellationToken = default);
}

public sealed record PayPalCatalogSetupResult(
    string ProductId,
    string PlanId,
    string PlanStatus,
    string Mode);

public sealed class PayPalService : IPayPalService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public PayPalService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<PayPalCatalogSetupResult> EnsureMonthlyPlanAsync(CancellationToken cancellationToken = default)
    {
        var configuredProductId = _configuration["PAYPAL_PRODUCT_ID"];
        var configuredPlanId = _configuration["PAYPAL_PLAN_ID"];

        if (!string.IsNullOrWhiteSpace(configuredProductId) && !string.IsNullOrWhiteSpace(configuredPlanId))
        {
            return new PayPalCatalogSetupResult(
                configuredProductId,
                configuredPlanId,
                "CONFIGURED",
                GetMode());
        }

        var accessToken = await GetAccessTokenAsync(cancellationToken);
        var productId = string.IsNullOrWhiteSpace(configuredProductId)
            ? await CreateProductAsync(accessToken, cancellationToken)
            : configuredProductId;

        var planId = string.IsNullOrWhiteSpace(configuredPlanId)
            ? await CreatePlanAsync(accessToken, productId, cancellationToken)
            : configuredPlanId;

        return new PayPalCatalogSetupResult(productId, planId, "ACTIVE", GetMode());
    }

    private string GetMode() =>
        _configuration["PAYPAL_MODE"]?.Trim().Equals("Live", StringComparison.OrdinalIgnoreCase) == true
            ? "Live"
            : "Sandbox";

    private string GetBaseUrl() => GetMode() == "Live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    private async Task<string> GetAccessTokenAsync(CancellationToken cancellationToken)
    {
        var clientId = _configuration["PAYPAL_CLIENT_ID"];
        var clientSecret = _configuration["PAYPAL_CLIENT_SECRET"];

        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
        {
            throw new InvalidOperationException("PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET deben estar configurados.");
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{GetBaseUrl()}/v1/oauth2/token");
        var basic = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", basic);
        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "client_credentials"
        });

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        EnsureSuccess(response, json, "obtener el access token");

        using var document = JsonDocument.Parse(json);
        return document.RootElement.GetProperty("access_token").GetString()
            ?? throw new InvalidOperationException("PayPal no devolvió access_token.");
    }

    private async Task<string> CreateProductAsync(string accessToken, CancellationToken cancellationToken)
    {
        var payload = new
        {
            name = "Barbería SaaS",
            description = "Sistema de gestión para barberías y salones",
            type = "SERVICE",
            category = "SOFTWARE"
        };

        var json = await SendJsonAsync(
            HttpMethod.Post,
            "/v1/catalogs/products",
            accessToken,
            payload,
            cancellationToken);

        using var document = JsonDocument.Parse(json);
        return document.RootElement.GetProperty("id").GetString()
            ?? throw new InvalidOperationException("PayPal no devolvió Product ID.");
    }

    private async Task<string> CreatePlanAsync(string accessToken, string productId, CancellationToken cancellationToken)
    {
        var payload = new
        {
            product_id = productId,
            name = "Barbería SaaS Mensual",
            description = "Suscripción mensual de Barbería SaaS",
            status = "ACTIVE",
            billing_cycles = new[]
            {
                new
                {
                    frequency = new
                    {
                        interval_unit = "MONTH",
                        interval_count = 1
                    },
                    tenure_type = "REGULAR",
                    sequence = 1,
                    total_cycles = 0,
                    pricing_scheme = new
                    {
                        fixed_price = new
                        {
                            value = "10.00",
                            currency_code = "USD"
                        }
                    }
                }
            },
            payment_preferences = new
            {
                auto_bill_outstanding = true,
                payment_failure_threshold = 3
            }
        };

        var json = await SendJsonAsync(
            HttpMethod.Post,
            "/v1/billing/plans",
            accessToken,
            payload,
            cancellationToken);

        using var document = JsonDocument.Parse(json);
        return document.RootElement.GetProperty("id").GetString()
            ?? throw new InvalidOperationException("PayPal no devolvió Plan ID.");
    }

    private async Task<string> SendJsonAsync(
        HttpMethod method,
        string path,
        string accessToken,
        object payload,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(method, $"{GetBaseUrl()}{path}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Headers.Add("PayPal-Request-Id", Guid.NewGuid().ToString("N"));
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json");

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        EnsureSuccess(response, json, path);
        return json;
    }

    private static void EnsureSuccess(HttpResponseMessage response, string body, string operation)
    {
        if (response.IsSuccessStatusCode) return;

        throw new InvalidOperationException(
            $"Error de PayPal al {operation}. HTTP {(int)response.StatusCode}: {body}");
    }
}
