using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ScalaPOS.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountingModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Accounts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Code = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    AccountType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    SubType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    IsSystemAccount = table.Column<bool>(type: "INTEGER", nullable: false),
                    AllowManualEntry = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accounts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "JournalEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Reference = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    TotalDebit = table.Column<decimal>(type: "TEXT", precision: 14, scale: 2, nullable: false),
                    TotalCredit = table.Column<decimal>(type: "TEXT", precision: 14, scale: 2, nullable: false),
                    IsPosted = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JournalEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "JournalLines",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    JournalEntryId = table.Column<int>(type: "INTEGER", nullable: false),
                    AccountId = table.Column<int>(type: "INTEGER", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Debit = table.Column<decimal>(type: "TEXT", precision: 14, scale: 2, nullable: false),
                    Credit = table.Column<decimal>(type: "TEXT", precision: 14, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JournalLines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JournalLines_Accounts_AccountId",
                        column: x => x.AccountId,
                        principalTable: "Accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_JournalLines_JournalEntries_JournalEntryId",
                        column: x => x.JournalEntryId,
                        principalTable: "JournalEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Accounts",
                columns: new[] { "Id", "AccountType", "AllowManualEntry", "Code", "CreatedAt", "IsSystemAccount", "Name", "SubType" },
                values: new object[,]
                {
                    { 1, "Asset", true, "1000", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Cash on Hand", "Current Asset" },
                    { 2, "Asset", false, "1010", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Cash in Bank", "Current Asset" },
                    { 3, "Asset", false, "1100", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Accounts Receivable", "Current Asset" },
                    { 4, "Asset", false, "1200", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Inventory", "Current Asset" },
                    { 5, "Liability", false, "2000", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Accounts Payable", "Current Liability" },
                    { 6, "Liability", false, "2100", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Sales Tax Payable", "Current Liability" },
                    { 7, "Equity", false, "3000", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Owner's Equity", "Equity" },
                    { 8, "Revenue", false, "4000", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Sales Revenue", "Operating Revenue" },
                    { 9, "Expense", false, "5000", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Cost of Goods Sold", "Cost of Sales" },
                    { 10, "Expense", true, "6000", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, "Wages Expense", "Operating Expense" },
                    { 11, "Expense", true, "6100", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "Rent Expense", "Operating Expense" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_JournalLines_AccountId",
                table: "JournalLines",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_JournalLines_JournalEntryId",
                table: "JournalLines",
                column: "JournalEntryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JournalLines");

            migrationBuilder.DropTable(
                name: "Accounts");

            migrationBuilder.DropTable(
                name: "JournalEntries");
        }
    }
}
