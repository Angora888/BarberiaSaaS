using System.Net;
using System.Net.Mail;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Models;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Controllers;

[ApiController]
[Route("api/usuarios-acceso")]
[Authorize(Roles = RolesUsuario.SuperAdmin + "," + RolesUsuario.Propietario + "," + RolesUsuario.Administrador)]
public sealed class UsuariosAccesoController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITenantContext _tenant;
    private readonly IEmailService _email;
    private readonly IConfiguration _configuration;

    public UsuariosAccesoController(
        AppDbContext db,
        ITenantContext tenant,
        IEmailService email,
        IConfiguration configuration)
    {
        _db = db;
        _tenant = tenant;
        _email = email;
        _configuration = configuration;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var tenantId = _tenant.TenantId;
        var usuarioActualId = ObtenerUsuarioActualId();

        var usuarios = await _db.Usuarios
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId)
            .OrderBy(x => x.Nombre)
            .ThenBy(x => x.Apellidos)
            .Select(x => new
            {
                x.Id,
                x.Nombre,
                x.Apellidos,
                x.Email,
                x.Rol,
                x.Activo,
                x.SucursalId,
                x.ProfesionalId,
                EsUsuarioActual = x.Id == usuarioActualId,
                Profesional = x.Profesional == null ? null : new
                {
                    x.Profesional.Id,
                    x.Profesional.Nombre,
                    x.Profesional.Apellidos
                }
            })
            .ToListAsync(ct);

        var profesionales = await _db.Profesionales
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.Activo)
            .OrderBy(x => x.Nombre)
            .ThenBy(x => x.Apellidos)
            .Select(x => new
            {
                x.Id,
                x.Nombre,
                x.Apellidos,
                x.Email,
                x.SucursalId,
                Usuario = x.Usuario == null ? null : new
                {
                    x.Usuario.Id,
                    x.Usuario.Email,
                    x.Usuario.Rol,
                    x.Usuario.Activo
                }
            })
            .ToListAsync(ct);

        return Ok(new { usuarios, profesionales });
    }

    [HttpPost("vincular-actual")]
    public async Task<IActionResult> VincularActual(
        VincularProfesionalDto request,
        CancellationToken ct)
    {
        var tenantId = _tenant.TenantId;
        var usuarioId = ObtenerUsuarioActualId();

        if (!usuarioId.HasValue)
            return Unauthorized();

        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(x => x.Id == usuarioId.Value && x.TenantId == tenantId, ct);

        var profesional = await _db.Profesionales
            .Include(x => x.Usuario)
            .FirstOrDefaultAsync(x => x.Id == request.ProfesionalId && x.TenantId == tenantId && x.Activo, ct);

        if (usuario == null || profesional == null)
            return NotFound(new { mensaje = "Usuario o profesional no encontrado." });

        if (profesional.Usuario != null && profesional.Usuario.Id != usuario.Id)
            return Conflict(new { mensaje = "Este profesional ya está vinculado a otro usuario." });

        if (usuario.ProfesionalId.HasValue && usuario.ProfesionalId.Value != profesional.Id)
            return Conflict(new { mensaje = "Tu usuario ya está vinculado a otro profesional." });

        usuario.ProfesionalId = profesional.Id;
        usuario.SucursalId ??= profesional.SucursalId;

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            mensaje = "Tu cuenta quedó vinculada al profesional correctamente.",
            usuario.ProfesionalId
        });
    }

    [HttpPost("invitar-profesional")]
    public async Task<IActionResult> InvitarProfesional(
        InvitarProfesionalDto request,
        CancellationToken ct)
    {
        var tenantId = _tenant.TenantId;

        var profesional = await _db.Profesionales
            .Include(x => x.Usuario)
            .FirstOrDefaultAsync(x => x.Id == request.ProfesionalId && x.TenantId == tenantId && x.Activo, ct);

        if (profesional == null)
            return NotFound(new { mensaje = "Profesional no encontrado." });

        var email = NormalizarEmail(request.Email) ?? NormalizarEmail(profesional.Email);
        if (email == null)
            return BadRequest(new { mensaje = "Ingresa un correo válido para enviar la invitación." });

        Usuario usuario;

        if (profesional.Usuario != null)
        {
            usuario = profesional.Usuario;

            if (usuario.Activo)
                return Conflict(new { mensaje = "Este profesional ya tiene acceso activo a Barbería SaaS." });

            if (!string.Equals(usuario.Email, email, StringComparison.OrdinalIgnoreCase))
            {
                var correoOcupado = await _db.Usuarios
                    .AnyAsync(x => x.Id != usuario.Id && x.Email.ToLower() == email, ct);

                if (correoOcupado)
                    return Conflict(new { mensaje = "Ese correo ya está asociado a otro usuario." });

                usuario.Email = email;
            }
        }
        else
        {
            var existente = await _db.Usuarios
                .FirstOrDefaultAsync(x => x.Email.ToLower() == email, ct);

            if (existente != null)
            {
                if (existente.TenantId != tenantId)
                    return Conflict(new { mensaje = "Ese correo ya está asociado a otro negocio." });

                if (existente.ProfesionalId.HasValue && existente.ProfesionalId.Value != profesional.Id)
                    return Conflict(new { mensaje = "Ese usuario ya está vinculado a otro profesional." });

                existente.ProfesionalId = profesional.Id;
                existente.SucursalId ??= profesional.SucursalId;
                usuario = existente;

                if (usuario.Activo)
                {
                    await _db.SaveChangesAsync(ct);
                    return Ok(new
                    {
                        mensaje = "El usuario existente quedó vinculado al profesional. No fue necesario crear otra cuenta.",
                        usuarioId = usuario.Id,
                        yaTeniaAcceso = true
                    });
                }
            }
            else
            {
                usuario = new Usuario
                {
                    TenantId = tenantId,
                    SucursalId = profesional.SucursalId,
                    ProfesionalId = profesional.Id,
                    Nombre = profesional.Nombre,
                    Apellidos = profesional.Apellidos,
                    Email = email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(Convert.ToHexString(RandomNumberGenerator.GetBytes(32))),
                    Rol = RolesUsuario.Profesional,
                    Activo = false,
                    FechaCreacion = DateTime.UtcNow
                };

                _db.Usuarios.Add(usuario);
            }
        }

        usuario.Rol = RolesUsuario.Profesional;
        usuario.ProfesionalId = profesional.Id;
        usuario.SucursalId ??= profesional.SucursalId;

        await _db.SaveChangesAsync(ct);

        var resultado = await CrearYEnviarInvitacion(usuario, profesional, ct);

        if (!resultado)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new
            {
                mensaje = "El usuario quedó preparado, pero no pudimos enviar la invitación. Puedes reenviarla desde Configuración > Usuarios.",
                usuarioId = usuario.Id
            });
        }

        return Ok(new
        {
            mensaje = "Invitación enviada. El profesional podrá crear su contraseña desde el correo.",
            usuarioId = usuario.Id
        });
    }

    [HttpPost("{id:int}/reenviar-invitacion")]
    public async Task<IActionResult> ReenviarInvitacion(int id, CancellationToken ct)
    {
        var tenantId = _tenant.TenantId;

        var usuario = await _db.Usuarios
            .Include(x => x.Profesional)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId, ct);

        if (usuario == null)
            return NotFound(new { mensaje = "Usuario no encontrado." });

        if (usuario.Profesional == null || usuario.Rol != RolesUsuario.Profesional)
            return BadRequest(new { mensaje = "Solo se pueden reenviar invitaciones a usuarios Profesional vinculados." });

        if (usuario.Activo)
            return BadRequest(new { mensaje = "Este usuario ya tiene acceso activo." });

        var enviado = await CrearYEnviarInvitacion(usuario, usuario.Profesional, ct);
        if (!enviado)
            return StatusCode(StatusCodes.Status502BadGateway, new { mensaje = "No pudimos enviar la invitación en este momento." });

        return Ok(new { mensaje = "Invitación reenviada correctamente." });
    }

    [HttpPut("{id:int}/activo")]
    public async Task<IActionResult> CambiarActivo(
        int id,
        CambiarActivoUsuarioDto request,
        CancellationToken ct)
    {
        var tenantId = _tenant.TenantId;
        var actualId = ObtenerUsuarioActualId();

        if (actualId == id)
            return BadRequest(new { mensaje = "No puedes desactivar tu propio usuario." });

        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId, ct);

        if (usuario == null)
            return NotFound(new { mensaje = "Usuario no encontrado." });

        if (usuario.Rol == RolesUsuario.Propietario && !request.Activo)
            return BadRequest(new { mensaje = "No se puede desactivar un usuario Propietario desde esta pantalla." });

        usuario.Activo = request.Activo;
        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            mensaje = request.Activo ? "Usuario activado." : "Usuario desactivado.",
            usuario.Id,
            usuario.Activo
        });
    }

    private async Task<bool> CrearYEnviarInvitacion(
        Usuario usuario,
        Profesional profesional,
        CancellationToken ct)
    {
        var ahora = DateTime.UtcNow;

        var anteriores = await _db.InvitacionesUsuario
            .Where(x => x.UsuarioId == usuario.Id && x.FechaUso == null)
            .ToListAsync(ct);

        foreach (var anterior in anteriores)
            anterior.FechaUso = ahora;

        var tokenPlano = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        var invitacion = new InvitacionUsuario
        {
            UsuarioId = usuario.Id,
            TokenHash = CalcularSha256(tokenPlano),
            FechaCreacion = ahora,
            FechaExpiracion = ahora.AddHours(48)
        };

        _db.InvitacionesUsuario.Add(invitacion);
        await _db.SaveChangesAsync(ct);

        var frontendUrl = _configuration["App:FrontendUrl"] ?? "https://barberiasaas.com";
        var enlace = $"{frontendUrl.TrimEnd('/')}/aceptar-invitacion/{Uri.EscapeDataString(tokenPlano)}";
        var nombre = WebUtility.HtmlEncode(profesional.Nombre);
        var negocio = await _db.Tenants
            .Where(x => x.Id == usuario.TenantId)
            .Select(x => x.NombreComercial ?? x.Nombre)
            .FirstAsync(ct);

        var html = $"""
            <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#1f2937;line-height:1.6">
              <h1 style="color:#111827">Te invitaron a Barbería SaaS</h1>
              <p>Hola <strong>{nombre}</strong>, recibiste acceso como profesional de <strong>{WebUtility.HtmlEncode(negocio)}</strong>.</p>
              <p>Crea tu contraseña para entrar a tu agenda, clientes y servicios.</p>
              <p style="margin:32px 0">
                <a href="{enlace}" style="background:#c62864;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:bold">Crear mi contraseña</a>
              </p>
              <p>Este enlace vence en <strong>48 horas</strong> y solo puede utilizarse una vez.</p>
              <p style="color:#6b7280;font-size:13px">Si no esperabas esta invitación, puedes ignorar este correo.</p>
            </div>
            """;

        try
        {
            await _email.EnviarAsync(
                usuario.Email,
                "Barbería SaaS",
                $"Invitación a {negocio} en Barbería SaaS",
                html,
                ct);

            return true;
        }
        catch
        {
            return false;
        }
    }

    private int? ObtenerUsuarioActualId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return int.TryParse(raw, out var id) ? id : null;
    }

    private static string? NormalizarEmail(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return null;

        var email = valor.Trim().ToLowerInvariant();

        try
        {
            var address = new MailAddress(email);
            return string.Equals(address.Address, email, StringComparison.OrdinalIgnoreCase)
                ? email
                : null;
        }
        catch
        {
            return null;
        }
    }

    private static string CalcularSha256(string valor) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(valor))).ToLowerInvariant();
}

public sealed class VincularProfesionalDto
{
    public int ProfesionalId { get; set; }
}

public sealed class InvitarProfesionalDto
{
    public int ProfesionalId { get; set; }
    public string? Email { get; set; }
}

public sealed class CambiarActivoUsuarioDto
{
    public bool Activo { get; set; }
}
