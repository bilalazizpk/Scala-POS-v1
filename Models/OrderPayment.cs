using System;

namespace ScalaPOS.Models
{
    public class OrderPayment
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty; // Cash, Card, etc.
        public DateTime PaymentDate { get; set; }
        public string Status { get; set; } = "Completed"; // Completed, Pending, Failed, Refunded
        public string Note { get; set; } = string.Empty; // E.g., "Split payment", "Customer A"
        
        // Navigation property
        public Order? Order { get; set; }
    }
}
