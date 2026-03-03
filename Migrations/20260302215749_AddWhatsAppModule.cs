using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ScalaPOS.Migrations
{
    /// <inheritdoc />
    public partial class AddWhatsAppModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WhatsAppMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MetaMessageId = table.Column<string>(type: "TEXT", maxLength: 150, nullable: true),
                    CustomerPhone = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    CustomerName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Direction = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Body = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "received"),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    MediaUrl = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WhatsAppMessages", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WhatsAppMessages_CustomerPhone",
                table: "WhatsAppMessages",
                column: "CustomerPhone");

            migrationBuilder.CreateIndex(
                name: "IX_WhatsAppMessages_MetaMessageId",
                table: "WhatsAppMessages",
                column: "MetaMessageId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WhatsAppMessages");
        }
    }
}
