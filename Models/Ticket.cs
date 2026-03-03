using System;
using System.Collections.Generic;

namespace ScalaPOS.Models
{
    /// <summary>A support/helpdesk ticket.</summary>
    public class Ticket
    {
        public int Id { get; set; }
        public string TicketNumber { get; set; }      // e.g. "TKT-001"
        public string Title { get; set; }
        public string Description { get; set; }
        /// <summary>open | in-progress | pending | resolved | closed</summary>
        public string Status { get; set; } = "open";
        /// <summary>low | medium | high | critical</summary>
        public string Priority { get; set; } = "medium";
        /// <summary>bug | feature | maintenance | question | billing | other</summary>
        public string Category { get; set; } = "other";
        public string ReportedBy { get; set; }        // Name of staff who raised it
        public string ReportedById { get; set; }      // Staff ID
        public string AssignedTo { get; set; }        // Name of assigned agent/staff
        public string AssignedToId { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string Resolution { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<TicketComment> Comments { get; set; } = new();
    }

    public class TicketComment
    {
        public int Id { get; set; }
        public int TicketId { get; set; }
        public string AuthorName { get; set; }
        public string AuthorId { get; set; }
        public string Body { get; set; }
        public bool IsInternal { get; set; }          // Internal note vs customer-visible
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Ticket Ticket { get; set; }
    }
}
