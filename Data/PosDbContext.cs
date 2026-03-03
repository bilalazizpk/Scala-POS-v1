using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Models;

namespace ScalaPOS.Data
{
    public class PosDbContext : DbContext
    {
        public DbSet<Product> Products { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderPayment> OrderPayments { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<InventoryItem> InventoryItems { get; set; }
        public DbSet<Staff> Staff { get; set; }
        public DbSet<RestaurantTable> Tables { get; set; }
        public DbSet<Shift> Shifts { get; set; }
        public DbSet<TimeEntry> TimeEntries { get; set; }
        
        // Accounting
        public DbSet<Account> Accounts { get; set; }
        public DbSet<JournalEntry> JournalEntries { get; set; }
        public DbSet<JournalLine> JournalLines { get; set; }
        
        // Appointments
        public DbSet<Appointment> Appointments { get; set; }

        // Security & Audit
        public DbSet<AuditLog> AuditLogs { get; set; }

        // Helpdesk
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<TicketComment> TicketComments { get; set; }

        // Supply Chain
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseOrderLine> PurchaseOrderLines { get; set; }

        // Projects
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectTask> ProjectTasks { get; set; }

        // Documents
        public DbSet<Document> Documents { get; set; }

        // Offline Sync
        public DbSet<SyncLog> SyncLogs { get; set; }

        // WhatsApp
        public DbSet<WhatsAppMessage> WhatsAppMessages { get; set; }
        
        // Reservations & Waitlist
        public DbSet<Reservation> Reservations { get; set; }
        public DbSet<WaitlistEntry> WaitlistEntries { get; set; }
        
        protected override void OnConfiguring(DbContextOptionsBuilder options)
        {
            string dbPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "posdb.db");
            options.UseSqlite($"Data Source={dbPath}");
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Category configuration
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.TargetKdsStation).HasMaxLength(50);
                entity.HasMany(e => e.Products)
                    .WithOne(p => p.Category)
                    .HasForeignKey(p => p.CategoryId);
            });

            // Product configuration
            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Price).HasPrecision(10, 2);
                entity.Property(e => e.CostPrice).HasPrecision(10, 2);
                entity.Property(e => e.SKU).HasMaxLength(50);
                entity.Property(e => e.Barcode).HasMaxLength(50);
            });

            // Customer configuration
            modelBuilder.Entity<Customer>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LastName).HasMaxLength(100);
                entity.Property(e => e.Email).HasMaxLength(255);
                entity.Property(e => e.Phone).HasMaxLength(20);
                entity.Property(e => e.TotalSpent).HasPrecision(10, 2);
                entity.HasMany(e => e.Orders)
                    .WithOne(o => o.Customer)
                    .HasForeignKey(o => o.CustomerId);
            });

            // Staff configuration
            modelBuilder.Entity<Staff>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.LastName).HasMaxLength(100);
                entity.Property(e => e.Email).HasMaxLength(255);
                entity.Property(e => e.HourlyRate).HasPrecision(10, 2);
                entity.Property(e => e.EmployeeId).HasMaxLength(50);
            });

            // Shift configuration
            modelBuilder.Entity<Shift>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Role).HasMaxLength(50);
                entity.Property(e => e.Notes).HasMaxLength(500);
                entity.Property(e => e.Color).HasMaxLength(20);
                entity.HasOne(e => e.Staff)
                    .WithMany()
                    .HasForeignKey(e => e.StaffId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // RestaurantTable configuration
            modelBuilder.Entity<RestaurantTable>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("RestaurantTables");
                entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Shape).IsRequired(false).HasMaxLength(50);
                entity.Property(e => e.Section).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.Status).IsRequired(false).HasMaxLength(50);
                entity.Property(e => e.Notes).IsRequired(false).HasMaxLength(500);
                entity.Property(e => e.Width).HasDefaultValue(80);
                entity.Property(e => e.Height).HasDefaultValue(80);
                entity.Property(e => e.Angle).HasDefaultValue(0);
            });

            // Appointment configuration
            modelBuilder.Entity<Appointment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("Appointments");
                entity.Property(e => e.Title).IsRequired(false).HasMaxLength(200);
                entity.Property(e => e.CustomerName).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.CustomerPhone).IsRequired(false).HasMaxLength(30);
                entity.Property(e => e.CustomerEmail).IsRequired(false).HasMaxLength(150);
                entity.Property(e => e.Status).HasMaxLength(30).HasDefaultValue("pending");
                entity.Property(e => e.Notes).IsRequired(false).HasMaxLength(1000);
                entity.HasOne(e => e.Table)
                    .WithMany()
                    .HasForeignKey(e => e.TableId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // AuditLog configuration
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("AuditLogs");
                entity.Property(e => e.Action).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.EntityType).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.EntityId).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.Description).IsRequired(false).HasMaxLength(500);
                entity.Property(e => e.Category).IsRequired(false).HasMaxLength(50);
                entity.Property(e => e.Result).IsRequired(false).HasMaxLength(20);
                entity.Property(e => e.UserId).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.UserName).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.IPAddress).IsRequired(false).HasMaxLength(50);
                entity.Property(e => e.OldValue).IsRequired(false);
                entity.Property(e => e.NewValue).IsRequired(false);
                entity.HasIndex(e => e.Timestamp);
                entity.HasIndex(e => e.Category);
                entity.HasIndex(e => new { e.EntityType, e.EntityId });
            });

            // Ticket (Helpdesk) configuration
            modelBuilder.Entity<Ticket>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("Tickets");
                entity.Property(e => e.TicketNumber).IsRequired(false).HasMaxLength(20);
                entity.Property(e => e.Title).IsRequired(false).HasMaxLength(200);
                entity.Property(e => e.Description).IsRequired(false);
                entity.Property(e => e.Status).HasMaxLength(30).HasDefaultValue("open");
                entity.Property(e => e.Priority).HasMaxLength(20).HasDefaultValue("medium");
                entity.Property(e => e.Category).HasMaxLength(50).HasDefaultValue("other");
                entity.Property(e => e.ReportedBy).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.ReportedById).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.AssignedTo).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.AssignedToId).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.Resolution).IsRequired(false);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.Priority);
            });

            modelBuilder.Entity<TicketComment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("TicketComments");
                entity.Property(e => e.Body).IsRequired(false);
                entity.Property(e => e.AuthorName).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.AuthorId).IsRequired(false).HasMaxLength(100);
                entity.HasOne(e => e.Ticket)
                    .WithMany(t => t.Comments)
                    .HasForeignKey(e => e.TicketId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Supply Chain configuration
            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("Suppliers");
                entity.Property(e => e.Name).IsRequired(false).HasMaxLength(200);
                entity.Property(e => e.ContactName).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.Email).IsRequired(false).HasMaxLength(150);
                entity.Property(e => e.Phone).IsRequired(false).HasMaxLength(30);
                entity.Property(e => e.Address).IsRequired(false).HasMaxLength(300);
                entity.Property(e => e.TaxNumber).IsRequired(false).HasMaxLength(50);
                entity.Property(e => e.PaymentTerms).IsRequired(false).HasMaxLength(50);
                entity.Property(e => e.Notes).IsRequired(false);
            });

            modelBuilder.Entity<PurchaseOrder>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("PurchaseOrders");
                entity.Property(e => e.PoNumber).IsRequired(false).HasMaxLength(20);
                entity.Property(e => e.Status).HasMaxLength(30).HasDefaultValue("draft");
                entity.Property(e => e.Notes).IsRequired(false);
                entity.Property(e => e.SubTotal).HasPrecision(10, 2);
                entity.Property(e => e.Tax).HasPrecision(10, 2);
                entity.Property(e => e.Total).HasPrecision(10, 2);
                entity.HasOne(e => e.Supplier)
                    .WithMany(s => s.PurchaseOrders)
                    .HasForeignKey(e => e.SupplierId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<PurchaseOrderLine>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("PurchaseOrderLines");
                entity.Property(e => e.ItemName).IsRequired(false).HasMaxLength(200);
                entity.Property(e => e.Unit).IsRequired(false).HasMaxLength(30);
                entity.Property(e => e.QuantityOrdered).HasPrecision(10, 3);
                entity.Property(e => e.QuantityReceived).HasPrecision(10, 3);
                entity.Property(e => e.UnitCost).HasPrecision(10, 2);
                entity.Property(e => e.LineTotal).HasPrecision(10, 2);
                entity.HasOne(e => e.PurchaseOrder)
                    .WithMany(p => p.Lines)
                    .HasForeignKey(e => e.PurchaseOrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Project configuration
            modelBuilder.Entity<Project>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("Projects");
                entity.Property(e => e.Name).IsRequired(false).HasMaxLength(200);
                entity.Property(e => e.Description).IsRequired(false);
                entity.Property(e => e.Status).HasMaxLength(30).HasDefaultValue("active");
                entity.Property(e => e.Priority).HasMaxLength(20).HasDefaultValue("medium");
                entity.Property(e => e.ClientName).IsRequired(false).HasMaxLength(150);
                entity.Property(e => e.ManagerId).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.ManagerName).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.Color).IsRequired(false).HasMaxLength(10);
                entity.Property(e => e.Budget).HasPrecision(12, 2);
            });

            modelBuilder.Entity<ProjectTask>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("ProjectTasks");
                entity.Property(e => e.Title).IsRequired(false).HasMaxLength(200);
                entity.Property(e => e.Description).IsRequired(false);
                entity.Property(e => e.Status).HasMaxLength(30).HasDefaultValue("todo");
                entity.Property(e => e.Priority).HasMaxLength(20).HasDefaultValue("medium");
                entity.Property(e => e.AssignedToId).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.AssignedToName).IsRequired(false).HasMaxLength(100);
                entity.HasOne(e => e.Project)
                    .WithMany(p => p.Tasks)
                    .HasForeignKey(e => e.ProjectId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Document configuration
            modelBuilder.Entity<Document>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("Documents");
                entity.Property(e => e.FileName).IsRequired(false).HasMaxLength(300);
                entity.Property(e => e.StoredName).IsRequired(false).HasMaxLength(300);
                entity.Property(e => e.ContentType).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.Category).HasMaxLength(50).HasDefaultValue("other");
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("active");
                entity.Property(e => e.Description).IsRequired(false);
                entity.Property(e => e.Tags).IsRequired(false).HasMaxLength(500);
                entity.Property(e => e.UploadedById).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.UploadedByName).IsRequired(false).HasMaxLength(100);
                entity.HasIndex(e => e.Category);
                entity.HasIndex(e => e.Status);
            });

            // Offline Sync configuration
            modelBuilder.Entity<SyncLog>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("SyncLogs");
                entity.Property(e => e.DeviceId).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.DeviceName).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.Operation).HasMaxLength(20);
                entity.Property(e => e.EntityType).HasMaxLength(50);
                entity.Property(e => e.EntityId).HasMaxLength(100);
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("applied");
                entity.Property(e => e.ConflictNote).IsRequired(false);
                
                // For polling fast delta queries
                entity.HasIndex(e => e.ServerTimestamp);
                
                // Prevent same client mutation from applying twice
                entity.HasIndex(e => new { e.DeviceId, e.ClientSeq }).IsUnique();
            });

            // WhatsApp configuration
            modelBuilder.Entity<WhatsAppMessage>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("WhatsAppMessages");
                entity.Property(e => e.MetaMessageId).IsRequired(false).HasMaxLength(150);
                entity.Property(e => e.CustomerPhone).HasMaxLength(30);
                entity.Property(e => e.CustomerName).IsRequired(false).HasMaxLength(100);
                entity.Property(e => e.Direction).HasMaxLength(20);
                entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("received");
                entity.Property(e => e.MediaUrl).IsRequired(false);
                
                // Index for fetching threads fast
                entity.HasIndex(e => e.CustomerPhone);
                // Index for tracking status updates from Meta
                entity.HasIndex(e => e.MetaMessageId);
            });

            // Order configuration
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.OrderNumber).HasMaxLength(50);
                entity.Property(e => e.SubTotal).HasPrecision(10, 2);
                entity.Property(e => e.Tax).HasPrecision(10, 2);
                entity.Property(e => e.Discount).HasPrecision(10, 2);
                entity.Property(e => e.TotalAmount).HasPrecision(10, 2);
                entity.Property(e => e.OrderStatus).HasMaxLength(50);
                entity.Property(e => e.OrderType).HasMaxLength(50);
                entity.Property(e => e.PaymentMethod).HasMaxLength(50);
                entity.Property(e => e.PaymentStatus).HasMaxLength(50);
                entity.HasMany(e => e.OrderItems)
                    .WithOne(oi => oi.Order)
                    .HasForeignKey(oi => oi.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasMany(e => e.Payments)
                    .WithOne(op => op.Order)
                    .HasForeignKey(op => op.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // OrderPayment configuration
            modelBuilder.Entity<OrderPayment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Amount).HasPrecision(10, 2);
                entity.Property(e => e.PaymentMethod).HasMaxLength(50);
                entity.Property(e => e.Status).HasMaxLength(50);
                entity.Property(e => e.Note).HasMaxLength(255);
            });

            // OrderItem configuration
            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UnitPrice).HasPrecision(10, 2);
                entity.Property(e => e.TotalPrice).HasPrecision(10, 2);
                entity.Property(e => e.Status).HasMaxLength(50);
                entity.Property(e => e.Notes).HasMaxLength(255);
                entity.HasOne(e => e.Order)
                    .WithMany(o => o.OrderItems)
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Product)
                    .WithMany()
                    .HasForeignKey(e => e.ProductId);
            });

            // InventoryItem configuration
            modelBuilder.Entity<InventoryItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.SKU).HasMaxLength(50);
                entity.Property(e => e.CostPrice).HasPrecision(10, 2);
                entity.Property(e => e.Unit).HasMaxLength(50);
                entity.HasOne(e => e.Product)
                    .WithMany()
                    .HasForeignKey(e => e.ProductId);
            });

            // Accounting Configurations
            modelBuilder.Entity<Account>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Code).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.AccountType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.SubType).HasMaxLength(50);
            });

            modelBuilder.Entity<JournalEntry>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Reference).HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.TotalDebit).HasPrecision(14, 2);
                entity.Property(e => e.TotalCredit).HasPrecision(14, 2);
            });

            modelBuilder.Entity<JournalLine>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Description).HasMaxLength(255);
                entity.Property(e => e.Debit).HasPrecision(14, 2);
                entity.Property(e => e.Credit).HasPrecision(14, 2);
                
                entity.HasOne(e => e.JournalEntry)
                    .WithMany(j => j.Lines)
                    .HasForeignKey(e => e.JournalEntryId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.Account)
                    .WithMany(a => a.JournalLines)
                    .HasForeignKey(e => e.AccountId);
            });

            // Seed initial data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            var seedDate = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            // Seed Categories
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Food", Description = "Food items", Icon = "🍔", Color = "#FF6B6B", DisplayOrder = 1, IsActive = true, CreatedAt = seedDate },
                new Category { Id = 2, Name = "Beverages", Description = "Drinks and beverages", Icon = "☕", Color = "#4ECDC4", DisplayOrder = 2, IsActive = true, CreatedAt = seedDate },
                new Category { Id = 3, Name = "Desserts", Description = "Sweet treats", Icon = "🍰", Color = "#FFE66D", DisplayOrder = 3, IsActive = true, CreatedAt = seedDate },
                new Category { Id = 4, Name = "Appetizers", Description = "Starters", Icon = "🍤", Color = "#95E1D3", DisplayOrder = 4, IsActive = true, CreatedAt = seedDate }
            );

            // Seed Chart of Accounts
            modelBuilder.Entity<Account>().HasData(
                new Account { Id = 1, Code = "1000", Name = "Cash on Hand", AccountType = "Asset", SubType = "Current Asset", IsSystemAccount = true, AllowManualEntry = true, CreatedAt = seedDate },
                new Account { Id = 2, Code = "1010", Name = "Cash in Bank", AccountType = "Asset", SubType = "Current Asset", IsSystemAccount = true, AllowManualEntry = false, CreatedAt = seedDate },
                new Account { Id = 3, Code = "1100", Name = "Accounts Receivable", AccountType = "Asset", SubType = "Current Asset", IsSystemAccount = true, AllowManualEntry = false, CreatedAt = seedDate },
                new Account { Id = 4, Code = "1200", Name = "Inventory", AccountType = "Asset", SubType = "Current Asset", IsSystemAccount = true, AllowManualEntry = false, CreatedAt = seedDate },
                new Account { Id = 5, Code = "2000", Name = "Accounts Payable", AccountType = "Liability", SubType = "Current Liability", IsSystemAccount = true, AllowManualEntry = false, CreatedAt = seedDate },
                new Account { Id = 6, Code = "2100", Name = "Sales Tax Payable", AccountType = "Liability", SubType = "Current Liability", IsSystemAccount = true, AllowManualEntry = false, CreatedAt = seedDate },
                new Account { Id = 7, Code = "3000", Name = "Owner's Equity", AccountType = "Equity", SubType = "Equity", IsSystemAccount = true, AllowManualEntry = false, CreatedAt = seedDate },
                new Account { Id = 8, Code = "4000", Name = "Sales Revenue", AccountType = "Revenue", SubType = "Operating Revenue", IsSystemAccount = true, AllowManualEntry = false, CreatedAt = seedDate },
                new Account { Id = 9, Code = "5000", Name = "Cost of Goods Sold", AccountType = "Expense", SubType = "Cost of Sales", IsSystemAccount = true, AllowManualEntry = false, CreatedAt = seedDate },
                new Account { Id = 10, Code = "6000", Name = "Wages Expense", AccountType = "Expense", SubType = "Operating Expense", IsSystemAccount = true, AllowManualEntry = true, CreatedAt = seedDate },
                new Account { Id = 11, Code = "6100", Name = "Rent Expense", AccountType = "Expense", SubType = "Operating Expense", IsSystemAccount = false, AllowManualEntry = true, CreatedAt = seedDate }
            );

            // Seed Products
            modelBuilder.Entity<Product>().HasData(
                new Product { Id = 1, Name = "Burger Deluxe", Description = "Classic beef burger with cheese", Price = 12.99m, StockQuantity = 50, CategoryId = 1, SKU = "FOOD-001", CostPrice = 5.50m, IsActive = true, CreatedAt = seedDate },
                new Product { Id = 2, Name = "Caesar Salad", Description = "Fresh romaine with caesar dressing", Price = 9.99m, StockQuantity = 30, CategoryId = 1, SKU = "FOOD-002", CostPrice = 4.00m, IsActive = true, CreatedAt = seedDate },
                new Product { Id = 3, Name = "Margherita Pizza", Description = "Classic pizza with mozzarella", Price = 15.99m, StockQuantity = 25, CategoryId = 1, SKU = "FOOD-003", CostPrice = 6.50m, IsActive = true, CreatedAt = seedDate },
                new Product { Id = 4, Name = "Espresso", Description = "Strong Italian coffee", Price = 3.50m, StockQuantity = 100, CategoryId = 2, SKU = "BEV-001", CostPrice = 0.80m, IsActive = true, CreatedAt = seedDate },
                new Product { Id = 5, Name = "Orange Juice", Description = "Freshly squeezed", Price = 4.99m, StockQuantity = 40, CategoryId = 2, SKU = "BEV-002", CostPrice = 1.50m, IsActive = true, CreatedAt = seedDate },
                new Product { Id = 6, Name = "Chocolate Cake", Description = "Rich chocolate layer cake", Price = 6.99m, StockQuantity = 20, CategoryId = 3, SKU = "DES-001", CostPrice = 2.50m, IsActive = true, CreatedAt = seedDate },
                new Product { Id = 7, Name = "Spring Rolls", Description = "Crispy vegetable rolls", Price = 7.99m, StockQuantity = 35, CategoryId = 4, SKU = "APP-001", CostPrice = 3.00m, IsActive = true, CreatedAt = seedDate }
            );

            // Seed Suppliers
            modelBuilder.Entity<Supplier>().HasData(
                new Supplier { Id = 1, Name = "Fresh Farms Inc.", ContactName = "Bob Smith", Email = "bob@freshfarms.example.com", Phone = "555-0100", Address = "123 Farm Lane", PaymentTerms = "Net 30", CreatedAt = seedDate },
                new Supplier { Id = 2, Name = "Global Beverages", ContactName = "Alice Jones", Email = "alice@globalbevs.example.com", Phone = "555-0200", Address = "456 Drink Way", PaymentTerms = "Net 15", CreatedAt = seedDate }
            );

            // Seed Inventory Items
            modelBuilder.Entity<InventoryItem>().HasData(
                new InventoryItem { Id = 1, ProductId = 1, SKU = "FOOD-001", CurrentStock = 50, MinimumStock = 20, ReorderLevel = 30, CostPrice = 5.50m, Unit = "pieces", Location = "Freezer 1", BatchNumber = "BATCH-001", LastRestocked = seedDate, CreatedAt = seedDate },
                new InventoryItem { Id = 2, ProductId = 4, SKU = "BEV-001", CurrentStock = 100, MinimumStock = 50, ReorderLevel = 70, CostPrice = 0.80m, Unit = "servings", Location = "Pantry", BatchNumber = "BATCH-002", LastRestocked = seedDate, CreatedAt = seedDate }
            );

            // Seed Staff
            modelBuilder.Entity<Staff>().HasData(
                new Staff { Id = 1, FirstName = "Admin", LastName = "User", Email = "admin@scalapos.com", Phone = "1234567890", Role = "admin", PINCode = "1234", HourlyRate = 25.00m, EmployeeId = "EMP001", HireDate = new DateTime(2023, 1, 1, 0, 0, 0, DateTimeKind.Utc), IsActive = true, ProfileImage = "", CreatedAt = seedDate },
                new Staff { Id = 2, FirstName = "Manager", LastName = "Smith", Email = "manager@scalapos.com", Phone = "1234567891", Role = "manager", PINCode = "5678", HourlyRate = 20.00m, EmployeeId = "EMP002", HireDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), IsActive = true, ProfileImage = "", CreatedAt = seedDate },
                new Staff { Id = 3, FirstName = "Cashier", LastName = "Jones", Email = "cashier@scalapos.com", Phone = "1234567892", Role = "cashier", PINCode = "9012", HourlyRate = 15.00m, EmployeeId = "EMP003", HireDate = new DateTime(2024, 7, 1, 0, 0, 0, DateTimeKind.Utc), IsActive = true, ProfileImage = "", CreatedAt = seedDate }
            );

            // Seed Customers
            modelBuilder.Entity<Customer>().HasData(
                new Customer { Id = 1, FirstName = "John", LastName = "Doe", Email = "john@example.com", Phone = "5551234567", Address = "123 Main St", DateOfBirth = new DateTime(1990, 5, 15, 0, 0, 0, DateTimeKind.Utc), LoyaltyPoints = 250, MembershipTier = "Gold", MemberSince = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), TotalSpent = 1250.00m, VisitCount = 25, IsActive = true, CreatedAt = seedDate },
                new Customer { Id = 2, FirstName = "Jane", LastName = "Smith", Email = "jane@example.com", Phone = "5551234568", Address = "456 Oak Ave", DateOfBirth = new DateTime(1985, 8, 22, 0, 0, 0, DateTimeKind.Utc), LoyaltyPoints = 150, MembershipTier = "Silver", MemberSince = new DateTime(2024, 7, 1, 0, 0, 0, DateTimeKind.Utc), TotalSpent = 750.00m, VisitCount = 15, IsActive = true, CreatedAt = seedDate }
            );
            // NOTE: RestaurantTable seed is handled programmatically in Program.cs after EnsureCreated
            // Seed RestaurantTables
            modelBuilder.Entity<RestaurantTable>().HasData(
                new RestaurantTable { Id = 1,  Name = "T1", Capacity = 4, Shape = "square",    Section = "Indoor",  Status = "available", PositionX = 60,  PositionY = 60,  IsActive = true, CreatedAt = seedDate },
                new RestaurantTable { Id = 2,  Name = "T2", Capacity = 4, Shape = "square",    Section = "Indoor",  Status = "occupied",  PositionX = 200, PositionY = 60,  IsActive = true, CreatedAt = seedDate },
                new RestaurantTable { Id = 3,  Name = "T3", Capacity = 6, Shape = "rectangle", Section = "Indoor",  Status = "reserved",  PositionX = 360, PositionY = 60,  IsActive = true, CreatedAt = seedDate },
                new RestaurantTable { Id = 4,  Name = "T4", Capacity = 2, Shape = "circle",    Section = "Indoor",  Status = "available", PositionX = 60,  PositionY = 200, IsActive = true, CreatedAt = seedDate },
                new RestaurantTable { Id = 5,  Name = "T5", Capacity = 4, Shape = "square",    Section = "Indoor",  Status = "occupied",  PositionX = 200, PositionY = 200, IsActive = true, CreatedAt = seedDate },
                new RestaurantTable { Id = 6,  Name = "T6", Capacity = 8, Shape = "rectangle", Section = "Indoor",  Status = "available", PositionX = 360, PositionY = 200, IsActive = true, CreatedAt = seedDate },
                new RestaurantTable { Id = 7,  Name = "P1", Capacity = 4, Shape = "circle",    Section = "Outdoor", Status = "available", PositionX = 60,  PositionY = 60,  IsActive = true, CreatedAt = seedDate },
                new RestaurantTable { Id = 8,  Name = "P2", Capacity = 4, Shape = "circle",    Section = "Outdoor", Status = "occupied",  PositionX = 200, PositionY = 60,  IsActive = true, CreatedAt = seedDate },
                new RestaurantTable { Id = 9,  Name = "P3", Capacity = 6, Shape = "rectangle", Section = "Outdoor", Status = "available", PositionX = 60,  PositionY = 200, IsActive = true, CreatedAt = seedDate },
                new RestaurantTable { Id = 10,  Name = "B1", Capacity = 2, Shape = "circle",    Section = "Bar",     Status = "available", PositionX = 60,  PositionY = 60,  IsActive = true, CreatedAt = seedDate }
            );

            // Seed Reservations
            modelBuilder.Entity<Reservation>().HasData(
                new Reservation { Id = 1, CustomerId = 1, CustomerName = "John Doe", PhoneNumber = "5551234567", PartySize = 4, ReservationTime = seedDate.AddDays(1).AddHours(19), TableId = 3, Status = "Confirmed", Notes = "Window seat requested", CreatedAt = seedDate },
                new Reservation { Id = 2, CustomerName = "Sarah Connor", PhoneNumber = "5559876543", PartySize = 2, ReservationTime = seedDate.AddDays(1).AddHours(20), TableId = null, Status = "Pending", Notes = "Anniversary dinner", CreatedAt = seedDate }
            );

            // Seed Waitlist
            modelBuilder.Entity<WaitlistEntry>().HasData(
                new WaitlistEntry { Id = 1, CustomerName = "Mike Johnson", PhoneNumber = "5552468135", PartySize = 3, QuotedWaitTime = 25, JoinTime = seedDate.AddMinutes(-10), Status = "Waiting" },
                new WaitlistEntry { Id = 2, CustomerName = "Emily Davis", PhoneNumber = "5551357924", PartySize = 5, QuotedWaitTime = 40, JoinTime = seedDate.AddMinutes(-5), Status = "Waiting" }
            );
        }
    }
}
