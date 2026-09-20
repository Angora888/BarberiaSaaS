using System.Net;
using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Services;

public class NotificacionesWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificacionesWorker> _logger;
    public NotificacionesWorker(IServiceScopeFactory scopeFactory, ILogger<NotificacionesWorker> logger) { _scopeFactory = scopeFactory; _logger = logger; }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await SincronizarAsync(stoppingToken); await EnviarPendientesAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex) { _logger.LogError(ex, "Error procesando notificaciones."); }
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
        }
    }

    private async Task SincronizarAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var set = db.Set<Notificacion>();
        var ahora = DateTime.UtcNow;
        var whatsapp = scope.ServiceProvider.GetRequiredService<IWhatsAppService>();

        var citas = await db.Citas.AsNoTracking().Include(x => x.Cliente).Include(x => x.Tenant).ThenInclude(x => x.Configuracion)
            .Where(x => x.FechaInicio > ahora && x.FechaInicio <= ahora.AddDays(60) && x.Cliente.Activo && x.Estado != EstadosCita.Cancelada && x.Estado != EstadosCita.Completada && x.Estado != EstadosCita.NoAsistio)
            .ToListAsync(ct);

        foreach (var cita in citas)
        {
            var cfg = cita.Tenant.Configuracion;
            var activo = cfg?.RecordatorioEmailActivo ?? true;
            var horas = cfg?.RecordatorioEmailHorasAntes ?? 24;
            var email = NotificacionCitaService.NormalizarEmail(cita.Cliente.Email);
            var cuando = cita.FechaInicio.AddHours(-horas);
            var n = await set.FirstOrDefaultAsync(x => x.CitaId == cita.Id && x.Canal == CanalesNotificacion.Email && x.Tipo == TiposNotificacion.RecordatorioCita24H, ct);

            if (!activo || email == null)
            {
                if (n != null && n.Estado != EstadosNotificacion.Enviada) n.Estado = EstadosNotificacion.Cancelada;
                continue;
            }

            // Once a reminder already exists and becomes due, leave it pending so
            // EnviarPendientesAsync can send it. Only skip creating a brand-new
            // reminder when its configured reminder time has already passed.
            if (n == null && cuando <= ahora)
                continue;

            if (n == null)
            {
                set.Add(new Notificacion { TenantId = cita.TenantId, CitaId = cita.Id, ClienteId = cita.ClienteId, Canal = CanalesNotificacion.Email, Tipo = TiposNotificacion.RecordatorioCita24H, Destino = email, ProgramadaPara = cuando, Estado = EstadosNotificacion.Pendiente, FechaCreacion = ahora });
            }
            else if (n.Estado != EstadosNotificacion.Enviada && (n.ProgramadaPara != cuando || !string.Equals(n.Destino, email, StringComparison.OrdinalIgnoreCase)))
            {
                n.Destino = email; n.ProgramadaPara = cuando; n.Estado = EstadosNotificacion.Pendiente; n.Intentos = 0; n.UltimoError = null;
            }
        }
        if (whatsapp.EstaConfigurado)
        {
            foreach (var cita in citas.Where(x => x.Estado == EstadosCita.Pendiente))
            {
                var telefono = NormalizarTelefonoWhatsApp(cita.Cliente.Telefono);
                if (telefono == null) continue;
                var cfg = cita.Tenant.Configuracion;
                var activoWhatsApp = cfg?.RecordatorioWhatsAppActivo ?? true;
                var horasWhatsApp = cfg?.RecordatorioEmailHorasAntes ?? 24;
                if (!activoWhatsApp) continue;
                var cuando = cita.FechaInicio.AddHours(-horasWhatsApp);
                if (cuando <= ahora) continue;

                var n = await set.FirstOrDefaultAsync(x => x.CitaId == cita.Id && x.Canal == CanalesNotificacion.WhatsApp && x.Tipo == TiposNotificacion.RecordatorioCita24H, ct);
                if (n == null)
                {
                    set.Add(new Notificacion { TenantId = cita.TenantId, CitaId = cita.Id, ClienteId = cita.ClienteId, Canal = CanalesNotificacion.WhatsApp, Tipo = TiposNotificacion.RecordatorioCita24H, Destino = telefono, ProgramadaPara = cuando, Estado = EstadosNotificacion.Pendiente, FechaCreacion = ahora });
                }
                else if (n.Estado != EstadosNotificacion.Enviada && (n.ProgramadaPara != cuando || n.Destino != telefono))
                {
                    n.Destino = telefono; n.ProgramadaPara = cuando; n.Estado = EstadosNotificacion.Pendiente; n.Intentos = 0; n.UltimoError = null;
                }
            }
        }

        await db.SaveChangesAsync(ct);

        var pendientes = await set.Where(x => (x.Estado == EstadosNotificacion.Pendiente || x.Estado == EstadosNotificacion.Reintento) && x.CitaId != null)
            .Include(x => x.Cita!).ThenInclude(x => x.Tenant).ThenInclude(x => x.Configuracion).Include(x => x.Cliente).ToListAsync(ct);
        foreach (var n in pendientes)
        {
            var citaInvalida = n.Cita == null || n.Cita.Estado == EstadosCita.Cancelada || n.Cita.Estado == EstadosCita.Completada || n.Cita.Estado == EstadosCita.NoAsistio;
            if (n.Canal == CanalesNotificacion.WhatsApp)
            {
                var telefono = NormalizarTelefonoWhatsApp(n.Cliente.Telefono);
                var cfg = n.Cita?.Tenant.Configuracion;
                var activoWhatsApp = cfg?.RecordatorioWhatsAppActivo ?? true;
                var horasWhatsApp = cfg?.RecordatorioEmailHorasAntes ?? 24;
                var fechaEsperada = n.Cita?.FechaInicio.AddHours(-horasWhatsApp);
                var reprogramadaATiempoYaPasado = fechaEsperada.HasValue && fechaEsperada.Value <= ahora && fechaEsperada.Value != n.ProgramadaPara;
                if (!activoWhatsApp || citaInvalida || n.Cita?.Estado != EstadosCita.Pendiente || telefono == null || reprogramadaATiempoYaPasado)
                    n.Estado = EstadosNotificacion.Cancelada;
            }
            else
            {
                var email = NotificacionCitaService.NormalizarEmail(n.Cliente.Email);
                var cfg = n.Cita?.Tenant.Configuracion;
                var activo = cfg?.RecordatorioEmailActivo ?? true;
                var horas = cfg?.RecordatorioEmailHorasAntes ?? 24;
                var fechaEsperada = n.Cita?.FechaInicio.AddHours(-horas);
                var reprogramadaATiempoYaPasado = fechaEsperada.HasValue && fechaEsperada.Value <= ahora && fechaEsperada.Value != n.ProgramadaPara;
                if (!activo || citaInvalida || email == null || reprogramadaATiempoYaPasado)
                    n.Estado = EstadosNotificacion.Cancelada;
            }
        }
        await db.SaveChangesAsync(ct);
    }

    private async Task EnviarPendientesAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var mail = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var whatsapp = scope.ServiceProvider.GetRequiredService<IWhatsAppService>();
        var zonas = scope.ServiceProvider.GetRequiredService<ITimeZoneService>();
        var set = db.Set<Notificacion>();
        var ahora = DateTime.UtcNow;
        var ids = await set.AsNoTracking().Where(x => (x.Estado == EstadosNotificacion.Pendiente || x.Estado == EstadosNotificacion.Reintento) && x.ProgramadaPara <= ahora && x.Intentos < 3).OrderBy(x => x.ProgramadaPara).Select(x => x.Id).Take(25).ToListAsync(ct);

        foreach (var id in ids)
        {
            var n = await set.Include(x => x.Tenant).ThenInclude(x => x.Configuracion).Include(x => x.Cliente).Include(x => x.Cita!).ThenInclude(x => x.Profesional).Include(x => x.Cita!).ThenInclude(x => x.Servicio).Include(x => x.Cita!).ThenInclude(x => x.ServicioVariante).Include(x => x.Cita!).ThenInclude(x => x.Sucursal).FirstOrDefaultAsync(x => x.Id == id, ct);
            if (n?.Cita == null) continue;

            var esWhatsApp = n.Canal == CanalesNotificacion.WhatsApp;
            if (esWhatsApp)
            {
                if (!whatsapp.EstaConfigurado || n.Tenant.Configuracion?.RecordatorioWhatsAppActivo == false || n.Cita.Estado != EstadosCita.Pendiente)
                {
                    n.Estado = EstadosNotificacion.Cancelada; await db.SaveChangesAsync(ct); continue;
                }
                var telefono = NormalizarTelefonoWhatsApp(n.Cliente.Telefono);
                if (telefono == null || telefono != n.Destino)
                {
                    n.Estado = EstadosNotificacion.Cancelada; await db.SaveChangesAsync(ct); continue;
                }
            }
            else
            {
                if (n.Tenant.Configuracion?.RecordatorioEmailActivo == false) { n.Estado = EstadosNotificacion.Cancelada; await db.SaveChangesAsync(ct); continue; }
                var email = NotificacionCitaService.NormalizarEmail(n.Cliente.Email);
                if (email == null || !string.Equals(email, n.Destino, StringComparison.OrdinalIgnoreCase)) { n.Estado = EstadosNotificacion.Cancelada; await db.SaveChangesAsync(ct); continue; }
            }

            n.Estado = EstadosNotificacion.Procesando; n.Intentos++; await db.SaveChangesAsync(ct);
            try
            {
                var cita = n.Cita; var local = await zonas.UtcALocalAsync(n.TenantId, cita.FechaInicio);
                var negocio = n.Tenant.NombreComercial ?? n.Tenant.Nombre; var cliente = $"{n.Cliente.Nombre} {n.Cliente.Apellidos}".Trim();
                var profesional = $"{cita.Profesional.Nombre} {cita.Profesional.Apellidos}".Trim();
                var servicio = cita.ServicioVariante == null ? cita.Servicio.Nombre : $"{cita.Servicio.Nombre} - {cita.ServicioVariante.Nombre}";
                var cultura = new System.Globalization.CultureInfo("es-CR"); var fecha = local.ToString("d 'de' MMMM 'de' yyyy", cultura); var hora = local.ToString("h:mm tt", cultura);

                if (esWhatsApp)
                    await whatsapp.EnviarRecordatorioCitaAsync(n.Destino, cliente, negocio, fecha, hora, servicio, profesional, cita.Id, ct);
                else
                    await mail.EnviarAsync(n.Destino, negocio, $"Recordatorio de tu cita en {negocio}", Html(negocio, cliente, fecha, hora, servicio, profesional, cita.Sucursal.Nombre), ct);

                n.Estado = EstadosNotificacion.Enviada; n.FechaEnvio = DateTime.UtcNow; n.UltimoError = null;
            }
            catch (Exception ex) { n.Estado = n.Intentos >= 3 ? EstadosNotificacion.Fallida : EstadosNotificacion.Reintento; n.UltimoError = ex.Message.Length > 2000 ? ex.Message[..2000] : ex.Message; _logger.LogError(ex, "Falló notificación {Id}.", id); }
            await db.SaveChangesAsync(ct);
        }
    }

    private static string? NormalizarTelefonoWhatsApp(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor)) return null;
        var digits = new string(valor.Where(char.IsDigit).ToArray());
        return digits.Length is >= 10 and <= 15 ? digits : null;
    }

    private static string Html(string negocio, string cliente, string fecha, string hora, string servicio, string profesional, string sucursal)
    {
        static string E(string s) => WebUtility.HtmlEncode(s);
        return $"""<!doctype html><html lang="es"><body style="margin:0;background:#f4f7f6;font-family:Arial,sans-serif;color:#17201e"><div style="max-width:600px;margin:auto;padding:32px 16px"><div style="background:#fff;border-radius:18px;padding:32px;border:1px solid #e6ecea"><div style="font-size:13px;font-weight:700;color:#18766a">BARBERÍA SAAS</div><h1>💈 {E(negocio)}</h1><p>Hola <strong>{E(cliente)}</strong> 👋</p><p>Te recordamos que tienes una cita próxima.</p><div style="background:#f4f8f7;border-radius:14px;padding:20px;line-height:1.9">📅 <strong>{E(fecha)}</strong><br>🕐 <strong>{E(hora)}</strong><br>✂️ {E(servicio)}<br>👤 {E(profesional)}<br>📍 {E(sucursal)}</div><p style="font-size:14px;color:#66736f">Si necesitas realizar un cambio, comunícate directamente con el negocio.</p></div></div></body></html>""";
    }
}
