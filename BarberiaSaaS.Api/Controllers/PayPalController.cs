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
    private const int TrialDays = 31;
    private readonly IPayPalService _payPalService;
    private readonly AppDbContext _context;
    private readonly ITenantContext _tenantContext;

    public PayPalController(IPayPalService payPalService, AppDbContext context, ITenantContext tenantContext)
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
            return Ok(new { config.ClientId, config.PlanId, config.Mode, price = "10.00", currency = "USD" });
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
        var tenant = await _context.Tenants.AsNoTracking().FirstOrDefaultAsync(x => x.Id == tenantId, cancellationToken);
        if (tenant is null) return NotFound(new { message = "No se encontró el negocio." });

        var now = DateTime.UtcNow;
        var trialStart = tenant.FechaActivacion ?? tenant.FechaCreacion;
        var trialEndsAt = trialStart.AddDays(TrialDays);
        var trialActive = now < trialEndsAt;
        var paypalActive = string.Equals(tenant.PayPalSubscriptionStatus, "ACTIVE", StringComparison.OrdinalIgnoreCase);
        var manualActive = tenant.SuscripcionHasta.HasValue && now < tenant.SuscripcionHasta.Value;
        var courtesyActive = tenant.AccesoCortesia;
        var accessAllowed = trialActive || paypalActive || manualActive || courtesyActive;
        var trialDaysRemaining = trialActive ? Math.Max(1, (int)Math.Ceiling((trialEndsAt - now).TotalDays)) : 0;

        string accessSource;
        if (courtesyActive) accessSource = "Cortesia";
        else if (paypalActive) accessSource = "PayPal";
        else if (manualActive) accessSource = tenant.MetodoSuscripcion ?? "Manual";
        else if (trialActive) accessSource = "Prueba";
        else accessSource = "SinAcceso";

        return Ok(new
        {
            hasSubscription = !string.IsNullOrWhiteSpace(tenant.PayPalSubscriptionId),
            accessAllowed,
            accessSource,
            trialActive,
            trialDaysRemaining,
            trialEndsAt,
            paypalActive,
            manualActive,
            courtesyActive,
            metodoSuscripcion = tenant.MetodoSuscripcion,
            suscripcionHasta = tenant.SuscripcionHasta,
            notaSuscripcion = tenant.NotaSuscripcion,
            subscriptionId = tenant.PayPalSubscriptionId,
            status = tenant.PayPalSubscriptionStatus,
            planId = tenant.PayPalPlanId,
            payerEmail = tenant.PayPalPayerEmail,
            nextBillingTime = tenant.PayPalNextBillingTime,
            updatedAt = tenant.PayPalSubscriptionUpdatedAt
        });
    }

    [HttpGet("subscriptions/{subscriptionId}")]
    public async Task<IActionResult> GetSubscription(string subscriptionId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _payPalService.GetSubscriptionAsync(subscriptionId, cancellationToken);
            var tenantId = _tenantContext.TenantId;
            var tenant = await _context.Tenants.FirstOrDefaultAsync(x => x.Id == tenantId, cancellationToken);
            if (tenant is null) return NotFound(new { message = "No se encontró el negocio." });

            var subscriptionOwner = await _context.Tenants.AsNoTracking().FirstOrDefaultAsync(
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
        if (string.IsNullOrWhiteSpace(value)) return null;
        return DateTimeOffset.TryParse(value, out var parsed) ? parsed.UtcDateTime : null;
    }
}
