using System.Security.Claims;
using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Middleware;

public sealed class ProfessionalAccessMiddleware
{
    private readonly RequestDelegate _next;

    public ProfessionalAccessMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated != true ||
            !context.User.IsInRole(RolesUsuario.Profesional))
        {
            await _next(context);
            return;
        }

        var path = context.Request.Path.Value?.ToLowerInvariant() ?? string.Empty;
        var method = context.Request.Method.ToUpperInvariant();

        if (!path.StartsWith("/api/"))
        {
            await _next(context);
            return;
        }

        if (EsRutaPublica(path))
        {
            await _next(context);
            return;
        }

        var profesionalId = ObtenerProfesionalId(context.User);
        if (!profesionalId.HasValue)
        {
            await Denegar(context, "Tu usuario Profesional no está vinculado a una ficha de profesional.");
            return;
        }

        if (path == "/api/citas")
        {
            if (method is "GET" or "POST")
            {
                await _next(context);
                return;
            }

            await Denegar(context);
            return;
        }

        if (path.StartsWith("/api/citas/"))
        {
            var partes = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (partes.Length >= 3 && int.TryParse(partes[2], out var citaId))
            {
                var pertenece = await db.Citas
                    .AsNoTracking()
                    .AnyAsync(x => x.Id == citaId && x.ProfesionalId == profesionalId.Value);

                if (!pertenece)
                {
                    await Denegar(context, "Esta cita no pertenece a tu agenda.");
                    return;
                }

                await _next(context);
                return;
            }

            await Denegar(context);
            return;
        }

        if (path.StartsWith("/api/clientes") && method is "GET" or "POST" or "PUT")
        {
            await _next(context);
            return;
        }

        if (path.StartsWith("/api/servicios") && method == "GET")
        {
            await _next(context);
            return;
        }

        if (path == "/api/profesionales" && method == "GET")
        {
            await _next(context);
            return;
        }

        if (path.StartsWith("/api/profesionales/"))
        {
            var partes = path.Split('/', StringSplitOptions.RemoveEmptyEntries);

            if (partes.Length < 3 ||
                !int.TryParse(partes[2], out var profesionalRutaId) ||
                profesionalRutaId != profesionalId.Value)
            {
                await Denegar(context, "Solo puedes administrar tu propio perfil profesional.");
                return;
            }

            if (partes.Length == 3 && method == "PUT")
            {
                await _next(context);
                return;
            }

            if (partes.Length >= 4)
            {
                var recurso = partes[3];

                var permitido =
                    recurso == "horarios" &&
                        ((partes.Length == 4 && method is "GET" or "POST") ||
                         (partes.Length == 5 && method is "PUT" or "DELETE")) ||
                    recurso == "bloqueos" &&
                        ((partes.Length == 4 && method is "GET" or "POST") ||
                         (partes.Length == 5 && method == "DELETE")) ||
                    recurso == "almuerzos" &&
                        ((partes.Length == 4 && method is "GET" or "POST" or "DELETE") ||
                         (partes.Length == 5 && method == "DELETE"));

                if (permitido)
                {
                    await _next(context);
                    return;
                }
            }

            await Denegar(context);
            return;
        }

        if (path == "/api/imagenes/subir" && method == "POST")
        {
            await _next(context);
            return;
        }

        if (path.StartsWith("/api/sucursales") && method == "GET")
        {
            await _next(context);
            return;
        }

        if (path.StartsWith("/api/configuracion") && method == "GET")
        {
            await _next(context);
            return;
        }

        if (path.StartsWith("/api/internacionalizacion") && method == "GET")
        {
            await _next(context);
            return;
        }

        if (path == "/api/disponibilidad/consultar" && method == "POST")
        {
            await _next(context);
            return;
        }

        if (path == "/api/disponibilidad/semana-siguiente" && method == "POST")
        {
            await _next(context);
            return;
        }

        if (path.StartsWith("/api/push-tokens") && method == "POST")
        {
            await _next(context);
            return;
        }

        if (path == "/api/paypal/subscription-current" && method == "GET")
        {
            await _next(context);
            return;
        }

        await Denegar(context);
    }

    private static int? ObtenerProfesionalId(ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue("ProfesionalId");
        return int.TryParse(raw, out var id) ? id : null;
    }

    private static bool EsRutaPublica(string path) =>
        path.StartsWith("/api/auth") ||
        path.StartsWith("/api/publico") ||
        path.StartsWith("/api/public-citas") ||
        path.StartsWith("/api/account-deletion") ||
        path.StartsWith("/api/paypal/webhook") ||
        path.StartsWith("/api/whatsapp/webhook");

    private static async Task Denegar(HttpContext context, string? mensaje = null)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        await context.Response.WriteAsJsonAsync(new
        {
            mensaje = mensaje ?? "Tu usuario Profesional no tiene permiso para acceder a esta función."
        });
    }
}
