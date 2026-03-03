using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using ScalaPOS.Features.Waitlist.Commands;
using ScalaPOS.Features.Waitlist.Queries;
using Microsoft.AspNetCore.SignalR;
using ScalaPOS.Hubs;

namespace ScalaPOS.Endpoints
{
    public static class WaitlistEndpoints
    {
        public static void MapWaitlistEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/v1/waitlist").WithTags("Waitlist");

            group.MapGet("/", async (IMediator mediator) =>
            {
                var waitlist = await mediator.Send(new GetWaitlistQuery());
                return Results.Ok(waitlist);
            });

            group.MapPost("/", async (JoinWaitlistCommand command, IMediator mediator, IHubContext<PosHub> hubContext) =>
            {
                var entry = await mediator.Send(command);
                await hubContext.Clients.All.SendAsync("ReceiveWaitlistUpdate", entry); // real-time sync for dispatch
                return Results.Created($"/api/v1/waitlist/{entry.Id}", entry);
            });

            group.MapPut("/{id}/status", async (int id, UpdateWaitlistStatusCommand command, IMediator mediator, IHubContext<PosHub> hubContext) =>
            {
                if (id != command.Id)
                {
                    return Results.BadRequest("ID mismatch");
                }

                var entry = await mediator.Send(command);
                if (entry == null) return Results.NotFound();

                await hubContext.Clients.All.SendAsync("ReceiveWaitlistUpdate", entry);
                return Results.Ok(entry);
            });
        }
    }
}
