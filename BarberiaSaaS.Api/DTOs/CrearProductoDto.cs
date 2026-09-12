namespace BarberiaSaaS.Api.DTOs
{
    public class CrearProductoDto
    {
        public int? CategoriaProductoId { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        public string? Codigo { get; set; }

        public string? CodigoBarras { get; set; }

        public decimal Costo { get; set; }

        public decimal PrecioVenta { get; set; }

        public decimal StockMinimo { get; set; }

        public string? ImagenUrl { get; set; }
    }
}
