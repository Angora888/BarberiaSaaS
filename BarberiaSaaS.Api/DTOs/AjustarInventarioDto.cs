namespace BarberiaSaaS.Api.DTOs
{
    public class AjustarInventarioDto
    {
        public int SucursalId { get; set; }

        public int ProductoId { get; set; }

        public string Tipo { get; set; } = string.Empty;

        public decimal Cantidad { get; set; }

        public string? Motivo { get; set; }
    }
}
