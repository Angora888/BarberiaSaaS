using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BarberiaSaaS.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace BarberiaSaaS.Api.Services;

public interface IPublicAppointmentLinkService
{
    string CrearToken(Cita cita);
    string CrearUrl(Cita cita);
    bool TryValidarToken(string? token, out int tenantId, out int citaId);
}

public sealed class PublicAppointmentLinkService : IPublicAppointmentLinkService
{
    private const string Purpose = "public-cita-management";
    private readonly IConfiguration _configuration;
    private readonly JwtSecurityTokenHandler _handler = new();

    public PublicAppointmentLinkService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string CrearToken(Cita cita)
    {
        var key = ObtenerKey();
        var issuer = ObtenerIssuer();
        var audience = ObtenerAudience();

        var expires = cita.FechaInicio.AddDays(1);
        if (expires <= DateTime.UtcNow)
            expires = DateTime.UtcNow.AddHours(1);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, cita.Id.ToString()),
            new Claim("tenant_id", cita.TenantId.ToString()),
            new Claim("purpose", Purpose)
        };

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expires,
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                SecurityAlgorithms.HmacSha256)
        };

        return _handler.WriteToken(_handler.CreateToken(descriptor));
    }

    public string CrearUrl(Cita cita)
    {
        var baseUrl = _configuration["PUBLIC_WEB_BASE_URL"];
        if (string.IsNullOrWhiteSpace(baseUrl))
            baseUrl = "https://barberiasaas.com";

        return $"{baseUrl.TrimEnd('/')}/cita/gestionar?token={Uri.EscapeDataString(CrearToken(cita))}";
    }

    public bool TryValidarToken(string? token, out int tenantId, out int citaId)
    {
        tenantId = 0;
        citaId = 0;

        if (string.IsNullOrWhiteSpace(token))
            return false;

        try
        {
            var principal = _handler.ValidateToken(
                token,
                new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = ObtenerIssuer(),
                    ValidAudience = ObtenerAudience(),
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(ObtenerKey())),
                    ClockSkew = TimeSpan.FromMinutes(1)
                },
                out _);

            if (!string.Equals(
                    principal.FindFirst("purpose")?.Value,
                    Purpose,
                    StringComparison.Ordinal))
                return false;

            var sub = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            var tenant = principal.FindFirst("tenant_id")?.Value;

            return int.TryParse(sub, out citaId)
                && int.TryParse(tenant, out tenantId)
                && citaId > 0
                && tenantId > 0;
        }
        catch
        {
            return false;
        }
    }

    private string ObtenerKey() =>
        _configuration["Jwt:Key"]
        ?? throw new InvalidOperationException("Jwt:Key no está configurado.");

    private string ObtenerIssuer() =>
        _configuration["Jwt:Issuer"]
        ?? throw new InvalidOperationException("Jwt:Issuer no está configurado.");

    private string ObtenerAudience() =>
        _configuration["Jwt:Audience"]
        ?? throw new InvalidOperationException("Jwt:Audience no está configurado.");
}
