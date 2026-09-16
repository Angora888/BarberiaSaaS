using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Controllers;

[ApiController]
[Route("api/paypal")]
[Authorize]
public sealed class PayPalController : ControllerBase
{
    private readonly IPayPalService _payPalService;
    private readonly AppDbContext _context;
    private readonly ITenantContext _tenantContext;

    public PayPalController(
        IPayPalService payPalService,
        AppDbContext context,
        ITenantContext tenantContext)
    {
        _payPalService = payPalService;
        _context = context;
        _tenantContext = tenantContext;
    }

    [HttpGet("subscription-config")]
    public IActionResult GetSubscriptionConfig()
    {
        try
        {
            var config = _payPalService.GetClientConfig();
            return Ok(new
            {
                config.ClientId,
                config.PlanId,
                config.Mode,
                price = "10.00",
                currency = "USD"
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("subscription-current")]
    public async Task<IActionResult> GetCurrentSubscription(CancellationToken cancellationToken)
    {
        var tenantId = _tenantContext.TenantId;
        var tenant = await _context.Tenants
            .AsNoTracking()
            .Where(x => x.Id == tenantId)
            .Select(x => new
            {
                subscriptionId = x.PayPalSubscriptionId,
                status = x.PayPalSubscriptionStatus,
                planId = x.PayPalPlanId,
                payerEmail = x.PayPalPayerEmail,
                nextBillingTime = x.PayPalNextBillingTime,
                updatedAt = x.PayPalSubscriptionUpdatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (tenant is null)
            return NotFound(new { message = "No se encontró el negocio." });

        if (string.IsNullOrWhiteSpace(tenant.subscriptionId))
            return Ok(new { hasSubscription = false });

        return Ok(new
        {
            hasSubscription = true,
            tenant.subscriptionId,
            tenant.status,
            tenant.planId,
            tenant.payerEmail,
            tenant.nextBillingTime,
            tenant.updatedAt
        });
    }

    [HttpGet("subscriptions/{subscriptionId}")]
    public async Task<IActionResult> GetSubscription(
        string subscriptionId,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _payPalService.GetSubscriptionAsync(
                subscriptionId,
                cancellationToken);

            var tenantId = _tenantContext.TenantId;
            var tenant = await _context.Tenants
                .FirstOrDefaultAsync(x => x.Id == tenantId, cancellationToken);

            if (tenant is null)
                return NotFound(new { message = "No se encontró el negocio." });

            var subscriptionOwner = await _context.Tenants
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.PayPalSubscriptionId == result.SubscriptionId && x.Id != tenantId,
                    cancellationToken);

            if (subscriptionOwner is not null)
                return Conflict(new { message = "Esta suscripción ya está asociada a otro negocio." });

            tenant.PayPalSubscriptionId = result.SubscriptionId;
            tenant.PayPalPlanId = result.PlanId;
            tenant.PayPalSubscriptionStatus = result.Status;
            tenant.PayPalPayerEmail = result.PayerEmail;
            tenant.PayPalNextBillingTime = ParsePayPalDate(result.NextBillingTime);
            tenant.PayPalSubscriptionUpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
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
