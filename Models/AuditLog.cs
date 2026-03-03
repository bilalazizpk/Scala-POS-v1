using System;

namespace ScalaPOS.Models
{
    /// <summary>Immutable record of any significant business action in the system.</summary>
    public class AuditLog
    {
        public long Id { get; set; }                  // Long for high-volume inserts
        public DateTime Timestamp { get; set; }       // UTC
        public string UserId { get; set; }            // Employee/staff ID or "system"
        public string UserName { get; set; }          // Display name for quick reading
        public string Action { get; set; }            // e.g. "ORDER_CREATED", "LOGIN_FAILED"
        public string EntityType { get; set; }        // e.g. "Order", "Product", "Shift"
        public string EntityId { get; set; }          // ID of affected entity
        public string Description { get; set; }       // Human-readable summary
        public string IPAddress { get; set; }         // Client IP
        public string OldValue { get; set; }          // JSON snapshot before change
        public string NewValue { get; set; }          // JSON snapshot after change
        public string Result { get; set; }            // "success" | "failure" | "warning"
        public string Category { get; set; }          // "auth" | "order" | "payment" | "inventory" | "settings" | "user_mgmt"
    }
}
