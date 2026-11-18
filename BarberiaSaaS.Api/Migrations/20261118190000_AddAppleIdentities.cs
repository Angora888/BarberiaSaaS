using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BarberiaSaaS.Api.Migrations;

// Requiere aplicar la migración antes de usar /api/auth/apple/*.
public partial class AddAppleIdentities : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "AppleIdentities",
            columns: table => new
            {
                Id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                UsuarioId = table.Column<int>(type: "integer", nullable: false),
                Subject = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                FechaVinculacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AppleIdentities", x => x.Id);
                table.ForeignKey("FK_AppleIdentities_Usuarios_UsuarioId", x => x.UsuarioId,
                    "Usuarios", "Id", onDelete: ReferentialAction.Cascade);
            });
        migrationBuilder.CreateIndex("IX_AppleIdentities_Subject", "AppleIdentities", "Subject", unique: true);
        migrationBuilder.CreateIndex("IX_AppleIdentities_UsuarioId", "AppleIdentities", "UsuarioId", unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
        => migrationBuilder.DropTable("AppleIdentities");
}
