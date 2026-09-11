namespace BarberiaSaaS.Api.DTOs
{
    public class CrearServicioVarianteDto
    {
        public string Nombre { get; set; } =
            string.Empty;

        public decimal Precio { get; set; }

        public int Orden { get; set; }
    }
}