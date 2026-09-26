using System.Net;
using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Controllers;

[ApiController]
[Route("api/account-deletion")]
public class AccountDeletionController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IEmailService _email;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AccountDeletionController> _logger;

    public AccountDeletionController(
        AppDbContext db,
        IEmailService email,
        IConfiguration configuration,
        ILogger<AccountDeletionController> logger)
    {
        _db = db;
        _email = email;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("request")]
    [EnableRateLimiting("RegistroPublico")]
    public async Task<IActionResult> RequestDeletion(
        AccountDeletionRequestDto request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { mensaje = "El correo de la cuenta es requerido." });

        var email = request.Email.Trim().ToLowerInvariant();
        if (!email.Contains('@') || email.Length > 200)
            return BadRequest(new { mensaje = "Ingresa un correo válido." });

        var usuario = await _db.Usuarios
            .AsNoTracking()
            .Include(x => x.Tenant)
            .FirstOrDefaultAsync(x => x.Email.ToLower() == email, ct);

        var supportEmail =
            _configuration["PRIVACY_SUPPORT_EMAIL"] ??
            _configuration["RESEND_FROM_EMAIL"];

        if (string.IsNullOrWhiteSpace(supportEmail))
        {
            _logger.LogError("No hay correo configurado para solicitudes de eliminación de cuenta.");
            return StatusCode(503, new
            {
                mensaje = "No fue posible registrar la solicitud en este momento. Intenta nuevamente más tarde."
            });
        }

        var negocio = string.IsNullOrWhiteSpace(request.Negocio)
            ? usuario?.Tenant?.Nombre ?? "(no indicado)"
            : request.Negocio.Trim();

        var motivo = string.IsNullOrWhiteSpace(request.Motivo)
            ? "(sin indicar)"
            : request.Motivo.Trim();

        var htmlSoporte = $"""
            <div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#1f2937;line-height:1.6">
              <h1>Solicitud de eliminación de cuenta</h1>
              <p><strong>Correo:</strong> {WebUtility.HtmlEncode(email)}</p>
              <p><strong>Negocio:</strong> {WebUtility.HtmlEncode(negocio)}</p>
              <p><strong>Motivo:</strong> {WebUtility.HtmlEncode(motivo)}</p>
              <p><strong>Usuario localizado:</strong> {(usuario == null ? "No" : "Sí")}</p>
              <p><strong>Usuario ID:</strong> {usuario?.Id.ToString() ?? "-"}</p>
              <p><strong>Tenant ID:</strong> {usuario?.TenantId.ToString() ?? "-"}</p>
              <p><strong>Fecha UTC:</strong> {DateTime.UtcNow:O}</p>
              <hr />
              <p>Verifica la identidad antes de procesar la eliminación. Al completar el proceso, confirma al usuario por correo.</p>
            </div>
            """;

        try
        {
            await _email.EnviarAsync(
                supportEmail,
                "Privacidad",
                "Solicitud de eliminación de cuenta - Barbería SaaS",
                htmlSoporte,
                ct);

            if (usuario != null)
            {
                var htmlUsuario = $"""
                    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#1f2937;line-height:1.6">
                      <h1>Recibimos tu solicitud</h1>
                      <p>Hola {WebUtility.HtmlEncode(usuario.Nombre)}, recibimos una solicitud para eliminar tu cuenta de Barbería SaaS.</p>
                      <p>La revisaremos y podremos contactarte para verificar tu identidad antes de completar la eliminación.</p>
                      <p>El proceso se completará normalmente dentro de 30 días, salvo que una obligación legal requiera conservar determinada información por más tiempo.</p>
                      <p>Si no realizaste esta solicitud, responde a este correo o contacta soporte lo antes posible.</p>
                    </div>
                    """;

                await _email.EnviarAsync(
                    usuario.Email,
                    "Privacidad",
                    "Recibimos tu solicitud de eliminación - Barbería SaaS",
                    htmlUsuario,
                    ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "No fue posible registrar la solicitud de eliminación para {Email}.", email);
            return StatusCode(503, new
            {
                mensaje = "No fue posible registrar la solicitud en este momento. Intenta nuevamente más tarde."
            });
        }

        return Ok(new
        {
            mensaje = "Solicitud recibida. Si el correo corresponde a una cuenta de Barbería SaaS, recibirás una confirmación y podremos contactarte para verificar tu identidad."
        });
    }
}

public sealed class AccountDeletionRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string? Negocio { get; set; }
    public string? Motivo { get; set; }
}
