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

        public NotificacionesWorker(IServiceScopeFactory scopeFactory, ILogger<NotificacionesWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await SincronizarRecordatoriosAsync(stoppingToken);
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

        private async Task SincronizarRecordatoriosAsync(CancellationToken cancellationToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var notificaciones = context.Set<Notificacion>();
            var ahora = DateTime.UtcNow;
            var limite = ahora.AddDays(60);

            // Solo traemos citas con cliente activo Y email presente. Un cliente sin
            // email ni siquiera entra al proceso y por tanto no genera filas basura.
            var citas = await context.Citas
                .AsNoTracking()
                .Include(x => x.Cliente)
                .Where(x =>
                    x.FechaInicio > ahora.AddHours(24) &&
                    x.FechaInicio <= limite &&
                    x.Cliente.Activo &&
                    x.Cliente.Email != null &&
                    x.Cliente.Email != "" &&
                    x.Estado != EstadosCita.Cancelada &&
                    x.Estado != EstadosCita.Completada &&
                    x.Estado != EstadosCita.NoAsistio)
                .ToListAsync(cancellationToken);

            foreach (var cita in citas)
            {
                var email = NotificacionCitaService.NormalizarEmail(cita.Cliente.Email);
                if (email == null) continue;

                var programadaPara = cita.FechaInicio.AddHours(-24);
                if (programadaPara <= ahora) continue;

                var existente = await notificaciones.FirstOrDefaultAsync(x =>
                    x.CitaId == cita.Id &&
                    x.Canal == CanalesNotificacion.Email &&
                    x.Tipo == TiposNotificacion.RecordatorioCita24H,
                    cancellationToken);

                if (existente == null)
                {
                    notificaciones.Add(new Notificacion
                    {
                        TenantId = cita.TenantId,
                        CitaId = cita.Id,
                        ClienteId = cita.ClienteId,
                        Canal = CanalesNotificacion.Email,
                        Tipo = TiposNotificacion.RecordatorioCita24H,
                        Destino = email,
                        ProgramadaPara = programadaPara,
                        Estado = EstadosNotificacion.Pendiente,
                        FechaCreacion = ahora
                    });
                }
                else if (existente.Estado != EstadosNotificacion.Enviada &&
                         (existente.ProgramadaPara != programadaPara ||
                          !string.Equals(existente.Destino, email, StringComparison.OrdinalIgnoreCase)))
                {
                    existente.Destino = email;
                    existente.ProgramadaPara = programadaPara;
                    existente.Estado = EstadosNotificacion.Pendiente;
                    existente.Intentos = 0;
                    existente.UltimoError = null;
                }
            }

            await context.SaveChangesAsync(cancellationToken);

            // Citas canceladas/reprogramadas a menos de 24h o clientes que perdieron
            // su email quedan cancelados antes de que el proceso de envío los tome.
            var activas = await notificaciones
                .Where(x =>
                    (x.Estado == EstadosNotificacion.Pendiente || x.Estado == EstadosNotificacion.Reintento) &&
                    x.CitaId != null)
                .Include(x => x.Cita!)
                .Include(x => x.Cliente)
                .ToListAsync(cancellationToken);

            foreach (var n in activas)
            {
                var emailActual = NotificacionCitaService.NormalizarEmail(n.Cliente.Email);
                if (n.Cita == null ||
                    n.Cita.Estado == EstadosCita.Cancelada ||
                    n.Cita.Estado == EstadosCita.Completada ||
                    n.Cita.Estado == EstadosCita.NoAsistio ||
                    n.Cita.FechaInicio.AddHours(-24) <= ahora ||
                    emailActual == null)
                {
                    n.Estado = EstadosNotificacion.Cancelada;
                }
            }

            await context.SaveChangesAsync(cancellationToken);
        }

        private async Task ProcesarPendientesAsync(CancellationToken cancellationToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
            var timeZoneService = scope.ServiceProvider.GetRequiredService<ITimeZoneService>();
            var notificaciones = context.Set<Notificacion>();
            var ahora = DateTime.UtcNow;

            var ids = await notificaciones.AsNoTracking()
                .Where(x =>
                    (x.Estado == EstadosNotificacion.Pendiente || x.Estado == EstadosNotificacion.Reintento) &&
                    x.ProgramadaPara <= ahora &&
                    x.Intentos < 3)
                .OrderBy(x => x.ProgramadaPara)
                .Select(x => x.Id)
                .Take(25)
                .ToListAsync(cancellationToken);

            foreach (var id in ids)
                await ProcesarUnaAsync(context, emailService, timeZoneService, id, cancellationToken);
        }

        private async Task ProcesarUnaAsync(
            AppDbContext context,
            IEmailService emailService,
            ITimeZoneService timeZoneService,
            int id,
            CancellationToken cancellationToken)
        {
            var notificaciones = context.Set<Notificacion>();
            var notificacion = await notificaciones
                .Include(x => x.Tenant)
                .Include(x => x.Cliente)
                .Include(x => x.Cita!).ThenInclude(x => x.Profesional)
                .Include(x => x.Cita!).ThenInclude(x => x.Servicio)
                .Include(x => x.Cita!).ThenInclude(x => x.ServicioVariante)
                .Include(x => x.Cita!).ThenInclude(x => x.Sucursal)
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (notificacion == null ||
                (notificacion.Estado != EstadosNotificacion.Pendiente && notificacion.Estado != EstadosNotificacion.Reintento))
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

            var emailActual = NotificacionCitaService.NormalizarEmail(notificacion.Cliente.Email);
            if (emailActual == null ||
                !string.Equals(emailActual, notificacion.Destino, StringComparison.OrdinalIgnoreCase))
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
                var fechaLocal = await timeZoneService.UtcALocalAsync(notificacion.TenantId, cita.FechaInicio);
                var negocio = notificacion.Tenant.NombreComercial ?? notificacion.Tenant.Nombre;
                var cliente = string.Join(" ", new[] { notificacion.Cliente.Nombre, notificacion.Cliente.Apellidos }.Where(x => !string.IsNullOrWhiteSpace(x)));
                var profesional = string.Join(" ", new[] { cita.Profesional.Nombre, cita.Profesional.Apellidos }.Where(x => !string.IsNullOrWhiteSpace(x)));
                var servicio = cita.ServicioVariante == null ? cita.Servicio.Nombre : $"{cita.Servicio.Nombre} - {cita.ServicioVariante.Nombre}";
                var cultura = new System.Globalization.CultureInfo("es-CR");
                var fechaTexto = fechaLocal.ToString("dddd d 'de' MMMM 'de' yyyy", cultura);
                var horaTexto = fechaLocal.ToString("h:mm tt", cultura);

                await emailService.EnviarAsync(
                    notificacion.Destino,
                    negocio,
                    $"Recordatorio de tu cita en {negocio}",
                    CrearHtml(negocio, cliente, fechaTexto, horaTexto, servicio, profesional, cita.Sucursal.Nombre),
                    cancellationToken);

                notificacion.Estado = EstadosNotificacion.Enviada;
                notificacion.FechaEnvio = DateTime.UtcNow;
                notificacion.UltimoError = null;
                await context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                notificacion.Estado = notificacion.Intentos >= 3 ? EstadosNotificacion.Fallida : EstadosNotificacion.Reintento;
                notificacion.UltimoError = ex.Message.Length > 2000 ? ex.Message[..2000] : ex.Message;
                await context.SaveChangesAsync(cancellationToken);
                _logger.LogError(ex, "Falló notificación {NotificacionId}.", id);
            }
        }

        private static string CrearHtml(string negocio, string cliente, string fecha, string hora, string servicio, string profesional, string sucursal)
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
