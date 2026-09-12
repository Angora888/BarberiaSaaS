namespace BarberiaSaaS.Api.Models
{
    public class Venta
    {
        public int Id { get; set; }

        public int TenantId { get; set; }

        public int SucursalId { get; set; }

        public int? ClienteId { get; set; }

        public int UsuarioId { get; set; }

        public string MetodoPago { get; set; } = string.Empty;

        public decimal Subtotal { get; set; }

        public decimal Descuento { get; set; }

        public decimal Total { get; set; }

        public string Estado { get; set; } = EstadosVenta.Completada;

        public string? Notas { get; set; }

        public DateTime Fecha { get; set; } = DateTime.UtcNow;

        public Tenant Tenant { get; set; } = null!;

        public Sucursal Sucursal { get; set; } = null!;

        public Cliente? Cliente { get; set; }

        public Usuario Usuario { get; set; } = null!;

        public ICollection<VentaDetalle> Detalles { get; set; } =
            new List<VentaDetalle>();
    }
}
