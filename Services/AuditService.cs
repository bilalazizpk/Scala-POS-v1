using System;
using System.Threading.Tasks;
using ScalaPOS.Data;
using ScalaPOS.Models;

namespace ScalaPOS.Services
{
    /// <summary>
    /// Lightweight service for writing immutable audit events.
    /// Inject wherever business-critical actions are performed.
    /// </summary>
    public class AuditService
    {
        private readonly PosDbContext _db;

        public AuditService(PosDbContext db)
        {
            _db = db;
        }

        public async Task LogAsync(
            string action,
            string category,
            string entityType = null,
            string entityId = null,
            string description = null,
            string userId = null,
            string userName = null,
            string ipAddress = null,
            string oldValue = null,
            string newValue = null,
            string result = "success")
        {
            var log = new AuditLog
            {
                Timestamp = DateTime.UtcNow,
                Action = action,
                Category = category,
                EntityType = entityType,
                EntityId = entityId?.ToString(),
                Description = description,
                UserId = userId ?? "system",
                UserName = userName ?? "System",
                IPAddress = ipAddress,
                OldValue = oldValue,
                NewValue = newValue,
                Result = result
            };

            _db.AuditLogs.Add(log);
            await _db.SaveChangesAsync();
        }

        // Convenience shortcuts
        public Task LogOrderAsync(string action, string orderId, string description, string userId = null)
            => LogAsync(action, "order", "Order", orderId, description, userId);

        public Task LogPaymentAsync(string action, string orderId, string description, string userId = null)
            => LogAsync(action, "payment", "OrderPayment", orderId, description, userId);

        public Task LogAuthAsync(string action, string userId, string userName, string description, string result = "success")
            => LogAsync(action, "auth", "Staff", userId, description, userId, userName, result: result);

        public Task LogInventoryAsync(string action, string itemId, string description)
            => LogAsync(action, "inventory", "InventoryItem", itemId, description);

        public Task LogSettingsAsync(string action, string description, string userId = null)
            => LogAsync(action, "settings", "Settings", null, description, userId);
    }
}
