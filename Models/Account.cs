using System;
using System.Collections.Generic;

namespace ScalaPOS.Models
{
    public class Account
    {
        public int Id { get; set; }
        public string Code { get; set; }        // e.g. "1000", "4000"
        public string Name { get; set; }        // e.g. "Cash", "Sales Revenue"
        public string AccountType { get; set; } // Asset, Liability, Equity, Revenue, Expense
        public string SubType { get; set; }     // e.g. "Current Asset"
        public bool IsSystemAccount { get; set; }
        public bool AllowManualEntry { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Navigation properties
        public ICollection<JournalLine> JournalLines { get; set; } = new List<JournalLine>();
    }
}
