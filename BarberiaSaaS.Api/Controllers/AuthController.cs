using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.DTOs;
using BarberiaSaaS.Api.Models;
using Microsoft.AspNetCore.Mvc;
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

        public AuthController(
            AppDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // =========================================================
        // REGISTRAR NEGOCIO
        // =========================================================

        [HttpPost("registrar-negocio")]
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

            var email = request.Email
                .Trim()
                .ToLowerInvariant();

            // Evita que el mismo email se registre en más de un negocio
            var emailExiste = await _context.Usuarios
                .AnyAsync(x =>
                    x.Email.ToLower() == email);

            if (emailExiste)
            {
                return Conflict(new
                {
                    mensaje = "Ya existe una cuenta registrada con este correo."
                });
            }

            await using var transaction =
                await _context.Database.BeginTransactionAsync();

            try
            {
                // =====================================================
                // TENANT
                // =====================================================

                var tenant = new Tenant
                {
                    Nombre = request.NombreNegocio.Trim(),

                    NombreComercial =
                        request.NombreNegocio.Trim(),

                    Identificacion =
                        request.Identificacion?.Trim(),

                    Telefono =
                        request.Telefono?.Trim(),

                    Email = email,

                    Activo = true,

                    FechaCreacion = DateTime.UtcNow
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

                    Moneda = "CRC",

                    ZonaHoraria = "America/Costa_Rica",

                    Idioma = "es",

                    DuracionSlotMinutos = 15,

                    PermitirReservaOnline = true,

                    MostrarPrecios = true,

                    RequiereDeposito = false,

                    PorcentajeDeposito = 0,

                    WhatsApp =
                        request.Telefono?.Trim()
                };

                _context.ConfiguracionesTenant.Add(
                    configuracion);

                // =====================================================
                // SUCURSAL PRINCIPAL
                // =====================================================

                var sucursal = new Sucursal
                {
                    TenantId = tenant.Id,

                    Nombre = "Sucursal Principal",

                    Telefono =
                        request.Telefono?.Trim(),

                    Email = email,

                    Activa = true,

                    FechaCreacion = DateTime.UtcNow
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

                    Nombre =
                        request.NombrePropietario.Trim(),

                    Apellidos =
                        request.ApellidosPropietario?.Trim()
                        ?? string.Empty,

                    Email = email,

                    PasswordHash =
                        BCrypt.Net.BCrypt.HashPassword(
                            request.Password),

                    Rol =
                        RolesUsuario.Propietario,

                    Activo = true,

                    FechaCreacion =
                        DateTime.UtcNow
                };

                _context.Usuarios.Add(usuario);

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new
                {
                    mensaje =
                        "Negocio registrado correctamente.",

                    tenantId =
                        tenant.Id,

                    sucursalId =
                        sucursal.Id,

                    usuarioId =
                        usuario.Id,

                    negocio =
                        tenant.Nombre,

                    propietario =
                        $"{usuario.Nombre} {usuario.Apellidos}"
                        .Trim(),

                    usuario.Email,

                    usuario.Rol
                });
            }
            catch
            {
                await transaction.RollbackAsync();

                throw;
            }
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
                    mensaje =
                        "Email y contraseña son requeridos."
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
                    mensaje =
                        "Email o contraseña incorrectos."
                });
            }

            var passwordValido =
                BCrypt.Net.BCrypt.Verify(
                    request.Password,
                    usuario.PasswordHash);

            if (!passwordValido)
            {
                return Unauthorized(new
                {
                    mensaje =
                        "Email o contraseña incorrectos."
                });
            }

            // Verificamos que el negocio siga activo
            if (!usuario.Tenant.Activo)
            {
                return Unauthorized(new
                {
                    mensaje =
                        "El negocio se encuentra inactivo."
                });
            }

            // Generar JWT
            var token =
                GenerarToken(usuario);

            // Registrar último acceso
            usuario.UltimoAcceso =
                DateTime.UtcNow;

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

                    negocio =
                        usuario.Tenant.Nombre,

                    sucursal =
                        usuario.Sucursal?.Nombre
                }
            });
        }

        // =========================================================
        // GENERAR JWT
        // =========================================================

        private string GenerarToken(
            Usuario usuario)
        {
            var jwtKey =
                _configuration["Jwt:Key"]
                ?? throw new InvalidOperationException(
                    "Jwt:Key no está configurado.");

            var issuer =
                _configuration["Jwt:Issuer"]
                ?? throw new InvalidOperationException(
                    "Jwt:Issuer no está configurado.");

            var audience =
                _configuration["Jwt:Audience"]
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

            // La sucursal puede ser null
            if (usuario.SucursalId.HasValue)
            {
                claims.Add(
                    new Claim(
                        "SucursalId",
                        usuario.SucursalId.Value.ToString())
                );
            }

            var key =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtKey));

            var credentials =
                new SigningCredentials(
                    key,
                    SecurityAlgorithms.HmacSha256);

            var token =
                new JwtSecurityToken(
                    issuer: issuer,

                    audience: audience,

                    claims: claims,

                    expires:
                        DateTime.UtcNow.AddHours(8),

                    signingCredentials:
                        credentials
                );

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }
    }
}