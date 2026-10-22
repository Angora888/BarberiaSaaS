using BarberiaSaaS.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarberiaSaaS.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20261022120000_AddAnticipacionMinimaReserva")]
    public partial class AddAnticipacionMinimaReserva : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AnticipacionMinimaReservaHoras",
                table: "ConfiguracionesTenant",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnticipacionMinimaReservaHoras",
                table: "ConfiguracionesTenant");
        }
    }
}