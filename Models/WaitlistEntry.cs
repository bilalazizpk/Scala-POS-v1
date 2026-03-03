using System;
using System.ComponentModel.DataAnnotations;

namespace ScalaPOS.Models
{
    public class WaitlistEntry
    {
        public int Id { get; set; }

        public int? CustomerId { get; set; } // Optional reference

        [Required]
        [MaxLength(100)]
        public string CustomerName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [Required]
        public int PartySize { get; set; }

        // Time the customer was told they'd wait (in minutes)
        public int QuotedWaitTime { get; set; }

        public DateTime JoinTime { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Waiting"; // Waiting, Seated, Notified, Left, Cancelled

        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}
