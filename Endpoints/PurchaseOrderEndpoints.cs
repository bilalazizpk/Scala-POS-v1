using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using ScalaPOS.Features.PurchaseOrders.Commands;
using ScalaPOS.Features.PurchaseOrders.Queries;
using System.Threading.Tasks;

namespace ScalaPOS.Endpoints
{
    public static class PurchaseOrderEndpoints
    {
        public static WebApplication MapPurchaseOrderEndpoints(this WebApplication app)
        {
            var group = app.MapGroup("/api/v1/purchase-orders");

            group.MapGet("/", async (IMediator m) =>
            {
                var result = await m.Send(new GetPurchaseOrdersQuery());
                return Results.Ok(result);
            });

            group.MapGet("/{id:int}", async (int id, IMediator m) =>
            {
                var result = await m.Send(new GetPurchaseOrderByIdQuery(id));
                return result != null ? Results.Ok(result) : Results.NotFound();
            });

            group.MapPost("/", async (CreatePurchaseOrderCommand cmd, IMediator m) =>
            {
                var result = await m.Send(cmd);
                return Results.Created($"/api/v1/purchase-orders/{result.Id}", result);
            });

            group.MapPost("/{id:int}/receive", async (int id, ReceivePurchaseOrderRequest req, IMediator m) =>
            {
                try {
                    var cmd = new ReceivePurchaseOrderCommand
                    {
                        PurchaseOrderId = id,
                        ReceivedLines = req.ReceivedLines
                    };
                    var result = await m.Send(cmd);
                    return Results.Ok(result);
                } catch {
                    return Results.BadRequest("Failed to receive purchase order. Check quantities.");
                }
            });

            return app;
        }
    }

    public class ReceivePurchaseOrderRequest
    {
        public System.Collections.Generic.List<ReceivePurchaseOrderLineDto> ReceivedLines { get; set; } = new();
    }
}
