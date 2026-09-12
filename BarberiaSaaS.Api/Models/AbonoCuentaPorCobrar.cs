using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Models
{
    [Index(nameof(TenantId), nameof(FechaPago))]
    [Index(nameof(CuentaPorCobrarId), nameof(FechaPago))]
    public class AbonoCuentaPorCobrar
    {
        public int Id { get; set; }

        public int TenantId { get; set; }

        public int CuentaPorCobrarId { get; set; }

        public int? UsuarioId { get; set; }

        [Precision(12, 2)]
        public decimal Monto { get; set; }

        public string MetodoPago { get; set; } = string.Empty;

        public DateTime FechaPago { get; set; } = DateTime.UtcNow;

        public string? Notas { get; set; }

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public Tenant Tenant { get; set; } = null!;

        public CuentaPorCobrar CuentaPorCobrar { get; set; } = null!;

        public Usuario? Usuario { get; set; }
    }
}
