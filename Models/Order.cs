using System;
using System.Collections.Generic;

namespace ScalaPOS.Models
{
    public class Order
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public decimal SubTotal { get; set; }
        public decimal Tax { get; set; }
        public decimal Discount { get; set; }
        public decimal TotalAmount { get; set; }
        public string OrderStatus { get; set; } = "Pending";
        public string OrderType { get; set; } = "dine-in";
        public int? CustomerId { get; set; }
        public int? TableNumber { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = "pending";
        public int? StaffId { get; set; }
        public string Notes { get; set; } = string.Empty;
        public int PointsEarned { get; set; }
        public int PointsRedeemed { get; set; }
        public decimal PointsDiscountAmount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }

        // Navigation properties
        public Customer? Customer { get; set; }
        public Staff? Staff { get; set; }
        public List<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public List<OrderPayment> Payments { get; set; } = new List<OrderPayment>();
    }
}
