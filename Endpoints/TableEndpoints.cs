using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Hubs;
using ScalaPOS.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ScalaPOS.Endpoints
{
    public static class TableEndpoints
    {
        public static void MapTableEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/v1/tables").WithTags("Tables");

            // GET /api/v1/tables
            group.MapGet("/", async (PosDbContext db) =>
            {
                var tables = await db.Tables
                    .OrderBy(t => t.Section)
                    .ThenBy(t => t.Name)
                    .ToListAsync();
                return Results.Ok(tables);
            }).WithName("GetAllTables");

            // GET /api/v1/tables/{id}
            group.MapGet("/{id:int}", async (int id, PosDbContext db) =>
            {
                var table = await db.Tables.FindAsync(id);
                return table is not null ? Results.Ok(table) : Results.NotFound();
            }).WithName("GetTableById");

            // PUT /api/v1/tables/{id}/status  (quick status update with SignalR broadcast)
            group.MapPut("/{id:int}/status", async (int id, UpdateTableStatusRequest req, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                var table = await db.Tables.FindAsync(id);
                if (table is null) return Results.NotFound();

                table.Status = req.Status;
                table.GuestCount = req.GuestCount ?? table.GuestCount;
                table.Notes = req.Notes ?? table.Notes;

                if (req.Status == "occupied" && table.SeatedAt is null)
                    table.SeatedAt = DateTime.UtcNow;
                else if (req.Status == "available")
                {
                    table.SeatedAt = null;
                    table.CurrentOrderId = null;
                    table.GuestCount = null;
                }

                await db.SaveChangesAsync();

                // Broadcast to all connected clients in the "tables" group
                await hub.Clients.Group("tables").SendAsync("TableUpdated", table);
                // Also broadcast to all for broad refresh
                await hub.Clients.All.SendAsync("TableUpdated", table);

                return Results.Ok(table);
            }).WithName("UpdateTableStatus");

            // PUT /api/v1/tables/{id}/position  (drag-and-drop editor saves new position)
            group.MapPut("/{id:int}/position", async (int id, UpdateTablePositionRequest req, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                var table = await db.Tables.FindAsync(id);
                if (table is null) return Results.NotFound();

                table.PositionX = req.X;
                table.PositionY = req.Y;
                if (req.Width.HasValue) table.Width = req.Width.Value;
                if (req.Height.HasValue) table.Height = req.Height.Value;
                if (req.Angle.HasValue) table.Angle = req.Angle.Value;

                await db.SaveChangesAsync();
                await hub.Clients.All.SendAsync("TableUpdated", table);

                return Results.Ok(table);
            }).WithName("UpdateTablePosition");

            // POST /api/v1/tables  (add a new table in editor mode)
            group.MapPost("/", async (CreateTableRequest req, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                var table = new RestaurantTable
                {
                    Name = req.Name,
                    Capacity = req.Capacity,
                    Shape = req.Shape ?? "square",
                    Section = req.Section ?? "Indoor",
                    Status = "available",
                    PositionX = req.X,
                    PositionY = req.Y,
                    Width = req.Width > 0 ? req.Width : 80,
                    Height = req.Height > 0 ? req.Height : 80,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                db.Tables.Add(table);
                await db.SaveChangesAsync();
                await hub.Clients.All.SendAsync("TableCreated", table);

                return Results.Created($"/api/v1/tables/{table.Id}", table);
            }).WithName("CreateTable");

            // DELETE /api/v1/tables/{id}
            group.MapDelete("/{id:int}", async (int id, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                var table = await db.Tables.FindAsync(id);
                if (table is null) return Results.NotFound();

                db.Tables.Remove(table);
                await db.SaveChangesAsync();
                await hub.Clients.All.SendAsync("TableDeleted", id);

                return Results.Ok(new { message = "Table deleted", id });
            }).WithName("DeleteTable");
        }
    }

    public record UpdateTableStatusRequest(string Status, int? GuestCount, string? Notes);
    public record UpdateTablePositionRequest(int X, int Y, int? Width, int? Height, int? Angle);
    public record CreateTableRequest(string Name, int Capacity, string? Shape, string? Section, int X, int Y, int Width, int Height);
}
