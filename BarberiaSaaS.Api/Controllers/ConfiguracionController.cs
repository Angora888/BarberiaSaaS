using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.DTOs;
using BarberiaSaaS.Api.Models;
using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace BarberiaSaaS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ConfiguracionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenantContext;

        public ConfiguracionController(AppDbContext context, ITenantContext tenantContext)
        { _context = context; _tenantContext = tenantContext; }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var tenantId = _tenantContext.TenantId;
            var tenant = await _context.Tenants.Where(x => x.Id == tenantId && x.Activo).Select(x => new
            {
                x.Id, x.Nombre, x.NombreComercial, x.Identificacion, x.Telefono, x.Email,
                x.SlugPublico, x.LandingPublicaActiva, x.FechaCreacion,
                Configuracion = x.Configuracion == null ? null : new
                {
                    x.Configuracion.LogoUrl, x.Configuracion.ColorPrimario, x.Configuracion.ColorSecundario,
                    x.Configuracion.ColorFondo, x.Configuracion.Moneda, x.Configuracion.ZonaHoraria,
                    x.Configuracion.Idioma, x.Configuracion.DuracionSlotMinutos,
                    x.Configuracion.PermitirReservaOnline, x.Configuracion.MostrarPrecios,
                    x.Configuracion.RecordatorioEmailActivo, x.Configuracion.RecordatorioEmailHorasAntes,
                    x.Configuracion.RequiereDeposito, x.Configuracion.PorcentajeDeposito,
                    x.Configuracion.Instagram, x.Configuracion.Facebook, x.Configuracion.WhatsApp
                }
            }).FirstOrDefaultAsync();
            return tenant == null ? NotFound(new { mensaje = "Negocio no encontrado." }) : Ok(tenant);
        }

        [HttpPut]
        public async Task<IActionResult> Actualizar(ActualizarConfiguracionDto request)
        {
            var tenantId = _tenantContext.TenantId;
            var tenant = await _context.Tenants.Include(x => x.Configuracion).FirstOrDefaultAsync(x => x.Id == tenantId && x.Activo);
            if (tenant == null) return NotFound(new { mensaje = "Negocio no encontrado." });
            if (string.IsNullOrWhiteSpace(request.Nombre)) return BadRequest(new { mensaje = "El nombre del negocio es requerido." });
            if (!EsColorHexValido(request.ColorPrimario) || !EsColorHexValido(request.ColorSecundario) || !EsColorHexValido(request.ColorFondo)) return BadRequest(new { mensaje = "Los colores deben tener formato hexadecimal válido, por ejemplo #C62864." });
            if (request.DuracionSlotMinutos <= 0 || request.DuracionSlotMinutos > 120) return BadRequest(new { mensaje = "La duración del slot debe estar entre 1 y 120 minutos." });
            if (request.PorcentajeDeposito < 0 || request.PorcentajeDeposito > 100) return BadRequest(new { mensaje = "El porcentaje de depósito debe estar entre 0 y 100." });
            if (request.RecordatorioEmailHorasAntes < 1 || request.RecordatorioEmailHorasAntes > 168) return BadRequest(new { mensaje = "El recordatorio por correo debe programarse entre 1 y 168 horas antes." });
            if (string.IsNullOrWhiteSpace(request.Moneda)) return BadRequest(new { mensaje = "La moneda es requerida." });
            if (string.IsNullOrWhiteSpace(request.ZonaHoraria)) return BadRequest(new { mensaje = "La zona horaria es requerida." });

            tenant.Nombre = request.Nombre.Trim(); tenant.NombreComercial = Limpiar(request.NombreComercial);
            tenant.Identificacion = Limpiar(request.Identificacion); tenant.Telefono = Limpiar(request.Telefono); tenant.Email = Limpiar(request.Email);
            tenant.Configuracion ??= new ConfiguracionTenant { TenantId = tenantId };
            var configuracion = tenant.Configuracion;
            var recordatoriosEstabanActivos = configuracion.RecordatorioEmailActivo;
            var horasAnteriores = configuracion.RecordatorioEmailHorasAntes;

            configuracion.LogoUrl = Limpiar(request.LogoUrl); configuracion.ColorPrimario = request.ColorPrimario.Trim();
            configuracion.ColorSecundario = request.ColorSecundario.Trim(); configuracion.ColorFondo = request.ColorFondo.Trim();
            configuracion.Moneda = request.Moneda.Trim().ToUpperInvariant(); configuracion.ZonaHoraria = request.ZonaHoraria.Trim();
            configuracion.Idioma = string.IsNullOrWhiteSpace(request.Idioma) ? "es" : request.Idioma.Trim().ToLowerInvariant();
            configuracion.DuracionSlotMinutos = request.DuracionSlotMinutos; configuracion.PermitirReservaOnline = request.PermitirReservaOnline;
            configuracion.MostrarPrecios = request.MostrarPrecios; configuracion.RecordatorioEmailActivo = request.RecordatorioEmailActivo;
            configuracion.RecordatorioEmailHorasAntes = request.RecordatorioEmailHorasAntes; configuracion.RequiereDeposito = request.RequiereDeposito;
            configuracion.PorcentajeDeposito = request.RequiereDeposito ? request.PorcentajeDeposito : 0;
            configuracion.Instagram = Limpiar(request.Instagram); configuracion.Facebook = Limpiar(request.Facebook); configuracion.WhatsApp = Limpiar(request.WhatsApp);

            var notificaciones = _context.Set<Notificacion>();
            var pendientes = await notificaciones.Where(x => x.TenantId == tenantId && x.Canal == CanalesNotificacion.Email && x.Tipo == TiposNotificacion.RecordatorioCita24H && x.Estado != EstadosNotificacion.Enviada && x.Estado != EstadosNotificacion.Cancelada).ToListAsync();

            if (!request.RecordatorioEmailActivo)
            {
                foreach (var n in pendientes) n.Estado = EstadosNotificacion.Cancelada;
            }
            else if (!recordatoriosEstabanActivos || horasAnteriores != request.RecordatorioEmailHorasAntes)
            {
                var citas = await _context.Citas.Include(x => x.Cliente).Where(x => x.TenantId == tenantId && x.FechaInicio > DateTime.UtcNow && x.Estado != EstadosCita.Cancelada && x.Estado != EstadosCita.Completada && x.Estado != EstadosCita.NoAsistio).ToListAsync();
                foreach (var cita in citas)
                {
                    var email = NotificacionCitaService.NormalizarEmail(cita.Cliente.Email);
                    var programada = cita.FechaInicio.AddHours(-request.RecordatorioEmailHorasAntes);
                    var existente = pendientes.FirstOrDefault(x => x.CitaId == cita.Id);
                    if (email == null || programada <= DateTime.UtcNow) { if (existente != null) existente.Estado = EstadosNotificacion.Cancelada; continue; }
                    if (existente != null)
                    {
                        existente.Destino = email; existente.ProgramadaPara = programada; existente.Estado = EstadosNotificacion.Pendiente;
                        existente.Intentos = 0; existente.UltimoError = null;
                    }
                    else
                    {
                        notificaciones.Add(new Notificacion { TenantId = tenantId, CitaId = cita.Id, ClienteId = cita.ClienteId, Canal = CanalesNotificacion.Email, Tipo = TiposNotificacion.RecordatorioCita24H, Destino = email, ProgramadaPara = programada, Estado = EstadosNotificacion.Pendiente, FechaCreacion = DateTime.UtcNow });
                    }
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Configuración actualizada correctamente." });
        }

        private static string? Limpiar(string? valor) => string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();
        private static bool EsColorHexValido(string? color) => !string.IsNullOrWhiteSpace(color) && Regex.IsMatch(color.Trim(), "^#[0-9A-Fa-f]{6}$");
    }
}
