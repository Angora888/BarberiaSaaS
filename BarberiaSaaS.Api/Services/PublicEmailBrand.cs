using Microsoft.AspNetCore.Http;

namespace BarberiaSaaS.Api.Services;

/// <summary>
/// Brand for transactional email links. Never trust arbitrary Origin/Referer as a redirect URL.
/// Only known first-party hosts may select the alternative brand.
/// </summary>
public sealed record PublicEmailBrand(string Nombre, string FrontendUrl, string Acento)
{
    public static PublicEmailBrand Resolve(HttpRequest request, IConfiguration configuration)
    {
        const string miAgenda = "https://www.miagendacr.app";
        var origin = request.Headers.Origin.ToString().TrimEnd('/');

        // The browser sends Origin on cross-origin POST calls. Origin is a brand hint,
        // not authorization: the frontend origin is validated against exact known hosts.
        if (string.Equals(origin, "https://miagendacr.app", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(origin, miAgenda, StringComparison.OrdinalIgnoreCase))
            return new("Mi Agenda CR", miAgenda, "#A34D78");

        // Never copy an untrusted header into email links.
        var configured = configuration["App:FrontendUrl"]?.TrimEnd('/');
        if (string.IsNullOrWhiteSpace(configured) ||
            !Uri.TryCreate(configured, UriKind.Absolute, out var uri) ||
            uri.Scheme != Uri.UriSchemeHttps ||
            (uri.Host != "barberiasaas.com" && uri.Host != "barberiasaas.vercel.app"))
            configured = "https://barberiasaas.com";

        return new("Barbería SaaS", configured, "#c62864");
    }
}
