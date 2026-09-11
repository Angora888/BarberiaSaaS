using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarberiaSaaS.Migrations
{
    /// <inheritdoc />
    public partial class MoveDuracionFromServicioToCita : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DuracionMinutos",
                table: "Servicios");

            migrationBuilder.AddColumn<int>(
                name: "DuracionMinutos",
                table: "Citas",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DuracionMinutos",
                table: "Citas");

            migrationBuilder.AddColumn<int>(
                name: "DuracionMinutos",
                table: "Servicios",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
