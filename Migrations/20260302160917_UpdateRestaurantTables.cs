using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ScalaPOS.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRestaurantTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Angle",
                table: "RestaurantTables",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Height",
                table: "RestaurantTables",
                type: "INTEGER",
                nullable: false,
                defaultValue: 80);

            migrationBuilder.AddColumn<bool>(
                name: "IsLocked",
                table: "RestaurantTables",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "Width",
                table: "RestaurantTables",
                type: "INTEGER",
                nullable: false,
                defaultValue: 80);

            migrationBuilder.UpdateData(
                table: "RestaurantTables",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Height", "IsLocked", "Width" },
                values: new object[] { 80, false, 80 });

            migrationBuilder.UpdateData(
                table: "RestaurantTables",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Height", "IsLocked", "Width" },
                values: new object[] { 80, false, 80 });

            migrationBuilder.UpdateData(
                table: "RestaurantTables",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Height", "IsLocked", "Width" },
                values: new object[] { 80, false, 80 });

            migrationBuilder.UpdateData(
                table: "RestaurantTables",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Height", "IsLocked", "Width" },
                values: new object[] { 80, false, 80 });

            migrationBuilder.UpdateData(
                table: "RestaurantTables",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Height", "IsLocked", "Width" },
                values: new object[] { 80, false, 80 });

            migrationBuilder.UpdateData(
                table: "RestaurantTables",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "Height", "IsLocked", "Width" },
                values: new object[] { 80, false, 80 });

            migrationBuilder.UpdateData(
                table: "RestaurantTables",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "Height", "IsLocked", "Width" },
                values: new object[] { 80, false, 80 });

            migrationBuilder.UpdateData(
                table: "RestaurantTables",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "Height", "IsLocked", "Width" },
                values: new object[] { 80, false, 80 });

            migrationBuilder.UpdateData(
                table: "RestaurantTables",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "Height", "IsLocked", "Width" },
                values: new object[] { 80, false, 80 });

            migrationBuilder.UpdateData(
                table: "RestaurantTables",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "Height", "IsLocked", "Width" },
                values: new object[] { 80, false, 80 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Angle",
                table: "RestaurantTables");

            migrationBuilder.DropColumn(
                name: "Height",
                table: "RestaurantTables");

            migrationBuilder.DropColumn(
                name: "IsLocked",
                table: "RestaurantTables");

            migrationBuilder.DropColumn(
                name: "Width",
                table: "RestaurantTables");
        }
    }
}
