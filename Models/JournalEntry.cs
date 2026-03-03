using System;
using System.Collections.Generic;

namespace ScalaPOS.Models
{
    public class JournalEntry
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public string Reference { get; set; } // e.g. "Invoice INV-001" or "Order ORD-123"
        public string Description { get; set; }
        public decimal TotalDebit { get; set; }
        public decimal TotalCredit { get; set; }
        public bool IsPosted { get; set; }
        public DateTime CreatedAt { get; set; }

        public ICollection<JournalLine> Lines { get; set; } = new List<JournalLine>();
    }

    public class JournalLine
    {
        public int Id { get; set; }
        public int JournalEntryId { get; set; }
        public int AccountId { get; set; }
        
        public string Description { get; set; }
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }

        public JournalEntry JournalEntry { get; set; }
        public Account Account { get; set; }
    }
}
