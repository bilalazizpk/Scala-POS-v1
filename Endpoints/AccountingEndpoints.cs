using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System.Linq;
using System;
using System.Threading.Tasks;

namespace ScalaPOS.Endpoints
{
    public static class AccountingEndpoints
    {
        public static void MapAccountingEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/v1/accounting").WithTags("Accounting");

            // GET /api/v1/accounting/accounts
            group.MapGet("/accounts", async (PosDbContext context) =>
            {
                var accounts = await context.Accounts
                    .OrderBy(a => a.Code)
                    .Select(a => new
                    {
                        a.Id,
                        a.Code,
                        a.Name,
                        a.AccountType,
                        a.SubType,
                        a.IsSystemAccount,
                        // Calculate current balance (this is a simplified live calculation)
                        Balance = a.JournalLines.Sum(l => l.Debit - l.Credit)
                    })
                    .ToListAsync();

                // By convention, Liability/Equity/Revenue have normal Credit balances 
                // Assets/Expenses have normal Debit balances. 
                // Here Balance = Debit - Credit. 
                // So if it's negative, it means it's a credit balance.

                return Results.Ok(accounts);
            })
            .WithName("GetChartOfAccounts");

            // GET /api/v1/accounting/ledger
            group.MapGet("/ledger", async (PosDbContext context) =>
            {
                var entries = await context.JournalEntries
                    .Include(j => j.Lines)
                        .ThenInclude(l => l.Account)
                    .OrderByDescending(j => j.Date)
                    .Take(100)
                    .Select(j => new
                    {
                        j.Id,
                        j.Date,
                        j.Reference,
                        j.Description,
                        j.TotalDebit,
                        j.TotalCredit,
                        Lines = j.Lines.Select(l => new
                        {
                            l.Account.Code,
                            l.Account.Name,
                            l.Description,
                            l.Debit,
                            l.Credit
                        })
                    })
                    .ToListAsync();

                return Results.Ok(entries);
            })
            .WithName("GetGeneralLedger");

            // GET /api/v1/accounting/pnl
            group.MapGet("/pnl", async (PosDbContext context) =>
            {
                var lines = await context.JournalLines
                    .Include(l => l.Account)
                    .Where(l => l.Account.AccountType == "Revenue" || l.Account.AccountType == "Expense")
                    .ToListAsync();

                var revenue = lines
                    .Where(l => l.Account.AccountType == "Revenue")
                    .Sum(l => l.Credit - l.Debit);

                var expenses = lines
                    .Where(l => l.Account.AccountType == "Expense")
                    .Sum(l => l.Debit - l.Credit);

                return Results.Ok(new
                {
                    TotalRevenue = revenue,
                    TotalExpenses = expenses,
                    NetProfit = revenue - expenses
                });
            })
            .WithName("GetProfitAndLoss");
        }
    }
}
