namespace BarberiaSaaS.Api.DTOs
{
    public class CrearBloqueoProfesionalDto
    {
        public DateTime FechaInicio { get; set; }

        public DateTime FechaFin { get; set; }

        public string? Motivo { get; set; }
    }
}