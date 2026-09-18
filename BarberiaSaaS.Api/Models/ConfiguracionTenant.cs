namespace BarberiaSaaS.Api.Models
{
    public class ConfiguracionTenant
    {
        public int Id { get; set; }
        public int TenantId { get; set; }

        // Branding
        public string? LogoUrl { get; set; }
        public string? FrasePresentacion { get; set; }
        public string ColorPrimario { get; set; } = "#C62864";
        public string ColorSecundario { get; set; } = "#F8E7EE";
        public string ColorFondo { get; set; } = "#FFFFFF";

        // Configuración regional
        public string Moneda { get; set; } = "CRC";
        public string ZonaHoraria { get; set; } = "America/Costa_Rica";
        public string Idioma { get; set; } = "es";

        // Agenda
        public int DuracionSlotMinutos { get; set; } = 15;
        public bool PermitirReservaOnline { get; set; } = true;
        public bool MostrarPrecios { get; set; } = true;

        // Notificaciones
        public bool RecordatorioEmailActivo { get; set; } = true;
        public int RecordatorioEmailHorasAntes { get; set; } = 24;

        // Depósitos
        public bool RequiereDeposito { get; set; } = false;
        public decimal PorcentajeDeposito { get; set; } = 0;

        // Redes y contacto
        public string? Instagram { get; set; }
        public string? Facebook { get; set; }
        public string? WhatsApp { get; set; }

        public Tenant Tenant { get; set; } = null!;
    }
}
