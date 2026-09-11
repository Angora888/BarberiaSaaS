namespace BarberiaSaaS.Api.Models
{
    public class Sucursal
    {
        public int Id { get; set; }

        public int TenantId { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public string? Direccion { get; set; }

        public string? Telefono { get; set; }

        public string? Email { get; set; }

        public bool Activa { get; set; } = true;

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public Tenant Tenant { get; set; } = null!;

        public ICollection<Usuario> Usuarios { get; set; }
            = new List<Usuario>();

        public ICollection<Profesional> Profesionales { get; set; }
            = new List<Profesional>();

        public ICollection<Cita> Citas { get; set; }
            = new List<Cita>();
    }
}