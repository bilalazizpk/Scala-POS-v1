using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Hubs;
using System.Linq;
using System.Threading.Tasks;

namespace ScalaPOS.Endpoints
{
    public static class KitchenEndpoints
    {
        public static WebApplication MapKitchenEndpoints(this WebApplication app)
        {
            var group = app.MapGroup("/api/v1/kitchen");

            // Fetch active orders containing items for a specific KDS station
            group.MapGet("/orders/{station}", async (string station, PosDbContext db) =>
            {
                var orders = await db.Orders
                    .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                    .ThenInclude(p => p.Category)
                    .Where(o => o.OrderStatus == "Pending" || o.OrderStatus == "Preparing")
                    .Where(o => o.OrderItems.Any(oi => 
                        (oi.Status == "Pending" || oi.Status == "Preparing") && 
                        oi.Product!.Category!.TargetKdsStation.ToLower() == station.ToLower()))
                    .OrderBy(o => o.OrderDate)
                    .ToListAsync();

                return Results.Ok(orders);
            });

            // Update status of an OrderItem
            group.MapPut("/items/{itemId:int}/status", async (int itemId, UpdateStatusRequest req, PosDbContext db, IHubContext<KitchenHub> hub) =>
            {
                var item = await db.OrderItems
                    .Include(oi => oi.Order)
                    .Include(oi => oi.Product)
                    .ThenInclude(p => p.Category)
                    .FirstOrDefaultAsync(oi => oi.Id == itemId);

                if (item == null) return Results.NotFound();

                item.Status = req.Status; // e.g., Preparing, Ready
                await db.SaveChangesAsync();

                var stationName = item.Product?.Category?.TargetKdsStation?.ToLower() ?? "kitchen";

                // Broadcast update to the relevant station group
                await hub.Clients.Group($"kds_{stationName}").SendAsync("ItemStatusUpdated", item.OrderId, itemId, req.Status);

                // Auto-update order status if all items are ready
                var order = item.Order;
                if (order != null)
                {
                    bool allReady = await db.OrderItems.Where(oi => oi.OrderId == order.Id).AllAsync(oi => oi.Status == "Ready");
                    if (allReady && order.OrderStatus != "Completed")
                    {
                        order.OrderStatus = "Ready";
                        await db.SaveChangesAsync();
                        await hub.Clients.All.SendAsync("OrderReady", order.Id);
                    }
                }

                return Results.Ok();
            });

            return app;
        }
    }

    public record UpdateStatusRequest(string Status);
}
