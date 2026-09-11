namespace BarberiaSaaS.Api.Models
{
    public class CategoriaProducto
    {
        public int Id { get; set; }

        public int TenantId { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        public bool Activa { get; set; } = true;

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;


        // Navegación

        public Tenant Tenant { get; set; } = null!;

        public ICollection<Producto> Productos { get; set; } =
            new List<Producto>();
    }
}