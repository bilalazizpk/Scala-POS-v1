using System;

namespace ScalaPOS.Models
{
    public class Staff
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Role { get; set; } // admin, manager, cashier, kitchen, delivery
        public string PINCode { get; set; }
        public decimal HourlyRate { get; set; }
        public string EmployeeId { get; set; }
        public DateTime HireDate { get; set; }
        public bool IsActive { get; set; }
        public string ProfileImage { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
