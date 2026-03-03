using System;
using System.Collections.Generic;

namespace ScalaPOS.Models
{
    public class Category
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Icon { get; set; }
        public string Color { get; set; }
        public int DisplayOrder { get; set; }
        public string TargetKdsStation { get; set; } = "Kitchen";
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation property
        public ICollection<Product> Products { get; set; }
    }
}
