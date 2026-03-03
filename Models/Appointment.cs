using System;

namespace ScalaPOS.Models
{
    public class Appointment
    {
        public int Id { get; set; }
        public string Title { get; set; }           // e.g. "Birthday Dinner for 6"
        public string CustomerName { get; set; }    // Walk-in or linked customer name
        public string CustomerPhone { get; set; }
        public string CustomerEmail { get; set; }
        public int? CustomerId { get; set; }        // FK to Customer (optional)
        public int? TableId { get; set; }           // FK to RestaurantTable (optional)
        public int? StaffId { get; set; }           // Assigned server / staff
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int PartySize { get; set; }
        public string Notes { get; set; }
        /// <summary>pending | confirmed | seated | cancelled | no-show</summary>
        public string Status { get; set; } = "pending";
        public bool ReminderSent { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public RestaurantTable Table { get; set; }
    }
}
