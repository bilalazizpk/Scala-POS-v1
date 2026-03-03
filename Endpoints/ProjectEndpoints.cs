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
    public static class ProjectEndpoints
    {
        public static void MapProjectEndpoints(this IEndpointRouteBuilder app)
        {
            // ── Projects ──────────────────────────────────────────────────────
            var projects = app.MapGroup("/api/v1/projects").WithTags("Projects");

            projects.MapGet("/", async (PosDbContext db) =>
                Results.Ok(await db.Projects.Include(p => p.Tasks).OrderByDescending(p => p.UpdatedAt).ToListAsync()))
                .WithName("GetProjects");

            projects.MapGet("/{id:int}", async (int id, PosDbContext db) =>
            {
                var p = await db.Projects.Include(x => x.Tasks).FirstOrDefaultAsync(x => x.Id == id);
                return p is not null ? Results.Ok(p) : Results.NotFound();
            }).WithName("GetProjectById");

            projects.MapPost("/", async (CreateProjectRequest req, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                var p = new Project
                {
                    Name = req.Name, Description = req.Description,
                    Priority = req.Priority ?? "medium", ClientName = req.ClientName,
                    ManagerName = req.ManagerName, StartDate = req.StartDate,
                    DueDate = req.DueDate, Budget = req.Budget,
                    Color = req.Color ?? "#6366f1",
                    CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
                };
                db.Projects.Add(p);
                await db.SaveChangesAsync();
                await hub.Clients.All.SendAsync("ProjectUpdated", p);
                return Results.Created($"/api/v1/projects/{p.Id}", p);
            }).WithName("CreateProject");

            projects.MapPut("/{id:int}/status", async (int id, UpdateProjectStatusRequest req, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                var p = await db.Projects.FindAsync(id);
                if (p is null) return Results.NotFound();
                p.Status = req.Status; p.UpdatedAt = DateTime.UtcNow;
                await db.SaveChangesAsync();
                await hub.Clients.All.SendAsync("ProjectUpdated", p);
                return Results.Ok(p);
            }).WithName("UpdateProjectStatus");

            projects.MapDelete("/{id:int}", async (int id, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                var p = await db.Projects.FindAsync(id);
                if (p is null) return Results.NotFound();
                db.Projects.Remove(p);
                await db.SaveChangesAsync();
                await hub.Clients.All.SendAsync("ProjectDeleted", id);
                return Results.Ok(new { message = "Deleted", id });
            }).WithName("DeleteProject");

            // ── Project Tasks ─────────────────────────────────────────────────
            projects.MapPost("/{projectId:int}/tasks", async (int projectId, CreateTaskRequest req, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                var task = new ProjectTask
                {
                    ProjectId = projectId, Title = req.Title, Description = req.Description,
                    Priority = req.Priority ?? "medium", AssignedToName = req.AssignedToName,
                    EstimatedHours = req.EstimatedHours, DueDate = req.DueDate,
                    Status = "todo", SortOrder = await db.ProjectTasks.CountAsync(t => t.ProjectId == projectId),
                    CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
                };
                db.ProjectTasks.Add(task);
                await db.SaveChangesAsync();
                await hub.Clients.All.SendAsync("TaskUpdated", new { projectId, task });
                return Results.Created($"/api/v1/projects/{projectId}/tasks/{task.Id}", task);
            }).WithName("CreateProjectTask");

            projects.MapPut("/{projectId:int}/tasks/{taskId:int}/status", async (int projectId, int taskId, UpdateProjectStatusRequest req, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                var task = await db.ProjectTasks.FirstOrDefaultAsync(t => t.Id == taskId && t.ProjectId == projectId);
                if (task is null) return Results.NotFound();
                task.Status = req.Status; task.UpdatedAt = DateTime.UtcNow;
                await db.SaveChangesAsync();
                await hub.Clients.All.SendAsync("TaskUpdated", new { projectId, task });
                return Results.Ok(task);
            }).WithName("UpdateTaskStatus");

            projects.MapDelete("/{projectId:int}/tasks/{taskId:int}", async (int projectId, int taskId, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                var task = await db.ProjectTasks.FirstOrDefaultAsync(t => t.Id == taskId && t.ProjectId == projectId);
                if (task is null) return Results.NotFound();
                db.ProjectTasks.Remove(task);
                await db.SaveChangesAsync();
                await hub.Clients.All.SendAsync("TaskUpdated", new { projectId, taskId, deleted = true });
                return Results.Ok(new { message = "Task deleted", taskId });
            }).WithName("DeleteProjectTask");
        }
    }

    public record CreateProjectRequest(string Name, string? Description, string? Priority, string? ClientName,
        string? ManagerName, DateTime? StartDate, DateTime? DueDate, decimal Budget, string? Color);

    public record CreateTaskRequest(string Title, string? Description, string? Priority, string? AssignedToName,
        int? EstimatedHours, DateTime? DueDate);

    public record UpdateProjectStatusRequest(string Status);
}
