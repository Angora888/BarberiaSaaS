namespace BarberiaSaaS.Api.DTOs
{
    public class ActualizarServicioDto
    {
        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        public decimal Precio { get; set; }

        public bool Activo { get; set; }
    }
}
