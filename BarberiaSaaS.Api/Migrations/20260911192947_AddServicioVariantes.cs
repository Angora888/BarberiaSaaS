using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BarberiaSaaS.Migrations
{
    /// <inheritdoc />
    public partial class AddServicioVariantes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ServicioVarianteId",
                table: "Citas",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ServicioVariantes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TenantId = table.Column<int>(type: "integer", nullable: false),
                    ServicioId = table.Column<int>(type: "integer", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Precio = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    Orden = table.Column<int>(type: "integer", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServicioVariantes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServicioVariantes_Servicios_ServicioId",
                        column: x => x.ServicioId,
                        principalTable: "Servicios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ServicioVariantes_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Citas_ServicioVarianteId",
                table: "Citas",
                column: "ServicioVarianteId");

            migrationBuilder.CreateIndex(
                name: "IX_ServicioVariantes_ServicioId",
                table: "ServicioVariantes",
                column: "ServicioId");

            migrationBuilder.CreateIndex(
                name: "IX_ServicioVariantes_TenantId_ServicioId_Nombre",
                table: "ServicioVariantes",
                columns: new[] { "TenantId", "ServicioId", "Nombre" });

            migrationBuilder.AddForeignKey(
                name: "FK_Citas_ServicioVariantes_ServicioVarianteId",
                table: "Citas",
                column: "ServicioVarianteId",
                principalTable: "ServicioVariantes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Citas_ServicioVariantes_ServicioVarianteId",
                table: "Citas");

            migrationBuilder.DropTable(
                name: "ServicioVariantes");

            migrationBuilder.DropIndex(
                name: "IX_Citas_ServicioVarianteId",
                table: "Citas");

            migrationBuilder.DropColumn(
                name: "ServicioVarianteId",
                table: "Citas");
        }
    }
}
