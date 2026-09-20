namespace BarberiaSaaS.Api.DTOs
{
    public class RegistrarTenantDto
    {
        // Negocio
        public string NombreNegocio { get; set; } = string.Empty;

        public string? Identificacion { get; set; }

        // ISO 3166-1 alpha-2, por ejemplo CR, PA o US.
        public string PaisCodigo { get; set; } = "CR";

        // Se normalizará a E.164 en el backend antes de persistirlo.
        public string? Telefono { get; set; }

        // Propietario
        public string NombrePropietario { get; set; } = string.Empty;

        public string ApellidosPropietario { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        // Token generado por Cloudflare Turnstile en el formulario público.
        // El backend siempre lo valida con Cloudflare antes de crear el negocio.
        public string TurnstileToken { get; set; } = string.Empty;
    }
}