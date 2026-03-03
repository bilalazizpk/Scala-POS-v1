using System;
using System.Collections.Generic;

namespace ScalaPOS.Models
{
    public class Supplier
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string ContactName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public string TaxNumber { get; set; }       // ABN, VAT, EIN
        public string PaymentTerms { get; set; }    // e.g. "Net 30"
        public string Notes { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<PurchaseOrder> PurchaseOrders { get; set; } = new();
    }

    public class PurchaseOrder
    {
        public int Id { get; set; }
        public string PoNumber { get; set; }        // e.g. "PO-0001"
        public int SupplierId { get; set; }
        public Supplier Supplier { get; set; }
        /// <summary>draft | sent | partially-received | received | cancelled</summary>
        public string Status { get; set; } = "draft";
        public DateTime OrderDate { get; set; }
        public DateTime? ExpectedDate { get; set; }
        public DateTime? ReceivedDate { get; set; }
        public decimal SubTotal { get; set; }
        public decimal Tax { get; set; }
        public decimal Total { get; set; }
        public string Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<PurchaseOrderLine> Lines { get; set; } = new();
    }

    public class PurchaseOrderLine
    {
        public int Id { get; set; }
        public int PurchaseOrderId { get; set; }
        public PurchaseOrder PurchaseOrder { get; set; }
        public int? InventoryItemId { get; set; }   // Links to existing InventoryItem
        public string ItemName { get; set; }         // Fallback if no InventoryItem
        public string Unit { get; set; }             // e.g. "kg", "box", "each"
        public decimal QuantityOrdered { get; set; }
        public decimal QuantityReceived { get; set; }
        public decimal UnitCost { get; set; }
        public decimal LineTotal { get; set; }
    }
}
