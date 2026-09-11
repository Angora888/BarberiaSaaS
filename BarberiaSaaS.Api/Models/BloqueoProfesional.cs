namespace BarberiaSaaS.Api.Models
{
    public class BloqueoProfesional
    {
        public int Id { get; set; }

        public int TenantId { get; set; }

        public int ProfesionalId { get; set; }

        public DateTime FechaInicio { get; set; }

        public DateTime FechaFin { get; set; }

        public string? Motivo { get; set; }

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public Tenant Tenant { get; set; } = null!;

        public Profesional Profesional { get; set; } = null!;
    }
}