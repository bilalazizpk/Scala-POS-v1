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
    public static class HelpdeskEndpoints
    {
        public static void MapHelpdeskEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/v1/tickets").WithTags("Helpdesk");

            // GET /api/v1/tickets  (optionally filter by status, priority, category)
            group.MapGet("/", async (PosDbContext db, string? status, string? priority, string? category) =>
            {
                var q = db.Tickets.Include(t => t.Comments).AsQueryable();
                if (!string.IsNullOrWhiteSpace(status))   q = q.Where(t => t.Status == status);
                if (!string.IsNullOrWhiteSpace(priority)) q = q.Where(t => t.Priority == priority);
                if (!string.IsNullOrWhiteSpace(category)) q = q.Where(t => t.Category == category);
                var tickets = await q.OrderByDescending(t => t.UpdatedAt).ToListAsync();
                return Results.Ok(tickets);
            }).WithName("GetTickets");

            // GET /api/v1/tickets/{id}
            group.MapGet("/{id:int}", async (int id, PosDbContext db) =>
            {
                var t = await db.Tickets.Include(t => t.Comments).FirstOrDefaultAsync(t => t.Id == id);
                return t is not null ? Results.Ok(t) : Results.NotFound();
            }).WithName("GetTicketById");

            // POST /api/v1/tickets
            group.MapPost("/", async (CreateTicketRequest req, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                // Auto-number
                var count = await db.Tickets.CountAsync();
                var ticket = new Ticket
                {
                    TicketNumber = $"TKT-{(count + 1):D4}",
                    Title = req.Title,
                    Description = req.Description,
                    Priority = req.Priority ?? "medium",
                    Category = req.Category ?? "other",
                    ReportedBy = req.ReportedBy,
                    ReportedById = req.ReportedById,
                    AssignedTo = req.AssignedTo,
                    AssignedToId = req.AssignedToId,
                    DueDate = req.DueDate,
                    Status = "open",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                db.Tickets.Add(ticket);
                await db.SaveChangesAsync();
                await hub.Clients.All.SendAsync("TicketCreated", ticket);
                return Results.Created($"/api/v1/tickets/{ticket.Id}", ticket);
            }).WithName("CreateTicket");

            // PUT /api/v1/tickets/{id}/status
            group.MapPut("/{id:int}/status", async (int id, UpdateTicketStatusRequest req, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                var ticket = await db.Tickets.FindAsync(id);
                if (ticket is null) return Results.NotFound();
                ticket.Status = req.Status;
                ticket.UpdatedAt = DateTime.UtcNow;
                if (req.Status == "resolved")
                {
                    ticket.ResolvedAt = DateTime.UtcNow;
                    ticket.Resolution = req.Resolution;
                }
                if (!string.IsNullOrWhiteSpace(req.AssignedTo))
                {
                    ticket.AssignedTo = req.AssignedTo;
                    ticket.AssignedToId = req.AssignedToId;
                }
                await db.SaveChangesAsync();
                await hub.Clients.All.SendAsync("TicketUpdated", ticket);
                return Results.Ok(ticket);
            }).WithName("UpdateTicketStatus");

            // POST /api/v1/tickets/{id}/comments
            group.MapPost("/{id:int}/comments", async (int id, AddCommentRequest req, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                var ticket = await db.Tickets.FindAsync(id);
                if (ticket is null) return Results.NotFound();
                var comment = new TicketComment
                {
                    TicketId = id,
                    Body = req.Body,
                    AuthorName = req.AuthorName,
                    AuthorId = req.AuthorId,
                    IsInternal = req.IsInternal,
                    CreatedAt = DateTime.UtcNow
                };
                db.TicketComments.Add(comment);
                ticket.UpdatedAt = DateTime.UtcNow;
                await db.SaveChangesAsync();
                await hub.Clients.All.SendAsync("TicketUpdated", ticket);
                return Results.Created($"/api/v1/tickets/{id}/comments/{comment.Id}", comment);
            }).WithName("AddTicketComment");

            // DELETE /api/v1/tickets/{id}
            group.MapDelete("/{id:int}", async (int id, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                var ticket = await db.Tickets.FindAsync(id);
                if (ticket is null) return Results.NotFound();
                db.Tickets.Remove(ticket);
                await db.SaveChangesAsync();
                await hub.Clients.All.SendAsync("TicketDeleted", id);
                return Results.Ok(new { message = "Ticket deleted", id });
            }).WithName("DeleteTicket");
        }
    }

    public record CreateTicketRequest(
        string Title, string? Description, string? Priority, string? Category,
        string? ReportedBy, string? ReportedById, string? AssignedTo, string? AssignedToId,
        DateTime? DueDate);

    public record UpdateTicketStatusRequest(string Status, string? Resolution, string? AssignedTo, string? AssignedToId);

    public record AddCommentRequest(string Body, string? AuthorName, string? AuthorId, bool IsInternal = false);
}
