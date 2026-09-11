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

        public DbSet<Profesional> Profesionales => Set<Profesional>();

        public DbSet<Servicio> Servicios => Set<Servicio>();

        public DbSet<ProfesionalServicio> ProfesionalServicios =>
            Set<ProfesionalServicio>();

        public DbSet<Cliente> Clientes => Set<Cliente>();

        public DbSet<Cita> Citas => Set<Cita>();

        public DbSet<HorarioProfesional> HorariosProfesionales =>
            Set<HorarioProfesional>();

        public DbSet<BloqueoProfesional> BloqueosProfesionales =>
            Set<BloqueoProfesional>();

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
        }
    }
}