using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.Orders.Commands
{
    public record VoidOrderCommand(int OrderId, string Reason) : IRequest;

    public class VoidOrderValidator : AbstractValidator<VoidOrderCommand>
    {
        public VoidOrderValidator()
        {
            RuleFor(x => x.OrderId).GreaterThan(0);
            RuleFor(x => x.Reason).NotEmpty().WithMessage("A reason must be provided to void an order.");
        }
    }

    public class VoidOrderHandler : IRequestHandler<VoidOrderCommand>
    {
        private readonly PosDbContext _db;

        public VoidOrderHandler(PosDbContext db)
        {
            _db = db;
        }

        public async Task Handle(VoidOrderCommand request, CancellationToken cancellationToken)
        {
            var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);
            
            if (order == null)
            {
                // In a complete implementation we'd throw a NotFoundException handled by global middleware
                throw new System.Exception($"Order {request.OrderId} not found.");
            }

            if (order.OrderStatus == "Completed")
            {
                throw new System.Exception("Cannot void a completed order. Use Refund instead.");
            }

            order.OrderStatus = "Voided";
            // Append note for audit
            order.Notes = string.IsNullOrEmpty(order.Notes) 
                ? $"[VOIDED] Reason: {request.Reason}" 
                : $"{order.Notes} | [VOIDED] Reason: {request.Reason}";

            await _db.SaveChangesAsync(cancellationToken);
        }
    }
}
