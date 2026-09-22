using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable
namespace BarberiaSaaS.Api.Migrations;

public partial class AddPushTokens : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "PushTokens",
            columns: table => new
            {
                Id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                TenantId = table.Column<int>(type: "integer", nullable: false),
                UsuarioId = table.Column<int>(type: "integer", nullable: false),
                Token = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                Plataforma = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                Activo = table.Column<bool>(type: "boolean", nullable: false),
                FechaActualizacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PushTokens", x => x.Id);
                table.ForeignKey("FK_PushTokens_Tenants_TenantId", x => x.TenantId, "Tenants", "Id", onDelete: ReferentialAction.Cascade);
                table.ForeignKey("FK_PushTokens_Usuarios_UsuarioId", x => x.UsuarioId, "Usuarios", "Id", onDelete: ReferentialAction.Cascade);
            });
        migrationBuilder.CreateIndex(name: "IX_PushTokens_TenantId_UsuarioId", table: "PushTokens", columns: new[] { "TenantId", "UsuarioId" });
        migrationBuilder.CreateIndex(name: "IX_PushTokens_Token", table: "PushTokens", column: "Token", unique: true);
        migrationBuilder.CreateIndex(name: "IX_PushTokens_UsuarioId", table: "PushTokens", column: "UsuarioId");
    }
    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable(name: "PushTokens");
}
