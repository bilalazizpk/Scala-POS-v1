using System;
using System.Collections.Generic;

namespace ScalaPOS.Models
{
    public class Project
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        /// <summary>active | on-hold | completed | cancelled</summary>
        public string Status { get; set; } = "active";
        /// <summary>low | medium | high | critical</summary>
        public string Priority { get; set; } = "medium";
        public string ClientName { get; set; }
        public string ManagerId { get; set; }
        public string ManagerName { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public decimal Budget { get; set; }
        public string Color { get; set; } = "#6366f1"; // brand color per project
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<ProjectTask> Tasks { get; set; } = new();
    }

    public class ProjectTask
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public Project Project { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        /// <summary>todo | in-progress | review | done</summary>
        public string Status { get; set; } = "todo";
        /// <summary>low | medium | high</summary>
        public string Priority { get; set; } = "medium";
        public string AssignedToId { get; set; }
        public string AssignedToName { get; set; }
        public int? EstimatedHours { get; set; }
        public int? ActualHours { get; set; }
        public DateTime? DueDate { get; set; }
        public int SortOrder { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
