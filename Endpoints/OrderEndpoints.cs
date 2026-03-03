using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using ScalaPOS.Features.Orders.Commands;
using System;

namespace ScalaPOS.Endpoints
{
    public static class OrderEndpoints
    {
        public static WebApplication MapOrderEndpoints(this WebApplication app)
        {
            var group = app.MapGroup("/api/v1/orders");

            group.MapPost("/", async (CreateOrderCommand cmd, IMediator m) =>
            {
                var result = await m.Send(cmd);
                return Results.Created($"/api/v1/orders/{result.Id}", result);
            });

            group.MapPost("/{id:int}/void", async (int id, VoidRequest req, IMediator m) =>
            {
                await m.Send(new VoidOrderCommand(id, req.Reason));
                return Results.NoContent();
            });

            group.MapPost("/{id:int}/refund", async (int id, RefundRequest req, IMediator m) =>
            {
                var result = await m.Send(new RefundOrderCommand(id, req.Reason));
                return Results.Ok(result);
            });

            group.MapPost("/{id:int}/payments", async (int id, AddOrderPaymentRequest req, IMediator m) =>
            {
                var cmd = new AddOrderPaymentCommand(id, req.Amount, req.PaymentMethod, req.Note);
                var result = await m.Send(cmd);
                if (!result.Success) return Results.BadRequest(result);
                return Results.Ok(result);
            });

            return app;
        }
    }

    public record VoidRequest(string Reason);
    public record RefundRequest(string Reason);
    public record AddOrderPaymentRequest(decimal Amount, string PaymentMethod, string Note);
}
