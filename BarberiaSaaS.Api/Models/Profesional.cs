namespace BarberiaSaaS.Api.Models
{
    public class Profesional
    {
        public int Id { get; set; }

        public int TenantId { get; set; }

        public int? SucursalId { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public string Apellidos { get; set; } = string.Empty;

        public string? Telefono { get; set; }

        public string? Email { get; set; }

        public string? Especialidad { get; set; }

        public string? FotoUrl { get; set; }

        public bool Activo { get; set; } = true;

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public Tenant Tenant { get; set; } = null!;

        public Sucursal? Sucursal { get; set; }

        public ICollection<ProfesionalServicio> Servicios { get; set; }
            = new List<ProfesionalServicio>();

        public ICollection<Cita> Citas { get; set; }
            = new List<Cita>();

        public ICollection<HorarioProfesional> Horarios { get; set; }
            = new List<HorarioProfesional>();

        public ICollection<BloqueoProfesional> Bloqueos { get; set; }
            = new List<BloqueoProfesional>();
    }
}