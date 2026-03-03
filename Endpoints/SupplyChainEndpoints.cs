using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System;
using System.Linq;

namespace ScalaPOS.Endpoints
{
    public static class SupplyChainEndpoints
    {
        public static void MapSupplyChainEndpoints(this IEndpointRouteBuilder app)
        {
            // ── Suppliers ────────────────────────────────────────────────────────────
            var suppliers = app.MapGroup("/api/v1/suppliers").WithTags("Supply Chain");

            suppliers.MapGet("/", async (PosDbContext db) =>
                Results.Ok(await db.Suppliers.OrderBy(s => s.Name).ToListAsync()))
                .WithName("GetSuppliers");

            suppliers.MapGet("/{id:int}", async (int id, PosDbContext db) =>
            {
                var s = await db.Suppliers.Include(x => x.PurchaseOrders).FirstOrDefaultAsync(x => x.Id == id);
                return s is not null ? Results.Ok(s) : Results.NotFound();
            }).WithName("GetSupplierById");

            suppliers.MapPost("/", async (CreateSupplierRequest req, PosDbContext db) =>
            {
                var s = new Supplier
                {
                    Name = req.Name, ContactName = req.ContactName, Email = req.Email,
                    Phone = req.Phone, Address = req.Address, TaxNumber = req.TaxNumber,
                    PaymentTerms = req.PaymentTerms, Notes = req.Notes
                };
                db.Suppliers.Add(s);
                await db.SaveChangesAsync();
                return Results.Created($"/api/v1/suppliers/{s.Id}", s);
            }).WithName("CreateSupplier");

            suppliers.MapPut("/{id:int}", async (int id, CreateSupplierRequest req, PosDbContext db) =>
            {
                var s = await db.Suppliers.FindAsync(id);
                if (s is null) return Results.NotFound();
                s.Name = req.Name; s.ContactName = req.ContactName; s.Email = req.Email;
                s.Phone = req.Phone; s.Address = req.Address; s.TaxNumber = req.TaxNumber;
                s.PaymentTerms = req.PaymentTerms; s.Notes = req.Notes;
                await db.SaveChangesAsync();
                return Results.Ok(s);
            }).WithName("UpdateSupplier");

            suppliers.MapDelete("/{id:int}", async (int id, PosDbContext db) =>
            {
                var s = await db.Suppliers.FindAsync(id);
                if (s is null) return Results.NotFound();
                db.Suppliers.Remove(s);
                await db.SaveChangesAsync();
                return Results.Ok(new { message = "Supplier deleted" });
            }).WithName("DeleteSupplier");


        }
    }

    public record CreateSupplierRequest(string Name, string? ContactName, string? Email, string? Phone,
        string? Address, string? TaxNumber, string? PaymentTerms, string? Notes);
}
