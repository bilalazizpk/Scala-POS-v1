using System;

namespace ScalaPOS.Models
{
    public class Document
    {
        public int Id { get; set; }
        public string FileName { get; set; }          // Original file name
        public string StoredName { get; set; }        // GUID-based stored name on disk
        public string ContentType { get; set; }       // MIME type
        public long FileSize { get; set; }            // Bytes
        /// <summary>contract | invoice | policy | receipt | other</summary>
        public string Category { get; set; } = "other";
        public string Description { get; set; }
        public string Tags { get; set; }              // Comma-separated tags
        public string UploadedById { get; set; }
        public string UploadedByName { get; set; }
        /// <summary>draft | active | archived</summary>
        public string Status { get; set; } = "active";
        public DateTime? ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
