namespace BarberiaSaaS.Api.DTOs
{
    public class CrearServicioDto
    {
        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        public decimal Precio { get; set; }

        public int DuracionMinutos { get; set; }
    }
}