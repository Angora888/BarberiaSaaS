namespace BarberiaSaaS.Api.Models;

// Una identidad Apple siempre se vincula de forma explícita a un usuario existente.
public sealed class AppleIdentity
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public DateTime FechaVinculacion { get; set; } = DateTime.UtcNow;
    public Usuario Usuario { get; set; } = null!;
}
