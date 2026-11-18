using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;

namespace BarberiaSaaS.Api.Services;

// Valida firma RSA con las claves publicadas por Apple; nunca confía en el correo del cliente.
public sealed class AppleTokenValidator
{
    private const string KeysUrl = "https://appleid.apple.com/auth/keys";
    private readonly IHttpClientFactory _clients;
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _cache;

    public AppleTokenValidator(IHttpClientFactory clients, IConfiguration configuration, IMemoryCache cache)
    {
        _clients = clients;
        _configuration = configuration;
        _cache = cache;
    }

    public async Task<string?> ValidateSubjectAsync(string? identityToken, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(identityToken) || identityToken.Length > 12000)
            return null;

        var audience = _configuration["AppleAuth:BundleId"] ?? "com.miagendacr.app";
        if (string.IsNullOrWhiteSpace(audience))
            throw new InvalidOperationException("AppleAuth:BundleId no está configurado.");

        var keys = await _cache.GetOrCreateAsync("apple-jwks", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(6);
            var client = _clients.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            var jwks = await client.GetStringAsync(KeysUrl, cancellationToken);
            return new JsonWebKeySet(jwks).GetSigningKeys().ToArray();
        });

        if (keys is null || keys.Length == 0)
            return null;

        try
        {
            var handler = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(identityToken, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = "https://appleid.apple.com",
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = keys,
                ValidateLifetime = true,
                RequireExpirationTime = true,
                RequireSignedTokens = true,
                ValidAlgorithms = new[] { SecurityAlgorithms.RsaSha256 },
                ClockSkew = TimeSpan.FromSeconds(30)
            }, out var verifiedToken);

            if (verifiedToken is not JwtSecurityToken jwt ||
                !string.Equals(jwt.Header.Alg, SecurityAlgorithms.RsaSha256, StringComparison.Ordinal))
                return null;

            return principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
        }
        catch (SecurityTokenException) { return null; }
        catch (ArgumentException) { return null; }
    }
}
