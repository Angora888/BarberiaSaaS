using System.Security.Claims;
using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Middleware;

public sealed class SaasAccessMiddleware
{
    private const int TrialDays = 31;
    private readonly RequestDelegate _next;

    public SaasAccessMiddleware(RequestDelegate next)
    {
        _next = next;
    }

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

        var tenant = await dbContext.Tenants
            .AsNoTracking()
            .Where(x => x.Id == tenantId)
            .Select(x => new
            {
                x.FechaActivacion,
                x.FechaCreacion,
                x.PayPalSubscriptionStatus
            })
            .FirstOrDefaultAsync(context.RequestAborted);

        if (tenant is null)
        {
            await _next(context);
            return;
        }

        var trialStart = tenant.FechaActivacion ?? tenant.FechaCreacion;
        var trialEndsAt = trialStart.AddDays(TrialDays);
        var trialActive = DateTime.UtcNow < trialEndsAt;
        var subscriptionActive = string.Equals(
            tenant.PayPalSubscriptionStatus,
            "ACTIVE",
            StringComparison.OrdinalIgnoreCase);

        if (trialActive || subscriptionActive)
        {
            await _next(context);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status402PaymentRequired;
        await context.Response.WriteAsJsonAsync(new
        {
            code = "SUBSCRIPTION_REQUIRED",
            message = "Tu período de prueba terminó. Activa tu suscripción para continuar usando Barbería SaaS.",
            trialEndsAt
        }, context.RequestAborted);
    }

    private static bool IsExemptPath(PathString path)
    {
        return path.StartsWithSegments("/api/paypal", StringComparison.OrdinalIgnoreCase)
            || path.StartsWithSegments("/api/auth", StringComparison.OrdinalIgnoreCase)
            || path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase);
    }
}
