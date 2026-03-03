using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using System;
using System.Linq;

namespace ScalaPOS.Endpoints
{
    public static class AuditEndpoints
    {
        public static void MapAuditEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/v1/audit").WithTags("Audit");

            // GET /api/v1/audit?page=1&pageSize=50&category=order&from=2024-01-01&to=2024-01-31
            group.MapGet("/", async (
                PosDbContext db,
                int page = 1,
                int pageSize = 50,
                string? category = null,
                string? action = null,
                string? entityType = null,
                string? result = null,
                string? from = null,
                string? to = null) =>
            {
                var query = db.AuditLogs.AsQueryable();

                if (!string.IsNullOrWhiteSpace(category))
                    query = query.Where(l => l.Category == category);
                if (!string.IsNullOrWhiteSpace(action))
                    query = query.Where(l => l.Action.Contains(action));
                if (!string.IsNullOrWhiteSpace(entityType))
                    query = query.Where(l => l.EntityType == entityType);
                if (!string.IsNullOrWhiteSpace(result))
                    query = query.Where(l => l.Result == result);
                if (!string.IsNullOrWhiteSpace(from) && DateTime.TryParse(from, out var fromDate))
                    query = query.Where(l => l.Timestamp >= fromDate);
                if (!string.IsNullOrWhiteSpace(to) && DateTime.TryParse(to, out var toDate))
                    query = query.Where(l => l.Timestamp <= toDate.AddDays(1));

                var total = await query.CountAsync();
                var logs = await query
                    .OrderByDescending(l => l.Timestamp)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return Results.Ok(new { total, page, pageSize, logs });
            }).WithName("GetAuditLogs");

            // GET /api/v1/audit/summary — counts per category for the dashboard widget
            group.MapGet("/summary", async (PosDbContext db) =>
            {
                var since = DateTime.UtcNow.AddDays(-7);
                var logs = await db.AuditLogs
                    .Where(l => l.Timestamp >= since)
                    .ToListAsync();

                var summary = new
                {
                    Total7Days = logs.Count,
                    ByCategory = logs
                        .GroupBy(l => l.Category ?? "other")
                        .ToDictionary(g => g.Key, g => g.Count()),
                    Failures = logs.Count(l => l.Result == "failure"),
                    LatestEvents = logs.OrderByDescending(l => l.Timestamp).Take(5)
                };

                return Results.Ok(summary);
            }).WithName("GetAuditSummary");
        }
    }
}
