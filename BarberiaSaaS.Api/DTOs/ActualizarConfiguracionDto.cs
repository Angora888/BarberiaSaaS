namespace BarberiaSaaS.Api.DTOs
{
    public class ActualizarConfiguracionDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string? NombreComercial { get; set; }
        public string? Identificacion { get; set; }
        public string? Telefono { get; set; }
        public string? Email { get; set; }

        public string? LogoUrl { get; set; }
        public string? FrasePresentacion { get; set; }
        public string ColorPrimario { get; set; } = "#C62864";
        public string ColorSecundario { get; set; } = "#F8E7EE";
        public string ColorFondo { get; set; } = "#FFFFFF";

        public string Moneda { get; set; } = "CRC";
        public string ZonaHoraria { get; set; } = "America/Costa_Rica";
        public string Idioma { get; set; } = "es";

        public int DuracionSlotMinutos { get; set; } = 15;
        public bool PermitirReservaOnline { get; set; } = true;
        public bool MostrarPrecios { get; set; } = true;

        public bool RecordatorioEmailActivo { get; set; } = true;
        public bool RecordatorioWhatsAppActivo { get; set; } = true;
        public int RecordatorioEmailHorasAntes { get; set; } = 24;

        public bool RequiereDeposito { get; set; }
        public decimal PorcentajeDeposito { get; set; }

        public string? Instagram { get; set; }
        public string? Facebook { get; set; }
        public string? WhatsApp { get; set; }
    }
}
