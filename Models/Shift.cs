using System;

namespace ScalaPOS.Models
{
    public class Shift
    {
        public int Id { get; set; }
        public int StaffId { get; set; }
        
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        
        public string Role { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public string Color { get; set; } = "#3b82f6"; // Default blue
        
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation property
        public Staff? Staff { get; set; }
    }
}
