using System;

namespace ScalaPOS.Models
{
    public class InventoryItem
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string SKU { get; set; }
        public int CurrentStock { get; set; }
        public int MinimumStock { get; set; }
        public int ReorderLevel { get; set; }
        public decimal CostPrice { get; set; }
        public string Unit { get; set; } // kg, pieces, liters, etc.
        public string Location { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string BatchNumber { get; set; }
        public DateTime LastRestocked { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation property
        public Product Product { get; set; }
    }
}
