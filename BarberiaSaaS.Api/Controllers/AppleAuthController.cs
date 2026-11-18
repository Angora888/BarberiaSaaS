using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Models;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace BarberiaSaaS.Api.Controllers;

[ApiController]
[Route("api/auth/apple")]
public sealed class AppleAuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AppleTokenValidator _validator;
    private readonly IConfiguration _config;

    public AppleAuthController(AppDbContext db, AppleTokenValidator validator, IConfiguration config)
    {
        _db = db;
        _validator = validator;
        _config = config;
    }

    public sealed record AppleTokenRequest(string IdentityToken);

    // La cuenta Apple se vincula SOLO desde una sesión de usuario existente.
    [Authorize]
    [HttpPost("link")]
    [EnableRateLimiting("RegistroPublico")]
    public async Task<IActionResult> Link([FromBody] AppleTokenRequest request, CancellationToken cancellationToken)
    {
        var subject = await _validator.ValidateSubjectAsync(request.IdentityToken, cancellationToken);
        if (string.IsNullOrEmpty(subject))
            return Unauthorized(new { mensaje = "No pudimos verificar tu identidad con Apple." });

        var idText = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (!int.TryParse(idText, out var userId))
            return Unauthorized();

        var usuario = await _db.Usuarios.Include(x => x.Tenant)
            .FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);
        if (usuario is null || !usuario.Activo || !usuario.Tenant.Activo || !usuario.Tenant.EmailConfirmado)
            return Forbid();

        var existente = await _db.Set<AppleIdentity>()
            .FirstOrDefaultAsync(x => x.Subject == subject || x.UsuarioId == userId, cancellationToken);

        if (existente is not null)
        {
            if (existente.Subject == subject && existente.UsuarioId == userId)
                return Ok(new { mensaje = "Tu cuenta Apple ya está vinculada." });
            return Conflict(new { mensaje = "Esa cuenta Apple o ese usuario ya tiene otra vinculación." });
        }

        _db.Set<AppleIdentity>().Add(new AppleIdentity { Subject = subject, UsuarioId = userId });
        try { await _db.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateException)
        {
            return Conflict(new { mensaje = "La identidad Apple ya está vinculada a otra cuenta." });
        }
        return Ok(new { mensaje = "Cuenta Apple vinculada. Ya podés iniciar sesión con Apple." });
    }

    [HttpPost("login")]
    [EnableRateLimiting("RegistroPublico")]
    public async Task<IActionResult> Login([FromBody] AppleTokenRequest request, CancellationToken cancellationToken)
    {
        var subject = await _validator.ValidateSubjectAsync(request.IdentityToken, cancellationToken);
        if (string.IsNullOrEmpty(subject))
            return Unauthorized(new { mensaje = "No pudimos verificar tu identidad con Apple." });

        var identidad = await _db.Set<AppleIdentity>()
            .Include(x => x.Usuario).ThenInclude(x => x.Tenant)
            .Include(x => x.Usuario).ThenInclude(x => x.Sucursal)
            .FirstOrDefaultAsync(x => x.Subject == subject, cancellationToken);

        if (identidad is null)
            return Unauthorized(new {
                mensaje = "Primero ingresá con tu correo y vinculá Apple desde Configuración. No creamos cuentas duplicadas."
            });

        var usuario = identidad.Usuario;
        if (!usuario.Activo || !usuario.Tenant.EmailConfirmado || !usuario.Tenant.Activo)
            return Unauthorized(new { mensaje = "Tu usuario o negocio no está activo." });

        usuario.UltimoAcceso = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            token = GenerarJwt(usuario),
            usuario = new
            {
                usuario.Id, usuario.Nombre, usuario.Apellidos, usuario.Email, usuario.Rol,
                usuario.TenantId, usuario.SucursalId, usuario.ProfesionalId,
                negocio = usuario.Tenant.Nombre,
                sucursal = usuario.Sucursal?.Nombre
            }
        });
    }

    private string GenerarJwt(Usuario usuario)
    {
        var key = _config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key no configurado");
        var issuer = _config["Jwt:Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer no configurado");
        var audience = _config["Jwt:Audience"] ?? throw new InvalidOperationException("Jwt:Audience no configurado");
        var claims = new List<Claim> {
            new(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new(ClaimTypes.Name, usuario.Nombre),
            new(ClaimTypes.Email, usuario.Email),
            new(ClaimTypes.Role, usuario.Rol),
            new("TenantId", usuario.TenantId.ToString())
        };
        if (usuario.SucursalId is int sucursal) claims.Add(new("SucursalId", sucursal.ToString()));
        if (usuario.ProfesionalId is int profesional) claims.Add(new("ProfesionalId", profesional.ToString()));
        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
        var jwt = new JwtSecurityToken(issuer, audience, claims, expires: DateTime.UtcNow.AddHours(8), signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(jwt);
    }
}
