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

namespace ScalaPOS.Endpoints
{
    public static class AppointmentEndpoints
    {
        public static void MapAppointmentEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/v1/appointments").WithTags("Appointments");

            // GET /api/v1/appointments?date=2024-01-15
            group.MapGet("/", async (string? date, PosDbContext db) =>
            {
                var query = db.Appointments
                    .Include(a => a.Table)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(date) && DateTime.TryParse(date, out var parsedDate))
                {
                    var start = parsedDate.Date;
                    var end = start.AddDays(1);
                    query = query.Where(a => a.StartTime >= start && a.StartTime < end);
                }

                var results = await query
                    .OrderBy(a => a.StartTime)
                    .ToListAsync();

                return Results.Ok(results);
            }).WithName("GetAppointments");

            // GET /api/v1/appointments/{id}
            group.MapGet("/{id:int}", async (int id, PosDbContext db) =>
            {
                var appt = await db.Appointments.Include(a => a.Table).FirstOrDefaultAsync(a => a.Id == id);
                return appt is not null ? Results.Ok(appt) : Results.NotFound();
            }).WithName("GetAppointmentById");

            // POST /api/v1/appointments
            group.MapPost("/", async (CreateAppointmentRequest req, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                var appt = new Appointment
                {
                    Title = req.Title,
                    CustomerName = req.CustomerName,
                    CustomerPhone = req.CustomerPhone,
                    CustomerEmail = req.CustomerEmail,
                    CustomerId = req.CustomerId,
                    TableId = req.TableId,
                    StaffId = req.StaffId,
                    StartTime = req.StartTime,
                    EndTime = req.EndTime,
                    PartySize = req.PartySize,
                    Notes = req.Notes,
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow
                };

                db.Appointments.Add(appt);
                await db.SaveChangesAsync();

                await hub.Clients.All.SendAsync("AppointmentUpdated", appt);

                return Results.Created($"/api/v1/appointments/{appt.Id}", appt);
            }).WithName("CreateAppointment");

            // PUT /api/v1/appointments/{id}/status
            group.MapPut("/{id:int}/status", async (int id, UpdateAppointmentStatusRequest req, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                var appt = await db.Appointments.FindAsync(id);
                if (appt is null) return Results.NotFound();

                appt.Status = req.Status;
                if (req.TableId.HasValue) appt.TableId = req.TableId;
                if (!string.IsNullOrWhiteSpace(req.Notes)) appt.Notes = req.Notes;

                await db.SaveChangesAsync();
                await hub.Clients.All.SendAsync("AppointmentUpdated", appt);

                return Results.Ok(appt);
            }).WithName("UpdateAppointmentStatus");

            // PUT /api/v1/appointments/{id}
            group.MapPut("/{id:int}", async (int id, CreateAppointmentRequest req, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                var appt = await db.Appointments.FindAsync(id);
                if (appt is null) return Results.NotFound();

                appt.Title = req.Title;
                appt.CustomerName = req.CustomerName;
                appt.CustomerPhone = req.CustomerPhone;
                appt.CustomerEmail = req.CustomerEmail;
                appt.TableId = req.TableId;
                appt.StaffId = req.StaffId;
                appt.StartTime = req.StartTime;
                appt.EndTime = req.EndTime;
                appt.PartySize = req.PartySize;
                appt.Notes = req.Notes;

                await db.SaveChangesAsync();
                await hub.Clients.All.SendAsync("AppointmentUpdated", appt);

                return Results.Ok(appt);
            }).WithName("UpdateAppointment");

            // DELETE /api/v1/appointments/{id}
            group.MapDelete("/{id:int}", async (int id, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                var appt = await db.Appointments.FindAsync(id);
                if (appt is null) return Results.NotFound();

                db.Appointments.Remove(appt);
                await db.SaveChangesAsync();
                await hub.Clients.All.SendAsync("AppointmentDeleted", id);

                return Results.Ok(new { message = "Appointment deleted", id });
            }).WithName("DeleteAppointment");
        }
    }

    public record CreateAppointmentRequest(
        string Title,
        string CustomerName,
        string? CustomerPhone,
        string? CustomerEmail,
        int? CustomerId,
        int? TableId,
        int? StaffId,
        DateTime StartTime,
        DateTime EndTime,
        int PartySize,
        string? Notes
    );

    public record UpdateAppointmentStatusRequest(string Status, int? TableId, string? Notes);
}
