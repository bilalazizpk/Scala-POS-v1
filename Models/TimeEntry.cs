using System;

namespace ScalaPOS.Models
{
    public class TimeEntry
    {
        public int Id { get; set; }
        public int StaffId { get; set; }
        
        public DateTime ClockIn { get; set; }
        public DateTime? ClockOut { get; set; }
        
        public int? BreakMinutes { get; set; }
        
        public bool IsApproved { get; set; }
        public string Notes { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public Staff? Staff { get; set; }
    }
}
