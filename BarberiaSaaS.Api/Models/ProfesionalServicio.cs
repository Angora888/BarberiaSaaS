namespace BarberiaSaaS.Api.Models
{
    public class ProfesionalServicio
    {
        public int ProfesionalId { get; set; }

        public int ServicioId { get; set; }

        public Profesional Profesional { get; set; } = null!;

        public Servicio Servicio { get; set; } = null!;
    }
}