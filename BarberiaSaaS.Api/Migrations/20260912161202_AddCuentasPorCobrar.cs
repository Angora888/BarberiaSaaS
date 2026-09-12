using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BarberiaSaaS.Migrations
{
    /// <inheritdoc />
    public partial class AddCuentasPorCobrar : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CuentaPorCobrar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    SucursalId = table.Column<int>(type: "integer", nullable: false),
                    ClienteId = table.Column<int>(type: "integer", nullable: false),
                    CitaId = table.Column<int>(type: "integer", nullable: true),
                    VentaId = table.Column<int>(type: "integer", nullable: true),
                    MontoOriginal = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    SaldoPendiente = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    Estado = table.Column<string>(type: "text", nullable: false),
                    Notas = table.Column<string>(type: "text", nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CuentaPorCobrar", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CuentaPorCobrar_Citas_CitaId",
                        column: x => x.CitaId,
                        principalTable: "Citas",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CuentaPorCobrar_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CuentaPorCobrar_Sucursales_SucursalId",
                        column: x => x.SucursalId,
                        principalTable: "Sucursales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CuentaPorCobrar_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CuentaPorCobrar_Ventas_VentaId",
                        column: x => x.VentaId,
                        principalTable: "Ventas",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "AbonoCuentaPorCobrar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    CuentaPorCobrarId = table.Column<int>(type: "integer", nullable: false),
                    UsuarioId = table.Column<int>(type: "integer", nullable: true),
                    Monto = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    MetodoPago = table.Column<string>(type: "text", nullable: false),
                    FechaPago = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Notas = table.Column<string>(type: "text", nullable: true),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AbonoCuentaPorCobrar", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AbonoCuentaPorCobrar_CuentaPorCobrar_CuentaPorCobrarId",
                        column: x => x.CuentaPorCobrarId,
                        principalTable: "CuentaPorCobrar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AbonoCuentaPorCobrar_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AbonoCuentaPorCobrar_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AbonoCuentaPorCobrar_CuentaPorCobrarId_FechaPago",
                table: "AbonoCuentaPorCobrar",
                columns: new[] { "CuentaPorCobrarId", "FechaPago" });

            migrationBuilder.CreateIndex(
                name: "IX_AbonoCuentaPorCobrar_TenantId_FechaPago",
                table: "AbonoCuentaPorCobrar",
                columns: new[] { "TenantId", "FechaPago" });

            migrationBuilder.CreateIndex(
                name: "IX_AbonoCuentaPorCobrar_UsuarioId",
                table: "AbonoCuentaPorCobrar",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_CuentaPorCobrar_CitaId",
                table: "CuentaPorCobrar",
                column: "CitaId");

            migrationBuilder.CreateIndex(
                name: "IX_CuentaPorCobrar_ClienteId",
                table: "CuentaPorCobrar",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_CuentaPorCobrar_SucursalId",
                table: "CuentaPorCobrar",
                column: "SucursalId");

            migrationBuilder.CreateIndex(
                name: "IX_CuentaPorCobrar_TenantId_CitaId",
                table: "CuentaPorCobrar",
                columns: new[] { "TenantId", "CitaId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CuentaPorCobrar_TenantId_ClienteId",
                table: "CuentaPorCobrar",
                columns: new[] { "TenantId", "ClienteId" });

            migrationBuilder.CreateIndex(
                name: "IX_CuentaPorCobrar_TenantId_Estado",
                table: "CuentaPorCobrar",
                columns: new[] { "TenantId", "Estado" });

            migrationBuilder.CreateIndex(
                name: "IX_CuentaPorCobrar_VentaId",
                table: "CuentaPorCobrar",
                column: "VentaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AbonoCuentaPorCobrar");

            migrationBuilder.DropTable(
                name: "CuentaPorCobrar");
        }
    }
}
