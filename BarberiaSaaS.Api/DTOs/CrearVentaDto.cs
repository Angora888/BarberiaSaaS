namespace BarberiaSaaS.Api.DTOs
{
    public class CrearVentaDto
    {
        public int SucursalId { get; set; }

        public int? ClienteId { get; set; }

        public string MetodoPago { get; set; } = string.Empty;

        public decimal Descuento { get; set; }

        public string? Notas { get; set; }

        public List<CrearVentaDetalleDto> Detalles { get; set; } =
            new List<CrearVentaDetalleDto>();
    }
}
