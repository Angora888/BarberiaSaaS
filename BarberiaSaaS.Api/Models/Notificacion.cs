using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Models
{
    public static class CanalesNotificacion
    {
        public const string Email = "Email";
        public const string WhatsApp = "WhatsApp";
    }

    public static class TiposNotificacion
    {
        public const string RecordatorioCita24H = "RecordatorioCita24H";
    }

    public static class EstadosNotificacion
    {
        public const string Pendiente = "Pendiente";
        public const string Procesando = "Procesando";
        public const string Enviada = "Enviada";
        public const string Reintento = "Reintento";
        public const string Fallida = "Fallida";
        public const string Cancelada = "Cancelada";
    }

    [Table("Notificaciones")]
    [Index(nameof(TenantId), nameof(Estado), nameof(ProgramadaPara))]
    public class Notificacion
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int? CitaId { get; set; }
        public int ClienteId { get; set; }

        [MaxLength(30)]
        public string Canal { get; set; } = CanalesNotificacion.Email;

        [MaxLength(50)]
        public string Tipo { get; set; } = TiposNotificacion.RecordatorioCita24H;

        [MaxLength(320)]
        public string Destino { get; set; } = string.Empty;

        public DateTime ProgramadaPara { get; set; }

        [MaxLength(30)]
        public string Estado { get; set; } = EstadosNotificacion.Pendiente;

        public int Intentos { get; set; }

        [MaxLength(2000)]
        public string? UltimoError { get; set; }

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public DateTime? FechaEnvio { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public Cita? Cita { get; set; }
        public Cliente Cliente { get; set; } = null!;
    }
}
