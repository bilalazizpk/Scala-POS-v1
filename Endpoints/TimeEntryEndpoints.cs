using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using ScalaPOS.Features.TimeEntries;
using System;

namespace ScalaPOS.Endpoints
{
    public static class TimeEntryEndpoints
    {
        public static void MapTimeEntryEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/v1/time-entries").WithTags("TimeEntries");

            group.MapGet("/", async (
                int? staffId, 
                DateTime? startDate, 
                DateTime? endDate, 
                IMediator mediator) =>
            {
                var result = await mediator.Send(new GetTimeEntriesQuery(staffId, startDate, endDate));
                return Results.Ok(result);
            });

            group.MapPost("/clock-in", async (ClockInCommand command, IMediator mediator) =>
            {
                try
                {
                    var id = await mediator.Send(command);
                    return Results.Created($"/api/v1/time-entries/{id}", new { Id = id });
                }
                catch (Exception ex)
                {
                    return Results.BadRequest(ex.Message);
                }
            });

            group.MapPost("/clock-out", async (ClockOutCommand command, IMediator mediator) =>
            {
                var success = await mediator.Send(command);
                return success ? Results.Ok() : Results.NotFound("No active clock-in found for this staff member.");
            });
            
            // NOTE: A full enterprise app would also need PUT /:id for managers to edit past entries, 
            // but for this implementation we will start with just the clock in/out mechanisms.
        }
    }
}
