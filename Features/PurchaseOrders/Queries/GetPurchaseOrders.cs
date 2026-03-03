using MediatR;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.PurchaseOrders.Queries
{
    public class GetPurchaseOrdersQuery : IRequest<List<PurchaseOrder>>
    {
    }

    public class GetPurchaseOrdersHandler : IRequestHandler<GetPurchaseOrdersQuery, List<PurchaseOrder>>
    {
        private readonly PosDbContext _context;

        public GetPurchaseOrdersHandler(PosDbContext context)
        {
            _context = context;
        }

        public async Task<List<PurchaseOrder>> Handle(GetPurchaseOrdersQuery request, CancellationToken cancellationToken)
        {
            var pos = await _context.PurchaseOrders
                .Include(p => p.Supplier)
                .Include(p => p.Lines)
                .OrderByDescending(p => p.OrderDate)
                .ToListAsync(cancellationToken);

            // Avoid object cycle if needed by client, but System.Text.Json is already configured for IgnoreCycles
            return pos;
        }
    }

    public class GetPurchaseOrderByIdQuery : IRequest<PurchaseOrder>
    {
        public int Id { get; set; }
        public GetPurchaseOrderByIdQuery(int id) => Id = id;
    }

    public class GetPurchaseOrderByIdHandler : IRequestHandler<GetPurchaseOrderByIdQuery, PurchaseOrder>
    {
        private readonly PosDbContext _context;

        public GetPurchaseOrderByIdHandler(PosDbContext context)
        {
            _context = context;
        }

        public async Task<PurchaseOrder> Handle(GetPurchaseOrderByIdQuery request, CancellationToken cancellationToken)
        {
            var po = await _context.PurchaseOrders
                .Include(p => p.Supplier)
                .Include(p => p.Lines)
                .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
            
            return po;
        }
    }
}
