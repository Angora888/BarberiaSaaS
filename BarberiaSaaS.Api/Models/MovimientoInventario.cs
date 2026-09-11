namespace BarberiaSaaS.Api.Models
{
    public class MovimientoInventario
    {
        public int Id { get; set; }

        public int TenantId { get; set; }

        public int SucursalId { get; set; }

        public int ProductoId { get; set; }

        public string Tipo { get; set; } = string.Empty;

        public decimal Cantidad { get; set; }

        public decimal CantidadAnterior { get; set; }

        public decimal CantidadNueva { get; set; }

        public string? Motivo { get; set; }

        public int? UsuarioId { get; set; }

        public DateTime Fecha { get; set; } =
            DateTime.UtcNow;


        // Navegación

        public Tenant Tenant { get; set; } = null!;

        public Sucursal Sucursal { get; set; } = null!;

        public Producto Producto { get; set; } = null!;

        public Usuario? Usuario { get; set; }
    }
}