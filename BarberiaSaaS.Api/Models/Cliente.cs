namespace BarberiaSaaS.Api.Models
{
    public class Cliente
    {
        public int Id { get; set; }

        public int TenantId { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public string Apellidos { get; set; } = string.Empty;

        public string? Telefono { get; set; }

        public string? PaisCodigoTelefono { get; set; }

        public string? Email { get; set; }

        public DateOnly? FechaNacimiento { get; set; }

        public string? Notas { get; set; }

        public bool Activo { get; set; } = true;

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public Tenant Tenant { get; set; } = null!;

        public ICollection<Cita> Citas { get; set; }
            = new List<Cita>();
    }
}