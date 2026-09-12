namespace BarberiaSaaS.Api.Models
{
    public class VentaDetalle
    {
        public int Id { get; set; }

        public int TenantId { get; set; }

        public int VentaId { get; set; }

        public int ProductoId { get; set; }

        public decimal Cantidad { get; set; }

        public decimal PrecioUnitario { get; set; }

        public decimal CostoUnitario { get; set; }

        public decimal Subtotal { get; set; }

        public Tenant Tenant { get; set; } = null!;

        public Venta Venta { get; set; } = null!;

        public Producto Producto { get; set; } = null!;
    }
}
