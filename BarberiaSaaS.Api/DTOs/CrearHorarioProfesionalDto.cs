namespace BarberiaSaaS.Api.DTOs
{
    public class CrearHorarioProfesionalDto
    {
        public int DiaSemana { get; set; }

        public TimeSpan HoraInicio { get; set; }

        public TimeSpan HoraFin { get; set; }
    }
}