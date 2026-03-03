using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using ScalaPOS.Features.Reservations.Commands;
using ScalaPOS.Features.Reservations.Queries;
using Microsoft.AspNetCore.SignalR;
using ScalaPOS.Hubs;

namespace ScalaPOS.Endpoints
{
    public static class ReservationEndpoints
    {
        public static void MapReservationEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/v1/reservations").WithTags("Reservations");

            group.MapGet("/", async (IMediator mediator) =>
            {
                var reservations = await mediator.Send(new GetReservationsQuery());
                return Results.Ok(reservations);
            });

            group.MapPost("/", async (CreateReservationCommand command, IMediator mediator, IHubContext<PosHub> hubContext) =>
            {
                var reservation = await mediator.Send(command);
                await hubContext.Clients.All.SendAsync("ReceiveReservationUpdate", reservation); // align with frontend convention
                return Results.Created($"/api/v1/reservations/{reservation.Id}", reservation);
            });

            group.MapPut("/{id}/status", async (int id, UpdateReservationStatusCommand command, IMediator mediator, IHubContext<PosHub> hubContext) =>
            {
                if (id != command.Id)
                {
                    return Results.BadRequest("ID mismatch");
                }

                var reservation = await mediator.Send(command);
                if (reservation == null) return Results.NotFound();

                await hubContext.Clients.All.SendAsync("ReceiveReservationUpdate", reservation);
                return Results.Ok(reservation);
            });
        }
    }
}
