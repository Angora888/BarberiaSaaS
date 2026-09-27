using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarberiaSaaS.Api.Migrations
{
    public partial class AddProfessionalUserAccess : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProfesionalId",
                table: "Usuarios",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "InvitacionesUsuario",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    TokenHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaExpiracion = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaUso = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvitacionesUsuario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InvitacionesUsuario_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_ProfesionalId",
                table: "Usuarios",
                column: "ProfesionalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InvitacionesUsuario_TokenHash",
                table: "InvitacionesUsuario",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InvitacionesUsuario_UsuarioId_FechaExpiracion",
                table: "InvitacionesUsuario",
                columns: new[] { "UsuarioId", "FechaExpiracion" });

            migrationBuilder.AddForeignKey(
                name: "FK_Usuarios_Profesionales_ProfesionalId",
                table: "Usuarios",
                column: "ProfesionalId",
                principalTable: "Profesionales",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Usuarios_Profesionales_ProfesionalId",
                table: "Usuarios");

            migrationBuilder.DropTable(
                name: "InvitacionesUsuario");

            migrationBuilder.DropIndex(
                name: "IX_Usuarios_ProfesionalId",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "ProfesionalId",
                table: "Usuarios");
        }
    }
}
