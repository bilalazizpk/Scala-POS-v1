using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.Orders.Commands
{
    public record RefundOrderCommand(int OrderId, string Reason) : IRequest<bool>;

    public class RefundOrderValidator : AbstractValidator<RefundOrderCommand>
    {
        public RefundOrderValidator()
        {
            RuleFor(x => x.OrderId).GreaterThan(0);
            RuleFor(x => x.Reason).NotEmpty().WithMessage("A reason must be provided to issue a refund.");
        }
    }

    public class RefundOrderHandler : IRequestHandler<RefundOrderCommand, bool>
    {
        private readonly PosDbContext _db;

        public RefundOrderHandler(PosDbContext db)
        {
            _db = db;
        }

        public async Task<bool> Handle(RefundOrderCommand request, CancellationToken cancellationToken)
        {
            var order = await _db.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);
            
            if (order == null)
            {
                throw new System.Exception($"Order {request.OrderId} not found.");
            }

            if (order.OrderStatus != "Completed")
            {
                throw new System.Exception("Only completed orders can be refunded. If the order is Open, use Void instead.");
            }

            order.OrderStatus = "Refunded";
            order.Notes = string.IsNullOrEmpty(order.Notes) 
                ? $"[REFUNDED] Reason: {request.Reason}" 
                : $"{order.Notes} | [REFUNDED] Reason: {request.Reason}";

            // In Phase 1 MVP, we just mark the order as refunded. 
            // In Phase 2, we would restock inventory items based on a boolean flag.

            await _db.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
