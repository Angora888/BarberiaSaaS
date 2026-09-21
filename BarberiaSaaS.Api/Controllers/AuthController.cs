using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;
using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.DTOs;
using BarberiaSaaS.Api.Models;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace BarberiaSaaS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IInternacionalizacionService _internacionalizacion;

        public AuthController(
            AppDbContext context,
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory,
            IInternacionalizacionService internacionalizacion)
        {
            _context = context;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
            _internacionalizacion = internacionalizacion;
        }

        // =========================================================
        // REGISTRAR NEGOCIO
        // =========================================================

        [HttpPost("registrar-negocio")]
        [EnableRateLimiting("RegistroPublico")]
        public async Task<IActionResult> RegistrarNegocio(
            RegistrarTenantDto request)
        {
            if (string.IsNullOrWhiteSpace(request.NombreNegocio) ||
                string.IsNullOrWhiteSpace(request.NombrePropietario) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    mensaje = "Nombre del negocio, propietario, email y contraseña son requeridos."
                });
            }

            if (string.IsNullOrWhiteSpace(request.TurnstileToken))
            {
                return BadRequest(new
                {
                    mensaje = "Completa la verificación de seguridad antes de continuar."
                });
            }

            if (!await ValidarTurnstileAsync(request.TurnstileToken))
            {
                return BadRequest(new
                {
                    mensaje = "La verificación de seguridad no fue válida o expiró. Intenta nuevamente."
                });
            }

            var email = request.Email
                .Trim()
                .ToLowerInvariant();

            var pais = _internacionalizacion.ObtenerPais(request.PaisCodigo);
            if (pais == null)
            {
                return BadRequest(new { mensaje = "Selecciona un país válido." });
            }

            if (!_internacionalizacion.TryNormalizarTelefono(
                    request.Telefono,
                    pais.Codigo,
                    out var telefonoE164,
                    out var errorTelefono))
            {
                return BadRequest(new { mensaje = errorTelefono });
            }

            var emailExiste = await _context.Usuarios
                .AnyAsync(x => x.Email.ToLower() == email)
                || await _context.Tenants
                    .AnyAsync(x => x.Email != null && x.Email.ToLower() == email);

            if (emailExiste)
            {
                return Conflict(new
                {
                    mensaje = "Ya existe una cuenta registrada con este correo."
                });
            }

            var telefonoExiste = await _context.Tenants
                .AnyAsync(x => x.Telefono == telefonoE164);

            if (telefonoExiste)
            {
                return Conflict(new
                {
                    mensaje = "Ya existe un negocio registrado con este teléfono."
                });
            }

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                var ahora = DateTime.UtcNow;

                // =====================================================
                // TENANT PENDIENTE DE CONFIRMACIÓN
                // =====================================================

                var tenant = new Tenant
                {
                    Nombre = request.NombreNegocio.Trim(),
                    NombreComercial = request.NombreNegocio.Trim(),
                    Identificacion = request.Identificacion?.Trim(),
                    PaisCodigo = pais.Codigo,
                    Telefono = telefonoE164,
                    Email = email,
                    Activo = false,
                    EmailConfirmado = false,
                    FechaActivacion = null,
                    FechaCreacion = ahora
                };

                _context.Tenants.Add(tenant);
                await _context.SaveChangesAsync();

                // =====================================================
                // CONFIGURACIÓN DEL TENANT
                // =====================================================

                var configuracion = new ConfiguracionTenant
                {
                    TenantId = tenant.Id,
                    LogoUrl = null,
                    ColorPrimario = "#C62864",
                    ColorSecundario = "#F8E7EE",
                    ColorFondo = "#FFFFFF",
                    Moneda = pais.Moneda,
                    ZonaHoraria = pais.ZonaHoraria,
                    Idioma = pais.Idioma,
                    DuracionSlotMinutos = 15,
                    PermitirReservaOnline = true,
                    MostrarPrecios = true,
                    RequiereDeposito = false,
                    PorcentajeDeposito = 0,
                    WhatsApp = telefonoE164
                };

                _context.ConfiguracionesTenant.Add(configuracion);

                // =====================================================
                // SUCURSAL PRINCIPAL
                // =====================================================

                var sucursal = new Sucursal
                {
                    TenantId = tenant.Id,
                    Nombre = "Sucursal Principal",
                    Telefono = telefonoE164,
                    Email = email,
                    Activa = true,
                    FechaCreacion = ahora
                };

                _context.Sucursales.Add(sucursal);
                await _context.SaveChangesAsync();

                // =====================================================
                // USUARIO PROPIETARIO
                // =====================================================

                var usuario = new Usuario
                {
                    TenantId = tenant.Id,
                    SucursalId = sucursal.Id,
                    Nombre = request.NombrePropietario.Trim(),
                    Apellidos = request.ApellidosPropietario?.Trim()
                        ?? string.Empty,
                    Email = email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                        request.Password),
                    Rol = RolesUsuario.Propietario,
                    Activo = true,
                    FechaCreacion = ahora
                };

                _context.Usuarios.Add(usuario);
                await _context.SaveChangesAsync();

                // =====================================================
                // TOKEN DE CONFIRMACIÓN - SOLO GUARDAMOS EL HASH
                // =====================================================

                var tokenPlano = GenerarTokenConfirmacion();
                var tokenHash = CalcularSha256(tokenPlano);

                var tokenConfirmacion = new TokenConfirmacionRegistro
                {
                    TenantId = tenant.Id,
                    TokenHash = tokenHash,
                    FechaCreacion = ahora,
                    FechaExpiracion = ahora.AddMinutes(30),
                    FechaUso = null
                };

                _context.Set<TokenConfirmacionRegistro>()
                    .Add(tokenConfirmacion);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var correoEnviado = await EnviarCorreoConfirmacionAsync(
                    tenant,
                    usuario,
                    tokenPlano);

                if (!correoEnviado)
                {
                    return StatusCode(
                        StatusCodes.Status502BadGateway,
                        new
                        {
                            mensaje = "El negocio quedó registrado, pero no pudimos enviar el correo de confirmación. Intenta reenviar la confirmación en unos minutos.",
                            requiereConfirmacion = true,
                            email
                        });
                }

                return Ok(new
                {
                    mensaje = "Negocio registrado. Revisa tu correo para confirmar y activar tu cuenta.",
                    requiereConfirmacion = true,
                    email,
                    negocio = tenant.Nombre
                });
            }
            catch
            {
                if (transaction.GetDbTransaction().Connection != null)
                {
                    await transaction.RollbackAsync();
                }

                throw;
            }
        }

        // =========================================================
        // CONFIRMAR REGISTRO
        // =========================================================

        [HttpPost("confirmar-registro")]
        [EnableRateLimiting("RegistroPublico")]
        public async Task<IActionResult> ConfirmarRegistro(
            ConfirmarRegistroDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Token))
            {
                return BadRequest(new
                {
                    mensaje = "El enlace de confirmación no es válido."
                });
            }

            var tokenHash = CalcularSha256(request.Token.Trim());
            var ahora = DateTime.UtcNow;

            var token = await _context
                .Set<TokenConfirmacionRegistro>()
                .Include(x => x.Tenant)
                .FirstOrDefaultAsync(x =>
                    x.TokenHash == tokenHash);

            if (token == null)
            {
                return BadRequest(new
                {
                    mensaje = "El enlace de confirmación no es válido."
                });
            }

            if (token.FechaUso.HasValue ||
                token.Tenant.EmailConfirmado)
            {
                return Ok(new
                {
                    mensaje = "Este negocio ya fue confirmado.",
                    confirmado = true
                });
            }

            if (token.FechaExpiracion < ahora)
            {
                return BadRequest(new
                {
                    mensaje = "El enlace de confirmación expiró. Solicita uno nuevo.",
                    expirado = true
                });
            }

            token.FechaUso = ahora;
            token.Tenant.EmailConfirmado = true;
            token.Tenant.Activo = true;
            token.Tenant.FechaActivacion = ahora;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "¡Correo confirmado! Tu negocio ya está activo y tu período de prueba comienza hoy.",
                confirmado = true
            });
        }

        // =========================================================
        // LOGIN
        // =========================================================

        [HttpPost("login")]
        public async Task<IActionResult> Login(
            LoginDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    mensaje = "Email y contraseña son requeridos."
                });
            }

            var email = request.Email
                .Trim()
                .ToLowerInvariant();

            var usuario = await _context.Usuarios
                .Include(x => x.Tenant)
                .Include(x => x.Sucursal)
                .FirstOrDefaultAsync(x =>
                    x.Email.ToLower() == email &&
                    x.Activo);

            if (usuario == null)
            {
                return Unauthorized(new
                {
                    mensaje = "Email o contraseña incorrectos."
                });
            }

            var passwordValido = BCrypt.Net.BCrypt.Verify(
                request.Password,
                usuario.PasswordHash);

            if (!passwordValido)
            {
                return Unauthorized(new
                {
                    mensaje = "Email o contraseña incorrectos."
                });
            }

            if (!usuario.Tenant.EmailConfirmado)
            {
                return Unauthorized(new
                {
                    mensaje = "Debes confirmar tu correo electrónico antes de iniciar sesión.",
                    requiereConfirmacion = true
                });
            }

            if (!usuario.Tenant.Activo)
            {
                return Unauthorized(new
                {
                    mensaje = "El negocio se encuentra inactivo."
                });
            }

            var token = GenerarToken(usuario);

            usuario.UltimoAcceso = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                token,
                usuario = new
                {
                    usuario.Id,
                    usuario.Nombre,
                    usuario.Apellidos,
                    usuario.Email,
                    usuario.Rol,
                    usuario.TenantId,
                    usuario.SucursalId,
                    negocio = usuario.Tenant.Nombre,
                    sucursal = usuario.Sucursal?.Nombre
                }
            });
        }

        // =========================================================
        // RECUPERAR CONTRASEÑA
        // =========================================================

        [HttpPost("solicitar-recuperacion-password")]
        [EnableRateLimiting("RegistroPublico")]
        public async Task<IActionResult> SolicitarRecuperacionPassword(
            SolicitarRecuperacionPasswordDto request)
        {
            const string mensajeGenerico =
                "Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer tu contraseña.";

            if (string.IsNullOrWhiteSpace(request.Email))
                return Ok(new { mensaje = mensajeGenerico });

            var email = request.Email.Trim().ToLowerInvariant();
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(x => x.Email.ToLower() == email && x.Activo);

            if (usuario == null)
                return Ok(new { mensaje = mensajeGenerico });

            var ahora = DateTime.UtcNow;
            var tokensAnteriores = await _context.PasswordResetTokens
                .Where(x => x.UsuarioId == usuario.Id && x.FechaUso == null)
                .ToListAsync();

            foreach (var anterior in tokensAnteriores)
                anterior.FechaUso = ahora;

            var tokenPlano = GenerarTokenConfirmacion();
            _context.PasswordResetTokens.Add(new PasswordResetToken
            {
                UsuarioId = usuario.Id,
                TokenHash = CalcularSha256(tokenPlano),
                FechaCreacion = ahora,
                FechaExpiracion = ahora.AddMinutes(30)
            });
            await _context.SaveChangesAsync();

            var frontendUrl = _configuration["App:FrontendUrl"]
                ?? "https://barberiasaas.vercel.app";
            var enlace = $"{frontendUrl.TrimEnd('/')}/restablecer-password/{Uri.EscapeDataString(tokenPlano)}";
            var nombre = System.Net.WebUtility.HtmlEncode(usuario.Nombre);
            var html = $"""
                <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#1f2937;line-height:1.6">
                  <h1 style="color:#111827">Restablece tu contraseña</h1>
                  <p>Hola <strong>{nombre}</strong>, recibimos una solicitud para cambiar tu contraseña de Barbería SaaS.</p>
                  <p style="margin:32px 0">
                    <a href="{enlace}" style="background:#111827;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:bold">Crear nueva contraseña</a>
                  </p>
                  <p>Este enlace vence en <strong>30 minutos</strong> y solo puede utilizarse una vez.</p>
                  <p style="color:#6b7280;font-size:13px">Si no solicitaste este cambio, ignora este correo. Tu contraseña actual seguirá funcionando.</p>
                </div>
                """;

            try
            {
                var emailService = HttpContext.RequestServices.GetRequiredService<IEmailService>();
                await emailService.EnviarAsync(
                    usuario.Email,
                    "Barbería SaaS",
                    "Restablece tu contraseña de Barbería SaaS",
                    html);
            }
            catch
            {
                // La respuesta permanece genérica para no revelar cuentas registradas.
            }

            return Ok(new { mensaje = mensajeGenerico });
        }

        [HttpPost("restablecer-password")]
        [EnableRateLimiting("RegistroPublico")]
        public async Task<IActionResult> RestablecerPassword(
            RestablecerPasswordDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Token) ||
                string.IsNullOrWhiteSpace(request.NuevaPassword))
                return BadRequest(new { mensaje = "El enlace o la nueva contraseña no son válidos." });

            if (request.NuevaPassword.Length < 8)
                return BadRequest(new { mensaje = "La contraseña debe tener al menos 8 caracteres." });

            var ahora = DateTime.UtcNow;
            var tokenHash = CalcularSha256(request.Token.Trim());
            var token = await _context.PasswordResetTokens
                .Include(x => x.Usuario)
                .FirstOrDefaultAsync(x => x.TokenHash == tokenHash);

            if (token == null || token.FechaUso.HasValue || token.FechaExpiracion < ahora)
                return BadRequest(new { mensaje = "El enlace de recuperación no es válido o ya expiró." });

            token.Usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NuevaPassword);
            token.FechaUso = ahora;

            var otrosTokens = await _context.PasswordResetTokens
                .Where(x => x.UsuarioId == token.UsuarioId && x.Id != token.Id && x.FechaUso == null)
                .ToListAsync();
            foreach (var otro in otrosTokens)
                otro.FechaUso = ahora;

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Tu contraseña fue actualizada correctamente." });
        }

        // =========================================================
        // TURNSTILE
        // =========================================================

        private async Task<bool> ValidarTurnstileAsync(string token)
        {
            var secretKey = _configuration["Turnstile:SecretKey"];

            if (string.IsNullOrWhiteSpace(secretKey))
            {
                throw new InvalidOperationException(
                    "Turnstile:SecretKey no está configurado.");
            }

            var client = _httpClientFactory.CreateClient();

            var form = new Dictionary<string, string>
            {
                ["secret"] = secretKey,
                ["response"] = token
            };

            var remoteIp = HttpContext.Connection.RemoteIpAddress?.ToString();

            if (!string.IsNullOrWhiteSpace(remoteIp))
            {
                form["remoteip"] = remoteIp;
            }

            using var response = await client.PostAsync(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                new FormUrlEncodedContent(form));

            if (!response.IsSuccessStatusCode)
            {
                return false;
            }

            var resultado = await response.Content
                .ReadFromJsonAsync<TurnstileVerificationResponse>();

            return resultado?.Success == true;
        }

        // =========================================================
        // RESEND
        // =========================================================

        private async Task<bool> EnviarCorreoConfirmacionAsync(
            Tenant tenant,
            Usuario usuario,
            string tokenPlano)
        {
            var frontendUrl =
                _configuration["App:FrontendUrl"]
                ?? "https://barberiasaas.vercel.app";

            var enlace =
                $"{frontendUrl.TrimEnd('/')}/confirmarcreacion/{Uri.EscapeDataString(tokenPlano)}";

            var nombre = System.Net.WebUtility.HtmlEncode(usuario.Nombre);
            var negocio = System.Net.WebUtility.HtmlEncode(tenant.Nombre);

            var html = $"""
                <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#1f2937;line-height:1.6">
                  <h1 style="color:#111827">¡Bienvenido a Barbería SaaS!</h1>
                  <p>Hola <strong>{nombre}</strong>, recibimos una solicitud para crear <strong>{negocio}</strong>.</p>
                  <p>Confirma tu correo para activar el negocio y comenzar tu período de prueba.</p>
                  <p style="margin:32px 0">
                    <a href="{enlace}" style="background:#c62864;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:bold">Confirmar mi negocio</a>
                  </p>
                  <p>Este enlace vence en <strong>30 minutos</strong> y solo puede utilizarse una vez.</p>
                  <p style="color:#6b7280;font-size:13px">Si no realizaste este registro, puedes ignorar este correo.</p>
                </div>
                """;

            try
            {
                var emailService = HttpContext.RequestServices.GetRequiredService<IEmailService>();
                await emailService.EnviarAsync(
                    usuario.Email,
                    "Barbería SaaS",
                    "Confirma tu negocio en Barbería SaaS",
                    html);

                return true;
            }
            catch
            {
                return false;
            }
        }

        // =========================================================
        // TOKEN DE CONFIRMACIÓN
        // =========================================================

        private static string GenerarTokenConfirmacion()
        {
            return Convert.ToHexString(
                    RandomNumberGenerator.GetBytes(32))
                .ToLowerInvariant();
        }

        private static string CalcularSha256(string valor)
        {
            return Convert.ToHexString(
                    SHA256.HashData(
                        Encoding.UTF8.GetBytes(valor)))
                .ToLowerInvariant();
        }

        // =========================================================
        // GENERAR JWT
        // =========================================================

        private string GenerarToken(Usuario usuario)
        {
            var jwtKey = _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException(
                    "Jwt:Key no está configurado.");

            var issuer = _configuration["Jwt:Issuer"]
                ?? throw new InvalidOperationException(
                    "Jwt:Issuer no está configurado.");

            var audience = _configuration["Jwt:Audience"]
                ?? throw new InvalidOperationException(
                    "Jwt:Audience no está configurado.");

            var claims = new List<Claim>
            {
                new Claim(
                    JwtRegisteredClaimNames.Sub,
                    usuario.Id.ToString()),
                new Claim(
                    ClaimTypes.NameIdentifier,
                    usuario.Id.ToString()),
                new Claim(
                    ClaimTypes.Name,
                    usuario.Nombre),
                new Claim(
                    ClaimTypes.Email,
                    usuario.Email),
                new Claim(
                    ClaimTypes.Role,
                    usuario.Rol),
                new Claim(
                    "TenantId",
                    usuario.TenantId.ToString())
            };

            if (usuario.SucursalId.HasValue)
            {
                claims.Add(
                    new Claim(
                        "SucursalId",
                        usuario.SucursalId.Value.ToString()));
            }

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey));

            var credentials = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }

        public class ConfirmarRegistroDto
        {
            public string Token { get; set; } = string.Empty;
        }

        private sealed class TurnstileVerificationResponse
        {
            [JsonPropertyName("success")]
            public bool Success { get; set; }
        }
    }
}