using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System;
using System.IO;
using System.Linq;

namespace ScalaPOS.Endpoints
{
    public static class DocumentEndpoints
    {
        // Files are stored under {BaseDir}/documents/
        private static string DocsDir => Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "documents");

        public static void MapDocumentEndpoints(this IEndpointRouteBuilder app)
        {
            // Ensure the directory exists
            Directory.CreateDirectory(DocsDir);

            var group = app.MapGroup("/api/v1/documents").WithTags("Documents");

            // GET /api/v1/documents  (filter by category, status, search)
            group.MapGet("/", async (PosDbContext db, string? category, string? status, string? search) =>
            {
                var q = db.Documents.AsQueryable();
                if (!string.IsNullOrWhiteSpace(category)) q = q.Where(d => d.Category == category);
                if (!string.IsNullOrWhiteSpace(status))   q = q.Where(d => d.Status == status);
                if (!string.IsNullOrWhiteSpace(search))   q = q.Where(d => d.FileName.Contains(search) || (d.Description != null && d.Description.Contains(search)) || (d.Tags != null && d.Tags.Contains(search)));
                return Results.Ok(await q.OrderByDescending(d => d.CreatedAt).ToListAsync());
            }).WithName("GetDocuments");

            // POST /api/v1/documents  (multipart/form-data)
            group.MapPost("/", async (HttpRequest request, PosDbContext db) =>
            {
                if (!request.HasFormContentType)
                    return Results.BadRequest(new { error = "Must be multipart/form-data" });

                var form = await request.ReadFormAsync();
                var file = form.Files.GetFile("file");
                if (file is null || file.Length == 0)
                    return Results.BadRequest(new { error = "No file provided" });

                // Save to disk
                var ext = Path.GetExtension(file.FileName);
                var storedName = $"{Guid.NewGuid()}{ext}";
                var filePath = Path.Combine(DocsDir, storedName);
                using (var stream = File.Create(filePath))
                    await file.CopyToAsync(stream);

                var doc = new Document
                {
                    FileName = file.FileName,
                    StoredName = storedName,
                    ContentType = file.ContentType,
                    FileSize = file.Length,
                    Category = form["category"].FirstOrDefault() ?? "other",
                    Description = form["description"].FirstOrDefault(),
                    Tags = form["tags"].FirstOrDefault(),
                    UploadedByName = form["uploadedByName"].FirstOrDefault(),
                    UploadedById = form["uploadedById"].FirstOrDefault(),
                    Status = "active",
                    CreatedAt = DateTime.UtcNow
                };

                db.Documents.Add(doc);
                await db.SaveChangesAsync();
                return Results.Created($"/api/v1/documents/{doc.Id}", doc);
            }).WithName("UploadDocument").DisableAntiforgery();

            // GET /api/v1/documents/{id}/download
            group.MapGet("/{id:int}/download", async (int id, PosDbContext db) =>
            {
                var doc = await db.Documents.FindAsync(id);
                if (doc is null) return Results.NotFound();
                var filePath = Path.Combine(DocsDir, doc.StoredName ?? "");
                if (!File.Exists(filePath)) return Results.NotFound();
                var bytes = await File.ReadAllBytesAsync(filePath);
                return Results.File(bytes, doc.ContentType ?? "application/octet-stream", doc.FileName);
            }).WithName("DownloadDocument");

            // PATCH /api/v1/documents/{id}/archive
            group.MapPatch("/{id:int}/archive", async (int id, PosDbContext db) =>
            {
                var doc = await db.Documents.FindAsync(id);
                if (doc is null) return Results.NotFound();
                doc.Status = "archived";
                await db.SaveChangesAsync();
                return Results.Ok(doc);
            }).WithName("ArchiveDocument");

            // DELETE /api/v1/documents/{id}
            group.MapDelete("/{id:int}", async (int id, PosDbContext db) =>
            {
                var doc = await db.Documents.FindAsync(id);
                if (doc is null) return Results.NotFound();
                // Delete file from disk
                var filePath = Path.Combine(DocsDir, doc.StoredName ?? "");
                if (File.Exists(filePath)) File.Delete(filePath);
                db.Documents.Remove(doc);
                await db.SaveChangesAsync();
                return Results.Ok(new { message = "Document deleted", id });
            }).WithName("DeleteDocument");
        }
    }
}
