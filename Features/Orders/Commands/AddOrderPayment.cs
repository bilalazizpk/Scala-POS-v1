using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.Orders.Commands
{
    public record AddOrderPaymentCommand(
        int OrderId,
        decimal Amount,
        string PaymentMethod,
        string Note
    ) : IRequest<OrderPaymentResult>;

    public class OrderPaymentResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public OrderPayment? Payment { get; set; }
        public decimal RemainingBalance { get; set; }
        public string OrderPaymentStatus { get; set; } = string.Empty;
    }

    public class AddOrderPaymentValidator : AbstractValidator<AddOrderPaymentCommand>
    {
        public AddOrderPaymentValidator()
        {
            RuleFor(x => x.OrderId).GreaterThan(0);
            RuleFor(x => x.Amount).GreaterThan(0);
            RuleFor(x => x.PaymentMethod).NotEmpty();
        }
    }

    public class AddOrderPaymentHandler : IRequestHandler<AddOrderPaymentCommand, OrderPaymentResult>
    {
        private readonly PosDbContext _context;
        private readonly ISender _sender;

        public AddOrderPaymentHandler(PosDbContext context, ISender sender)
        {
            _context = context;
            _sender = sender;
        }

        public async Task<OrderPaymentResult> Handle(AddOrderPaymentCommand request, CancellationToken cancellationToken)
        {
            var order = await _context.Orders
                .Include(o => o.Payments)
                .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

            if (order == null)
            {
                return new OrderPaymentResult { Success = false, Message = "Order not found" };
            }

            var payment = new OrderPayment
            {
                OrderId = request.OrderId,
                Amount = request.Amount,
                PaymentMethod = request.PaymentMethod,
                PaymentDate = DateTime.UtcNow,
                Status = "Completed",
                Note = request.Note
            };

            order.Payments.Add(payment);

            var totalPaid = order.Payments.Where(p => p.Status == "Completed").Sum(p => p.Amount);
            var remaining = order.TotalAmount - totalPaid;

            if (remaining <= 0)
            {
                order.PaymentStatus = "paid";
            }
            else
            {
                order.PaymentStatus = "partial";
            }

            await _context.SaveChangesAsync(cancellationToken);

            string cashAccount = request.PaymentMethod.ToLower() == "card" ? "1010" : "1000";
            
            await _sender.Send(new ScalaPOS.Features.Accounting.Commands.CreateJournalEntryCommand(
                DateTime.UtcNow,
                $"Payment ORD-{order.Id}-{payment.Id}",
                $"Order Payment ({request.PaymentMethod})",
                new System.Collections.Generic.List<ScalaPOS.Features.Accounting.Commands.JournalLineDto>
                {
                    new ScalaPOS.Features.Accounting.Commands.JournalLineDto { AccountCode = cashAccount, Debit = request.Amount, Credit = 0, Description = "Payment Received" },
                    new ScalaPOS.Features.Accounting.Commands.JournalLineDto { AccountCode = "1100", Debit = 0, Credit = request.Amount, Description = "Accounts Receivable Clearance" }
                }
            ), cancellationToken);

            return new OrderPaymentResult
            {
                Success = true,
                Message = "Payment added successfully",
                Payment = payment,
                RemainingBalance = remaining < 0 ? 0 : remaining,
                OrderPaymentStatus = order.PaymentStatus
            };
        }
    }
}
