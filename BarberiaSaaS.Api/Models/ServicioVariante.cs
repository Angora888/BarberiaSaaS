namespace BarberiaSaaS.Api.Models
{
    public class ServicioVariante
    {
        public int Id { get; set; }

        public int TenantId { get; set; }

        public int ServicioId { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public decimal Precio { get; set; }

        public int Orden { get; set; }

        public bool Activo { get; set; } = true;

        public DateTime FechaCreacion { get; set; } =
            DateTime.UtcNow;

        // Relaciones

        public Tenant Tenant { get; set; } = null!;

        public Servicio Servicio { get; set; } = null!;

        public ICollection<Cita> Citas { get; set; } =
            new List<Cita>();
    }
}