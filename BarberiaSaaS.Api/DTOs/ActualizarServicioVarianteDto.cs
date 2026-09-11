namespace BarberiaSaaS.Api.DTOs
{
    public class ActualizarServicioVarianteDto
    {
        public string Nombre { get; set; } =
            string.Empty;

        public decimal Precio { get; set; }

        public int Orden { get; set; }

        public bool Activo { get; set; }
    }
}