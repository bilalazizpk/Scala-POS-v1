using System;

namespace ScalaPOS.Models
{
    public class RestaurantTable
    {
        public int Id { get; set; }
        public string Name { get; set; }        // e.g. "Table 1", "Bar 3"
        public int Capacity { get; set; }        // Number of seats
        public string Shape { get; set; }        // "square", "circle", "rectangle"
        public string Section { get; set; }      // "Indoor", "Outdoor", "Bar"
        public string Status { get; set; }       // "available", "occupied", "reserved", "cleaning"
        public int? CurrentOrderId { get; set; }
        public int? ServerId { get; set; }
        public int? GuestCount { get; set; }
        public DateTime? SeatedAt { get; set; }
        public string Notes { get; set; }
        public int PositionX { get; set; }       // Floor plan position
        public int PositionY { get; set; }
        public int Width { get; set; } = 80;      // SVG width
        public int Height { get; set; } = 80;     // SVG height
        public int Angle { get; set; } = 0;       // Rotation angle
        public bool IsLocked { get; set; }        // Locked from editing
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
