# SCALA POS — Backend Developer Guide
### Role: .NET 8 · C# · ASP.NET Core · EF Core · SignalR · Business Logic · APIs

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Domain Models (Core Layer)](#2-domain-models-core-layer)
3. [Application Layer — Commands & Queries](#3-application-layer--commands--queries)
4. [API Endpoints (Minimal APIs)](#4-api-endpoints-minimal-apis)
5. [Business Logic Services](#5-business-logic-services)
6. [SignalR Real-Time Hub](#6-signalr-real-time-hub)
7. [Background Worker Services](#7-background-worker-services)
8. [Hardware Integration](#8-hardware-integration)
9. [Payment Gateway Integration](#9-payment-gateway-integration)
10. [External API Integrations](#10-external-api-integrations)
11. [Testing Strategy](#11-testing-strategy)
12. [Module-by-Module Backend Tasks](#12-module-by-module-backend-tasks)

---

## 1. Project Setup

### NuGet Packages (ScalaPOS.Api.csproj)
```xml
<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.*" />
<PackageReference Include="MediatR" Version="12.*" />
<PackageReference Include="FluentValidation.AspNetCore" Version="11.*" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.*" />
<PackageReference Include="Serilog.AspNetCore" Version="8.*" />
<PackageReference Include="Hangfire.AspNetCore" Version="1.*" />
<PackageReference Include="Microsoft.AspNetCore.SignalR" Version="8.*" />
<PackageReference Include="StackExchange.Redis" Version="2.*" />
```

### NuGet Packages (ScalaPOS.Infrastructure.csproj)
```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="8.*" />
<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.*" />
<PackageReference Include="SQLitePCLRaw.bundle_e_sqlcipher" Version="2.*" />
<PackageReference Include="Dapper" Version="2.*" />
<PackageReference Include="Mapster" Version="7.*" />
<PackageReference Include="Stripe.net" Version="45.*" />
<PackageReference Include="Square" Version="37.*" />
<PackageReference Include="SendGrid" Version="9.*" />
<PackageReference Include="Twilio" Version="7.*" />
<PackageReference Include="QuickBooksOnline.CSharp.SDK" Version="5.*" />
<PackageReference Include="Xero.NetStandard.OAuth2" Version="4.*" />
```

### Program.cs Setup
```csharp
var builder = WebApplication.CreateBuilder(args);

// Core services
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(IApplicationMarker).Assembly));
builder.Services.AddValidatorsFromAssembly(typeof(IApplicationMarker).Assembly);
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehaviour<,>));
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehaviour<,>));
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(AuthorisationBehaviour<,>));
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(AuditBehaviour<,>));

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Sqlite")));

// Auth
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuer = true, ValidIssuer = "ScalaPOS",
            ValidateAudience = true, ValidAudience = "ScalaPOS.Client",
            ValidateLifetime = true,
            IssuerSigningKey = new RsaSecurityKey(LoadRsaPublicKey())
        };
    });

// SignalR
builder.Services.AddSignalR().AddStackExchangeRedis(builder.Configuration["Redis:Url"]);

// Background jobs
builder.Services.AddHangfire(x => x.UseSqliteStorage(connStr));
builder.Services.AddHangfireServer();

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
app.MapHub<PosHub>("/hubs/pos");

// Register all endpoint groups
app.MapOrderEndpoints();
app.MapProductEndpoints();
app.MapInventoryEndpoints();
app.MapTableEndpoints();
app.MapEmployeeEndpoints();
app.MapAccountingEndpoints();
app.MapReportEndpoints();
app.MapSyncEndpoints();

app.Run();
```

---

## 2. Domain Models (Core Layer)

### Order Aggregate
```csharp
// ScalaPOS.Core/Entities/Order.cs
public class Order : BaseEntity
{
    public string Reference { get; private set; }       // ORD-20250001
    public Guid StoreId { get; private set; }
    public Guid RegisterId { get; private set; }
    public Guid EmployeeId { get; private set; }
    public Guid? CustomerId { get; private set; }
    public Guid? TableId { get; private set; }
    public OrderType Type { get; private set; }
    public OrderStatus Status { get; private set; }
    public int Covers { get; private set; }

    private readonly List<OrderItem> _items = new();
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();

    private readonly List<Payment> _payments = new();
    public IReadOnlyList<Payment> Payments => _payments.AsReadOnly();

    private readonly List<AppliedDiscount> _discounts = new();

    // Computed properties — always calculated, never stored directly
    public decimal SubTotal => _items.Sum(i => i.LineTotal);
    public decimal DiscountTotal => _discounts.Sum(d => d.Amount);
    public decimal TaxableAmount => SubTotal - DiscountTotal;
    public decimal TaxAmount => _items.Sum(i => i.TaxAmount);
    public decimal TipAmount => _payments.Sum(p => p.TipAmount);
    public decimal Total => TaxableAmount + TaxAmount;
    public decimal AmountPaid => _payments.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.Amount);
    public decimal BalanceDue => Total - AmountPaid;

    // Domain behaviour — business rules live here
    public void AddItem(Product product, ProductVariant? variant, decimal qty, List<Modifier> modifiers)
    {
        if (Status != OrderStatus.Open)
            throw new DomainException("Cannot add items to a non-open order");

        var existing = _items.FirstOrDefault(i => i.ProductId == product.Id && i.VariantId == variant?.Id && !i.HasModifiers);
        if (existing != null && !modifiers.Any())
            existing.IncrementQty(qty);
        else
            _items.Add(OrderItem.Create(product, variant, qty, modifiers));
    }

    public void ApplyDiscount(decimal amount, DiscountType type, Guid employeeId, Guid? managerApprovalId = null)
    {
        if (type == DiscountType.ManagerOverride && managerApprovalId == null)
            throw new DomainException("Manager override discount requires manager approval");

        _discounts.Add(new AppliedDiscount { Amount = amount, Type = type, EmployeeId = employeeId });
    }

    public PaymentResult AddPayment(Payment payment)
    {
        if (payment.Amount > BalanceDue + 0.01m)
            throw new DomainException($"Payment of {payment.Amount} exceeds balance due {BalanceDue}");

        _payments.Add(payment);

        if (BalanceDue <= 0.01m)
        {
            Status = OrderStatus.Completed;
            CompletedAt = DateTimeOffset.UtcNow;
            AddDomainEvent(new OrderCompletedEvent(this));
        }

        return new PaymentResult { Change = Math.Max(0, AmountPaid - Total) };
    }

    public SplitResult SplitBill(SplitMode mode, SplitParameters parameters)
    {
        // Validates and produces sub-orders or payment assignments
        return BillSplitter.Split(this, mode, parameters);
    }

    public void VoidOrder(string reason, Guid employeeId)
    {
        if (Status == OrderStatus.Completed)
            throw new DomainException("Cannot void a completed order — create a refund instead");

        Status = OrderStatus.Voided;
        AddDomainEvent(new OrderVoidedEvent(this, reason, employeeId));
    }
}
```

### Product with Variants
```csharp
public class Product : BaseEntity
{
    public string Name { get; set; }
    public string Sku { get; set; }
    public string? Barcode { get; set; }
    public decimal BasePrice { get; set; }
    public decimal Cost { get; set; }
    public Guid CategoryId { get; set; }
    public CostingMethod CostingMethod { get; set; }
    public decimal ReorderPoint { get; set; }
    public bool TrackInventory { get; set; }
    public bool IsActive { get; set; }

    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
    public Recipe? Recipe { get; set; }

    // Generate variant matrix from attributes
    public static IEnumerable<ProductVariant> GenerateVariants(
        string baseSku, Dictionary<string, List<string>> attributeMatrix)
    {
        var combinations = CartesianProduct(attributeMatrix.Values.ToList());
        var attributeKeys = attributeMatrix.Keys.ToList();

        return combinations.Select((combo, i) => new ProductVariant
        {
            Sku = $"{baseSku}-{string.Join("-", combo).ToUpper()}",
            Attributes = attributeKeys.Zip(combo).ToDictionary(x => x.First, x => x.Second),
            Price = null, // inherits from parent
            Cost = null,
        });
    }
}
```

### Employee with RBAC
```csharp
public class Employee : BaseEntity
{
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string PinHash { get; set; }        // bcrypt
    public Guid RoleId { get; set; }
    public Role Role { get; set; }
    public EmploymentType EmploymentType { get; set; }
    public decimal HourlyRate { get; set; }
    public string EncryptedTaxNumber { get; set; }    // AES-256-GCM
    public string EncryptedBankAccount { get; set; }

    public string FullName => $"{FirstName} {LastName}";
    public bool HasPermission(Permission perm) => Role.Permissions.HasFlag(perm);

    public bool VerifyPin(string pin) => BCrypt.Net.BCrypt.Verify(pin, PinHash);
}

[Flags]
public enum Permission : long
{
    None = 0,
    // POS
    ProcessSale                = 1L << 0,
    ApplyItemDiscount          = 1L << 1,
    ApplyOrderDiscount         = 1L << 2,
    ApplyManagerDiscount       = 1L << 3,
    VoidItem                   = 1L << 4,
    VoidOrder                  = 1L << 5,
    OverridePrice              = 1L << 6,
    OpenCashDrawer             = 1L << 7,
    RefundOrder                = 1L << 8,
    // Inventory
    ViewInventory              = 1L << 10,
    EditInventory              = 1L << 11,
    CreatePurchaseOrder        = 1L << 12,
    ReceiveStock               = 1L << 13,
    AdjustStock                = 1L << 14,
    // Tables
    ManageFloorPlan            = 1L << 20,
    TransferTable              = 1L << 21,
    MergeTable                 = 1L << 22,
    // HR
    ViewEmployees              = 1L << 30,
    EditEmployees              = 1L << 31,
    ManageSchedule             = 1L << 32,
    ApproveTimesheets          = 1L << 33,
    RunPayroll                 = 1L << 34,
    // Accounting
    ViewAccounting             = 1L << 40,
    PostJournalEntries         = 1L << 41,
    ApproveExpenses            = 1L << 42,
    ViewFinancialReports       = 1L << 43,
    // Admin
    ManageSettings             = 1L << 50,
    ManageIntegrations         = 1L << 51,
    ViewAuditLog               = 1L << 52,
}
```

---

## 3. Application Layer — Commands & Queries

### Complete Order Command
```csharp
// Command
public record CompleteOrderCommand(
    Guid OrderId,
    List<PaymentRequest> Payments,
    Guid EmployeeId
) : IRequest<CompleteOrderResult>;

public record PaymentRequest(PaymentMethod Method, decimal Amount, decimal TipAmount, string? Reference);

// Handler
public class CompleteOrderHandler : IRequestHandler<CompleteOrderCommand, CompleteOrderResult>
{
    private readonly IOrderRepository _orders;
    private readonly IInventoryService _inventory;
    private readonly ILoyaltyService _loyalty;
    private readonly IAccountingService _accounting;
    private readonly IPaymentGateway _gateway;
    private readonly IUnitOfWork _uow;

    public async Task<CompleteOrderResult> Handle(CompleteOrderCommand cmd, CancellationToken ct)
    {
        await using var tx = await _uow.BeginTransactionAsync(ct);

        var order = await _orders.GetWithItemsAsync(cmd.OrderId, ct)
            ?? throw new NotFoundException(nameof(Order), cmd.OrderId);

        // Process each payment
        foreach (var paymentReq in cmd.Payments)
        {
            Payment payment;
            if (paymentReq.Method == PaymentMethod.Card)
            {
                var result = await _gateway.ChargeAsync(new GatewayChargeRequest(
                    Amount: paymentReq.Amount,
                    TipAmount: paymentReq.TipAmount,
                    Reference: paymentReq.Reference
                ), ct);
                payment = Payment.FromGatewayResult(result, paymentReq.TipAmount);
            }
            else
            {
                payment = Payment.Cash(paymentReq.Amount);
            }

            order.AddPayment(payment);
        }

        // Deduct inventory (fire-and-forget if recipe items)
        await _inventory.DeductForOrderAsync(order, ct);

        // Post accounting entries
        await _accounting.PostOrderJournalAsync(order, ct);

        // Award loyalty points
        if (order.CustomerId.HasValue)
            await _loyalty.AwardPointsAsync(order.CustomerId.Value, order.Total, order.Id, ct);

        await _orders.SaveAsync(order, ct);
        await tx.CommitAsync(ct);

        return new CompleteOrderResult(order.Id, order.Total, order.AmountPaid - order.Total);
    }
}
```

### Stock Deduction Service
```csharp
public class InventoryService : IInventoryService
{
    public async Task DeductForOrderAsync(Order order, CancellationToken ct)
    {
        foreach (var item in order.Items.Where(i => !i.IsVoided))
        {
            var product = await _products.GetWithRecipeAsync(item.ProductId, ct);

            if (product.Recipe != null)
            {
                // Restaurant: deduct raw ingredients
                foreach (var ingredient in product.Recipe.Ingredients)
                {
                    var deductQty = ingredient.Quantity * item.Quantity * (1 + ingredient.WastagePercent / 100);
                    await DeductStockAsync(ingredient.IngredientProductId, deductQty, order.StoreId, ct);
                }
            }
            else if (product.TrackInventory)
            {
                // Retail: deduct the product itself
                await DeductStockAsync(item.ProductId, item.Quantity, order.StoreId, ct);
            }
        }
    }

    private async Task DeductStockAsync(Guid productId, decimal qty, Guid storeId, CancellationToken ct)
    {
        var level = await _db.InventoryLevels
            .FirstOrDefaultAsync(l => l.ProductId == productId && l.StoreId == storeId, ct)
            ?? throw new NotFoundException($"Inventory level not found for product {productId}");

        if (level.QtyOnHand - qty < 0 && !level.AllowNegative)
            throw new InsufficientStockException(productId, level.QtyOnHand, qty);

        level.QtyOnHand -= qty;

        // Record movement
        _db.StockMovements.Add(new StockMovement
        {
            ProductId = productId, StoreId = storeId,
            Type = MovementType.Sale, Quantity = -qty,
            CostPerUnit = level.CurrentCost,
            CreatedAt = DateTimeOffset.UtcNow
        });

        // Check if low-stock alert needed
        if (level.QtyOnHand <= level.ReorderPoint)
            await _notifications.SendLowStockAlertAsync(productId, level.QtyOnHand, ct);
    }
}
```

### Tax Calculation Service
```csharp
public class TaxCalculationService
{
    public TaxBreakdown Calculate(Product product, decimal quantity, decimal unitPrice, Guid storeId)
    {
        var taxRules = _taxRuleRepository.GetRulesForProduct(product.CategoryId, storeId);
        var breakdown = new List<TaxLine>();

        foreach (var rule in taxRules.Where(r => r.IsActive))
        {
            if (product.IsTaxExempt || product.Category.IsTaxExempt)
                continue;

            decimal taxBase = rule.IsInclusive
                ? unitPrice * quantity / (1 + rule.Rate / 100)   // extract tax from inclusive price
                : unitPrice * quantity;                            // tax added on top

            decimal taxAmount = taxBase * (rule.Rate / 100);

            if (rule.IsInclusive)
                taxAmount = unitPrice * quantity - taxBase;

            breakdown.Add(new TaxLine
            {
                TaxName = rule.Name,
                Rate = rule.Rate,
                Amount = RoundTax(taxAmount, rule.RoundingRule),
                IsInclusive = rule.IsInclusive
            });
        }

        return new TaxBreakdown(breakdown);
    }

    private decimal RoundTax(decimal amount, TaxRoundingRule rule) => rule switch
    {
        TaxRoundingRule.RoundUp   => Math.Ceiling(amount * 100) / 100,
        TaxRoundingRule.RoundDown => Math.Floor(amount * 100) / 100,
        _                         => Math.Round(amount, 2, MidpointRounding.AwayFromZero)
    };
}
```

### Commission Calculation
```csharp
public class CommissionService
{
    public async Task<decimal> CalculateForPeriodAsync(Guid employeeId, DateRange period, CancellationToken ct)
    {
        var rules = await _commissionRules.GetActiveForEmployeeAsync(employeeId, ct);
        var orders = await _orders.GetCompletedByEmployeeAsync(employeeId, period, ct);

        decimal total = 0;

        foreach (var rule in rules.OrderBy(r => r.Priority))
        {
            switch (rule.Type)
            {
                case CommissionType.FlatPerSale:
                    total += orders.Count(o => Matches(o, rule)) * rule.FlatAmount!.Value;
                    break;

                case CommissionType.PercentOfRevenue:
                    var matchingRevenue = orders
                        .Where(o => Matches(o, rule))
                        .Sum(o => rule.CategoryId.HasValue
                            ? o.Items.Where(i => i.CategoryId == rule.CategoryId).Sum(i => i.LineTotal)
                            : o.SubTotal);
                    total += matchingRevenue * (rule.Percentage!.Value / 100);
                    break;

                case CommissionType.Tiered:
                    var periodRevenue = orders.Where(o => Matches(o, rule)).Sum(o => o.SubTotal);
                    total += CalculateTiered(periodRevenue, rule.Tiers);
                    break;
            }
        }

        return total;
    }
}
```

---

## 4. API Endpoints (Minimal APIs)

### Order Endpoints
```csharp
// ScalaPOS.Api/Endpoints/OrderEndpoints.cs
public static class OrderEndpoints
{
    public static WebApplication MapOrderEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/orders").RequireAuthorization();

        group.MapPost("/", async (CreateOrderRequest req, IMediator m, CancellationToken ct) =>
        {
            var result = await m.Send(req.ToCommand(), ct);
            return Results.Created($"/api/v1/orders/{result.OrderId}", result);
        });

        group.MapGet("/{id:guid}", async (Guid id, IMediator m, CancellationToken ct) =>
        {
            var result = await m.Send(new GetOrderQuery(id), ct);
            return result == null ? Results.NotFound() : Results.Ok(result);
        });

        group.MapPost("/{id:guid}/items", async (Guid id, AddOrderItemRequest req, IMediator m, CancellationToken ct) =>
        {
            await m.Send(new AddOrderItemCommand(id, req.ProductId, req.VariantId, req.Quantity, req.Modifiers, req.Notes), ct);
            return Results.NoContent();
        });

        group.MapDelete("/{id:guid}/items/{itemId:guid}", async (Guid id, Guid itemId, string reason, IMediator m, CancellationToken ct) =>
        {
            await m.Send(new RemoveOrderItemCommand(id, itemId, reason), ct);
            return Results.NoContent();
        });

        group.MapPost("/{id:guid}/complete", async (Guid id, CompleteOrderRequest req, IMediator m, CancellationToken ct) =>
        {
            var result = await m.Send(new CompleteOrderCommand(id, req.Payments, req.EmployeeId), ct);
            return Results.Ok(result);
        });

        group.MapPost("/{id:guid}/split", async (Guid id, SplitBillRequest req, IMediator m, CancellationToken ct) =>
        {
            var result = await m.Send(new SplitBillCommand(id, req.Mode, req.Parties), ct);
            return Results.Ok(result);
        });

        group.MapPost("/{id:guid}/refund", async (Guid id, RefundRequest req, IMediator m, CancellationToken ct) =>
        {
            var result = await m.Send(new RefundOrderCommand(id, req.ItemIds, req.Reason, req.Method), ct);
            return Results.Ok(result);
        });

        group.MapPost("/{id:guid}/void", async (Guid id, VoidRequest req, IMediator m, CancellationToken ct) =>
        {
            await m.Send(new VoidOrderCommand(id, req.Reason), ct);
            return Results.NoContent();
        });

        group.MapGet("/open", async ([FromQuery] Guid storeId, IMediator m, CancellationToken ct) =>
            Results.Ok(await m.Send(new GetOpenOrdersQuery(storeId), ct)));

        return app;
    }
}
```

### Sync Endpoints
```csharp
public static class SyncEndpoints
{
    public static WebApplication MapSyncEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/v1/sync").RequireAuthorization();

        // Push: local device sends its pending changes to cloud
        group.MapPost("/push", async (SyncPushRequest req, ISyncService sync, CancellationToken ct) =>
        {
            var result = await sync.ApplyPushedChangesAsync(req.Changes, req.DeviceId, ct);
            return Results.Ok(result);
        });

        // Pull: local device fetches what's changed in cloud since last sync
        group.MapGet("/pull", async ([FromQuery] long sinceVersion, [FromQuery] Guid storeId,
            ISyncService sync, CancellationToken ct) =>
        {
            var changes = await sync.GetChangesSinceAsync(storeId, sinceVersion, ct);
            return Results.Ok(changes);
        });

        return app;
    }
}
```

---

## 5. Business Logic Services

### Payroll Calculation Service
```csharp
public class PayrollService
{
    public async Task<PayrollRun> CalculateAsync(Guid storeId, DateRange period, CancellationToken ct)
    {
        var employees = await _employees.GetActiveForStoreAsync(storeId, ct);
        var lines = new List<PayrollLine>();

        foreach (var emp in employees)
        {
            var timeEntries = await _timeEntries.GetApprovedAsync(emp.Id, period, ct);
            var commission = await _commissionService.CalculateForPeriodAsync(emp.Id, period, ct);
            var tips = await _tipService.GetPeriodTipsAsync(emp.Id, period, ct);

            var regularHours = CalculateRegularHours(timeEntries, emp.OvertimeConfig);
            var overtimeHours = CalculateOvertimeHours(timeEntries, emp.OvertimeConfig);
            var doubleTimeHours = CalculateDoubleTimeHours(timeEntries, emp.OvertimeConfig);

            var grossPay = emp.EmploymentType == EmploymentType.Salaried
                ? emp.Salary!.Value / 26    // fortnightly
                : (regularHours * emp.HourlyRate)
                  + (overtimeHours * emp.HourlyRate * 1.5m)
                  + (doubleTimeHours * emp.HourlyRate * 2m)
                  + commission
                  + tips;

            var tax = _taxCalculator.CalculatePayrollTax(grossPay, emp.TaxSettings);
            var superannuation = grossPay * emp.SuperRate;

            lines.Add(new PayrollLine
            {
                EmployeeId = emp.Id,
                RegularHours = regularHours,
                OvertimeHours = overtimeHours,
                CommissionAmount = commission,
                TipAmount = tips,
                GrossPay = grossPay,
                TaxWithheld = tax,
                Superannuation = superannuation,
                NetPay = grossPay - tax - superannuation,
            });
        }

        return new PayrollRun { Period = period, Lines = lines, TotalNetPay = lines.Sum(l => l.NetPay) };
    }
}
```

### Loyalty Points Service
```csharp
public class LoyaltyService
{
    public async Task AwardPointsAsync(Guid customerId, decimal orderTotal, Guid orderId, CancellationToken ct)
    {
        var program = await _programs.GetActiveAsync(ct);
        var customer = await _customers.GetAsync(customerId, ct);

        var multiplier = GetTierMultiplier(customer.Tier, program);
        var bonusMultiplier = await GetActiveBonusMultiplierAsync(customerId, ct);

        var points = (int)Math.Floor(orderTotal * program.PointsPerDollar * multiplier * bonusMultiplier);

        customer.LoyaltyPoints += points;
        customer.Tier = CalculateNewTier(customer.LoyaltyPoints, program.Tiers);

        _db.LoyaltyTransactions.Add(new LoyaltyTransaction
        {
            CustomerId = customerId,
            OrderId = orderId,
            Type = LoyaltyTransactionType.Earn,
            Points = points,
            BalanceAfter = customer.LoyaltyPoints,
        });

        await _db.SaveChangesAsync(ct);
    }

    public async Task<RedeemResult> RedeemPointsAsync(Guid customerId, int points, CancellationToken ct)
    {
        var customer = await _customers.GetAsync(customerId, ct);
        var program = await _programs.GetActiveAsync(ct);

        if (customer.LoyaltyPoints < points)
            throw new InsufficientPointsException(customer.LoyaltyPoints, points);

        var dollarValue = points * program.DollarValuePerPoint;
        customer.LoyaltyPoints -= points;

        _db.LoyaltyTransactions.Add(new LoyaltyTransaction
        {
            CustomerId = customerId,
            Type = LoyaltyTransactionType.Redeem,
            Points = -points,
            BalanceAfter = customer.LoyaltyPoints,
        });

        return new RedeemResult(dollarValue, customer.LoyaltyPoints);
    }
}
```

### Double-Entry Accounting Service
```csharp
public class AccountingService
{
    // Post journal entries for every financial event
    public async Task PostOrderJournalAsync(Order order, CancellationToken ct)
    {
        var cashAccount     = await _accounts.GetSystemAccountAsync(SystemAccount.CashDrawer, order.StoreId, ct);
        var cardAccount     = await _accounts.GetSystemAccountAsync(SystemAccount.CardReceivable, order.StoreId, ct);
        var revenueAccount  = await _accounts.GetSystemAccountAsync(SystemAccount.SalesRevenue, order.StoreId, ct);
        var taxAccount      = await _accounts.GetSystemAccountAsync(SystemAccount.SalesTaxPayable, order.StoreId, ct);
        var cogsAccount     = await _accounts.GetSystemAccountAsync(SystemAccount.COGS, order.StoreId, ct);
        var inventoryAccount= await _accounts.GetSystemAccountAsync(SystemAccount.Inventory, order.StoreId, ct);

        var entry = JournalEntry.Create($"Sale {order.Reference}", order.Id.ToString());

        // Debit: payment accounts
        foreach (var payment in order.Payments.Where(p => p.Status == PaymentStatus.Completed))
        {
            var account = payment.Method == PaymentMethod.Cash ? cashAccount : cardAccount;
            entry.AddLine(account.Id, debit: payment.Amount, credit: 0);
        }

        // Credit: revenue
        entry.AddLine(revenueAccount.Id, debit: 0, credit: order.SubTotal - order.DiscountTotal);

        // Credit: tax
        if (order.TaxAmount > 0)
            entry.AddLine(taxAccount.Id, debit: 0, credit: order.TaxAmount);

        // COGS debit / Inventory credit (if costing enabled)
        if (order.HasCostableItems)
        {
            entry.AddLine(cogsAccount.Id, debit: order.TotalCost, credit: 0);
            entry.AddLine(inventoryAccount.Id, debit: 0, credit: order.TotalCost);
        }

        entry.Validate(); // throws if debits ≠ credits
        _db.JournalEntries.Add(entry);
    }
}
```

---

## 6. SignalR Real-Time Hub

```csharp
[Authorize]
public class PosHub : Hub
{
    private readonly ITableService _tables;
    private readonly IOrderService _orders;

    public async Task JoinStore(Guid storeId)
    {
        // Verify employee belongs to this store
        var employee = await _employees.GetAsync(_currentUser.EmployeeId);
        if (employee.StoreId != storeId)
            throw new HubException("Access denied to store");

        await Groups.AddToGroupAsync(Context.ConnectionId, $"store:{storeId}");

        // Send current state to newly joined device
        var tables = await _tables.GetLiveStatusAsync(storeId);
        await Clients.Caller.SendAsync("InitialTableState", tables);

        var openOrders = await _orders.GetOpenAsync(storeId);
        await Clients.Caller.SendAsync("InitialOpenOrders", openOrders);
    }

    public async Task JoinKdsStation(Guid stationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"kds:{stationId}");
        var pendingOrders = await _orders.GetPendingForStationAsync(stationId);
        await Clients.Caller.SendAsync("KdsCurrentOrders", pendingOrders);
    }

    public async Task BumpKdsItem(Guid orderId, Guid itemId, Guid stationId)
    {
        await _orders.BumpKdsItemAsync(orderId, itemId, stationId);
        await Clients.Group($"kds:{stationId}").SendAsync("ItemBumped", orderId, itemId);
    }

    // Called by backend services (not clients) to broadcast events:
    // await _hubContext.Clients.Group($"store:{storeId}").SendAsync("TableStatusChanged", tableId, status);
}
```

---

## 7. Background Worker Services

### Hangfire Recurring Jobs
```csharp
// Registered in Program.cs
RecurringJob.AddOrUpdate<SyncWorker>("cloud-sync", w => w.RunAsync(CancellationToken.None), "*/30 * * * * *"); // every 30s
RecurringJob.AddOrUpdate<LowStockCheck>("low-stock", w => w.RunAsync(), Cron.Hourly());
RecurringJob.AddOrUpdate<SubscriptionBilling>("subscriptions", w => w.BillDueSubscriptionsAsync(), Cron.Daily());
RecurringJob.AddOrUpdate<ReportScheduler>("scheduled-reports", w => w.SendScheduledReportsAsync(), "0 6 * * *"); // 6am daily
RecurringJob.AddOrUpdate<LoyaltyExpiry>("loyalty-expiry", w => w.ExpireOldPointsAsync(), Cron.Daily());
RecurringJob.AddOrUpdate<ReservationReminders>("reservation-reminders", w => w.SendRemindersAsync(), "*/15 * * * *"); // every 15m
RecurringJob.AddOrUpdate<AppointmentReminders>("appointment-reminders", w => w.SendRemindersAsync(), "*/15 * * * *");
```

---

## 8. Hardware Integration

### Receipt Printer (ESC/POS)
```csharp
public class EpsonEscPosPrinter : IReceiptPrinter
{
    public async Task PrintReceiptAsync(ReceiptData data, CancellationToken ct)
    {
        using var doc = new EscPosDocument();

        doc.Align(Alignment.Center);
        doc.SetBold(true);
        doc.AppendLine(data.StoreName);
        doc.SetBold(false);
        doc.AppendLine(data.StoreAddress);
        doc.FeedLine();

        doc.Align(Alignment.Left);
        doc.AppendLine($"Receipt: {data.OrderReference}");
        doc.AppendLine($"Date: {data.CompletedAt:dd/MM/yyyy HH:mm}");
        doc.AppendLine($"Server: {data.EmployeeName}");
        doc.DrawLine();

        foreach (var item in data.Items)
        {
            doc.AppendTwoColumns($"{item.Qty}x {item.Name}", item.LineTotal.ToString("C"), 42);
            if (item.Modifiers.Any())
                doc.AppendLine($"  + {string.Join(", ", item.Modifiers)}", smallText: true);
        }

        doc.DrawLine();
        doc.AppendTwoColumns("Subtotal", data.SubTotal.ToString("C"), 42);
        if (data.DiscountAmount > 0)
            doc.AppendTwoColumns("Discount", $"-{data.DiscountAmount:C}", 42);
        doc.AppendTwoColumns("Tax", data.TaxAmount.ToString("C"), 42);
        doc.SetBold(true);
        doc.AppendTwoColumns("TOTAL", data.Total.ToString("C"), 42);
        doc.SetBold(false);

        foreach (var payment in data.Payments)
            doc.AppendTwoColumns(payment.Method.ToString(), payment.Amount.ToString("C"), 42);

        if (data.Change > 0)
            doc.AppendTwoColumns("Change", data.Change.ToString("C"), 42);

        doc.FeedLine(3);
        doc.Cut();

        await _printerConnection.SendAsync(doc.GetBytes(), ct);
    }

    public async Task OpenCashDrawerAsync(CancellationToken ct)
    {
        // ESC/POS drawer kick: ESC p m t1 t2
        var kickCommand = new byte[] { 0x1B, 0x70, 0x00, 0x19, 0xFF };
        await _printerConnection.SendAsync(kickCommand, ct);
    }
}
```

---

## 9. Payment Gateway Integration

### Stripe Terminal
```csharp
public class StripeTerminalGateway : IPaymentGateway
{
    private readonly string _secretKey;

    public async Task<PaymentResult> ChargeAsync(PaymentRequest request, CancellationToken ct)
    {
        // 1. Create PaymentIntent on Stripe
        var intentOptions = new PaymentIntentCreateOptions
        {
            Amount = (long)(request.Amount * 100), // Stripe uses cents
            Currency = "aud",
            CaptureMethod = "automatic",
            PaymentMethodTypes = new List<string> { "card_present" },
            Application = "ca_xxx",   // registered Stripe Connect app
            Metadata = new Dictionary<string, string>
            {
                { "order_id", request.OrderId.ToString() },
                { "store_id", request.StoreId.ToString() }
            }
        };

        var intent = await new PaymentIntentService().CreateAsync(intentOptions, ct: ct);

        // 2. Send to terminal (terminal processes card, returns result)
        // Terminal SDK communicates directly with the Stripe Reader
        // Result comes back via Stripe webhook OR polling

        // 3. Confirm (webhook triggered when card tapped/inserted):
        return new PaymentResult
        {
            Success = intent.Status == "succeeded",
            TransactionId = intent.Id,
            Last4 = intent.PaymentMethod?.Card?.Last4,
            CardBrand = intent.PaymentMethod?.Card?.Brand,
        };
    }

    public async Task<RefundResult> RefundAsync(RefundRequest request, CancellationToken ct)
    {
        var refund = await new RefundService().CreateAsync(new RefundCreateOptions
        {
            PaymentIntent = request.OriginalTransactionId,
            Amount = (long)(request.Amount * 100),
            Reason = "requested_by_customer",
        }, ct: ct);

        return new RefundResult { Success = refund.Status == "succeeded", RefundId = refund.Id };
    }
}
```

---

## 10. External API Integrations

### QuickBooks Online Sync
```csharp
public class QuickBooksService
{
    public async Task SyncDailySalesSummaryAsync(DateOnly date, CancellationToken ct)
    {
        var summary = await _reports.GetDailySummaryAsync(date, ct);
        var client = await GetAuthenticatedClientAsync(ct);

        // Post a Journal Entry to QuickBooks
        var journalEntry = new JournalEntry
        {
            TxnDate = date.ToString("yyyy-MM-dd"),
            DocNumber = $"POS-{date:yyyyMMdd}",
            Line = new List<Line>
            {
                new() { Amount = summary.Revenue, DetailType = "JournalEntryLineDetail",
                    JournalEntryLineDetail = new JournalEntryLineDetail
                    { PostingType = "Credit", AccountRef = new ReferenceType { Value = _config.SalesAccountId } }},
                new() { Amount = summary.Revenue, DetailType = "JournalEntryLineDetail",
                    JournalEntryLineDetail = new JournalEntryLineDetail
                    { PostingType = "Debit", AccountRef = new ReferenceType { Value = _config.BankAccountId } }},
            }
        };

        await client.PostAsync<JournalEntry>(QuickBooksConstants.JournalEntryEndpoint, journalEntry, ct);
    }
}
```

### Twilio SMS
```csharp
public class TwilioSmsService : ISmsService
{
    public async Task SendReceiptAsync(string phone, string receiptUrl, CancellationToken ct)
    {
        await MessageResource.CreateAsync(
            to: new PhoneNumber(phone),
            from: new PhoneNumber(_config.FromNumber),
            body: $"Your receipt from {_config.StoreName}: {receiptUrl}",
            client: _twilioClient
        );
    }

    public async Task SendReservationReminderAsync(Reservation reservation, CancellationToken ct)
    {
        var message = $"Reminder: Your reservation at {_config.StoreName} is at {reservation.ReservationTime:HH:mm} today for {reservation.PartySize} guests. Reply CANCEL to cancel.";
        await MessageResource.CreateAsync(to: reservation.Phone, from: _config.FromNumber, body: message, client: _twilioClient);
    }
}
```

---

## 11. Testing Strategy

### Unit Tests (Domain Logic)
```csharp
public class OrderTests
{
    [Fact]
    public void AddItem_WhenOrderClosed_ThrowsDomainException()
    {
        var order = OrderTestFactory.CreateCompleted();
        var product = ProductTestFactory.Create();

        Assert.Throws<DomainException>(() => order.AddItem(product, null, 1, new List<Modifier>()));
    }

    [Fact]
    public void ApplyManagerDiscount_WithoutManagerApproval_ThrowsDomainException()
    {
        var order = OrderTestFactory.CreateOpen();
        Assert.Throws<DomainException>(() =>
            order.ApplyDiscount(10m, DiscountType.ManagerOverride, Guid.NewGuid(), managerApprovalId: null));
    }

    [Fact]
    public void AddPayment_ExceedingBalance_ThrowsDomainException()
    {
        var order = OrderTestFactory.CreateWithTotal(50m);
        Assert.Throws<DomainException>(() => order.AddPayment(Payment.Cash(60m)));
    }
}
```

### Integration Tests (API + SQLite)
```csharp
public class OrderApiTests : IClassFixture<TestWebApplicationFactory>
{
    [Fact]
    public async Task CompleteOrder_ValidPayment_Returns200AndPostsJournal()
    {
        // Arrange
        var order = await CreateOpenOrderAsync();
        var request = new CompleteOrderRequest(
            Payments: [new PaymentRequest(PaymentMethod.Cash, order.Total, 0, null)]
        );

        // Act
        var response = await _client.PostAsJsonAsync($"/api/v1/orders/{order.Id}/complete", request);

        // Assert
        response.EnsureSuccessStatusCode();
        var journalEntry = await _db.JournalEntries.FirstOrDefaultAsync(j => j.Reference == order.Id.ToString());
        Assert.NotNull(journalEntry);
        Assert.Equal(0, journalEntry.Lines.Sum(l => l.Debit - l.Credit)); // balanced
    }
}
```

---

## 12. Module-by-Module Backend Tasks

### Phase 1 — Backend Tasks Checklist

**Auth & Security**
- [ ] ASP.NET Core Identity setup with Employee entity
- [ ] JWT RS256 token generation and validation
- [ ] PIN verification endpoint (bcrypt)
- [ ] RBAC middleware with Permission enum bitmask
- [ ] Refresh token endpoint
- [ ] Audit log behaviour in MediatR pipeline

**POS Core**
- [ ] Order aggregate with domain logic
- [ ] CompleteOrderCommand handler (payments + inventory + accounting + loyalty)
- [ ] Tax calculation service (inclusive/exclusive, multi-rate)
- [ ] Discount service (item, order, manager override, coupon)
- [ ] Refund command handler (full + partial, restock toggle)
- [ ] VoidOrder command handler
- [ ] SplitBillCommand handler (all 4 modes)
- [ ] Hold/recall order endpoints
- [ ] Receipt generation service (ESC/POS + email)

**Inventory**
- [ ] StockDeduction service (direct product + recipe ingredients)
- [ ] Low stock alert trigger + notification
- [ ] PurchaseOrder CRUD + receive stock workflow
- [ ] Stock adjustment endpoint
- [ ] FTS5 product search endpoint (< 50ms target)

**Tables**
- [ ] Table status CRUD
- [ ] MergeTable command (combine orders)
- [ ] TransferTable command (move order)
- [ ] Reservation CRUD + confirmation SMS/email
- [ ] Waitlist CRUD + SMS notification

**Employees & Time**
- [ ] ClockIn / ClockOut command handlers
- [ ] Overtime detection on clock-out
- [ ] Z-report generation on shift close
- [ ] Cash session open/close workflow

**Sync**
- [ ] SyncQueue table + enqueue on every write
- [ ] Push endpoint (apply local changes to cloud PostgreSQL)
- [ ] Pull endpoint (return changes since version N)
- [ ] Conflict resolution per entity type
- [ ] LAN discovery (mDNS) service
- [ ] SignalR LAN sync hub

**Phase 2 — Additional Backend Tasks**
- [ ] Payroll calculation service (regular + OT + commission + tips + deductions)
- [ ] Commission calculation service (flat, %, tiered)
- [ ] Tip pooling service (multiple distribution methods)
- [ ] Double-entry accounting service (auto journal for all events)
- [ ] QuickBooks OAuth + sync service
- [ ] Xero OAuth + sync service
- [ ] Loyalty program full service (earn, redeem, tiers, bonuses, expiry)
- [ ] Subscription billing service (Hangfire recurring + dunning)
- [ ] Manufacturing Order service (BOM explosion, work orders)
- [ ] Purchase RFQ multi-supplier comparison
- [ ] Helpdesk SLA timer service (Hangfire checks every 5min)
- [ ] Timesheet approval workflow
- [ ] Project budget tracking service
- [ ] WhatsApp Business API integration (Meta Cloud API)
- [ ] Digital signing service (PDF field placement + audit trail)
