using BarberiaSaaS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(
            DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Tenant> Tenants => Set<Tenant>();

        public DbSet<ConfiguracionTenant> ConfiguracionesTenant =>
            Set<ConfiguracionTenant>();

        public DbSet<Sucursal> Sucursales => Set<Sucursal>();

        public DbSet<Usuario> Usuarios => Set<Usuario>();

        public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

        public DbSet<Profesional> Profesionales => Set<Profesional>();

        public DbSet<Servicio> Servicios => Set<Servicio>();

        public DbSet<ServicioVariante> ServicioVariantes =>
            Set<ServicioVariante>();

        public DbSet<ProfesionalServicio> ProfesionalServicios =>
            Set<ProfesionalServicio>();

        public DbSet<Cliente> Clientes => Set<Cliente>();

        public DbSet<Cita> Citas => Set<Cita>();

        public DbSet<HorarioProfesional> HorariosProfesionales =>
            Set<HorarioProfesional>();

        public DbSet<AlmuerzoProfesional> AlmuerzosProfesionales =>
            Set<AlmuerzoProfesional>();

        public DbSet<BloqueoProfesional> BloqueosProfesionales =>
            Set<BloqueoProfesional>();

        public DbSet<CategoriaProducto> CategoriasProducto =>
            Set<CategoriaProducto>();

        public DbSet<Producto> Productos =>
            Set<Producto>();

        public DbSet<InventarioSucursal> InventariosSucursal =>
            Set<InventarioSucursal>();

        public DbSet<MovimientoInventario> MovimientosInventario =>
            Set<MovimientoInventario>();

        public DbSet<Venta> Ventas =>
            Set<Venta>();

        public DbSet<VentaDetalle> VentaDetalles =>
            Set<VentaDetalle>();

        protected override void OnModelCreating(
            ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Tenant>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Nombre)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.Property(x => x.NombreComercial)
                    .HasMaxLength(150);

                entity.Property(x => x.Identificacion)
                    .HasMaxLength(50);

                entity.Property(x => x.Telefono)
                    .HasMaxLength(30);

                entity.Property(x => x.Email)
                    .HasMaxLength(150);
            });

            modelBuilder.Entity<ConfiguracionTenant>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.HasIndex(x => x.TenantId)
                    .IsUnique();

                entity.HasOne(x => x.Tenant)
                    .WithOne(x => x.Configuracion)
                    .HasForeignKey<ConfiguracionTenant>(
                        x => x.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(x => x.PorcentajeDeposito)
                    .HasPrecision(5, 2);
            });

            modelBuilder.Entity<Sucursal>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Nombre)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.HasOne(x => x.Tenant)
                    .WithMany(x => x.Sucursales)
                    .HasForeignKey(x => x.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Usuario>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Nombre)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(x => x.Apellidos)
                    .HasMaxLength(150);

                entity.Property(x => x.Email)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.Property(x => x.PasswordHash)
                    .IsRequired();

                entity.Property(x => x.Rol)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.HasIndex(x => new
                {
                    x.TenantId,
                    x.Email
                })
                .IsUnique();

                entity.HasOne(x => x.Tenant)
                    .WithMany(x => x.Usuarios)
                    .HasForeignKey(x => x.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Sucursal)
                    .WithMany(x => x.Usuarios)
                    .HasForeignKey(x => x.SucursalId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<PasswordResetToken>(entity =>
            {
                entity.HasKey(x => x.Id);
                entity.Property(x => x.TokenHash).IsRequired().HasMaxLength(64);
                entity.HasIndex(x => x.TokenHash).IsUnique();
                entity.HasIndex(x => new { x.UsuarioId, x.FechaExpiracion });
                entity.HasOne(x => x.Usuario)
                    .WithMany()
                    .HasForeignKey(x => x.UsuarioId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Profesional>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Nombre)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(x => x.Apellidos)
                    .HasMaxLength(150);

                entity.Property(x => x.Telefono)
                    .HasMaxLength(30);

                entity.Property(x => x.Email)
                    .HasMaxLength(150);

                entity.Property(x => x.Especialidad)
                    .HasMaxLength(150);

                entity.Property(x => x.FotoUrl)
                    .HasMaxLength(500);

                entity.HasOne(x => x.Tenant)
                    .WithMany(x => x.Profesionales)
                    .HasForeignKey(x => x.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Sucursal)
                    .WithMany(x => x.Profesionales)
                    .HasForeignKey(x => x.SucursalId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Servicio>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Nombre)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.Property(x => x.Descripcion)
                    .HasMaxLength(1000);

                entity.Property(x => x.Precio)
                    .HasPrecision(12, 2);

                entity.HasIndex(x => new
                {
                    x.TenantId,
                    x.Nombre
                });

                entity.HasOne(x => x.Tenant)
                    .WithMany(x => x.Servicios)
                    .HasForeignKey(x => x.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ServicioVariante>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Nombre)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.Property(x => x.Precio)
                    .HasPrecision(12, 2);

                entity.Property(x => x.Orden)
                    .IsRequired();

                entity.HasIndex(x => new
                {
                    x.TenantId,
                    x.ServicioId,
                    x.Nombre
                });

                entity.HasOne(x => x.Tenant)
                    .WithMany()
                    .HasForeignKey(x => x.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Servicio)
                    .WithMany(x => x.Variantes)
                    .HasForeignKey(x => x.ServicioId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ProfesionalServicio>(entity =>
            {
                entity.HasKey(x => new
                {
                    x.ProfesionalId,
                    x.ServicioId
                });

                entity.HasOne(x => x.Profesional)
                    .WithMany(x => x.Servicios)
                    .HasForeignKey(x => x.ProfesionalId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Servicio)
                    .WithMany(x => x.Profesionales)
                    .HasForeignKey(x => x.ServicioId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Cliente>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Nombre)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(x => x.Apellidos)
                    .HasMaxLength(150);

                entity.Property(x => x.Telefono)
                    .HasMaxLength(30);

                entity.Property(x => x.Email)
                    .HasMaxLength(150);

                entity.Property(x => x.Notas)
                    .HasMaxLength(2000);

                entity.HasIndex(x => new
                {
                    x.TenantId,
                    x.Telefono
                });

                entity.HasOne(x => x.Tenant)
                    .WithMany(x => x.Clientes)
                    .HasForeignKey(x => x.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Cita>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.DuracionMinutos)
                    .IsRequired();

                entity.Property(x => x.Precio)
                    .HasPrecision(12, 2);

                entity.Property(x => x.Estado)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(x => x.Notas)
                    .HasMaxLength(2000);

                entity.HasIndex(x => new
                {
                    x.TenantId,
                    x.ProfesionalId,
                    x.FechaInicio
                });

                entity.HasIndex(x => new
                {
                    x.TenantId,
                    x.ClienteId,
                    x.FechaInicio
                });

                entity.HasOne(x => x.Tenant)
                    .WithMany(x => x.Citas)
                    .HasForeignKey(x => x.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Sucursal)
                    .WithMany(x => x.Citas)
                    .HasForeignKey(x => x.SucursalId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.Cliente)
                    .WithMany(x => x.Citas)
                    .HasForeignKey(x => x.ClienteId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.Profesional)
                    .WithMany(x => x.Citas)
                    .HasForeignKey(x => x.ProfesionalId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.Servicio)
                    .WithMany(x => x.Citas)
                    .HasForeignKey(x => x.ServicioId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.ServicioVariante)
                    .WithMany(x => x.Citas)
                    .HasForeignKey(x => x.ServicioVarianteId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<HorarioProfesional>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.HasIndex(x => new
                {
                    x.TenantId,
                    x.ProfesionalId,
                    x.DiaSemana
                });

                entity.HasOne(x => x.Tenant)
                    .WithMany(x => x.HorariosProfesionales)
                    .HasForeignKey(x => x.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Profesional)
                    .WithMany(x => x.Horarios)
                    .HasForeignKey(x => x.ProfesionalId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<AlmuerzoProfesional>(entity =>
            {
                entity.HasKey(x => x.Id);
                entity.HasIndex(x => new { x.TenantId, x.ProfesionalId, x.DiaSemana }).IsUnique();
                entity.HasOne(x => x.Tenant).WithMany(x => x.AlmuerzosProfesionales)
                    .HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(x => x.Profesional).WithMany(x => x.Almuerzos)
                    .HasForeignKey(x => x.ProfesionalId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<BloqueoProfesional>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Motivo)
                    .HasMaxLength(500);

                entity.HasIndex(x => new
                {
                    x.TenantId,
                    x.ProfesionalId,
                    x.FechaInicio
                });

                entity.HasOne(x => x.Tenant)
                    .WithMany(x => x.BloqueosProfesionales)
                    .HasForeignKey(x => x.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Profesional)
                    .WithMany(x => x.Bloqueos)
                    .HasForeignKey(x => x.ProfesionalId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CategoriaProducto>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Nombre)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.Property(x => x.Descripcion)
                    .HasMaxLength(1000);

                entity.HasIndex(x => new
                {
                    x.TenantId,
                    x.Nombre
                });

                entity.HasOne(x => x.Tenant)
                    .WithMany()
                    .HasForeignKey(x => x.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Producto>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Nombre)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.Property(x => x.Descripcion)
                    .HasMaxLength(1000);

                entity.Property(x => x.Codigo)
                    .HasMaxLength(100);

                entity.Property(x => x.CodigoBarras)
                    .HasMaxLength(100);

                entity.Property(x => x.Costo)
                    .HasPrecision(12, 2);

                entity.Property(x => x.PrecioVenta)
                    .HasPrecision(12, 2);

                entity.Property(x => x.StockMinimo)
                    .HasPrecision(12, 2);

                entity.Property(x => x.ImagenUrl)
                    .HasMaxLength(500);

                entity.HasIndex(x => new
                {
                    x.TenantId,
                    x.Nombre
                });

                entity.HasIndex(x => new
                {
                    x.TenantId,
                    x.Codigo
                })
                .IsUnique();

                entity.HasIndex(x => new
                {
                    x.TenantId,
                    x.CodigoBarras
                })
                .IsUnique();

                entity.HasOne(x => x.Tenant)
                    .WithMany()
                    .HasForeignKey(x => x.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.CategoriaProducto)
                    .WithMany(x => x.Productos)
                    .HasForeignKey(x => x.CategoriaProductoId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<InventarioSucursal>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Cantidad)
                    .HasPrecision(12, 2);

                entity.HasIndex(x => new
                {
                    x.TenantId,
                    x.SucursalId,
                    x.ProductoId
                })
                .IsUnique();

                entity.HasOne(x => x.Tenant)
                    .WithMany()
                    .HasForeignKey(x => x.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Sucursal)
                    .WithMany()
                    .HasForeignKey(x => x.SucursalId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Producto)
                    .WithMany(x => x.Inventarios)
                    .HasForeignKey(x => x.ProductoId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<MovimientoInventario>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Tipo)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(x => x.Cantidad)
                    .HasPrecision(12, 2);

                entity.Property(x => x.CantidadAnterior)
                    .HasPrecision(12, 2);

                entity.Property(x => x.CantidadNueva)
                    .HasPrecision(12, 2);

                entity.Property(x => x.Motivo)
                    .HasMaxLength(500);

                entity.HasIndex(x => new
                {
                    x.TenantId,
                    x.SucursalId,
                    x.ProductoId,
                    x.Fecha
                });

                entity.HasOne(x => x.Tenant)
                    .WithMany()
                    .HasForeignKey(x => x.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Sucursal)
                    .WithMany()
                    .HasForeignKey(x => x.SucursalId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.Producto)
                    .WithMany(x => x.MovimientosInventario)
                    .HasForeignKey(x => x.ProductoId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.Usuario)
                    .WithMany()
                    .HasForeignKey(x => x.UsuarioId)
                    .OnDelete(DeleteBehavior.SetNull);
            });


            // ============================================================
            // VENTA
            // ============================================================

            modelBuilder.Entity<Venta>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.MetodoPago)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(x => x.Subtotal)
                    .HasPrecision(12, 2);

                entity.Property(x => x.Descuento)
                    .HasPrecision(12, 2);

                entity.Property(x => x.Total)
                    .HasPrecision(12, 2);

                entity.Property(x => x.Estado)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(x => x.Notas)
                    .HasMaxLength(1000);

                entity.HasIndex(x => new
                {
                    x.TenantId,
                    x.SucursalId,
                    x.Fecha
                });

                entity.HasIndex(x => new
                {
                    x.TenantId,
                    x.ClienteId,
                    x.Fecha
                });

                entity.HasOne(x => x.Tenant)
                    .WithMany()
                    .HasForeignKey(x => x.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Sucursal)
                    .WithMany()
                    .HasForeignKey(x => x.SucursalId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.Cliente)
                    .WithMany()
                    .HasForeignKey(x => x.ClienteId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(x => x.Usuario)
                    .WithMany()
                    .HasForeignKey(x => x.UsuarioId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ============================================================
            // DETALLE DE VENTA
            // ============================================================

            modelBuilder.Entity<VentaDetalle>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Cantidad)
                    .HasPrecision(12, 2);

                entity.Property(x => x.PrecioUnitario)
                    .HasPrecision(12, 2);

                entity.Property(x => x.CostoUnitario)
                    .HasPrecision(12, 2);

                entity.Property(x => x.Subtotal)
                    .HasPrecision(12, 2);

                entity.HasIndex(x => new
                {
                    x.TenantId,
                    x.VentaId
                });

                entity.HasOne(x => x.Tenant)
                    .WithMany()
                    .HasForeignKey(x => x.TenantId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Venta)
                    .WithMany(x => x.Detalles)
                    .HasForeignKey(x => x.VentaId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Producto)
                    .WithMany()
                    .HasForeignKey(x => x.ProductoId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}
