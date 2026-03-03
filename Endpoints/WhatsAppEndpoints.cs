using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using ScalaPOS.Data;
using ScalaPOS.Models;
using ScalaPOS.Hubs;
using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace ScalaPOS.Endpoints
{
    public static class WhatsAppEndpoints
    {
        // Simple token for Meta webhook verification (would be in config in prod)
        private const string VERIFY_TOKEN = "scala_pos_wa_token_123";

        public static void MapWhatsAppEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/api/v1/whatsapp").WithTags("WhatsApp");

            // 1. Webhook Verification (Meta requires this when setting up the webhook)
            group.MapGet("/webhook", (HttpRequest request) =>
            {
                var mode = request.Query["hub.mode"];
                var token = request.Query["hub.verify_token"];
                var challenge = request.Query["hub.challenge"];

                if (mode == "subscribe" && token == VERIFY_TOKEN)
                {
                    return Results.Content(challenge, "text/plain");
                }
                return Results.StatusCode(403);
            });

            // 2. Incoming Webhook (Receives messages and statuses from Meta)
            group.MapPost("/webhook", async (JsonDocument payload, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                try
                {
                    var root = payload.RootElement;
                    if (root.GetProperty("object").GetString() != "whatsapp_business_account")
                        return Results.NotFound();

                    foreach (var entry in root.GetProperty("entry").EnumerateArray())
                    {
                        foreach (var change in entry.GetProperty("changes").EnumerateArray())
                        {
                            var value = change.GetProperty("value");

                            // Handle Status Updates (sent, delivered, read)
                            if (value.TryGetProperty("statuses", out var statuses))
                            {
                                foreach (var status in statuses.EnumerateArray())
                                {
                                    var msgId = status.GetProperty("id").GetString();
                                    var statusTxt = status.GetProperty("status").GetString();
                                    
                                    var dbMsg = await db.WhatsAppMessages.FirstOrDefaultAsync(m => m.MetaMessageId == msgId);
                                    if (dbMsg != null)
                                    {
                                        dbMsg.Status = statusTxt;
                                        await db.SaveChangesAsync();
                                        await hub.Clients.All.SendAsync("WhatsAppStatusUpdated", dbMsg);
                                    }
                                }
                            }

                            // Handle Incoming Messages
                            if (value.TryGetProperty("messages", out var messages))
                            {
                                // Extract customer profile name if available
                                string contactName = "Unknown";
                                if (value.TryGetProperty("contacts", out var contacts) && contacts.GetArrayLength() > 0)
                                {
                                    var contact = contacts[0];
                                    if (contact.TryGetProperty("profile", out var profile) && profile.TryGetProperty("name", out var nameProp))
                                    {
                                        contactName = nameProp.GetString() ?? "Unknown";
                                    }
                                }

                                foreach (var msg in messages.EnumerateArray())
                                {
                                    var fromPhone = msg.GetProperty("from").GetString();
                                    var msgId = msg.GetProperty("id").GetString();
                                    var timestampStr = msg.GetProperty("timestamp").GetString();
                                    var dt = DateTimeOffset.FromUnixTimeSeconds(long.Parse(timestampStr)).UtcDateTime;

                                    string body = "";
                                    string type = msg.GetProperty("type").GetString();

                                    if (type == "text")
                                    {
                                        body = msg.GetProperty("text").GetProperty("body").GetString();
                                    }
                                    else if (type == "image")
                                    {
                                        body = "📷 [Image Received]";
                                        // In reality, we'd fetch the media URL using the media ID
                                    }

                                    // Check if already processed (webhooks can be delivered multiple times)
                                    if (await db.WhatsAppMessages.AnyAsync(m => m.MetaMessageId == msgId))
                                        continue;

                                    var newMsg = new WhatsAppMessage
                                    {
                                        MetaMessageId = msgId,
                                        CustomerPhone = fromPhone,
                                        CustomerName = contactName,
                                        Direction = "inbound",
                                        Body = body,
                                        Status = "received",
                                        Timestamp = dt
                                    };

                                    db.WhatsAppMessages.Add(newMsg);
                                    await db.SaveChangesAsync();

                                    // Broadcast to UI instantly
                                    await hub.Clients.All.SendAsync("WhatsAppMessageReceived", newMsg);
                                }
                            }
                        }
                    }
                    return Results.Ok();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Webhook Error: {ex.Message}");
                    return Results.StatusCode(500);
                }
            }).WithName("WhatsAppWebhook");

            // 3. API: Get active conversations (Grouped by Phone)
            group.MapGet("/conversations", async (PosDbContext db) =>
            {
                // Get latest message per phone
                var convos = await db.WhatsAppMessages
                    .GroupBy(m => m.CustomerPhone)
                    .Select(g => g.OrderByDescending(m => m.Timestamp).FirstOrDefault())
                    .OrderByDescending(m => m.Timestamp)
                    .ToListAsync();

                return Results.Ok(convos);
            }).WithName("GetWhatsAppConversations");

            // 4. API: Get chat history for a specific phone number
            group.MapGet("/chat/{phone}", async (string phone, PosDbContext db) =>
            {
                var history = await db.WhatsAppMessages
                    .Where(m => m.CustomerPhone == phone)
                    .OrderBy(m => m.Timestamp)
                    .ToListAsync();
                    
                return Results.Ok(history);
            }).WithName("GetWhatsAppHistory");

            // 5. API: Send Outbound Message (from POS Staff to Customer)
            group.MapPost("/send", async (SendWaRequest req, PosDbContext db, IHubContext<PosHub> hub) =>
            {
                // In a real app, this makes an HTTP POST to "https://graph.facebook.com/v17.0/{PHONE_NUMBER_ID}/messages"
                // with a Bearer token. We simulate success here.
                
                var mockMetaId = "wmid_" + Guid.NewGuid().ToString("N").Substring(0, 16);

                var outMsg = new WhatsAppMessage
                {
                    MetaMessageId = mockMetaId,
                    CustomerPhone = req.Phone,
                    CustomerName = req.Name ?? "Customer",
                    Direction = "outbound",
                    Body = req.Message,
                    Status = "sent",
                    Timestamp = DateTime.UtcNow
                };

                db.WhatsAppMessages.Add(outMsg);
                await db.SaveChangesAsync();

                // Broadcast
                await hub.Clients.All.SendAsync("WhatsAppMessageSent", outMsg);

                // Simulate Meta delivery/read receipts after a short delay (for demo coolness)
                _ = Task.Run(async () =>
                {
                    await Task.Delay(2000);
                    using var scope = db.Database.GetDbConnection().CreateCommand();
                    // Just broadcast the update directly for the demo
                    outMsg.Status = "delivered";
                    await hub.Clients.All.SendAsync("WhatsAppStatusUpdated", outMsg);
                    
                    await Task.Delay(3000);
                    outMsg.Status = "read";
                    await hub.Clients.All.SendAsync("WhatsAppStatusUpdated", outMsg);
                    
                    // Update DB behind the scenes
                    // (Omitted strict scope building here to keep it concise, just trusting the instance for demo)
                });

                return Results.Ok(outMsg);
            }).WithName("SendWhatsAppMessage");
        }
    }

    public class SendWaRequest
    {
        public string Phone { get; set; }
        public string Name { get; set; }
        public string Message { get; set; }
    }
}
