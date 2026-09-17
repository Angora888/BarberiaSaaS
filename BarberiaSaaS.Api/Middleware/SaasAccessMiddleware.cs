using System.Security.Claims;
using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Middleware;

public sealed class SaasAccessMiddleware
{
    private const int TrialDays = 31;
    private readonly RequestDelegate _next;

    public SaasAccessMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
    {
        if (context.User.Identity?.IsAuthenticated != true || IsExemptPath(context.Request.Path))
        {
            await _next(context);
            return;
        }

        var role = context.User.FindFirstValue(ClaimTypes.Role);
        if (string.Equals(role, RolesUsuario.SuperAdmin, StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        var tenantClaim = context.User.FindFirstValue("TenantId");
        if (!int.TryParse(tenantClaim, out var tenantId))
        {
            await _next(context);
            return;
        }

        var tenant = await dbContext.Tenants.AsNoTracking()
            .Where(x => x.Id == tenantId)
            .Select(x => new
            {
                x.FechaActivacion,
                x.FechaCreacion,
                x.PayPalSubscriptionStatus,
                x.PayPalNextBillingTime,
                x.MetodoSuscripcion,
                x.SuscripcionHasta,
                x.AccesoCortesia
            })
            .FirstOrDefaultAsync(context.RequestAborted);

        if (tenant is null)
        {
            await _next(context);
            return;
        }

        var now = DateTime.UtcNow;
        var trialStart = tenant.FechaActivacion ?? tenant.FechaCreacion;
        var trialEndsAt = trialStart.AddDays(TrialDays);
        var trialActive = now < trialEndsAt;
        var paypalActive = string.Equals(tenant.PayPalSubscriptionStatus, "ACTIVE", StringComparison.OrdinalIgnoreCase);
        var paypalPaidThrough = string.Equals(tenant.PayPalSubscriptionStatus, "CANCELLED", StringComparison.OrdinalIgnoreCase)
            && tenant.PayPalNextBillingTime.HasValue
            && now < tenant.PayPalNextBillingTime.Value;
        var manualActive = tenant.SuscripcionHasta.HasValue && now < tenant.SuscripcionHasta.Value;
        var courtesyActive = tenant.AccesoCortesia;

        if (trialActive || paypalActive || paypalPaidThrough || manualActive || courtesyActive)
        {
            await _next(context);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status402PaymentRequired;
        await context.Response.WriteAsJsonAsync(new
        {
            code = "SUBSCRIPTION_REQUIRED",
            message = "Tu acceso a Barbería SaaS requiere una suscripción activa.",
            trialEndsAt,
            paypalPaidThrough = tenant.PayPalNextBillingTime,
            metodoSuscripcion = tenant.MetodoSuscripcion,
            suscripcionHasta = tenant.SuscripcionHasta
        }, context.RequestAborted);
    }

    private static bool IsExemptPath(PathString path)
    {
        return path.StartsWithSegments("/api/paypal", StringComparison.OrdinalIgnoreCase)
            || path.StartsWithSegments("/api/auth", StringComparison.OrdinalIgnoreCase)
            || path.StartsWithSegments("/api/admin/suscripciones", StringComparison.OrdinalIgnoreCase)
            || path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase);
    }
}
