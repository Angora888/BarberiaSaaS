using System.Net;
using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Services
{
    public class NotificacionesWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<NotificacionesWorker> _logger;

        public NotificacionesWorker(
            IServiceScopeFactory scopeFactory,
            ILogger<NotificacionesWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(
            CancellationToken stoppingToken)
        {
            // Pequeña espera inicial para no competir con el arranque de la API.
            await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcesarPendientesAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error general procesando notificaciones.");
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        private async Task ProcesarPendientesAsync(
            CancellationToken cancellationToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
            var timeZoneService = scope.ServiceProvider.GetRequiredService<ITimeZoneService>();

            var ahora = DateTime.UtcNow;

            var ids = await context.Notificaciones
                .AsNoTracking()
                .Where(x =>
                    (x.Estado == EstadosNotificacion.Pendiente ||
                     x.Estado == EstadosNotificacion.Reintento) &&
                    x.ProgramadaPara <= ahora &&
                    x.Intentos < 3)
                .OrderBy(x => x.ProgramadaPara)
                .Select(x => x.Id)
                .Take(25)
                .ToListAsync(cancellationToken);

            foreach (var id in ids)
            {
                await ProcesarUnaAsync(
                    context,
                    emailService,
                    timeZoneService,
                    id,
                    cancellationToken);
            }
        }

        private async Task ProcesarUnaAsync(
            AppDbContext context,
            IEmailService emailService,
            ITimeZoneService timeZoneService,
            int id,
            CancellationToken cancellationToken)
        {
            var notificacion = await context.Notificaciones
                .Include(x => x.Tenant)
                .Include(x => x.Cliente)
                .Include(x => x.Cita!)
                    .ThenInclude(x => x.Profesional)
                .Include(x => x.Cita!)
                    .ThenInclude(x => x.Servicio)
                .Include(x => x.Cita!)
                    .ThenInclude(x => x.ServicioVariante)
                .Include(x => x.Cita!)
                    .ThenInclude(x => x.Sucursal)
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (notificacion == null ||
                (notificacion.Estado != EstadosNotificacion.Pendiente &&
                 notificacion.Estado != EstadosNotificacion.Reintento))
                return;

            if (notificacion.Cita == null ||
                notificacion.Cita.Estado == EstadosCita.Cancelada ||
                notificacion.Cita.Estado == EstadosCita.Completada ||
                notificacion.Cita.Estado == EstadosCita.NoAsistio)
            {
                notificacion.Estado = EstadosNotificacion.Cancelada;
                await context.SaveChangesAsync(cancellationToken);
                return;
            }

            // Segunda barrera contra basura: aunque exista un registro viejo,
            // nunca enviamos si el cliente ya no tiene email válido/no coincide.
            if (string.IsNullOrWhiteSpace(notificacion.Cliente.Email) ||
                !string.Equals(
                    notificacion.Cliente.Email.Trim(),
                    notificacion.Destino,
                    StringComparison.OrdinalIgnoreCase))
            {
                notificacion.Estado = EstadosNotificacion.Cancelada;
                notificacion.UltimoError = "El cliente no tiene un email vigente para este recordatorio.";
                await context.SaveChangesAsync(cancellationToken);
                return;
            }

            notificacion.Estado = EstadosNotificacion.Procesando;
            notificacion.Intentos++;
            await context.SaveChangesAsync(cancellationToken);

            try
            {
                var cita = notificacion.Cita;
                var fechaLocal = await timeZoneService.UtcALocalAsync(
                    notificacion.TenantId,
                    cita.FechaInicio);

                var negocio =
                    notificacion.Tenant.NombreComercial ??
                    notificacion.Tenant.Nombre;

                var cliente = string.Join(
                    " ",
                    new[] { notificacion.Cliente.Nombre, notificacion.Cliente.Apellidos }
                        .Where(x => !string.IsNullOrWhiteSpace(x)));

                var profesional = string.Join(
                    " ",
                    new[] { cita.Profesional.Nombre, cita.Profesional.Apellidos }
                        .Where(x => !string.IsNullOrWhiteSpace(x)));

                var servicio = cita.ServicioVariante == null
                    ? cita.Servicio.Nombre
                    : $"{cita.Servicio.Nombre} - {cita.ServicioVariante.Nombre}";

                var cultura = new System.Globalization.CultureInfo("es-CR");
                var fechaTexto = fechaLocal.ToString("dddd d 'de' MMMM 'de' yyyy", cultura);
                var horaTexto = fechaLocal.ToString("h:mm tt", cultura);

                var asunto = $"Recordatorio de tu cita en {negocio}";
                var html = CrearHtml(
                    negocio,
                    cliente,
                    fechaTexto,
                    horaTexto,
                    servicio,
                    profesional,
                    cita.Sucursal.Nombre);

                await emailService.EnviarAsync(
                    notificacion.Destino,
                    negocio,
                    asunto,
                    html,
                    cancellationToken);

                notificacion.Estado = EstadosNotificacion.Enviada;
                notificacion.FechaEnvio = DateTime.UtcNow;
                notificacion.UltimoError = null;
                await context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                notificacion.Estado = notificacion.Intentos >= 3
                    ? EstadosNotificacion.Fallida
                    : EstadosNotificacion.Reintento;

                notificacion.UltimoError = ex.Message.Length > 2000
                    ? ex.Message[..2000]
                    : ex.Message;

                await context.SaveChangesAsync(cancellationToken);
                _logger.LogError(ex, "Falló notificación {NotificacionId}.", id);
            }
        }

        private static string CrearHtml(
            string negocio,
            string cliente,
            string fecha,
            string hora,
            string servicio,
            string profesional,
            string sucursal)
        {
            static string E(string value) => WebUtility.HtmlEncode(value);

            return $"""
                <!doctype html>
                <html lang="es">
                <body style="margin:0;background:#f4f7f6;font-family:Arial,sans-serif;color:#17201e;">
                  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
                    <div style="background:#ffffff;border-radius:18px;padding:32px;border:1px solid #e6ecea;">
                      <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#18766a;">Barbería SaaS</div>
                      <h1 style="font-size:26px;margin:10px 0 18px;">💈 {E(negocio)}</h1>
                      <p style="font-size:16px;line-height:1.6;">Hola <strong>{E(cliente)}</strong> 👋</p>
                      <p style="font-size:16px;line-height:1.6;">Te recordamos que tienes una cita mañana.</p>
                      <div style="background:#f4f8f7;border-radius:14px;padding:20px;margin:22px 0;line-height:1.9;">
                        📅 <strong>{E(fecha)}</strong><br>
                        🕐 <strong>{E(hora)}</strong><br>
                        ✂️ {E(servicio)}<br>
                        👤 {E(profesional)}<br>
                        📍 {E(sucursal)}
                      </div>
                      <p style="font-size:14px;color:#66736f;">Si necesitas realizar un cambio, comunícate directamente con el negocio.</p>
                    </div>
                  </div>
                </body>
                </html>
                """;
        }
    }
}
