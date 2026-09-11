namespace BarberiaSaaS.Api.Models
{
    public class Producto
    {
        public int Id { get; set; }

        public int TenantId { get; set; }

        public int? CategoriaProductoId { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        public string? Codigo { get; set; }

        public string? CodigoBarras { get; set; }

        public decimal Costo { get; set; }

        public decimal PrecioVenta { get; set; }

        public decimal StockMinimo { get; set; }

        public string? ImagenUrl { get; set; }

        public bool Activo { get; set; } = true;

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;


        // Navegación

        public Tenant Tenant { get; set; } = null!;

        public CategoriaProducto? CategoriaProducto { get; set; }

        public ICollection<InventarioSucursal> Inventarios { get; set; } =
            new List<InventarioSucursal>();

        public ICollection<MovimientoInventario> MovimientosInventario { get; set; } =
            new List<MovimientoInventario>();
    }
}