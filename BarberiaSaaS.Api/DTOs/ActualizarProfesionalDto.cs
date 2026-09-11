namespace BarberiaSaaS.Api.DTOs
{
    public class ActualizarProfesionalDto
    {
        public int? SucursalId { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public string Apellidos { get; set; } = string.Empty;

        public string? Telefono { get; set; }

        public string? Email { get; set; }

        public string? Especialidad { get; set; }

        public string? FotoUrl { get; set; }

        public List<int> ServicioIds { get; set; } = new();

        public bool Activo { get; set; }
    }
}
