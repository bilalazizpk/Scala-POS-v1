using System;

namespace ScalaPOS.Models
{
    /// <summary>
    /// Records every mutation pushed from any client device.
    /// Acts as an append-only event log for offline-first sync.
    /// </summary>
    public class SyncLog
    {
        public long Id { get; set; }                 // Auto-increment
        public string DeviceId { get; set; }         // UUID per terminal
        public string DeviceName { get; set; }       // Human label
        public long ClientSeq { get; set; }          // Monotonic seq on the client
        /// <summary>create | update | delete</summary>
        public string Operation { get; set; }
        /// <summary>Order | Product | InventoryItem | etc.</summary>
        public string EntityType { get; set; }
        public string EntityId { get; set; }         // String PK of the affected record
        public string Payload { get; set; }          // JSON snapshot of the change
        public string Status { get; set; } = "applied"; // applied | conflict | rejected
        public string ConflictNote { get; set; }
        public DateTime ClientTimestamp { get; set; }// When the device made the change
        public DateTime ServerTimestamp { get; set; } = DateTime.UtcNow; // When server received it
    }
}
