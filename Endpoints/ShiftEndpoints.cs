using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System;

namespace ScalaPOS.Endpoints
{
    public static class ShiftEndpoints
    {
        public static void MapShiftEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/v1/shifts").WithTags("Shifts");

            group.MapGet("/", async (DateTime start, DateTime end, IMediator mediator) =>
            {
                var query = new Features.Shifts.GetShiftsQuery(start, end);
                var result = await mediator.Send(query);
                return Results.Ok(result);
            });

            group.MapPost("/", async (Features.Shifts.CreateShiftCommand command, IMediator mediator) =>
            {
                var id = await mediator.Send(command);
                return Results.Created($"/api/v1/shifts/{id}", id);
            });

            group.MapPut("/{id:int}", async (int id, Features.Shifts.UpdateShiftCommand command, IMediator mediator) =>
            {
                if (id != command.Id) return Results.BadRequest("ID mismatch");
                
                var success = await mediator.Send(command);
                return success ? Results.NoContent() : Results.NotFound();
            });

            group.MapDelete("/{id:int}", async (int id, IMediator mediator) =>
            {
                var success = await mediator.Send(new Features.Shifts.DeleteShiftCommand(id));
                return success ? Results.NoContent() : Results.NotFound();
            });
        }
    }
}
