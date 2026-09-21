namespace BarberiaSaaS.Api.DTOs
{
    public class RestablecerPasswordDto
    {
        public string Token { get; set; } = string.Empty;
        public string NuevaPassword { get; set; } = string.Empty;
    }
}