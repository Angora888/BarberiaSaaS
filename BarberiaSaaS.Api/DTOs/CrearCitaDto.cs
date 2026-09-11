namespace BarberiaSaaS.Api.DTOs
{
    public class CrearCitaDto
    {
        public int ClienteId { get; set; }

        public int ProfesionalId { get; set; }

        public int ServicioId { get; set; }

        public int? ServicioVarianteId { get; set; }

        public int SucursalId { get; set; }

        public DateTime FechaInicio { get; set; }

        public int DuracionMinutos { get; set; }

        public string? Notas { get; set; }
    }
}