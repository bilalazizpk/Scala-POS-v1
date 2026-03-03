using System;
using System.Collections.Generic;

namespace ScalaPOS.Models
{
    public class Customer
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public DateTime DateOfBirth { get; set; }
        public int LoyaltyPoints { get; set; }
        public string MembershipTier { get; set; } // Bronze, Silver, Gold, Platinum
        public DateTime MemberSince { get; set; }
        public DateTime? LastVisit { get; set; }
        public decimal TotalSpent { get; set; }
        public int VisitCount { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation property
        public ICollection<Order> Orders { get; set; }
    }
}
