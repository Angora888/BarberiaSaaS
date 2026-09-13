using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BarberiaSaaS.Migrations
{
    /// <inheritdoc />
    public partial class AddLandingPublicaTenant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "LandingPublicaActiva",
                table: "Tenants",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SlugPublico",
                table: "Tenants",
                type: "character varying(180)",
                maxLength: 180,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_SlugPublico",
                table: "Tenants",
                column: "SlugPublico",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tenants_SlugPublico",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "LandingPublicaActiva",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "SlugPublico",
                table: "Tenants");
        }
    }
}
