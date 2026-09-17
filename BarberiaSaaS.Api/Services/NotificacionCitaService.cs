using System.Net.Mail;
using BarberiaSaaS.Api.Data;
using BarberiaSaaS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Services
{
    public interface INotificacionCitaService
    {
        Task ProgramarRecordatorioEmail24HAsync(
            Cita cita,
            Cliente cliente,
            CancellationToken cancellationToken = default);

        Task ReprogramarRecordatorioEmail24HAsync(
            Cita cita,
            CancellationToken cancellationToken = default);

        Task CancelarRecordatoriosAsync(
            int tenantId,
            int citaId,
            CancellationToken cancellationToken = default);
    }

    public class NotificacionCitaService : INotificacionCitaService
    {
        private readonly AppDbContext _context;

        public NotificacionCitaService(AppDbContext context)
        {
            _context = context;
        }

        public async Task ProgramarRecordatorioEmail24HAsync(
            Cita cita,
            Cliente cliente,
            CancellationToken cancellationToken = default)
        {
            // Regla principal: si el cliente no tiene un email utilizable,
            // no creamos ningún registro de notificación.
            var email = NormalizarEmail(cliente.Email);
            if (email == null)
                return;

            var programadaPara = cita.FechaInicio.AddHours(-24);

            // Si la cita fue creada con menos de 24 horas de anticipación,
            // no generamos un recordatorio atrasado/inmediato.
            if (programadaPara <= DateTime.UtcNow)
                return;

            var existente = await _context.Notificaciones
                .FirstOrDefaultAsync(x =>
                    x.TenantId == cita.TenantId &&
                    x.CitaId == cita.Id &&
                    x.Canal == CanalesNotificacion.Email &&
                    x.Tipo == TiposNotificacion.RecordatorioCita24H,
                    cancellationToken);

            if (existente == null)
            {
                _context.Notificaciones.Add(new Notificacion
                {
                    TenantId = cita.TenantId,
                    CitaId = cita.Id,
                    ClienteId = cliente.Id,
                    Canal = CanalesNotificacion.Email,
                    Tipo = TiposNotificacion.RecordatorioCita24H,
                    Destino = email,
                    ProgramadaPara = programadaPara,
                    Estado = EstadosNotificacion.Pendiente,
                    FechaCreacion = DateTime.UtcNow
                });
            }
            else if (existente.Estado != EstadosNotificacion.Enviada)
            {
                existente.Destino = email;
                existente.ProgramadaPara = programadaPara;
                existente.Estado = EstadosNotificacion.Pendiente;
                existente.Intentos = 0;
                existente.UltimoError = null;
                existente.FechaEnvio = null;
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task ReprogramarRecordatorioEmail24HAsync(
            Cita cita,
            CancellationToken cancellationToken = default)
        {
            var cliente = await _context.Clientes
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.Id == cita.ClienteId &&
                    x.TenantId == cita.TenantId &&
                    x.Activo,
                    cancellationToken);

            if (cliente == null || NormalizarEmail(cliente.Email) == null)
            {
                await CancelarRecordatoriosAsync(
                    cita.TenantId,
                    cita.Id,
                    cancellationToken);
                return;
            }

            var programadaPara = cita.FechaInicio.AddHours(-24);
            if (programadaPara <= DateTime.UtcNow)
            {
                await CancelarRecordatoriosAsync(
                    cita.TenantId,
                    cita.Id,
                    cancellationToken);
                return;
            }

            await ProgramarRecordatorioEmail24HAsync(
                cita,
                cliente,
                cancellationToken);
        }

        public async Task CancelarRecordatoriosAsync(
            int tenantId,
            int citaId,
            CancellationToken cancellationToken = default)
        {
            var pendientes = await _context.Notificaciones
                .Where(x =>
                    x.TenantId == tenantId &&
                    x.CitaId == citaId &&
                    x.Estado != EstadosNotificacion.Enviada &&
                    x.Estado != EstadosNotificacion.Cancelada)
                .ToListAsync(cancellationToken);

            foreach (var notificacion in pendientes)
            {
                notificacion.Estado = EstadosNotificacion.Cancelada;
            }

            if (pendientes.Count > 0)
                await _context.SaveChangesAsync(cancellationToken);
        }

        private static string? NormalizarEmail(string? email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return null;

            var valor = email.Trim();

            try
            {
                var direccion = new MailAddress(valor);
                return string.Equals(
                    direccion.Address,
                    valor,
                    StringComparison.OrdinalIgnoreCase)
                    ? direccion.Address
                    : null;
            }
            catch (FormatException)
            {
                return null;
            }
        }
    }
}
