using MediatR;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.PurchaseOrders.Commands
{
    public class ReceivePurchaseOrderCommand : IRequest<PurchaseOrder>
    {
        public int PurchaseOrderId { get; set; }
        public List<ReceivePurchaseOrderLineDto> ReceivedLines { get; set; } = new();
    }

    public class ReceivePurchaseOrderLineDto
    {
        public int PurchaseOrderLineId { get; set; }
        public decimal QuantityReceived { get; set; }
    }

    public class ReceivePurchaseOrderHandler : IRequestHandler<ReceivePurchaseOrderCommand, PurchaseOrder>
    {
        private readonly PosDbContext _context;

        public ReceivePurchaseOrderHandler(PosDbContext context)
        {
            _context = context;
        }

        public async Task<PurchaseOrder> Handle(ReceivePurchaseOrderCommand request, CancellationToken cancellationToken)
        {
            var po = await _context.PurchaseOrders
                .Include(p => p.Lines)
                .FirstOrDefaultAsync(p => p.Id == request.PurchaseOrderId, cancellationToken);

            if (po == null) throw new Exception("Purchase Order not found");

            bool allFullyReceived = true;
            bool anyReceived = false;

            foreach (var reqLine in request.ReceivedLines)
            {
                var dbLine = po.Lines.FirstOrDefault(l => l.Id == reqLine.PurchaseOrderLineId);
                if (dbLine != null)
                {
                    dbLine.QuantityReceived += reqLine.QuantityReceived;

                    // If inventory item exists, increment total stock
                    if (dbLine.InventoryItemId.HasValue)
                    {
                        var inv = await _context.InventoryItems.FindAsync(new object[] { dbLine.InventoryItemId.Value }, cancellationToken);
                        if (inv != null)
                        {
                            inv.CurrentStock += (int)reqLine.QuantityReceived;
                        }
                    }

                    if (dbLine.QuantityReceived >= dbLine.QuantityOrdered)
                    {
                        anyReceived = true;
                    }
                    else
                    {
                        allFullyReceived = false;
                        if (dbLine.QuantityReceived > 0) anyReceived = true;
                    }
                }
            }

            po.ReceivedDate = DateTime.UtcNow;
            po.UpdatedAt = DateTime.UtcNow;

            if (allFullyReceived)
            {
                po.Status = "received";
            }
            else if (anyReceived)
            {
                po.Status = "partially-received";
            }

            await _context.SaveChangesAsync(cancellationToken);

            return po;
        }
    }
}
