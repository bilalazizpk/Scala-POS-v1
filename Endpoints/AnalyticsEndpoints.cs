using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using System;
using System.Linq;

namespace ScalaPOS.Endpoints
{
    public static class AnalyticsEndpoints
    {
        public static void MapAnalyticsEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/v1/analytics").WithTags("Analytics");

            // GET /api/v1/analytics/sales-by-day?days=30
            // Returns daily revenue/order count aggregates for the last N days
            group.MapGet("/sales-by-day", async (PosDbContext db, int days = 30) =>
            {
                var from = DateTime.UtcNow.Date.AddDays(-days + 1);
                var rows = await db.Orders
                    .Where(o => o.OrderDate >= from && o.OrderStatus == "Completed")
                    .GroupBy(o => o.OrderDate.Date)
                    .Select(g => new
                    {
                        date = g.Key.ToString("yyyy-MM-dd"),
                        revenue = g.Sum(o => o.TotalAmount),
                        orders = g.Count()
                    })
                    .OrderBy(r => r.date)
                    .ToListAsync();

                // Fill in zero-value days so the chart is continuous
                var allDays = Enumerable.Range(0, days)
                    .Select(i => from.AddDays(i).ToString("yyyy-MM-dd"))
                    .Select(d => rows.FirstOrDefault(r => r.date == d) ?? new { date = d, revenue = 0m, orders = 0 })
                    .ToList();

                return Results.Ok(allDays);
            }).WithName("GetSalesByDay");

            // GET /api/v1/analytics/top-products?limit=10&days=30
            group.MapGet("/top-products", async (PosDbContext db, int limit = 10, int days = 30) =>
            {
                var from = DateTime.UtcNow.Date.AddDays(-days);
                var top = await db.OrderItems
                    .Where(oi => oi.Order != null && oi.Order.OrderDate >= from && oi.Order.OrderStatus == "Completed")
                    .GroupBy(oi => new { oi.ProductId, oi.Product!.Name })
                    .Select(g => new
                    {
                        productId = g.Key.ProductId,
                        name = g.Key.Name,
                        quantitySold = g.Sum(x => x.Quantity),
                        revenue = g.Sum(x => x.TotalPrice)
                    })
                    .OrderByDescending(x => x.revenue)
                    .Take(limit)
                    .ToListAsync();

                return Results.Ok(top);
            }).WithName("GetTopProducts");

            // GET /api/v1/analytics/revenue-by-category?days=30
            group.MapGet("/revenue-by-category", async (PosDbContext db, int days = 30) =>
            {
                var from = DateTime.UtcNow.Date.AddDays(-days);
                var result = await db.OrderItems
                    .Where(oi => oi.Order != null && oi.Order.OrderDate >= from && oi.Order.OrderStatus == "Completed" && oi.Product != null)
                    .GroupBy(oi => oi.Product!.Category != null ? oi.Product!.Category.Name : "Unknown")
                    .Select(g => new
                    {
                        category = g.Key,
                        revenue = g.Sum(x => x.TotalPrice),
                        quantity = g.Sum(x => x.Quantity)
                    })
                    .OrderByDescending(x => x.revenue)
                    .ToListAsync();

                return Results.Ok(result);
            }).WithName("GetRevenueByCategory");

            // GET /api/v1/analytics/revenue-by-payment-method?days=30
            group.MapGet("/revenue-by-payment", async (PosDbContext db, int days = 30) =>
            {
                var from = DateTime.UtcNow.Date.AddDays(-days);
                var result = await db.Orders
                    .Where(o => o.OrderDate >= from && o.OrderStatus == "Completed")
                    .GroupBy(o => o.PaymentMethod ?? "Unknown")
                    .Select(g => new { method = g.Key, revenue = g.Sum(o => o.TotalAmount), count = g.Count() })
                    .OrderByDescending(x => x.revenue)
                    .ToListAsync();

                return Results.Ok(result);
            }).WithName("GetRevenueByPayment");

            // GET /api/v1/analytics/kpis?days=30
            // Returns headline KPI numbers
            group.MapGet("/kpis", async (PosDbContext db, int days = 30) =>
            {
                var from = DateTime.UtcNow.Date.AddDays(-days);
                var prev = from.AddDays(-days);

                var completed = db.Orders.Where(o => o.OrderStatus == "Completed");

                // Current period
                var curr = await completed.Where(o => o.OrderDate >= from)
                    .GroupBy(_ => 1)
                    .Select(g => new { revenue = g.Sum(o => o.TotalAmount), orders = g.Count(), avgOrder = g.Average(o => o.TotalAmount) })
                    .FirstOrDefaultAsync();

                // Previous period for delta %
                var prevData = await completed.Where(o => o.OrderDate >= prev && o.OrderDate < from)
                    .GroupBy(_ => 1)
                    .Select(g => new { revenue = g.Sum(o => o.TotalAmount), orders = g.Count() })
                    .FirstOrDefaultAsync();

                var invValue = await db.InventoryItems
                    .SumAsync(i => i.CurrentStock * (double)i.CostPrice);

                var lowStock = await db.InventoryItems.CountAsync(i => i.CurrentStock <= i.ReorderLevel);

                return Results.Ok(new
                {
                    revenue = curr?.revenue ?? 0,
                    orders = curr?.orders ?? 0,
                    avgOrderValue = curr?.avgOrder ?? 0,
                    revenueChange = prevData?.revenue > 0
                        ? Math.Round(((curr?.revenue ?? 0) - prevData.revenue) / prevData.revenue * 100, 1)
                        : 0m,
                    inventoryValue = Math.Round((decimal)invValue, 2),
                    lowStockItems = lowStock
                });
            }).WithName("GetKPIs");

            // GET /api/v1/analytics/orders-table?days=30&limit=100
            // Flat table of recent orders for grid export
            group.MapGet("/orders-table", async (PosDbContext db, int days = 30, int limit = 200) =>
            {
                var from = DateTime.UtcNow.Date.AddDays(-days);
                var rows = await db.Orders
                    .Include(o => o.Staff)
                    .Where(o => o.OrderDate >= from)
                    .OrderByDescending(o => o.OrderDate)
                    .Take(limit)
                    .Select(o => new
                    {
                        o.Id,
                        o.OrderNumber,
                        date = o.OrderDate.ToString("yyyy-MM-dd HH:mm"),
                        o.OrderType,
                        o.OrderStatus,
                        o.PaymentMethod,
                        staff = o.Staff != null ? o.Staff.FirstName + " " + o.Staff.LastName : "—",
                        subTotal = o.SubTotal,
                        tax = o.Tax,
                        discount = o.Discount,
                        total = o.TotalAmount
                    })
                    .ToListAsync();

                return Results.Ok(rows);
            }).WithName("GetOrdersTable");
        }
    }
}
