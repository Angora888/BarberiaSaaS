namespace BarberiaSaaS.Api.Models
{
    public class Servicio
    {
        public int Id { get; set; }

        public int TenantId { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        public decimal Precio { get; set; }

        public bool Activo { get; set; } = true;

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public Tenant Tenant { get; set; } = null!;

        public ICollection<ProfesionalServicio> Profesionales { get; set; }
            = new List<ProfesionalServicio>();

        public ICollection<Cita> Citas { get; set; }
            = new List<Cita>();
    }
}