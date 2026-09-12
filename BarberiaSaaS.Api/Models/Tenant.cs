namespace BarberiaSaaS.Api.Models
{
    public class Tenant
    {
        public int Id { get; set; }

        public string Nombre { get; set; } = string.Empty;

        public string? NombreComercial { get; set; }

        public string? Identificacion { get; set; }

        public string? Telefono { get; set; }

        public string? Email { get; set; }

        public bool Activo { get; set; } = true;

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

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
    }
}