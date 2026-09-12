using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Models
{
    [Index(nameof(TenantId), nameof(Estado))]
    [Index(nameof(TenantId), nameof(ClienteId))]
    [Index(nameof(TenantId), nameof(CitaId), IsUnique = true)]
    public class CuentaPorCobrar
    {
        public int Id { get; set; }

        public int TenantId { get; set; }

        public int SucursalId { get; set; }

        public int ClienteId { get; set; }

        public int? CitaId { get; set; }

        public int? VentaId { get; set; }

        [Precision(12, 2)]
        public decimal MontoOriginal { get; set; }

        [Precision(12, 2)]
        public decimal SaldoPendiente { get; set; }

        public string Estado { get; set; } = EstadosCuentaPorCobrar.Pendiente;

        public string? Notas { get; set; }

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public DateTime? FechaActualizacion { get; set; }

        public Tenant Tenant { get; set; } = null!;

        public Sucursal Sucursal { get; set; } = null!;

        public Cliente Cliente { get; set; } = null!;

        public Cita? Cita { get; set; }

        public Venta? Venta { get; set; }

        public ICollection<AbonoCuentaPorCobrar> Abonos { get; set; } =
            new List<AbonoCuentaPorCobrar>();
    }
}
