namespace BarberiaSaaS.Api.DTOs
{
    public class ConsultarDisponibilidadDto
    {
        public int ProfesionalId { get; set; }

        public int ServicioId { get; set; }

        public DateTime Fecha { get; set; }
    }
}