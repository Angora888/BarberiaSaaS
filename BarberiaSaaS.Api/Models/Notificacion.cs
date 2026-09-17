namespace BarberiaSaaS.Api.Models
{
    public static class CanalesNotificacion
    {
        public const string Email = "Email";
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

    public class Notificacion
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int? CitaId { get; set; }
        public int ClienteId { get; set; }
        public string Canal { get; set; } = CanalesNotificacion.Email;
        public string Tipo { get; set; } = TiposNotificacion.RecordatorioCita24H;
        public string Destino { get; set; } = string.Empty;
        public DateTime ProgramadaPara { get; set; }
        public string Estado { get; set; } = EstadosNotificacion.Pendiente;
        public int Intentos { get; set; }
        public string? UltimoError { get; set; }
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public DateTime? FechaEnvio { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public Cita? Cita { get; set; }
        public Cliente Cliente { get; set; } = null!;
    }
}
