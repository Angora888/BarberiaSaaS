namespace BarberiaSaaS.Api.Models
{
    public class Cita
    {
        public int Id { get; set; }

        public int TenantId { get; set; }

        public int SucursalId { get; set; }

        public int ClienteId { get; set; }

        public int ProfesionalId { get; set; }

        public int ServicioId { get; set; }

        public int? ServicioVarianteId { get; set; }

        public DateTime FechaInicio { get; set; }

        public int DuracionMinutos { get; set; }

        public DateTime FechaFin { get; set; }

        public decimal Precio { get; set; }

        public string Estado { get; set; } =
            EstadosCita.Pendiente;

        public string? Notas { get; set; }

        public DateTime FechaCreacion { get; set; } =
            DateTime.UtcNow;

        // Relaciones

        public Tenant Tenant { get; set; } = null!;

        public Sucursal Sucursal { get; set; } = null!;

        public Cliente Cliente { get; set; } = null!;

        public Profesional Profesional { get; set; } = null!;

        public Servicio Servicio { get; set; } = null!;

        public ServicioVariante? ServicioVariante { get; set; }
    }
}