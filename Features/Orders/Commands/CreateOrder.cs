using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace ScalaPOS.Features.Orders.Commands
{
    public class OrderItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public string Notes { get; set; } = string.Empty;
    }

    public record CreateOrderCommand(
        string OrderNumber,
        DateTime OrderDate,
        decimal SubTotal,
        decimal Tax,
        decimal Discount,
        decimal TotalAmount,
        string OrderStatus,
        string OrderType,
        int? CustomerId,
        int? TableNumber,
        string PaymentMethod,
        string PaymentStatus,
        int PointsRedeemed,
        decimal PointsDiscountAmount,
        string Notes,
        List<OrderItemDto> Items
    ) : IRequest<Order>;

    public class CreateOrderValidator : AbstractValidator<CreateOrderCommand>
    {
        public CreateOrderValidator()
        {
            RuleFor(x => x.OrderNumber).NotEmpty();
            RuleFor(x => x.TotalAmount).GreaterThanOrEqualTo(0);
            RuleFor(x => x.Items).NotEmpty();
        }
    }

    public class CreateOrderHandler : IRequestHandler<CreateOrderCommand, Order>
    {
        private readonly PosDbContext _context;
        private readonly Microsoft.AspNetCore.SignalR.IHubContext<ScalaPOS.Hubs.KitchenHub> _hub;
        private readonly ISender _sender;

        public CreateOrderHandler(PosDbContext context, Microsoft.AspNetCore.SignalR.IHubContext<ScalaPOS.Hubs.KitchenHub> hub, ISender sender)
        {
            _context = context;
            _hub = hub;
            _sender = sender;
        }

        public async Task<Order> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
        {
            Customer? customer = null;
            int pointsEarned = 0;

            if (request.CustomerId.HasValue)
            {
                customer = await _context.Customers.FindAsync(new object[] { request.CustomerId.Value }, cancellationToken);
                if (customer != null)
                {
                    // Deduct redeemed points
                    if (request.PointsRedeemed > 0 && customer.LoyaltyPoints >= request.PointsRedeemed)
                    {
                        customer.LoyaltyPoints -= request.PointsRedeemed;
                    }

                    // Earn points based on TotalAmount (1 point per $10 spent)
                    pointsEarned = (int)Math.Floor(request.TotalAmount / 10m);
                    customer.LoyaltyPoints += pointsEarned;
                    customer.TotalSpent += request.TotalAmount;
                    customer.VisitCount += 1;
                    customer.LastVisit = DateTime.UtcNow;
                    
                    _context.Customers.Update(customer);
                }
            }

            var order = new Order
            {
                OrderNumber = request.OrderNumber,
                OrderDate = request.OrderDate != default ? request.OrderDate : DateTime.UtcNow,
                SubTotal = request.SubTotal,
                Tax = request.Tax,
                Discount = request.Discount,
                TotalAmount = request.TotalAmount,
                OrderStatus = string.IsNullOrEmpty(request.OrderStatus) ? "Completed" : request.OrderStatus,
                OrderType = string.IsNullOrEmpty(request.OrderType) ? "dine-in" : request.OrderType,
                CustomerId = request.CustomerId,
                TableNumber = request.TableNumber,
                PaymentMethod = string.IsNullOrEmpty(request.PaymentMethod) ? "cash" : request.PaymentMethod,
                PaymentStatus = string.IsNullOrEmpty(request.PaymentStatus) ? "paid" : request.PaymentStatus,
                PointsRedeemed = request.PointsRedeemed,
                PointsDiscountAmount = request.PointsDiscountAmount,
                PointsEarned = pointsEarned,
                Notes = request.Notes ?? "",
                CreatedAt = DateTime.UtcNow,
                OrderItems = request.Items?.Select(i => new OrderItem
                {
                    ProductId = i.ProductId,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    TotalPrice = i.TotalPrice,
                    Notes = i.Notes ?? "",
                    Status = "Pending"
                }).ToList() ?? new List<OrderItem>()
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync(cancellationToken);

            // Fetch the populated order items with Categories to know which station to alert
            var savedOrder = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .ThenInclude(p => p.Category)
                .FirstOrDefaultAsync(o => o.Id == order.Id, cancellationToken);
            
            if (savedOrder != null)
            {
                var stations = savedOrder.OrderItems
                    .Where(oi => oi.Product?.Category?.TargetKdsStation != null)
                    .Select(oi => oi.Product!.Category!.TargetKdsStation.ToLower())
                    .Distinct();

                foreach (var st in stations)
                {
                    await _hub.Clients.Group($"kds_{st}").SendAsync("NewOrder", savedOrder);
                }
            }

            // ----------------------------------------------------
            // AUTO-JOURNALING HOOKS
            // ----------------------------------------------------
            try 
            {
                // 1. Accrue Revenue and AR
                await _sender.Send(new ScalaPOS.Features.Accounting.Commands.CreateJournalEntryCommand(
                    DateTime.UtcNow,
                    $"INV-{order.OrderNumber}",
                    "Sales Invoice",
                    new List<ScalaPOS.Features.Accounting.Commands.JournalLineDto>
                    {
                        new ScalaPOS.Features.Accounting.Commands.JournalLineDto { AccountCode = "1100", Debit = order.TotalAmount, Credit = 0, Description = "Accounts Receivable" },
                        new ScalaPOS.Features.Accounting.Commands.JournalLineDto { AccountCode = "4000", Debit = 0, Credit = order.SubTotal - order.Discount, Description = "Sales Revenue" },
                        new ScalaPOS.Features.Accounting.Commands.JournalLineDto { AccountCode = "2100", Debit = 0, Credit = order.Tax, Description = "Sales Tax Payable" }
                    }
                ), cancellationToken);

                // 2. If paid immediately, clear AR
                if (order.PaymentStatus == "paid")
                {
                    string cashAccount = order.PaymentMethod.ToLower() == "card" ? "1010" : "1000";
                    await _sender.Send(new ScalaPOS.Features.Accounting.Commands.CreateJournalEntryCommand(
                        DateTime.UtcNow,
                        $"PAY-{order.OrderNumber}",
                        $"Order Payment ({order.PaymentMethod})",
                        new List<ScalaPOS.Features.Accounting.Commands.JournalLineDto>
                        {
                            new ScalaPOS.Features.Accounting.Commands.JournalLineDto { AccountCode = cashAccount, Debit = order.TotalAmount, Credit = 0, Description = "Payment Received" },
                            new ScalaPOS.Features.Accounting.Commands.JournalLineDto { AccountCode = "1100", Debit = 0, Credit = order.TotalAmount, Description = "Accounts Receivable Clearance" }
                        }
                    ), cancellationToken);
                }
            }
            catch (Exception ex)
            {
                // Log and swallow so the order doesn't fail just because accounting glitched
                Console.WriteLine($"Accounting error: {ex.Message}");
            }

            return order;
        }
    }
}
