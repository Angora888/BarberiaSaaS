using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Models
{
    [Index(nameof(SlugPublico), IsUnique = true)]
    [Index(nameof(PayPalSubscriptionId), IsUnique = true)]
    public class Tenant
    {
        public int Id { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public string? NombreComercial { get; set; }

        public string? Identificacion { get; set; }

        public string? Telefono { get; set; }

        public string? Email { get; set; }

        // ============================================================
        // LANDING PÚBLICA
        // ============================================================

        [MaxLength(180)]
        public string? SlugPublico { get; set; }

        public bool LandingPublicaActiva { get; set; } = false;

        // ============================================================
        // ESTADO / ACTIVACIÓN
        // ============================================================

        public bool Activo { get; set; } = true;

        // Los tenants existentes se consideran confirmados. Los nuevos
        // registros públicos se crean explícitamente con false hasta que
        // el propietario confirme el correo.
        public bool EmailConfirmado { get; set; } = true;

        // Marca el momento en que comenzó realmente el acceso/prueba.
        // Para tenants existentes la migración la inicializa con FechaCreacion.
        public DateTime? FechaActivacion { get; set; }

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        // ============================================================
        // SUSCRIPCIÓN PAYPAL
        // ============================================================

        [MaxLength(100)]
        public string? PayPalSubscriptionId { get; set; }

        [MaxLength(100)]
        public string? PayPalPlanId { get; set; }

        [MaxLength(50)]
        public string? PayPalSubscriptionStatus { get; set; }

        [MaxLength(180)]
        public string? PayPalPayerEmail { get; set; }

        public DateTime? PayPalNextBillingTime { get; set; }

        public DateTime? PayPalSubscriptionUpdatedAt { get; set; }

        // ============================================================
        // RELACIONES
        // ============================================================

        public ConfiguracionTenant? Configuracion { get; set; }

        public ICollection<Sucursal> Sucursales { get; set; }
            = new List<Sucursal>();

        public ICollection<Usuario> Usuarios { get; set; }
            = new List<Usuario>();

        public ICollection<Profesional> Profesionales { get; set; }
            = new List<Profesional>();

        public ICollection<Servicio> Servicios { get; set; }
            = new List<Servicio>();

        public ICollection<Cliente> Clientes { get; set; }
            = new List<Cliente>();

        public ICollection<Cita> Citas { get; set; }
            = new List<Cita>();

        public ICollection<HorarioProfesional> HorariosProfesionales { get; set; }
            = new List<HorarioProfesional>();

        public ICollection<BloqueoProfesional> BloqueosProfesionales { get; set; }
            = new List<BloqueoProfesional>();

        public ICollection<CuentaPorCobrar> CuentasPorCobrar { get; set; }
            = new List<CuentaPorCobrar>();

        public ICollection<AbonoCuentaPorCobrar> AbonosCuentasPorCobrar { get; set; }
            = new List<AbonoCuentaPorCobrar>();

        public ICollection<TokenConfirmacionRegistro> TokensConfirmacionRegistro { get; set; }
            = new List<TokenConfirmacionRegistro>();
    }
}