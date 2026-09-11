namespace BarberiaSaaS.Api.DTOs
{
    public class RegistrarTenantDto
    {
        // Negocio
        public string NombreNegocio { get; set; } = string.Empty;

        public string? Identificacion { get; set; }

        public string? Telefono { get; set; }

        // Propietario
        public string NombrePropietario { get; set; } = string.Empty;

        public string ApellidosPropietario { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;
    }
}