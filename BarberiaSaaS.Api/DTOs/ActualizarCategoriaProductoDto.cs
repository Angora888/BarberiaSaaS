namespace BarberiaSaaS.Api.DTOs
{
    public class ActualizarCategoriaProductoDto
    {
        public string Nombre { get; set; } = string.Empty;

        public string? Descripcion { get; set; }

        public bool Activa { get; set; } = true;
    }
}
