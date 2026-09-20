namespace BarberiaSaaS.Api.DTOs
{
    public class CrearClienteDto
    {
        public string Nombre { get; set; } = string.Empty;

        public string Apellidos { get; set; } = string.Empty;

        public string? Telefono { get; set; }

        public string? PaisCodigoTelefono { get; set; }

        public string? Email { get; set; }

        public DateOnly? FechaNacimiento { get; set; }

        public string? Notas { get; set; }
    }
}