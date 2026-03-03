using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;

namespace ScalaPOS.Endpoints
{
    public static class InventoryEndpoints
    {
        public static void MapInventoryEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/v1/inventory").WithTags("Inventory");

            group.MapGet("/", async (PosDbContext db) =>
            {
                var items = await db.InventoryItems
                    .Include(i => i.Product)
                    .ToListAsync();
                
                return Results.Ok(items);
            }).WithName("GetInventoryItems");
        }
    }
}
