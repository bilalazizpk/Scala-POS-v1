using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace ScalaPOS.Endpoints
{
    public static class SyncEndpoints
    {
        public static void MapSyncEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/v1/sync").WithTags("Offline Sync");

            // PULL: Get all server mutations since a given timestamp
            group.MapGet("/pull", async (PosDbContext db, string from, string deviceId) =>
            {
                if (!DateTime.TryParse(from, out var since))
                    return Results.BadRequest(new { error = "Invalid 'from' timestamp" });

                var logs = await db.SyncLogs
                    .Where(l => l.ServerTimestamp > since && l.DeviceId != deviceId)
                    .OrderBy(l => l.ServerTimestamp)
                    .ToListAsync();

                return Results.Ok(logs);
            }).WithName("PullSyncLogs");

            // PUSH: Client sends its local mutations
            group.MapPost("/push", async (List<SyncLog> pushLogs, PosDbContext db) =>
            {
                var responseIds = new List<long>();

                foreach (var log in pushLogs)
                {
                    // Basic idempotency check
                    var exists = await db.SyncLogs.AnyAsync(l => l.DeviceId == log.DeviceId && l.ClientSeq == log.ClientSeq);
                    if (exists) continue;

                    log.ServerTimestamp = DateTime.UtcNow;

                    // Execute actual persistence into target model via simple reflection or switch (Simplified)
                    try
                    {
                        ApplyPayload(log, db);
                        log.Status = "applied";
                    }
                    catch (Exception ex)
                    {
                        log.Status = "rejected";
                        log.ConflictNote = ex.Message;
                    }

                    db.SyncLogs.Add(log);
                    await db.SaveChangesAsync(); // Save one by one or batch, doing one by one here for safety
                    responseIds.Add(log.ClientSeq); // Ack client sequence
                }

                return Results.Ok(new { acknowledged = responseIds });
            }).WithName("PushSyncLogs");
            
            // ADMIN UI: Get all sync logs for the dashboard
            group.MapGet("/admin/logs", async (PosDbContext db, int limit = 100) =>
            {
                var logs = await db.SyncLogs
                    .OrderByDescending(l => l.ServerTimestamp)
                    .Take(limit)
                    .ToListAsync();
                return Results.Ok(logs);
            }).WithName("GetAdminSyncLogs");
        }

        private static void ApplyPayload(SyncLog log, PosDbContext db)
        {
            if (string.IsNullOrEmpty(log.Payload)) return;
            
            // This is a naive implementation
            // In a real production system, we would deserialize cleanly
            // and merge the fields (CRDT / LWW).
            using var doc = JsonDocument.Parse(log.Payload);

            if (log.EntityType == "Customer")
            {
                var custIdStr = log.EntityId;
                if (!int.TryParse(custIdStr, out int id)) return;

                if (log.Operation == "create")
                {
                    if (!db.Customers.Any(c => c.Id == id))
                    {
                        var c = new Customer();
                        c.Id = id; // Try forcing ID if offline created one, or auto-assign. 
                        // In real syncs UUIDs are better for PKs to avoid collision. We'll map payload props.
                        MergeJsonToObj(doc.RootElement, c);
                        db.Customers.Add(c);
                    }
                }
                else if (log.Operation == "update")
                {
                    var existing = db.Customers.Find(id);
                    if (existing != null) MergeJsonToObj(doc.RootElement, existing);
                }
                else if (log.Operation == "delete")
                {
                    var existing = db.Customers.Find(id);
                    if (existing != null) db.Customers.Remove(existing);
                }
            }
            // Add other entities as needed
        }

        private static void MergeJsonToObj(JsonElement el, object obj)
        {
            var props = obj.GetType().GetProperties();
            foreach (var prop in props)
            {
                if (prop.Name == "Id") continue; // usually skip pk
                if (el.TryGetProperty(prop.Name, out var pNode))
                {
                    if (prop.PropertyType == typeof(string)) prop.SetValue(obj, pNode.GetString());
                    if (prop.PropertyType == typeof(int) && pNode.TryGetInt32(out int iv)) prop.SetValue(obj, iv);
                    if (prop.PropertyType == typeof(decimal) && pNode.TryGetDecimal(out decimal dv)) prop.SetValue(obj, dv);
                    if (prop.PropertyType == typeof(bool)) prop.SetValue(obj, pNode.GetBoolean());
                }
            }
        }
    }
}
