namespace BarberiaSaaS.Api.Models
{
    public class PasswordResetToken
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public string TokenHash { get; set; } = string.Empty;
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public DateTime FechaExpiracion { get; set; }
        public DateTime? FechaUso { get; set; }
        public Usuario Usuario { get; set; } = null!;
    }
}