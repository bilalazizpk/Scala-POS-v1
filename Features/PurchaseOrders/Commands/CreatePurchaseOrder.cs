using MediatR;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.PurchaseOrders.Commands
{
    public class CreatePurchaseOrderCommand : IRequest<PurchaseOrder>
    {
        public int SupplierId { get; set; }
        public string Notes { get; set; } = string.Empty;
        public List<PurchaseOrderLineDto> Lines { get; set; } = new();
    }

    public class PurchaseOrderLineDto
    {
        public int? InventoryItemId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string Unit { get; set; } = "Each";
        public decimal QuantityOrdered { get; set; }
        public decimal UnitCost { get; set; }
    }

    public class CreatePurchaseOrderHandler : IRequestHandler<CreatePurchaseOrderCommand, PurchaseOrder>
    {
        private readonly PosDbContext _context;

        public CreatePurchaseOrderHandler(PosDbContext context)
        {
            _context = context;
        }

        public async Task<PurchaseOrder> Handle(CreatePurchaseOrderCommand request, CancellationToken cancellationToken)
        {
            // Calculate totals
            decimal subTotal = 0;
            var poLines = new List<PurchaseOrderLine>();

            foreach (var line in request.Lines)
            {
                var lineTotal = line.QuantityOrdered * line.UnitCost;
                subTotal += lineTotal;

                poLines.Add(new PurchaseOrderLine
                {
                    InventoryItemId = line.InventoryItemId,
                    ItemName = line.ItemName,
                    Unit = line.Unit,
                    QuantityOrdered = line.QuantityOrdered,
                    QuantityReceived = 0,
                    UnitCost = line.UnitCost,
                    LineTotal = lineTotal
                });
            }

            var tax = subTotal * 0.1m; // 10% tax placeholder
            var total = subTotal + tax;

            var po = new PurchaseOrder
            {
                PoNumber = $"PO-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}",
                SupplierId = request.SupplierId,
                Status = "sent",
                OrderDate = DateTime.UtcNow,
                ExpectedDate = DateTime.UtcNow.AddDays(7),
                SubTotal = subTotal,
                Tax = tax,
                Total = total,
                Notes = request.Notes,
                Lines = poLines
            };

            _context.PurchaseOrders.Add(po);
            await _context.SaveChangesAsync(cancellationToken);

            return po;
        }
    }
}
