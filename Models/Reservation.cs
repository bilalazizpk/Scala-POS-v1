using System;
using System.ComponentModel.DataAnnotations;

namespace ScalaPOS.Models
{
    public class Reservation
    {
        public int Id { get; set; }

        public int? CustomerId { get; set; } // Optional reference to registered customer
        
        [Required]
        [MaxLength(100)]
        public string CustomerName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [Required]
        public int PartySize { get; set; }

        [Required]
        public DateTime ReservationTime { get; set; }

        public int? TableId { get; set; } // The table they are assigned to
        public RestaurantTable? Table { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending"; // Pending, Confirmed, Seated, Cancelled, No-Show
        
        [MaxLength(500)]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
