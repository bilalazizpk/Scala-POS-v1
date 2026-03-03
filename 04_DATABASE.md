# SCALA POS — Database Engineer Guide
### Role: SQLite · PostgreSQL · EF Core 8 · Migrations · Indexes · Performance · Sync Tables

---

## Table of Contents

1. [Database Strategy](#1-database-strategy)
2. [EF Core Configuration](#2-ef-core-configuration)
3. [Core Schema — All Tables](#3-core-schema--all-tables)
4. [Indexes & Performance](#4-indexes--performance)
5. [EF Core Entity Configurations](#5-ef-core-entity-configurations)
6. [Migrations Strategy](#6-migrations-strategy)
7. [Sync Tables & CDC](#7-sync-tables--cdc)
8. [SQLite-Specific Configuration](#8-sqlite-specific-configuration)
9. [PostgreSQL Cloud Schema](#9-postgresql-cloud-schema)
10. [Query Patterns & Optimisation](#10-query-patterns--optimisation)
11. [Data Seeding](#11-data-seeding)
12. [Backup & Recovery](#12-backup--recovery)

---

## 1. Database Strategy

| Database | Role | Location | Technology |
|---|---|---|---|
| **SQLite (local)** | Source of truth — always available | On each device | SQLite 3.45+ · WAL · SQLCipher AES-256 |
| **PostgreSQL (cloud)** | Multi-store sync target · reporting | AWS RDS / Supabase | PostgreSQL 16 · TimescaleDB ext |
| **Redis** | Sessions · real-time presence · report cache | Cloud (ElastiCache) | Redis 7 |

### Connection Strings
```json
// appsettings.json
{
  "ConnectionStrings": {
    "Sqlite": "Data Source=/var/scalapos/data.db;Password=<derived-key>;",
    "Postgres": "Host=db.scalapos.com;Database=scalapos;Username=app;Password=<secret>;SSL Mode=Require;",
    "Redis": "redis.scalapos.com:6380,ssl=true,password=<secret>"
  }
}
```

### Key Constraints
- Every sync-tracked table has: `sync_version INTEGER`, `updated_at TEXT`, `deleted_at TEXT`, `device_id TEXT`
- All IDs are UUIDs (TEXT in SQLite, UUID in PostgreSQL) — never auto-increment integers
- Soft deletes only — no hard deletes (set `deleted_at` timestamp)
- All timestamps in ISO 8601 UTC: `2025-01-15T09:30:00.000Z`

---

## 2. EF Core Configuration

### AppDbContext
```csharp
public class AppDbContext : DbContext
{
    // === Core POS ===
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<OrderItemModifier> OrderItemModifiers { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<AppliedDiscount> AppliedDiscounts { get; set; }
    public DbSet<Refund> Refunds { get; set; }

    // === Products ===
    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductVariant> ProductVariants { get; set; }
    public DbSet<ProductModifierGroup> ProductModifierGroups { get; set; }
    public DbSet<ProductModifier> ProductModifiers { get; set; }
    public DbSet<Recipe> Recipes { get; set; }
    public DbSet<RecipeIngredient> RecipeIngredients { get; set; }

    // === Inventory ===
    public DbSet<InventoryLevel> InventoryLevels { get; set; }
    public DbSet<StockMovement> StockMovements { get; set; }
    public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
    public DbSet<PurchaseOrderLine> PurchaseOrderLines { get; set; }
    public DbSet<StockCount> StockCounts { get; set; }
    public DbSet<StockCountLine> StockCountLines { get; set; }
    public DbSet<BatchLot> BatchLots { get; set; }

    // === Tables ===
    public DbSet<FloorPlan> FloorPlans { get; set; }
    public DbSet<TableEntity> Tables { get; set; }
    public DbSet<TableSession> TableSessions { get; set; }
    public DbSet<Reservation> Reservations { get; set; }
    public DbSet<WaitlistEntry> WaitlistEntries { get; set; }

    // === HR ===
    public DbSet<Employee> Employees { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<TimeEntry> TimeEntries { get; set; }
    public DbSet<ShiftSchedule> Shifts { get; set; }
    public DbSet<CommissionRule> CommissionRules { get; set; }
    public DbSet<CommissionEarning> CommissionEarnings { get; set; }
    public DbSet<TipRecord> TipRecords { get; set; }
    public DbSet<PayrollRun> PayrollRuns { get; set; }
    public DbSet<PayrollLine> PayrollLines { get; set; }
    public DbSet<LeaveRequest> LeaveRequests { get; set; }
    public DbSet<JobApplication> JobApplications { get; set; }
    public DbSet<Appraisal> Appraisals { get; set; }
    public DbSet<Vehicle> Vehicles { get; set; }

    // === Accounting ===
    public DbSet<Account> Accounts { get; set; }
    public DbSet<JournalEntry> JournalEntries { get; set; }
    public DbSet<JournalLine> JournalLines { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<SupplierInvoice> SupplierInvoices { get; set; }
    public DbSet<SupplierPayment> SupplierPayments { get; set; }
    public DbSet<CustomerInvoice> CustomerInvoices { get; set; }
    public DbSet<CustomerInvoiceLine> CustomerInvoiceLines { get; set; }
    public DbSet<Expense> Expenses { get; set; }
    public DbSet<BankReconciliation> BankReconciliations { get; set; }

    // === CRM ===
    public DbSet<Customer> Customers { get; set; }
    public DbSet<LoyaltyProgram> LoyaltyPrograms { get; set; }
    public DbSet<LoyaltyTier> LoyaltyTiers { get; set; }
    public DbSet<LoyaltyTransaction> LoyaltyTransactions { get; set; }
    public DbSet<Promotion> Promotions { get; set; }
    public DbSet<CouponCode> CouponCodes { get; set; }

    // === Services ===
    public DbSet<Project> Projects { get; set; }
    public DbSet<ProjectTask> ProjectTasks { get; set; }
    public DbSet<TimesheetEntry> TimesheetEntries { get; set; }
    public DbSet<SupportTicket> SupportTickets { get; set; }
    public DbSet<FieldServiceOrder> FieldServiceOrders { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<AppointmentType> AppointmentTypes { get; set; }

    // === Supply Chain ===
    public DbSet<ManufacturingOrder> ManufacturingOrders { get; set; }
    public DbSet<BillOfMaterials> BillsOfMaterials { get; set; }
    public DbSet<BomLine> BomLines { get; set; }
    public DbSet<WorkOrder> WorkOrders { get; set; }
    public DbSet<MaintenanceRequest> MaintenanceRequests { get; set; }
    public DbSet<QualityCheck> QualityChecks { get; set; }

    // === Productivity ===
    public DbSet<KnowledgeArticle> KnowledgeArticles { get; set; }
    public DbSet<Document> Documents { get; set; }
    public DbSet<SignatureRequest> SignatureRequests { get; set; }
    public DbSet<WhatsAppConversation> WhatsAppConversations { get; set; }
    public DbSet<Subscription> Subscriptions { get; set; }
    public DbSet<RentalOrder> RentalOrders { get; set; }

    // === System ===
    public DbSet<Store> Stores { get; set; }
    public DbSet<Register> Registers { get; set; }
    public DbSet<CashSession> CashSessions { get; set; }
    public DbSet<TaxRule> TaxRules { get; set; }
    public DbSet<Setting> Settings { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<SyncQueue> SyncQueue { get; set; }
    public DbSet<SyncState> SyncStates { get; set; }
    public DbSet<DailySalesSummary> DailySalesSummaries { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        // All entity configurations are in separate files — see Section 5
    }
}
```

---

## 3. Core Schema — All Tables

### Orders & Payments
```sql
CREATE TABLE orders (
    id              TEXT PRIMARY KEY,           -- UUID
    reference       TEXT NOT NULL UNIQUE,       -- ORD-20250001
    store_id        TEXT NOT NULL,
    register_id     TEXT NOT NULL,
    employee_id     TEXT NOT NULL,
    customer_id     TEXT,
    table_id        TEXT,
    order_type      TEXT NOT NULL DEFAULT 'dine_in',  -- dine_in | takeaway | delivery
    status          TEXT NOT NULL DEFAULT 'open',     -- open | completed | voided | refunded
    covers          INTEGER NOT NULL DEFAULT 1,
    sub_total       REAL NOT NULL DEFAULT 0,
    discount_total  REAL NOT NULL DEFAULT 0,
    tax_amount      REAL NOT NULL DEFAULT 0,
    tip_amount      REAL NOT NULL DEFAULT 0,
    total           REAL NOT NULL DEFAULT 0,
    total_cost      REAL NOT NULL DEFAULT 0,    -- for COGS
    notes           TEXT,
    created_at      TEXT NOT NULL,
    completed_at    TEXT,
    -- Sync columns (ALL sync tables must have these 4):
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    deleted_at      TEXT,
    device_id       TEXT NOT NULL
);

CREATE TABLE order_items (
    id              TEXT PRIMARY KEY,
    order_id        TEXT NOT NULL REFERENCES orders(id),
    product_id      TEXT NOT NULL,
    variant_id      TEXT,
    name            TEXT NOT NULL,              -- snapshot at time of sale
    qty             REAL NOT NULL,
    unit_price      REAL NOT NULL,
    discount_amount REAL NOT NULL DEFAULT 0,
    tax_amount      REAL NOT NULL DEFAULT 0,
    line_total      REAL NOT NULL,
    cost_per_unit   REAL NOT NULL DEFAULT 0,
    notes           TEXT,
    is_voided       INTEGER NOT NULL DEFAULT 0,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    deleted_at      TEXT,
    device_id       TEXT NOT NULL
);

CREATE TABLE order_item_modifiers (
    id              TEXT PRIMARY KEY,
    order_item_id   TEXT NOT NULL REFERENCES order_items(id),
    modifier_id     TEXT NOT NULL,
    name            TEXT NOT NULL,              -- snapshot
    price_adjustment REAL NOT NULL DEFAULT 0
);

CREATE TABLE payments (
    id              TEXT PRIMARY KEY,
    order_id        TEXT NOT NULL REFERENCES orders(id),
    method          TEXT NOT NULL,              -- cash | card | digital_wallet | house_account | gift_card
    amount          REAL NOT NULL,
    tip_amount      REAL NOT NULL DEFAULT 0,
    reference       TEXT,                       -- gateway transaction ID
    status          TEXT NOT NULL DEFAULT 'completed',
    card_last4      TEXT,
    card_brand      TEXT,
    processed_at    TEXT NOT NULL,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    device_id       TEXT NOT NULL
);

CREATE TABLE applied_discounts (
    id              TEXT PRIMARY KEY,
    order_id        TEXT NOT NULL REFERENCES orders(id),
    order_item_id   TEXT REFERENCES order_items(id),  -- NULL = order-level discount
    type            TEXT NOT NULL,              -- item | order | coupon | bogo | manager_override
    amount          REAL NOT NULL,
    percentage      REAL,
    coupon_code     TEXT,
    reason          TEXT,
    employee_id     TEXT NOT NULL,
    manager_id      TEXT,
    created_at      TEXT NOT NULL
);

CREATE TABLE refunds (
    id              TEXT PRIMARY KEY,
    order_id        TEXT NOT NULL REFERENCES orders(id),
    employee_id     TEXT NOT NULL,
    manager_id      TEXT,
    reason          TEXT NOT NULL,
    amount          REAL NOT NULL,
    method          TEXT NOT NULL,
    restock         INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    device_id       TEXT NOT NULL
);
```

### Products & Inventory
```sql
CREATE TABLE categories (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL,
    name            TEXT NOT NULL,
    parent_id       TEXT REFERENCES categories(id),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    color           TEXT,
    icon            TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    deleted_at      TEXT,
    device_id       TEXT NOT NULL
);

CREATE TABLE products (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL,
    name            TEXT NOT NULL,
    sku             TEXT NOT NULL,
    barcode         TEXT,
    description     TEXT,
    base_price      REAL NOT NULL DEFAULT 0,
    cost            REAL NOT NULL DEFAULT 0,
    category_id     TEXT REFERENCES categories(id),
    costing_method  TEXT NOT NULL DEFAULT 'average', -- fifo | lifo | average
    reorder_point   REAL NOT NULL DEFAULT 0,
    reorder_qty     REAL NOT NULL DEFAULT 0,
    track_inventory INTEGER NOT NULL DEFAULT 1,
    allow_negative  INTEGER NOT NULL DEFAULT 0,
    is_tax_exempt   INTEGER NOT NULL DEFAULT 0,
    unit_of_measure TEXT NOT NULL DEFAULT 'each',
    image_url       TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    deleted_at      TEXT,
    device_id       TEXT NOT NULL
);

CREATE TABLE product_variants (
    id              TEXT PRIMARY KEY,
    product_id      TEXT NOT NULL REFERENCES products(id),
    sku             TEXT NOT NULL,
    barcode         TEXT,
    attributes      TEXT NOT NULL,              -- JSON: {"size":"L","color":"Red"}
    price_override  REAL,                       -- NULL = inherit from parent
    cost_override   REAL,
    is_active       INTEGER NOT NULL DEFAULT 1,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    device_id       TEXT NOT NULL
);

CREATE TABLE recipes (
    id              TEXT PRIMARY KEY,
    product_id      TEXT NOT NULL UNIQUE REFERENCES products(id),
    yield_qty       REAL NOT NULL DEFAULT 1,
    yield_unit      TEXT NOT NULL DEFAULT 'serving',
    notes           TEXT,
    updated_at      TEXT NOT NULL
);

CREATE TABLE recipe_ingredients (
    id                  TEXT PRIMARY KEY,
    recipe_id           TEXT NOT NULL REFERENCES recipes(id),
    ingredient_product_id TEXT NOT NULL REFERENCES products(id),
    quantity            REAL NOT NULL,
    unit                TEXT NOT NULL,
    wastage_percent     REAL NOT NULL DEFAULT 0
);

CREATE TABLE inventory_levels (
    id              TEXT PRIMARY KEY,
    product_id      TEXT NOT NULL,
    store_id        TEXT NOT NULL,
    qty_on_hand     REAL NOT NULL DEFAULT 0,
    qty_committed   REAL NOT NULL DEFAULT 0,  -- reserved for open orders
    current_cost    REAL NOT NULL DEFAULT 0,  -- current average/FIFO cost
    updated_at      TEXT NOT NULL,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    device_id       TEXT NOT NULL,
    UNIQUE(product_id, store_id)
);

CREATE TABLE stock_movements (
    id              TEXT PRIMARY KEY,
    product_id      TEXT NOT NULL,
    store_id        TEXT NOT NULL,
    type            TEXT NOT NULL,            -- sale | purchase | adjustment | transfer_in | transfer_out | waste | count_adjustment
    quantity        REAL NOT NULL,            -- positive = in, negative = out
    cost_per_unit   REAL NOT NULL DEFAULT 0,
    reference_id    TEXT,                     -- order_id / po_id / count_id
    reference_type  TEXT,                     -- order / purchase_order / stock_count
    reason          TEXT,
    created_at      TEXT NOT NULL,
    employee_id     TEXT,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    device_id       TEXT NOT NULL
);

CREATE TABLE purchase_orders (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL,
    supplier_id     TEXT NOT NULL,
    reference       TEXT NOT NULL UNIQUE,     -- PO-20250001
    status          TEXT NOT NULL DEFAULT 'draft', -- draft | sent | partial | received | invoiced
    ordered_at      TEXT,
    expected_at     TEXT,
    notes           TEXT,
    total_cost      REAL NOT NULL DEFAULT 0,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    deleted_at      TEXT,
    device_id       TEXT NOT NULL
);

CREATE TABLE purchase_order_lines (
    id              TEXT PRIMARY KEY,
    purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id),
    product_id      TEXT NOT NULL,
    qty_ordered     REAL NOT NULL,
    qty_received    REAL NOT NULL DEFAULT 0,
    unit_cost       REAL NOT NULL,
    total_cost      REAL GENERATED ALWAYS AS (qty_ordered * unit_cost) STORED
);
```

### Tables & Reservations
```sql
CREATE TABLE floor_plans (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL,
    name            TEXT NOT NULL,
    layout_json     TEXT NOT NULL,            -- wall/fixture positions
    is_active       INTEGER NOT NULL DEFAULT 1,
    updated_at      TEXT NOT NULL,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    device_id       TEXT NOT NULL
);

CREATE TABLE tables (
    id              TEXT PRIMARY KEY,
    floor_plan_id   TEXT NOT NULL REFERENCES floor_plans(id),
    name            TEXT NOT NULL,
    capacity        INTEGER NOT NULL DEFAULT 4,
    shape           TEXT NOT NULL DEFAULT 'rectangle',  -- rectangle | circle | booth
    pos_x           REAL NOT NULL DEFAULT 0,
    pos_y           REAL NOT NULL DEFAULT 0,
    width           REAL NOT NULL DEFAULT 100,
    height          REAL NOT NULL DEFAULT 80,
    is_active       INTEGER NOT NULL DEFAULT 1,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    device_id       TEXT NOT NULL
);

CREATE TABLE table_sessions (
    id              TEXT PRIMARY KEY,
    table_id        TEXT NOT NULL REFERENCES tables(id),
    order_id        TEXT REFERENCES orders(id),
    server_id       TEXT,                     -- employee_id
    covers          INTEGER NOT NULL DEFAULT 1,
    status          TEXT NOT NULL DEFAULT 'occupied', -- occupied | cleaning | closed
    seated_at       TEXT NOT NULL,
    cleared_at      TEXT,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    device_id       TEXT NOT NULL
);

CREATE TABLE reservations (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL,
    table_id        TEXT REFERENCES tables(id),
    guest_name      TEXT NOT NULL,
    phone           TEXT,
    email           TEXT,
    party_size      INTEGER NOT NULL,
    reservation_time TEXT NOT NULL,           -- ISO8601
    duration_mins   INTEGER NOT NULL DEFAULT 90,
    status          TEXT NOT NULL DEFAULT 'confirmed', -- confirmed | seated | cancelled | no_show
    confirmation_code TEXT NOT NULL UNIQUE,
    dietary_notes   TEXT,
    special_occasion TEXT,
    created_at      TEXT NOT NULL,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    deleted_at      TEXT,
    device_id       TEXT NOT NULL
);

CREATE TABLE waitlist (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL,
    guest_name      TEXT NOT NULL,
    phone           TEXT,
    party_size      INTEGER NOT NULL,
    joined_at       TEXT NOT NULL,
    notified_at     TEXT,
    seated_at       TEXT,
    status          TEXT NOT NULL DEFAULT 'waiting', -- waiting | notified | seated | left
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    device_id       TEXT NOT NULL
);
```

### HR Tables
```sql
CREATE TABLE roles (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL,
    name            TEXT NOT NULL,
    permissions     INTEGER NOT NULL DEFAULT 0,  -- bitmask (long)
    is_system       INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL
);

CREATE TABLE employees (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL,
    role_id         TEXT NOT NULL REFERENCES roles(id),
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    phone           TEXT,
    pin_hash        TEXT NOT NULL,            -- bcrypt
    employment_type TEXT NOT NULL DEFAULT 'casual', -- full_time | part_time | casual
    hourly_rate     REAL NOT NULL DEFAULT 0,
    salary          REAL,
    super_rate      REAL NOT NULL DEFAULT 0.11,   -- superannuation %
    start_date      TEXT NOT NULL,
    end_date        TEXT,
    tax_number_enc  TEXT,                    -- AES-256-GCM encrypted
    bank_account_enc TEXT,                   -- AES-256-GCM encrypted
    is_active       INTEGER NOT NULL DEFAULT 1,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    deleted_at      TEXT,
    device_id       TEXT NOT NULL
);

CREATE TABLE time_entries (
    id              TEXT PRIMARY KEY,
    employee_id     TEXT NOT NULL REFERENCES employees(id),
    store_id        TEXT NOT NULL,
    clock_in        TEXT NOT NULL,
    clock_out       TEXT,
    break_minutes   INTEGER NOT NULL DEFAULT 0,
    is_approved     INTEGER NOT NULL DEFAULT 0,
    is_overtime     INTEGER NOT NULL DEFAULT 0,
    manager_note    TEXT,
    created_at      TEXT NOT NULL,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    device_id       TEXT NOT NULL
);

CREATE TABLE shifts (
    id              TEXT PRIMARY KEY,
    employee_id     TEXT NOT NULL REFERENCES employees(id),
    store_id        TEXT NOT NULL,
    date            TEXT NOT NULL,            -- YYYY-MM-DD
    start_time      TEXT NOT NULL,            -- HH:MM
    end_time        TEXT NOT NULL,
    role_note       TEXT,
    is_published    INTEGER NOT NULL DEFAULT 0,
    is_open_shift   INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    device_id       TEXT NOT NULL
);

CREATE TABLE payroll_runs (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL,
    period_start    TEXT NOT NULL,
    period_end      TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'draft',  -- draft | approved | paid
    total_gross     REAL NOT NULL DEFAULT 0,
    total_tax       REAL NOT NULL DEFAULT 0,
    total_net       REAL NOT NULL DEFAULT 0,
    created_by      TEXT NOT NULL,
    approved_by     TEXT,
    created_at      TEXT NOT NULL
);

CREATE TABLE payroll_lines (
    id                  TEXT PRIMARY KEY,
    payroll_run_id      TEXT NOT NULL REFERENCES payroll_runs(id),
    employee_id         TEXT NOT NULL,
    regular_hours       REAL NOT NULL DEFAULT 0,
    overtime_hours      REAL NOT NULL DEFAULT 0,
    double_time_hours   REAL NOT NULL DEFAULT 0,
    commission_amount   REAL NOT NULL DEFAULT 0,
    tip_amount          REAL NOT NULL DEFAULT 0,
    gross_pay           REAL NOT NULL DEFAULT 0,
    tax_withheld        REAL NOT NULL DEFAULT 0,
    superannuation      REAL NOT NULL DEFAULT 0,
    net_pay             REAL NOT NULL DEFAULT 0
);
```

### Accounting Tables
```sql
CREATE TABLE accounts (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL,
    code            TEXT NOT NULL,            -- e.g. 4000
    name            TEXT NOT NULL,
    type            TEXT NOT NULL,            -- asset | liability | equity | revenue | expense | cogs
    sub_type        TEXT,
    is_system       INTEGER NOT NULL DEFAULT 0,  -- system accounts cannot be deleted
    system_account  TEXT,                     -- enum key: CashDrawer | SalesRevenue | COGS | etc.
    allow_manual    INTEGER NOT NULL DEFAULT 1,
    is_active       INTEGER NOT NULL DEFAULT 1,
    UNIQUE(store_id, code)
);

CREATE TABLE journal_entries (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL,
    date            TEXT NOT NULL,
    description     TEXT NOT NULL,
    reference       TEXT,                     -- source: order_id / expense_id / etc.
    reference_type  TEXT,
    is_manual       INTEGER NOT NULL DEFAULT 0,
    created_by      TEXT NOT NULL,
    created_at      TEXT NOT NULL,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    device_id       TEXT NOT NULL
);

CREATE TABLE journal_lines (
    id              TEXT PRIMARY KEY,
    journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id),
    account_id      TEXT NOT NULL REFERENCES accounts(id),
    debit           REAL NOT NULL DEFAULT 0,
    credit          REAL NOT NULL DEFAULT 0,
    description     TEXT,
    -- Constraint: one of debit or credit must be > 0, not both
    CHECK (NOT (debit > 0 AND credit > 0)),
    CHECK (debit >= 0 AND credit >= 0)
);

CREATE TABLE suppliers (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL,
    name            TEXT NOT NULL,
    contact_name    TEXT,
    email           TEXT,
    phone           TEXT,
    address         TEXT,
    payment_terms_days INTEGER NOT NULL DEFAULT 30,
    tax_number      TEXT,
    currency        TEXT NOT NULL DEFAULT 'AUD',
    is_active       INTEGER NOT NULL DEFAULT 1,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    deleted_at      TEXT,
    device_id       TEXT NOT NULL
);

CREATE TABLE supplier_invoices (
    id              TEXT PRIMARY KEY,
    supplier_id     TEXT NOT NULL REFERENCES suppliers(id),
    store_id        TEXT NOT NULL,
    invoice_number  TEXT NOT NULL,
    invoice_date    TEXT NOT NULL,
    due_date        TEXT NOT NULL,
    sub_total       REAL NOT NULL DEFAULT 0,
    tax_amount      REAL NOT NULL DEFAULT 0,
    total           REAL NOT NULL DEFAULT 0,
    amount_paid     REAL NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'unpaid',  -- unpaid | partial | paid | overdue
    notes           TEXT,
    journal_entry_id TEXT REFERENCES journal_entries(id),
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    device_id       TEXT NOT NULL
);

CREATE TABLE expenses (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL,
    employee_id     TEXT NOT NULL,
    account_id      TEXT NOT NULL REFERENCES accounts(id),
    amount          REAL NOT NULL,
    date            TEXT NOT NULL,
    description     TEXT NOT NULL,
    receipt_url     TEXT,
    status          TEXT NOT NULL DEFAULT 'draft', -- draft | submitted | approved | rejected
    approved_by     TEXT,
    journal_entry_id TEXT REFERENCES journal_entries(id),
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    deleted_at      TEXT,
    device_id       TEXT NOT NULL
);
```

### CRM & Loyalty
```sql
CREATE TABLE customers (
    id              TEXT PRIMARY KEY,
    tenant_id       TEXT NOT NULL,            -- shared across all stores
    name            TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    date_of_birth   TEXT,
    type            TEXT NOT NULL DEFAULT 'individual',  -- individual | business
    company_name    TEXT,
    tax_number      TEXT,
    address         TEXT,                     -- JSON
    credit_limit    REAL NOT NULL DEFAULT 0,
    account_balance REAL NOT NULL DEFAULT 0,
    loyalty_points  INTEGER NOT NULL DEFAULT 0,
    tier_id         TEXT REFERENCES loyalty_tiers(id),
    notes           TEXT,
    marketing_consent INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    deleted_at      TEXT,
    device_id       TEXT NOT NULL
);

CREATE TABLE loyalty_programs (
    id              TEXT PRIMARY KEY,
    tenant_id       TEXT NOT NULL,
    points_per_dollar REAL NOT NULL DEFAULT 1,
    dollar_per_point  REAL NOT NULL DEFAULT 0.01,
    expiry_days     INTEGER NOT NULL DEFAULT 0,   -- 0 = never expire
    is_active       INTEGER NOT NULL DEFAULT 1,
    updated_at      TEXT NOT NULL
);

CREATE TABLE loyalty_tiers (
    id              TEXT PRIMARY KEY,
    program_id      TEXT NOT NULL REFERENCES loyalty_programs(id),
    name            TEXT NOT NULL,
    min_points      INTEGER NOT NULL DEFAULT 0,
    points_multiplier REAL NOT NULL DEFAULT 1.0,
    sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE loyalty_transactions (
    id              TEXT PRIMARY KEY,
    customer_id     TEXT NOT NULL REFERENCES customers(id),
    order_id        TEXT REFERENCES orders(id),
    type            TEXT NOT NULL,            -- earn | redeem | expire | adjust
    points          INTEGER NOT NULL,
    balance_after   INTEGER NOT NULL,
    created_at      TEXT NOT NULL,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    device_id       TEXT NOT NULL
);

CREATE TABLE promotions (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL,            -- discount | bogo | bundle | happy_hour
    discount_method TEXT NOT NULL,            -- flat | percentage
    discount_value  REAL NOT NULL DEFAULT 0,
    conditions      TEXT,                     -- JSON: min_spend, categories, items
    start_date      TEXT NOT NULL,
    end_date        TEXT,
    active_from     TEXT,                     -- HH:MM time
    active_to       TEXT,
    active_days     TEXT,                     -- JSON array: [1,2,3,4,5]
    max_redemptions INTEGER,
    use_count       INTEGER NOT NULL DEFAULT 0,
    requires_coupon INTEGER NOT NULL DEFAULT 0,
    is_active       INTEGER NOT NULL DEFAULT 1,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    device_id       TEXT NOT NULL
);
```

### System Tables
```sql
CREATE TABLE stores (
    id              TEXT PRIMARY KEY,
    tenant_id       TEXT NOT NULL,
    name            TEXT NOT NULL,
    address         TEXT,
    phone           TEXT,
    email           TEXT,
    timezone        TEXT NOT NULL DEFAULT 'UTC',
    currency        TEXT NOT NULL DEFAULT 'AUD',
    is_active       INTEGER NOT NULL DEFAULT 1,
    updated_at      TEXT NOT NULL,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    device_id       TEXT NOT NULL
);

CREATE TABLE registers (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL REFERENCES stores(id),
    name            TEXT NOT NULL,
    hardware_profile TEXT,                    -- JSON: printer, drawer, card_reader
    is_active       INTEGER NOT NULL DEFAULT 1,
    updated_at      TEXT NOT NULL
);

CREATE TABLE cash_sessions (
    id              TEXT PRIMARY KEY,
    register_id     TEXT NOT NULL REFERENCES registers(id),
    opened_by       TEXT NOT NULL,
    opening_float   REAL NOT NULL DEFAULT 0,
    drops           TEXT,                     -- JSON array of {amount, note, timestamp}
    disbursements   TEXT,                     -- JSON array of {amount, reason, timestamp}
    expected_cash   REAL,
    counted_cash    REAL,
    variance        REAL GENERATED ALWAYS AS (CASE WHEN counted_cash IS NOT NULL THEN counted_cash - expected_cash ELSE NULL END) STORED,
    opened_at       TEXT NOT NULL,
    closed_at       TEXT,
    sync_version    INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL,
    device_id       TEXT NOT NULL
);

CREATE TABLE tax_rules (
    id              TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL,
    name            TEXT NOT NULL,
    rate            REAL NOT NULL,
    is_inclusive    INTEGER NOT NULL DEFAULT 0,
    applies_to      TEXT,                     -- JSON: category_ids or null = all
    rounding_rule   TEXT NOT NULL DEFAULT 'nearest',
    is_active       INTEGER NOT NULL DEFAULT 1,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    updated_at      TEXT NOT NULL
);

CREATE TABLE settings (
    id              TEXT PRIMARY KEY,
    scope           TEXT NOT NULL,            -- global | store | register | employee
    scope_id        TEXT,                     -- NULL for global
    key             TEXT NOT NULL,
    value           TEXT NOT NULL,            -- JSON value
    updated_at      TEXT NOT NULL,
    UNIQUE(scope, scope_id, key)
);

-- AUDIT LOG: append-only, never updated or deleted
CREATE TABLE audit_logs (
    id              TEXT PRIMARY KEY,
    timestamp       TEXT NOT NULL,
    employee_id     TEXT NOT NULL,
    action          TEXT NOT NULL,
    entity_type     TEXT NOT NULL,
    entity_id       TEXT NOT NULL,
    previous_value  TEXT,                     -- JSON snapshot
    new_value       TEXT,                     -- JSON snapshot
    ip_address      TEXT,
    register_id     TEXT,
    hmac            TEXT NOT NULL             -- HMAC-SHA256 of all fields
);
-- No UPDATE or DELETE permissions granted on audit_logs table
```

### Sync Tables
```sql
-- Pending operations waiting to sync to cloud
CREATE TABLE sync_queue (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type     TEXT NOT NULL,
    entity_id       TEXT NOT NULL,
    operation       TEXT NOT NULL,            -- insert | update | delete
    payload         TEXT NOT NULL,            -- JSON of changed row
    created_at      TEXT NOT NULL,
    attempts        INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TEXT,
    error           TEXT,
    status          TEXT NOT NULL DEFAULT 'pending'  -- pending | synced | failed
);

-- Per-device sync tracking
CREATE TABLE sync_state (
    device_id       TEXT PRIMARY KEY,
    store_id        TEXT NOT NULL,
    last_push_version INTEGER NOT NULL DEFAULT 0,
    last_pull_version INTEGER NOT NULL DEFAULT 0,
    last_synced_at  TEXT,
    pending_count   INTEGER NOT NULL DEFAULT 0
);

-- Pre-aggregated daily sales summary — updated after every order
CREATE TABLE daily_sales_summary (
    store_id        TEXT NOT NULL,
    date            TEXT NOT NULL,            -- YYYY-MM-DD
    revenue         REAL NOT NULL DEFAULT 0,
    cost            REAL NOT NULL DEFAULT 0,
    discount_total  REAL NOT NULL DEFAULT 0,
    tax_total       REAL NOT NULL DEFAULT 0,
    tip_total       REAL NOT NULL DEFAULT 0,
    tx_count        INTEGER NOT NULL DEFAULT 0,
    item_count      INTEGER NOT NULL DEFAULT 0,
    avg_basket      REAL GENERATED ALWAYS AS (CASE WHEN tx_count > 0 THEN revenue / tx_count ELSE 0 END) STORED,
    gross_margin    REAL GENERATED ALWAYS AS (CASE WHEN revenue > 0 THEN (revenue - cost) / revenue * 100 ELSE 0 END) STORED,
    PRIMARY KEY (store_id, date)
);

-- Full-text search virtual table for product lookup
CREATE VIRTUAL TABLE products_fts USING fts5(
    product_id UNINDEXED,                     -- hidden column linking back to products
    name,
    sku,
    barcode,
    content='products',                        -- sync with products table
    content_rowid='rowid'
);
```

---

## 4. Indexes & Performance

```sql
-- === ORDERS ===
CREATE INDEX idx_orders_store_status ON orders(store_id, status, created_at DESC);
CREATE INDEX idx_orders_table ON orders(table_id) WHERE table_id IS NOT NULL;
CREATE INDEX idx_orders_customer ON orders(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_orders_employee ON orders(employee_id, created_at DESC);
CREATE INDEX idx_orders_reference ON orders(reference);
CREATE INDEX idx_orders_sync ON orders(sync_version, updated_at) WHERE deleted_at IS NULL;

-- === ORDER ITEMS ===
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- === PRODUCTS ===
CREATE INDEX idx_products_store_active ON products(store_id, is_active);
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id, is_active);
CREATE INDEX idx_products_sync ON products(sync_version) WHERE deleted_at IS NULL;

-- === INVENTORY ===
CREATE INDEX idx_inventory_product_store ON inventory_levels(product_id, store_id);
-- Low stock query optimisation:
CREATE INDEX idx_inventory_low_stock ON inventory_levels(store_id, qty_on_hand, product_id);
CREATE INDEX idx_stock_movements_product_date ON stock_movements(product_id, created_at DESC);
CREATE INDEX idx_stock_movements_type ON stock_movements(store_id, type, created_at DESC);

-- === TABLES ===
CREATE INDEX idx_tables_floor_plan ON tables(floor_plan_id, is_active);
CREATE INDEX idx_table_sessions_table ON table_sessions(table_id, status);
CREATE INDEX idx_reservations_store_time ON reservations(store_id, reservation_time, status);

-- === EMPLOYEES ===
CREATE INDEX idx_employees_store_active ON employees(store_id, is_active);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_time_entries_employee_date ON time_entries(employee_id, clock_in DESC);
CREATE INDEX idx_time_entries_store_date ON time_entries(store_id, clock_in DESC);
CREATE INDEX idx_shifts_employee_date ON shifts(employee_id, date);
CREATE INDEX idx_shifts_store_date ON shifts(store_id, date, is_published);

-- === ACCOUNTING ===
CREATE INDEX idx_journal_entries_store_date ON journal_entries(store_id, date DESC);
CREATE INDEX idx_journal_entries_reference ON journal_entries(reference_type, reference);
CREATE INDEX idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id, journal_entry_id);
CREATE INDEX idx_supplier_invoices_due ON supplier_invoices(store_id, status, due_date);
CREATE INDEX idx_expenses_store_status ON expenses(store_id, status, date DESC);

-- === CUSTOMERS ===
CREATE INDEX idx_customers_phone ON customers(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_customers_email ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_loyalty_transactions_customer ON loyalty_transactions(customer_id, created_at DESC);

-- === SYNC ===
CREATE INDEX idx_sync_queue_status ON sync_queue(status, created_at);
CREATE INDEX idx_sync_queue_entity ON sync_queue(entity_type, entity_id, status);

-- === DAILY SUMMARY ===
CREATE INDEX idx_daily_summary_date ON daily_sales_summary(store_id, date DESC);

-- === AUDIT ===
CREATE INDEX idx_audit_employee ON audit_logs(employee_id, timestamp DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
```

---

## 5. EF Core Entity Configurations

```csharp
// ScalaPOS.Infrastructure/Persistence/Configurations/OrderConfiguration.cs
public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders");
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).HasColumnName("id");
        builder.Property(o => o.Reference).HasColumnName("reference").HasMaxLength(20).IsRequired();
        builder.Property(o => o.Status).HasColumnName("status").HasConversion<string>();
        builder.Property(o => o.OrderType).HasColumnName("order_type").HasConversion<string>();
        builder.Property(o => o.SubTotal).HasColumnName("sub_total").HasPrecision(12, 4);
        builder.Property(o => o.Total).HasColumnName("total").HasPrecision(12, 4);
        builder.Property(o => o.CreatedAt).HasColumnName("created_at");
        builder.Property(o => o.UpdatedAt).HasColumnName("updated_at");
        builder.Property(o => o.DeletedAt).HasColumnName("deleted_at");
        builder.Property(o => o.SyncVersion).HasColumnName("sync_version");
        builder.Property(o => o.DeviceId).HasColumnName("device_id");

        builder.HasQueryFilter(o => o.DeletedAt == null);   // Global soft-delete filter

        // Navigation
        builder.HasMany(o => o.Items).WithOne().HasForeignKey("OrderId").OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(o => o.Payments).WithOne().HasForeignKey("OrderId");

        // Indexes (mirrors SQL)
        builder.HasIndex(o => new { o.StoreId, o.Status, o.CreatedAt });
        builder.HasIndex(o => o.Reference).IsUnique();
        builder.HasIndex(o => new { o.SyncVersion, o.UpdatedAt });
    }
}

// Base configuration for all sync-tracked entities:
public abstract class SyncEntityConfiguration<T> : IEntityTypeConfiguration<T> where T : SyncEntity
{
    public virtual void Configure(EntityTypeBuilder<T> builder)
    {
        builder.Property(e => e.SyncVersion).HasColumnName("sync_version").HasDefaultValue(0);
        builder.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(e => e.DeletedAt).HasColumnName("deleted_at");
        builder.Property(e => e.DeviceId).HasColumnName("device_id").IsRequired();
        builder.HasQueryFilter(e => e.DeletedAt == null);
    }
}
```

---

## 6. Migrations Strategy

### EF Core Migration Commands
```bash
# Create new migration
dotnet ef migrations add AddSubscriptions --project src/ScalaPOS.Infrastructure --startup-project src/ScalaPOS.Api

# Apply to local SQLite
dotnet ef database update --project src/ScalaPOS.Infrastructure --startup-project src/ScalaPOS.Api

# Generate SQL script (for production review)
dotnet ef migrations script --from 0 --to InitialCreate --output migrations.sql --idempotent

# Roll back one migration
dotnet ef migrations remove --project src/ScalaPOS.Infrastructure
```

### Migration Naming Convention
```
YYYYMMDD_ShortDescription
e.g.:
20250101_InitialCreate
20250115_AddRecipeWastage
20250201_AddSubscriptions
20250315_AddFleetManagement
```

### Backward-Compatible Migration Rules
1. **Always additive**: Only add columns/tables — never remove
2. **New columns**: Must be nullable OR have a default value
3. **Renames**: Add new column, migrate data, keep old column for 2 releases, then remove
4. **Index changes**: Use `CONCURRENTLY` in PostgreSQL (no-lock). In SQLite, rebuild at low-traffic time
5. **Data migrations**: Separate migration for schema, separate job for data backfill

### Per-Tenant Migration Runner (PostgreSQL cloud)
```csharp
// On every deploy, run migrations for all active tenant schemas
public class TenantMigrationRunner
{
    public async Task MigrateAllTenantsAsync(CancellationToken ct)
    {
        var tenants = await _db.Tenants.Where(t => t.IsActive).ToListAsync(ct);

        foreach (var tenant in tenants)
        {
            using var tenantCtx = _factory.CreateForTenant(tenant.Id);
            _logger.LogInformation("Migrating tenant {TenantId}", tenant.Id);
            await tenantCtx.Database.MigrateAsync(ct);
        }
    }
}
```

---

## 7. Sync Tables & CDC

### How Change Data Capture Works
```
1. Any write to a sync-tracked table → UpdatedAt = now, SyncVersion incremented
2. EF Core SaveChanges override → auto-enqueues changed entities to sync_queue
3. SyncEngine Worker picks up sync_queue → pushes to cloud
4. Cloud applies changes, updates LastSyncVersion
5. On next pull → device receives any changes from other devices with SyncVersion > LastPull
```

### AppDbContext SaveChanges Override
```csharp
public override async Task<int> SaveChangesAsync(CancellationToken ct = default)
{
    var changed = ChangeTracker.Entries<SyncEntity>()
        .Where(e => e.State is EntityState.Added or EntityState.Modified)
        .ToList();

    foreach (var entry in changed)
    {
        entry.Entity.UpdatedAt = DateTimeOffset.UtcNow;
        entry.Entity.SyncVersion = _syncVersionGenerator.Next();
        entry.Entity.DeviceId = _deviceId;
    }

    var result = await base.SaveChangesAsync(ct);

    // Enqueue sync operations
    foreach (var entry in changed)
    {
        SyncQueue.Add(new SyncQueueEntry
        {
            EntityType = entry.Entity.GetType().Name,
            EntityId = entry.Entity.Id.ToString(),
            Operation = entry.State == EntityState.Added ? "insert" : "update",
            Payload = JsonSerializer.Serialize(entry.Entity),
            CreatedAt = DateTimeOffset.UtcNow,
        });
    }

    await base.SaveChangesAsync(ct); // save sync queue entries
    return result;
}
```

---

## 8. SQLite-Specific Configuration

### Pragmas (applied on every connection open)
```csharp
public class SqliteConnectionInterceptor : DbConnectionInterceptor
{
    public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData data)
    {
        if (connection is SqliteConnection sqlite)
        {
            using var cmd = sqlite.CreateCommand();
            cmd.CommandText = @"
                PRAGMA journal_mode = WAL;
                PRAGMA synchronous = NORMAL;
                PRAGMA foreign_keys = ON;
                PRAGMA temp_store = MEMORY;
                PRAGMA cache_size = -65536;
                PRAGMA wal_autocheckpoint = 1000;
                PRAGMA optimize;";
            cmd.ExecuteNonQuery();
        }
    }
}
```

### FTS5 Maintenance
```sql
-- Rebuild FTS index after bulk product import:
INSERT INTO products_fts(products_fts) VALUES('rebuild');

-- Optimise FTS index (merge segments for faster reads):
INSERT INTO products_fts(products_fts) VALUES('optimize');

-- Integrity check:
INSERT INTO products_fts(products_fts) VALUES('integrity-check');

-- Keep FTS in sync with products table via triggers:
CREATE TRIGGER products_fts_insert AFTER INSERT ON products BEGIN
    INSERT INTO products_fts(product_id, name, sku, barcode) VALUES (new.id, new.name, new.sku, new.barcode);
END;
CREATE TRIGGER products_fts_update AFTER UPDATE ON products BEGIN
    DELETE FROM products_fts WHERE product_id = old.id;
    INSERT INTO products_fts(product_id, name, sku, barcode) VALUES (new.id, new.name, new.sku, new.barcode);
END;
CREATE TRIGGER products_fts_delete AFTER DELETE ON products BEGIN
    DELETE FROM products_fts WHERE product_id = old.id;
END;
```

### SQLite Backup
```csharp
// Online backup — no downtime, WAL-compatible
public async Task BackupToFileAsync(string destinationPath, CancellationToken ct)
{
    using var source = new SqliteConnection(_connectionString);
    using var dest = new SqliteConnection($"Data Source={destinationPath};");
    await source.OpenAsync(ct);
    await dest.OpenAsync(ct);
    source.BackupDatabase(dest);  // SQLite's built-in online backup API
}
```

---

## 9. PostgreSQL Cloud Schema

### TimescaleDB for Time-Series Reporting
```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert daily_sales_summary to hypertable (time-series optimised)
SELECT create_hypertable('daily_sales_summary', 'date', chunk_time_interval => INTERVAL '3 months');

-- Stock movements as hypertable for inventory history
SELECT create_hypertable('stock_movements', 'created_at', chunk_time_interval => INTERVAL '1 month');

-- Automatic data retention (7 years = 84 months)
SELECT add_retention_policy('stock_movements', INTERVAL '84 months');

-- Continuous aggregate: hourly sales (pre-computed, no query overhead)
CREATE MATERIALIZED VIEW hourly_sales
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', created_at) AS hour,
    store_id,
    SUM(total) AS revenue,
    COUNT(*) AS tx_count
FROM orders
WHERE status = 'completed'
GROUP BY 1, 2;
```

### Row-Level Security (Multi-Tenant)
```sql
-- Enable RLS on all tenant tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: app_user can only see rows belonging to their tenant schema
CREATE POLICY tenant_isolation ON orders
    USING (store_id IN (
        SELECT id FROM stores WHERE tenant_id = current_setting('app.tenant_id')
    ));

-- Set tenant context on every connection:
-- SET app.tenant_id = 'tenant_abc123';
```

---

## 10. Query Patterns & Optimisation

### Dashboard KPI Query (< 50ms)
```csharp
// Use Dapper for performance-critical reads — skip EF Core overhead
public async Task<DashboardKpis> GetTodayKpisAsync(Guid storeId)
{
    const string sql = @"
        SELECT revenue, tx_count, avg_basket, gross_margin
        FROM daily_sales_summary
        WHERE store_id = @StoreId AND date = @Today";

    return await _dapper.QuerySingleOrDefaultAsync<DashboardKpis>(sql, new {
        StoreId = storeId.ToString(),
        Today = DateTime.UtcNow.ToString("yyyy-MM-dd")
    }) ?? new DashboardKpis();
}
```

### Product FTS Search (< 50ms)
```csharp
public async Task<List<ProductSearchResult>> SearchProductsAsync(string query, Guid storeId)
{
    const string sql = @"
        SELECT p.id, p.name, p.sku, p.barcode, p.base_price, p.image_url
        FROM products p
        INNER JOIN products_fts f ON f.product_id = p.id
        WHERE products_fts MATCH @Query
            AND p.store_id = @StoreId
            AND p.is_active = 1
            AND p.deleted_at IS NULL
        ORDER BY rank
        LIMIT 30";

    return (await _dapper.QueryAsync<ProductSearchResult>(sql, new {
        Query = $"{query}*",    // prefix search
        StoreId = storeId.ToString()
    })).ToList();
}
```

### Open Orders Query (with table status)
```sql
SELECT
    o.id, o.reference, o.status, o.total, o.created_at,
    t.name AS table_name, ts.covers,
    e.first_name || ' ' || e.last_name AS server_name,
    CAST((julianday('now') - julianday(o.created_at)) * 24 * 60 AS INTEGER) AS elapsed_minutes
FROM orders o
LEFT JOIN table_sessions ts ON ts.order_id = o.id
LEFT JOIN tables t ON ts.table_id = t.id
LEFT JOIN employees e ON ts.server_id = e.id
WHERE o.store_id = @StoreId
    AND o.status = 'open'
    AND o.deleted_at IS NULL
ORDER BY o.created_at ASC;
```

### P&L Report Query (Dapper)
```sql
-- Revenue
SELECT
    strftime('%Y-%m', je.date) AS period,
    SUM(jl.credit - jl.debit) AS revenue
FROM journal_lines jl
INNER JOIN journal_entries je ON jl.journal_entry_id = je.id
INNER JOIN accounts a ON jl.account_id = a.id
WHERE a.type = 'revenue'
    AND je.store_id = @StoreId
    AND je.date BETWEEN @Start AND @End
GROUP BY 1

UNION ALL

-- Expenses
SELECT
    strftime('%Y-%m', je.date) AS period,
    -SUM(jl.debit - jl.credit) AS amount
FROM journal_lines jl
INNER JOIN journal_entries je ON jl.journal_entry_id = je.id
INNER JOIN accounts a ON jl.account_id = a.id
WHERE a.type IN ('expense', 'cogs')
    AND je.store_id = @StoreId
    AND je.date BETWEEN @Start AND @End
GROUP BY 1;
```

---

## 11. Data Seeding

```csharp
// ScalaPOS.Infrastructure/Persistence/Seeders/DefaultDataSeeder.cs
public class DefaultDataSeeder
{
    public async Task SeedAsync(AppDbContext db, Guid storeId)
    {
        await SeedRolesAsync(db, storeId);
        await SeedAccountsAsync(db, storeId);
        await SeedTaxRulesAsync(db, storeId);
        await SeedDefaultCategoriesAsync(db, storeId);
        await SeedLoyaltyProgramAsync(db, storeId);
    }

    private async Task SeedAccountsAsync(AppDbContext db, Guid storeId)
    {
        var accounts = new[]
        {
            // Assets
            new Account { Code = "1000", Name = "Cash - POS Drawer", Type = AccountType.Asset, SystemAccount = SystemAccount.CashDrawer },
            new Account { Code = "1100", Name = "Card Receivable", Type = AccountType.Asset, SystemAccount = SystemAccount.CardReceivable },
            new Account { Code = "1200", Name = "Bank Account", Type = AccountType.Asset },
            new Account { Code = "1300", Name = "Inventory Asset", Type = AccountType.Asset, SystemAccount = SystemAccount.Inventory },
            new Account { Code = "1400", Name = "Accounts Receivable", Type = AccountType.Asset },
            // Liabilities
            new Account { Code = "2100", Name = "Accounts Payable", Type = AccountType.Liability },
            new Account { Code = "2200", Name = "Sales Tax Payable", Type = AccountType.Liability, SystemAccount = SystemAccount.SalesTaxPayable },
            // Revenue
            new Account { Code = "4000", Name = "Sales Revenue", Type = AccountType.Revenue, SystemAccount = SystemAccount.SalesRevenue },
            new Account { Code = "4100", Name = "Service Revenue", Type = AccountType.Revenue },
            // COGS
            new Account { Code = "5000", Name = "Cost of Goods Sold", Type = AccountType.Cogs, SystemAccount = SystemAccount.COGS },
            // Expenses
            new Account { Code = "6000", Name = "Wages Expense", Type = AccountType.Expense },
            new Account { Code = "6100", Name = "Rent Expense", Type = AccountType.Expense },
            new Account { Code = "6200", Name = "Marketing Expense", Type = AccountType.Expense },
            new Account { Code = "6300", Name = "Utilities Expense", Type = AccountType.Expense },
        };

        foreach (var acc in accounts)
        {
            acc.Id = Guid.NewGuid();
            acc.StoreId = storeId;
            acc.IsSystem = acc.SystemAccount != null;
        }

        db.Accounts.AddRange(accounts.Where(a => !db.Accounts.Any(x => x.StoreId == storeId && x.Code == a.Code)));
        await db.SaveChangesAsync();
    }
}
```

---

## 12. Backup & Recovery

### SQLite — Automated Backup
```csharp
// Hangfire job: every 5 minutes, backup SQLite to cloud S3
public class SqliteBackupJob
{
    public async Task ExecuteAsync()
    {
        var tempPath = Path.GetTempFileName();
        await _db.BackupToFileAsync(tempPath);

        var key = $"backups/{_storeId}/{DateTime.UtcNow:yyyyMMdd-HHmm}-data.db.brotli";
        using var compressed = CompressBrotli(tempPath);
        await _s3.PutObjectAsync(new PutObjectRequest { BucketName = "scalapos-backups", Key = key, InputStream = compressed });

        File.Delete(tempPath);
    }
}
```

### PostgreSQL — RDS Automated Backups
- RDS automated backups: 7-day retention, every 5 minutes point-in-time recovery
- Weekly manual snapshot: retained 90 days
- Cross-region backup replication: same settings in DR region

### Recovery Procedures
```bash
# 1. Restore SQLite from S3 backup
aws s3 cp s3://scalapos-backups/{storeId}/{timestamp}-data.db.brotli /tmp/restore.db.brotli
brotli --decompress /tmp/restore.db.brotli -o /var/scalapos/data.db

# 2. Restore PostgreSQL from RDS snapshot
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier scalapos-restored \
    --db-snapshot-identifier scalapos-snap-20250101

# 3. Point-in-time restore
aws rds restore-db-instance-to-point-in-time \
    --source-db-instance-identifier scalapos-prod \
    --target-db-instance-identifier scalapos-restored \
    --restore-time 2025-01-15T09:30:00Z
```

### Integrity Checks (run on every startup)
```csharp
public async Task VerifyDatabaseIntegrityAsync()
{
    // SQLite integrity check
    var result = await _db.Database.ExecuteScalarAsync<string>("PRAGMA integrity_check;");
    if (result != "ok")
        throw new DatabaseCorruptedException(result);

    // Check all journal entries balance
    var unbalanced = await _db.JournalEntries
        .Where(je => je.Lines.Sum(l => l.Debit) != je.Lines.Sum(l => l.Credit))
        .CountAsync();
    if (unbalanced > 0)
        _logger.LogError("{Count} unbalanced journal entries detected", unbalanced);

    // Verify audit log HMAC integrity (sample 100 recent entries)
    var recentAudit = await _db.AuditLogs.OrderByDescending(a => a.Timestamp).Take(100).ToListAsync();
    foreach (var entry in recentAudit)
    {
        var expected = _hmac.Compute(entry);
        if (entry.Hmac != expected)
            _logger.LogError("Audit log entry {Id} HMAC mismatch — possible tampering", entry.Id);
    }
}
```
