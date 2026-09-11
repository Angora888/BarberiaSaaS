namespace BarberiaSaaS.Api.Models
{
    public class HorarioProfesional
    {
        public int Id { get; set; }

        public int TenantId { get; set; }

        public int ProfesionalId { get; set; }

        public DayOfWeek DiaSemana { get; set; }

        public TimeSpan HoraInicio { get; set; }

        public TimeSpan HoraFin { get; set; }

        public bool Activo { get; set; } = true;

        public Tenant Tenant { get; set; } = null!;

        public Profesional Profesional { get; set; } = null!;
    }
}