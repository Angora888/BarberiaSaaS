using System.Text.Json;
using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Controllers;

[ApiController]
[Route("api/paypal/webhook")]
[AllowAnonymous]
public sealed class PayPalWebhookController : ControllerBase
{
    private static readonly HashSet<string> SupportedEvents = new(StringComparer.OrdinalIgnoreCase)
    {
        "BILLING.SUBSCRIPTION.CREATED",
        "BILLING.SUBSCRIPTION.ACTIVATED",
        "BILLING.SUBSCRIPTION.UPDATED",
        "BILLING.SUBSCRIPTION.EXPIRED",
        "BILLING.SUBSCRIPTION.CANCELLED",
        "BILLING.SUBSCRIPTION.SUSPENDED",
        "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
        "PAYMENT.SALE.COMPLETED",
        "PAYMENT.SALE.REFUNDED",
        "PAYMENT.SALE.REVERSED"
    };

    private readonly IPayPalService _payPalService;
    private readonly AppDbContext _context;
    private readonly ILogger<PayPalWebhookController> _logger;

    public PayPalWebhookController(
        IPayPalService payPalService,
        AppDbContext context,
        ILogger<PayPalWebhookController> logger)
    {
        _payPalService = payPalService;
        _context = context;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> Receive(CancellationToken cancellationToken)
    {
        try
        {
            using var document = await JsonDocument.ParseAsync(Request.Body, cancellationToken: cancellationToken);
            var root = document.RootElement.Clone();

            if (!await _payPalService.VerifyWebhookAsync(Request.Headers, root, cancellationToken))
            {
                _logger.LogWarning("PayPal webhook rechazado por firma inválida.");
                return Unauthorized(new { message = "Firma de PayPal inválida." });
            }

            var eventType = root.TryGetProperty("event_type", out var eventTypeElement)
                ? eventTypeElement.GetString()
                : null;

            if (string.IsNullOrWhiteSpace(eventType) || !SupportedEvents.Contains(eventType))
                return Ok(new { received = true, ignored = true });

            var subscriptionId = ExtractSubscriptionId(root, eventType);
            if (string.IsNullOrWhiteSpace(subscriptionId))
            {
                _logger.LogInformation("Webhook PayPal {EventType} sin Subscription ID utilizable.", eventType);
                return Ok(new { received = true, ignored = true });
            }

            var tenant = await _context.Tenants
                .FirstOrDefaultAsync(x => x.PayPalSubscriptionId == subscriptionId, cancellationToken);

            if (tenant is null)
            {
                _logger.LogInformation("Webhook PayPal para suscripción {SubscriptionId} todavía no asociada a un Tenant.", subscriptionId);
                return Ok(new { received = true, ignored = true });
            }

            var subscription = await _payPalService.GetSubscriptionAsync(subscriptionId, cancellationToken);

            tenant.PayPalPlanId = subscription.PlanId;
            tenant.PayPalSubscriptionStatus = subscription.Status;
            tenant.PayPalPayerEmail = subscription.PayerEmail;
            tenant.PayPalNextBillingTime = ParsePayPalDate(subscription.NextBillingTime);
            tenant.PayPalSubscriptionUpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Webhook PayPal {EventType} procesado. Tenant {TenantId}, Subscription {SubscriptionId}, Status {Status}.",
                eventType,
                tenant.Id,
                subscriptionId,
                subscription.Status);

            return Ok(new
            {
                received = true,
                eventType,
                subscriptionId,
                status = subscription.Status
            });
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Payload inválido recibido en webhook PayPal.");
            return BadRequest(new { message = "Payload inválido." });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Error procesando webhook PayPal.");
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    private static string? ExtractSubscriptionId(JsonElement root, string eventType)
    {
        if (!root.TryGetProperty("resource", out var resource))
            return null;

        if (eventType.StartsWith("BILLING.SUBSCRIPTION.", StringComparison.OrdinalIgnoreCase) &&
            resource.TryGetProperty("id", out var subscriptionId))
            return subscriptionId.GetString();

        if (eventType.StartsWith("PAYMENT.SALE.", StringComparison.OrdinalIgnoreCase) &&
            resource.TryGetProperty("billing_agreement_id", out var billingAgreementId))
            return billingAgreementId.GetString();

        return null;
    }

    private static DateTime? ParsePayPalDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return DateTimeOffset.TryParse(value, out var parsed)
            ? parsed.UtcDateTime
            : null;
    }
}
