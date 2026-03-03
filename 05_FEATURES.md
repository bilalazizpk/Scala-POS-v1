# SCALA POS — Complete Project Features Plan
### Stack: .NET 8 · React 18 · TypeScript · Tailwind CSS · shadcn/ui · C# · SQLite (offline) · PostgreSQL (cloud)
### Scope: Full ERP · POS · HR · Supply Chain · Services · Productivity — All-in-One

---

## Table of Contents

1. [Tech Stack Architecture](#1-tech-stack-architecture)
2. [POS Core](#2-pos-core)
3. [Bill Splitting](#3-bill-splitting)
4. [Table Management](#4-table-management)
5. [Inventory Management](#5-inventory-management)
6. [Kitchen & Bar Management](#6-kitchen--bar-management)
7. [Store Management](#7-store-management)
8. [Accounting & Finance](#8-accounting--finance)
9. [HR & Employee Management](#9-hr--employee-management)
10. [Customer Management (CRM)](#10-customer-management-crm)
11. [Loyalty & Promotions](#11-loyalty--promotions)
12. [Reporting & Analytics](#12-reporting--analytics)
13. [Offline Architecture](#13-offline-architecture)
14. [Security & Compliance](#14-security--compliance)
15. [Integrations](#15-integrations)
16. [Settings & Configuration](#16-settings--configuration)
17. [Project File Structure](#17-project-file-structure)
18. [Database Schema Overview](#18-database-schema-overview)
19. [API Endpoint Map](#19-api-endpoint-map)
20. [Development Phases](#20-development-phases)
21. [Sales Module](#21-sales-module)
22. [Subscriptions & Rental](#22-subscriptions--rental)
23. [Supply Chain — Manufacturing & Quality](#23-supply-chain--manufacturing--quality)
24. [HR Extended — Recruitment, Appraisals, Fleet](#24-hr-extended--recruitment-appraisals-fleet)
25. [Services — Project, Helpdesk, Field Service](#25-services--project-helpdesk--field-service)
26. [Productivity — Knowledge Base & WhatsApp](#26-productivity--knowledge-base--whatsapp)
27. [Documents & Digital Signing](#27-documents--digital-signing)
28. [Spreadsheet BI](#28-spreadsheet-bi)
29. [Updated Summary Statistics](#29-updated-summary-statistics)

---

## 1. Tech Stack Architecture

### Backend — .NET 8 / C#

| Layer | Technology | Purpose |
|---|---|---|
| Web API | ASP.NET Core 8 Minimal APIs | REST endpoints, WebSocket hub |
| Real-time | SignalR | Table sync, KDS updates, multi-device |
| ORM | Entity Framework Core 8 | Database access, migrations |
| Local DB | SQLite + Microsoft.Data.Sqlite | Offline-first local store |
| Cloud DB | PostgreSQL 16 | Multi-store cloud sync |
| Caching | IMemoryCache + Redis (cloud) | Sessions, presence, report cache |
| Auth | ASP.NET Core Identity + JWT Bearer | Employee login, RBAC |
| Background | .NET Worker Services + Hangfire | Sync jobs, scheduled reports, reminders |
| Validation | FluentValidation | Request/command validation |
| Mapping | Mapster | DTO ↔ Entity mapping |
| Logging | Serilog → Seq / File | Structured logging + audit trail |
| Testing | xUnit + Moq + Respawn | Unit + integration tests |

### Frontend — React / TypeScript

| Layer | Technology | Purpose |
|---|---|---|
| Framework | React 18 + TypeScript | UI rendering |
| Build | Vite 5 | Fast HMR, optimised bundles |
| Styling | Tailwind CSS v3 + shadcn/ui | Component library + design system |
| State (server) | TanStack Query v5 | Server state, background sync, offline cache |
| State (client) | Zustand | Cart, active session, UI state |
| Routing | TanStack Router | Type-safe, file-based routing |
| Forms | React Hook Form + Zod | Type-safe form validation |
| Charts | Recharts + D3 | Dashboards, floor plans |
| Tables | TanStack Table v8 | Virtualized data tables |
| Real-time | @microsoft/signalr | WebSocket connection to .NET SignalR |
| Offline | Dexie.js (IndexedDB wrapper) | Browser-side offline cache |
| PDF | @react-pdf/renderer | Receipts, reports |
| Barcode | zxing-js/browser | Camera barcode scanning |
| Drag & Drop | @dnd-kit/core | Floor plan, scheduling |
| Animations | Framer Motion | Transitions, split bill UI |

### Project Structure (Monorepo)

```
ScalaPOS/
├── src/
│   ├── ScalaPOS.Api/                # ASP.NET Core 8 Web API
│   ├── ScalaPOS.Core/               # Domain models, interfaces
│   ├── ScalaPOS.Application/        # Use cases, commands, queries (CQRS)
│   ├── ScalaPOS.Infrastructure/     # EF Core, repositories, external services
│   ├── ScalaPOS.Sync/               # Offline sync engine (Worker Service)
│   └── ScalaPOS.Tests/              # xUnit test project
├── client/
│   ├── src/
│   │   ├── components/              # shadcn/ui + custom components
│   │   ├── pages/                   # Route-level page components
│   │   ├── features/                # Feature slices (pos, tables, inventory...)
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── stores/                  # Zustand stores
│   │   ├── lib/                     # API client, utils, validators
│   │   └── types/                   # TypeScript type definitions
│   └── ...
├── database/
│   ├── migrations/                  # EF Core migrations
│   └── seeds/                       # Dev seed data
└── docker/
    └── docker-compose.yml
```

---

## 2. POS Core

### 2.1 Checkout Screen

- **3-panel layout**: Product catalogue (left) · Active order/cart (centre) · Payment panel (right)
- **Quick Keys grid**: Configurable up to 8×6 per page, unlimited pages, colour-coded, image thumbnails
- **Product search**: Full-text search (FTS) across name, SKU, barcode — results < 50ms from SQLite
- **Barcode scanning**: USB HID scanner (auto-detected as keyboard input) + camera soft scanner (zxing-js)
- **Item modifiers**: Required/optional modifier groups (e.g. Burger → Doneness: Medium/Well, Add-ons: Cheese/Bacon)
- **Item notes**: Free-text note per line item (e.g. "no onions", "extra hot")
- **Quantity controls**: Tap +/- or enter quantity directly, supports decimal quantities (e.g. 0.5 kg)
- **Price override**: Manager PIN required to override item price, logged to audit trail
- **Void item**: Remove line item with reason code, logged
- **Hold & recall**: Park unlimited orders, recall by table, name, or order number
- **Open orders list**: Visual sidebar showing all parked orders with time elapsed
- **Order types**: Dine-in, takeaway, delivery, drive-through (configurable per store)
- **Covers/guests count**: Number of guests per order for analytics

### 2.2 Payment Processing

```csharp
// Payment abstraction — pluggable gateway
public interface IPaymentGateway
{
    Task<PaymentResult> ChargeAsync(PaymentRequest request, CancellationToken ct);
    Task<RefundResult> RefundAsync(RefundRequest request, CancellationToken ct);
    Task<bool> VoidAsync(string transactionId, CancellationToken ct);
}
```

- **Cash**: Tendered amount entry, automatic change calculation, configurable denominations
- **Card (EFTPOS)**: Stripe Terminal SDK, Square Terminal SDK — EMV chip, NFC tap, magnetic stripe
- **Digital wallets**: Apple Pay, Google Pay passthrough via payment terminal
- **QR Pay**: WeChat Pay, Alipay, PayNow (plugin-based, region-specific)
- **BNPL**: Klarna, Afterpay (Phase 3 — gateway-dependent)
- **House account / credit**: Charge to a customer account, collect later (B2B)
- **Gift cards**: Issue, redeem, check balance (custom or integrated e.g. Square Gift Cards)
- **Split payments**: One order paid across multiple methods (e.g. $30 cash + $20 card)
- **Tipping**: Suggested % buttons (10, 15, 20, 25, custom), shown on card reader screen
- **Surcharge rules**: Automatic card surcharge % configurable per payment type
- **Offline card**: Store-and-forward for card payments when terminal loses connectivity (Stripe offline mode)

### 2.3 Tax Engine

```csharp
public class TaxCalculationService
{
    // Supports inclusive, exclusive, compound, and zero-rated taxes
    // Multiple tax rates per item (federal + state + city)
    // Tax exemptions by customer or product category
}
```

- Inclusive (price includes tax) and exclusive (tax added on top) per item
- Multiple tax rates per product category (e.g. GST 10% + State 5%)
- Tax-exempt customers (B2B, non-profit)
- Zero-rated items (fresh food, medicine)
- Manual tax override with manager PIN
- Tax rounding rules: per-line or per-order

### 2.4 Discounts & Promotions

- **Item discount**: Flat $ or % off a single line item
- **Order discount**: Flat $ or % off entire order
- **Coupon codes**: Single-use, multi-use, with expiry date
- **BOGO**: Buy X get Y free/discounted (configurable X, Y, and discount)
- **Bundle deal**: Buy items A + B together for a fixed price
- **Happy hour**: Time-based automatic discount on selected categories
- **Employee discount**: Automatically applied per employee role
- **Manager override**: Approve discounts above a threshold
- All discounts logged: who applied, reason, amount, timestamp

### 2.5 Receipts

- **Print**: ESC/POS (Epson TM series, Star Micronics, Bixolon) via USB/Ethernet/Bluetooth
- **Email**: Receipt via email using SendGrid / SMTP
- **SMS**: Receipt link via Twilio
- **QR receipt**: Unique URL to digital receipt page (hosted)
- **Reprinting**: Reprint any past receipt from order history
- **Custom templates**: Header logo, footer message, social links — configurable per store
- **Kitchen tickets**: Separate kitchen print with modifiers, notes, order number
- **Fiscal receipts**: Country-specific fiscal printer support (Phase 3)

### 2.6 Refunds & Exchanges

- **Full refund**: Reverse entire transaction, restock inventory toggle
- **Partial refund**: Select individual items to refund
- **Exchange**: Swap items, difference charged or refunded
- **Refund method**: Return to original payment method or issue store credit
- **Reason codes**: Configurable list (customer complaint, wrong item, defective)
- **Refund approval**: Optional manager PIN requirement above threshold
- **Audit**: Every refund logged with employee, reason, items, and amount

---

## 3. Bill Splitting

> This is a world-class differentiator. The split interface is accessible from the main POS in one tap.

### 3.1 Split Modes

| Mode | Description |
|---|---|
| **Equal split** | Divide order total by N parties. Odd cents handled by configurable rounding (add to first party, last party, or largest) |
| **By-item split** | Drag-and-drop or checkbox-assign each line item to a party. Items can be shared across parties (each party pays their share) |
| **Custom amount** | Each party enters or server enters a custom $ amount. Running "remaining balance" counter shown in real time |
| **Percentage split** | Slider per party, must total 100%. Amounts update live |

### 3.2 Split Payment Workflow

```
1. Tap "Split Bill" on active order
2. Choose split mode
3. Assign items/amounts to parties (colour-coded Party A, B, C...)
4. Each party pays independently — any payment method per party
5. System tracks paid / unpaid balance per party
6. Final receipt: one combined receipt OR individual receipt per party
7. Tips: per-party tipping prompt on each payment
```

### 3.3 Additional Split Features

- **Merge bills**: Combine multiple open tabs or tables into one bill
- **Move items**: Move a line item from one order/table to another
- **Transfer table**: Move entire order from one table to another
- **Split a single item**: Half of a shared pizza → each party pays half
- **Visual party columns**: Colour-coded columns, party name editable, running subtotal per party
- **Print split receipts**: Individual receipt per party showing only their items

---

## 4. Table Management

### 4.1 Floor Plan Designer

- **Visual SVG editor**: Drag-and-drop furniture placement
- **Table shapes**: Circle, square, rectangle, booth, bar stool, high-top
- **Seats**: Set capacity per table (1–20 seats)
- **Sections**: Group tables into sections/rooms (Indoor, Outdoor, Bar, Private Dining)
- **Room tabs**: Navigate between sections
- **Walls & fixtures**: Non-interactive decorative elements (walls, bar counter, entrance)
- **Save layouts**: Multiple layout templates (lunch, dinner, event mode)
- **Manager-only edit mode**: Lock floor plan from accidental edits during service

### 4.2 Live Table View

- **Real-time status colours**:
  - 🟢 Green — Available
  - 🔴 Red — Occupied
  - 🟡 Yellow — Reserved (upcoming)
  - 🔵 Blue — Needs cleaning
  - 🟠 Orange — Needs attention (long wait, flagged)
  - ⚪ Grey — Closed/unavailable
- **Status updates** via SignalR — all terminals sync in < 1 second
- **Table card tooltip**: Party name, covers, time seated, order total, server name
- **One-tap to open order**: Double-tap table opens the order for that table
- **Time elapsed**: Visual timer showing how long table has been occupied

### 4.3 Table Operations

- **Merge tables**: Select 2–8 tables → creates one combined order. Floor plan shows merged visually
- **Split table**: Divide an occupied merged table back into individual tables, redistribute items
- **Transfer order**: Move order from Table 5 to Table 8 (table becomes available)
- **Move items**: Move specific items between two open orders/tables
- **Assign server**: Drag-and-drop server assignment per table or section
- **Cover count**: Update number of guests seated (for analytics)

### 4.4 Reservations

```csharp
public class Reservation
{
    public Guid Id { get; set; }
    public string GuestName { get; set; }
    public string Phone { get; set; }
    public string Email { get; set; }
    public int PartySize { get; set; }
    public DateTimeOffset ReservationTime { get; set; }
    public int DurationMinutes { get; set; }
    public Guid? TableId { get; set; }          // Pre-assigned table
    public string DietaryNotes { get; set; }
    public string SpecialOccasion { get; set; } // Birthday, anniversary
    public ReservationStatus Status { get; set; }
    public string ConfirmationCode { get; set; }
}
```

- Create, edit, cancel reservations with auto-confirmation SMS/email
- Table availability checker — shows conflicts
- Reservation timeline view (horizontal Gantt per table)
- Auto-assign best available table by party size
- Reminder SMS/email 24hr and 2hr before reservation
- No-show tracking and rebooking

### 4.5 Waitlist

- Add walk-ins to waitlist with name, party size, contact
- Estimated wait time calculation based on average table turnover
- SMS notification when table is ready: "Your table is ready! Please check in at the host stand."
- Waitlist display on customer-facing screen
- Accept/decline/mark-seated actions

### 4.6 QR Self-Ordering (Phase 2)

- Unique QR code per table → guest's phone → web app
- Guest browses menu, adds items, places order → appears on POS + KDS
- Guest can request service, ask for bill
- Payment at table via guest's phone (Stripe Payment Links)

---

## 5. Inventory Management

### 5.1 Product Catalogue

```csharp
public class Product
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Sku { get; set; }
    public string Barcode { get; set; }
    public decimal Price { get; set; }
    public decimal Cost { get; set; }
    public Guid CategoryId { get; set; }
    public List<ProductVariant> Variants { get; set; }
    public List<ProductModifierGroup> ModifierGroups { get; set; }
    public Recipe Recipe { get; set; }             // For restaurants
    public InventoryTrackingMethod TrackingMethod { get; set; }
    public CostingMethod CostingMethod { get; set; } // FIFO, LIFO, Average
    public decimal ReorderPoint { get; set; }
    public decimal ReorderQuantity { get; set; }
    public bool IsActive { get; set; }
}
```

- Unlimited categories with nested subcategories
- Product variants: size, colour, flavour — matrix generation (S/M/L × Red/Blue = 6 SKUs auto-created)
- Up to 3 attribute dimensions, unlimited values
- Bulk import via CSV/Excel
- Product images (stored locally + CDN for cloud sync)
- Unit of measure: each, kg, litre, metre, box — with conversion rules
- Composite products: a "Gift Basket" that contains 3 individual products

### 5.2 Stock Tracking

- **Real-time stock levels** deducted on every sale (including modifier ingredients)
- **Multiple locations**: stock levels per store/warehouse
- **Stock on hand, committed, available** distinction
- **Negative stock**: allow or block, configurable per product
- **Low stock alerts**: push notification, email, dashboard badge when stock ≤ reorder point
- **Out-of-stock handling**: grey out item on POS, or show "low stock" warning

### 5.3 Recipe / Bill of Materials (Restaurants)

```csharp
public class Recipe
{
    public Guid ProductId { get; set; }
    public List<RecipeIngredient> Ingredients { get; set; }
    public decimal Yield { get; set; }          // e.g. 1 serving
    public string PreparationNotes { get; set; }
}

public class RecipeIngredient
{
    public Guid IngredientProductId { get; set; }
    public decimal Quantity { get; set; }
    public string Unit { get; set; }
    public decimal WastagePercent { get; set; } // e.g. 10% carrot peeling waste
}
```

- Each menu item deducts raw ingredients on sale
- Wastage percentage per ingredient
- Theoretical vs. actual cost analysis
- Sub-recipes: "Hollandaise Sauce" recipe used in multiple dishes
- Yield tracking: 1 kg chicken breast → 12 chicken portions
- Recipe costing: auto-calculate dish cost from ingredient costs
- Menu engineering report: profit margin vs. popularity quadrant

### 5.4 Purchase Orders

- Create PO from supplier catalogue or low-stock suggestions
- PO workflow: Draft → Sent → Partially Received → Received → Invoiced
- Email PO to supplier directly from app
- Receive stock against PO: enter actual quantities received, flag discrepancies
- Partial receipts: receive 80 of 100 ordered, PO stays open
- Supplier invoice matching: match incoming invoice to PO, flag price variances
- Average cost update on receipt

### 5.5 Stock Operations

- **Stock count**: Full count or cycle count by category/location
  - Blind count: staff count without seeing expected quantities
  - Variance report: expected vs. actual, auto-creates adjustment
- **Stock adjustment**: Manual +/- with reason (waste, damage, theft, correction)
- **Stock transfer**: Move stock between locations with in-transit tracking
- **Stock write-off**: Write off expired/damaged stock, adjusts COGS
- **Batch/lot tracking**: Record lot number, manufacture date, expiry date
- **FEFO** (First Expired First Out) picking for batch-tracked items

### 5.6 Inventory Valuation

- **FIFO**: First in, first out — each unit tracked at purchase cost
- **LIFO**: Last in, first out
- **Weighted Average Cost**: Recalculated on each purchase receipt
- Per-product costing method
- **Inventory valuation report**: Total stock value at cost, by category/location
- **COGS report**: Cost of goods sold per period

---

## 6. Kitchen & Bar Management

### 6.1 Kitchen Display System (KDS)

- Web-based KDS screen (any browser — tablet, monitor, Raspberry Pi)
- Real-time order updates via SignalR
- Colour-coded by order age: green (fresh) → amber (5 min) → red (10+ min)
- Group items by course: Starter, Main, Dessert
- Bump bar support (hardware USB button to bump order)
- **Bump**: Mark item/order as ready
- **Recall**: Bring back bumped order (if sent in error)
- **Filter**: Show only Bar items, Grill items, etc. (per KDS station)
- Multi-station: separate KDS for Grill, Fryer, Pass, Bar
- Prep time tracking per item

### 6.2 Order Routing

- Items automatically routed to correct KDS station based on product category
- Configurable routing rules: Category → Station
- Course firing: hold starters until mains are submitted, or fire all at once
- Rush order flag: visually highlighted on KDS

### 6.3 Bar Tab Management

- Open a named tab (credit card authorisation hold optional)
- Add rounds to tab throughout the night
- Close tab to payment at end
- Tab list view for bar staff

---

## 7. Store Management

### 7.1 Multi-Store

- Unlimited store locations under one account
- Centralised product catalogue with per-store price overrides
- Centralised employee directory with store-specific roles
- Per-store settings: tax rates, receipt templates, payment methods, operating hours
- Consolidated reporting across all stores + per-store drill-down
- Stock transfers between store locations
- Inter-store sales (order at store A, pick up at store B)

### 7.2 Cash Management

```csharp
public class CashSession
{
    public Guid Id { get; set; }
    public Guid RegisterId { get; set; }
    public Guid OpenedByEmployeeId { get; set; }
    public decimal OpeningFloat { get; set; }
    public List<CashDrop> Drops { get; set; }       // Mid-shift cash removals
    public List<PettyCash> Disbursements { get; set; }
    public decimal? ExpectedCash { get; set; }       // Calculated from sales
    public decimal? CountedCash { get; set; }        // Blind count at close
    public decimal? Variance { get; set; }
    public DateTimeOffset? ClosedAt { get; set; }
}
```

- Opening float entry per register
- Mid-shift cash drops (remove cash to safe)
- Petty cash disbursements with reason
- Blind close: staff counts cash without seeing expected amount
- Z-report auto-generated on close: full reconciliation (cash, card, by payment type)
- X-report: mid-shift summary (does not close session)
- Variance tracking: over/short history per employee

### 7.3 Register / Terminal Management

- Multiple registers per store
- Hardware profile per register: assign printer, cash drawer, card reader
- Register open/close independent of shift
- Transfer float between registers
- Remote register monitoring from manager dashboard

### 7.4 Operating Hours & Service Periods

- Configure opening hours per store per day
- Service periods: Breakfast, Lunch, Dinner, Late Night
- Auto-switch menus/price lists per service period
- Public holiday overrides

---

## 8. Accounting & Finance

> Full double-entry accounting built-in. No QuickBooks required (though sync is available).

### 8.1 Chart of Accounts

```csharp
public class Account
{
    public Guid Id { get; set; }
    public string Code { get; set; }        // e.g. "4000"
    public string Name { get; set; }        // e.g. "Sales Revenue"
    public AccountType Type { get; set; }   // Asset, Liability, Equity, Revenue, Expense
    public AccountSubType SubType { get; set; }
    public bool IsSystemAccount { get; set; }
    public bool AllowManualEntry { get; set; }
}
```

- Pre-seeded chart of accounts per industry (Restaurant, Retail, Cafe, Service)
- Custom accounts, sub-accounts
- Account codes (4-digit standard)
- Account types: Asset, Liability, Equity, Revenue, Expense, Cost of Sales

### 8.2 Automatic Journal Entries

Every financial event creates a journal entry automatically:

| Event | Debit | Credit |
|---|---|---|
| Sale (cash) | Cash / Drawer | Sales Revenue |
| Sale (card) | Accounts Receivable (card) | Sales Revenue |
| Sale (tax) | Sales Tax Payable | — |
| Sale (cost) | Cost of Goods Sold | Inventory Asset |
| Refund | Sales Revenue | Cash / AR |
| Purchase receipt | Inventory Asset | Accounts Payable |
| Supplier payment | Accounts Payable | Cash/Bank |
| Expense | Expense Account | Cash/Bank |
| Employee wage | Wages Expense | Cash/Bank |

### 8.3 General Ledger

- Full double-entry ledger
- Journal entry list with drill-down to source transaction
- Manual journal entries (with approval workflow optional)
- Recurring journal entries (e.g. monthly depreciation, rent)
- Bank reconciliation: import bank statement, match to ledger entries

### 8.4 Accounts Payable

- Supplier invoices: create, attach PDF scan, post to ledger
- PO matching: match supplier invoice to purchase order
- Payment recording: full, partial, advance payment
- Supplier ageing report: 0–30, 31–60, 61–90, 90+ days overdue
- Batch payment: pay multiple suppliers in one action
- Due date alerts

### 8.5 Accounts Receivable (B2B)

- Customer invoices: create, send via email (PDF)
- Invoice line items with tax
- Payment recording against invoice
- Customer statement: all outstanding invoices per customer
- Overdue reminders: automated email at 7, 14, 30 days
- Customer ageing report
- Credit limits per customer account

### 8.6 Expense Management

- Record business expenses with category, supplier, amount, date
- Attach receipt photo (camera or file upload)
- Recurring expenses (rent, subscriptions)
- Expense approval workflow (employee submits → manager approves)
- Expense reports by category/employee/period
- Mileage / per-diem tracking (Phase 2)

### 8.7 Financial Reports

| Report | Description |
|---|---|
| **Profit & Loss** | Revenue − COGS − Expenses = Net Profit. Daily/weekly/monthly/YTD/custom |
| **Balance Sheet** | Assets = Liabilities + Equity snapshot at any date |
| **Cash Flow Statement** | Operating/investing/financing activities |
| **Trial Balance** | All accounts with debit/credit balances |
| **General Ledger Detail** | Every journal entry per account per period |
| **Sales Tax Report** | Tax collected by rate/jurisdiction for filing |
| **COGS Report** | Cost of goods sold by product/category/period |
| **Gross Margin Report** | Revenue, cost, and margin % by product/category |

- Accrual basis and cash basis switching
- Multi-currency with live FX rates (Phase 2)
- Export: PDF, Excel, CSV
- Comparison: current period vs. prior period vs. budget

### 8.8 Budget & Forecasting

- Set monthly budgets per account/category
- Budget vs. actual variance report
- Sales forecasting based on historical trends (Phase 2 — ML-assisted)

### 8.9 End of Day / Period Close

- EOD wizard: close cash session → reconcile → post journal entries → generate reports
- Monthly close checklist: bank reconciliation, review outstanding items, post adjustments
- Year-end close: transfer net profit to retained earnings

---

## 9. HR & Employee Management

### 9.1 Employee Profiles

```csharp
public class Employee
{
    public Guid Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public string Pin { get; set; }              // Hashed 4-6 digit POS PIN
    public Guid RoleId { get; set; }
    public Guid StoreId { get; set; }
    public EmploymentType EmploymentType { get; set; } // Full-time, Part-time, Casual
    public decimal HourlyRate { get; set; }
    public decimal? Salary { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string EmergencyContact { get; set; }
    public string TaxFileNumber { get; set; }    // Encrypted
    public string BankAccount { get; set; }      // Encrypted
    public List<Certification> Certifications { get; set; } // RSA, food safety certs
}
```

- Profile photo, personal details, contact info
- Employment type: Full-time, Part-time, Casual/Contractor
- Hourly rate, salary, pay frequency
- Tax information (encrypted)
- Bank account for payroll (encrypted)
- Document storage: employment contract, ID, certifications (Phase 2)

### 9.2 Roles & Permissions (RBAC)

```csharp
// Granular permission flags
public enum Permission
{
    // POS
    ProcessSale, ApplyDiscount, ApplyManagerDiscount, VoidItem, VoidOrder,
    OpenCashDrawer, RefundOrder, OverridePrice,
    // Tables
    ManageFloorPlan, TransferTable, MergeTable,
    // Inventory
    ViewInventory, EditInventory, CreatePurchaseOrder, ReceiveStock, AdjustStock,
    // HR
    ViewEmployees, EditEmployees, ManageRoles, ViewPayroll,
    // Accounting
    ViewAccounting, EditAccounting, ApproveExpenses,
    // Reports
    ViewSalesReports, ViewInventoryReports, ViewHRReports, ViewFinancialReports,
    // Settings
    ManageSettings, ManageIntegrations, ManageHardware
}
```

- Built-in roles: Cashier, Server, Bartender, Supervisor, Manager, Owner, Accountant
- Custom role creation from permission matrix
- Permissions enforced server-side (.NET middleware) — not just in UI
- PIN change, account lock/unlock
- Concurrent session control: one active POS session per employee

### 9.3 Time Clock

- **POS PIN entry**: Tap "Clock In" → enter PIN
- **NFC card tap**: ISO 14443 NFC reader (Phase 2)
- **Biometric**: Windows Hello / Face ID (Phase 3 — platform-dependent)
- Clock in/out logs: timestamp, location/register
- Break tracking: paid/unpaid break start/end
- Missed punch alerts: employee forgot to clock out
- Manager override: add/edit/delete time entries with reason
- Overtime detection: flag entries that trigger daily or weekly OT rules
- Kiosk mode: dedicated time clock screen (full-screen, no navigation)

### 9.4 Shift Scheduling

```
Week View: Mon Tue Wed Thu Fri Sat Sun
Employee A: [9–5] [9–5]  —  [9–5] [9–5] [11–7]  —
Employee B:  —   [2–10][2–10][2–10][2–10][2–10][10–6]
```

- **Drag-and-drop** weekly calendar (dnd-kit)
- Create shift templates (recurring weekly patterns)
- Shift copy: copy last week's schedule
- Conflict detection: double-booking, insufficient rest between shifts
- Availability management: employees set their unavailable times
- Open shifts: post unfilled shifts, employees can request them
- Shift swaps: employee A requests swap with Employee B → manager approves
- Labour cost estimator: shows projected wage cost vs. revenue target for the week
- Publish schedule → employees receive SMS/email notification
- Schedule vs. actual report: planned hours vs. clocked hours

### 9.5 Commission Tracking

```csharp
public class CommissionRule
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public CommissionType Type { get; set; } // FlatPerSale, PercentOfRevenue, Tiered
    public decimal? FlatAmount { get; set; }
    public decimal? Percentage { get; set; }
    public List<CommissionTier> Tiers { get; set; }
    public Guid? CategoryId { get; set; }    // Null = applies to all
    public Guid? EmployeeRoleId { get; set; }
}
```

- Flat amount per sale
- Percentage of item/order revenue
- Tiered commission: 5% for first $5k/month, 8% above $5k
- Category-specific rules: higher commission on premium items
- Role-specific rules
- Commission report: per employee per period, breakdown by transaction
- Commission payout export to payroll

### 9.6 Tip Management

- **Individual tips**: Tips go directly to serving employee
- **Tip pool — equal split**: All tips divided equally among all clocked-in staff
- **Tip pool — points-based**: Front of house 70%, back of house 30%; distributed by hours worked
- **Custom tip distribution**: Manager defines % per role (server 60%, busser 15%, kitchen 25%)
- Tip declaration tracking (for payroll tax compliance)
- Tip payout report per employee per shift/period

### 9.7 Payroll

- **Payroll run wizard**:
  1. Select pay period
  2. Review time entries (flag unresolved exceptions)
  3. Apply overtime rules
  4. Add commissions and tip payouts
  5. Apply deductions (tax, super/pension)
  6. Review totals → approve
  7. Generate pay slips (PDF email to employees)
  8. Export to accounting (posts journal entries automatically)

- **Pay calculation**: Base hours + overtime + double time + allowances + commissions + tips − deductions
- **Overtime rules**: Daily OT > 8h, weekly OT > 40h, double time > 12h (configurable by jurisdiction)
- **Deductions**: Tax (PAYG/PAYE), superannuation/pension, health insurance, other
- **Payroll export**: Xero, MYOB, ADP, Gusto, CSV
- **Pay slips**: Employee self-service: view pay slips from employee portal (Phase 2)
- **Leave management** (Phase 2): Annual leave, sick leave accrual and balance tracking

---

## 10. Customer Management (CRM)

### 10.1 Customer Profiles

```csharp
public class Customer
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string Notes { get; set; }
    public CustomerType Type { get; set; }   // Individual, Business
    public string CompanyName { get; set; }  // For B2B
    public string TaxNumber { get; set; }    // ABN, VAT, EIN
    public Address Address { get; set; }
    public decimal CreditLimit { get; set; }
    public decimal AccountBalance { get; set; }
    public int LoyaltyPoints { get; set; }
    public LoyaltyTier Tier { get; set; }
    public List<DietaryRestriction> DietaryRestrictions { get; set; }
    public List<Allergy> Allergies { get; set; }
    public MarketingConsent MarketingConsent { get; set; }
}
```

- Create customer at POS: just phone number minimum
- Progressive profiling: add details over time
- Purchase history: every transaction, product, amount, date
- Dietary restrictions and allergy notes (visible on POS when customer selected)
- Customer notes: "Prefers window seat", "VIP — always offer complimentary dessert"
- Account balance / house account
- B2B: company name, tax number, credit terms

### 10.2 Customer Search & Lookup

- Search at POS by name, phone, email, loyalty card number
- Scan loyalty card barcode / NFC
- Customer card shows: name, points balance, tier, last visit, total spend
- Merge duplicate customer records

### 10.3 Purchase History & Analytics

- Full transaction history per customer
- Lifetime value (LTV)
- Average spend per visit
- Favourite items
- Visit frequency: daily/weekly/monthly
- Days since last visit
- RFM score: Recency, Frequency, Monetary value

---

## 11. Loyalty & Promotions

### 11.1 Loyalty Program

```csharp
public class LoyaltyProgram
{
    public decimal PointsPerDollar { get; set; }     // e.g. 1 point per $1
    public decimal DollarValuePerPoint { get; set; } // e.g. 0.01 ($0.01 per point)
    public int PointsExpiryDays { get; set; }        // 0 = never expire
    public List<LoyaltyTier> Tiers { get; set; }
    public List<LoyaltyMultiplier> Multipliers { get; set; } // Double points Tuesdays
}

public class LoyaltyTier
{
    public string Name { get; set; }         // Bronze, Silver, Gold, Platinum
    public int MinimumPoints { get; set; }
    public decimal PointsMultiplier { get; set; }
    public List<TierBenefit> Benefits { get; set; }
}
```

- Earn points on every purchase (configurable ratio: $1 = 1 point)
- Redeem points at POS (enter points to redeem → deducted from cart total)
- Up to 5 tiers with automatic tier progression
- Tier benefits: bonus points multiplier, exclusive discounts, free items
- Bonus point events: double points Tuesday, 3x points on your birthday week
- Points expiry: configurable days of inactivity before expiry
- Points history: earn/redeem log per customer
- Loyalty card: physical barcode card or digital (QR on phone)

### 11.2 Promotions Engine

```csharp
public class Promotion
{
    public string Name { get; set; }
    public PromotionType Type { get; set; }
    public DiscountMethod DiscountMethod { get; set; }
    public decimal DiscountValue { get; set; }
    public List<PromotionCondition> Conditions { get; set; } // Min spend, category, items
    public DateTimeOffset StartDate { get; set; }
    public DateTimeOffset EndDate { get; set; }
    public TimeOnly? ActiveFrom { get; set; }
    public TimeOnly? ActiveTo { get; set; }
    public List<DayOfWeek> ActiveDays { get; set; }
    public int? MaxRedemptions { get; set; }
    public bool RequiresCouponCode { get; set; }
    public CustomerSegment? TargetSegment { get; set; }
}
```

- Time-based: happy hour, daily specials
- Day-of-week: "Taco Tuesday" — 20% off tacos every Tuesday
- Minimum spend: 10% off when order > $50
- Category: 15% off all desserts
- Specific items: BOGO on selected wine bottles
- Customer segment: Gold tier members get free coffee with any meal
- Coupon codes: single-use, multi-use, expiry, usage limits

### 11.3 Marketing Campaigns (Phase 2)

- **Email campaigns**: Design with drag-and-drop editor, send to segments
- **SMS campaigns**: Bulk SMS to customer segment via Twilio
- **Automations**:
  - Birthday: 1 week before birthday → send "Happy Birthday + 20% off"
  - Win-back: Not visited in 60 days → "We miss you! Free coffee with next visit"
  - Tier upgrade: "Congratulations! You've reached Gold status"
  - Post-visit: 2 hours after visit → "Thanks for visiting! Rate your experience"
- **Segment builder**: Rule-based dynamic segments
  - "Customers who spent > $200 in last 30 days AND haven't visited in 14 days"
  - "Customers in Gold tier who ordered Category: Wine"

---

## 12. Reporting & Analytics

### 12.1 Real-Time Dashboard

- **KPI tiles** (live, auto-refresh every 30s):
  - Today's revenue vs. yesterday vs. same day last week
  - Transaction count
  - Average basket size
  - Gross margin %
  - Items sold
  - Active tables / table occupancy %
  - Customers served
  - Top item of the day

### 12.2 Sales Reports

| Report | Details |
|---|---|
| Sales Summary | Revenue, transactions, avg basket, by hour/day/week/month |
| Sales by Product | Revenue, quantity, COGS, margin per product |
| Sales by Category | Revenue and margin by category |
| Sales by Employee | Revenue, transactions, avg basket per staff member |
| Sales by Payment Type | Cash, card, digital wallet breakdown |
| Hourly Sales Heat Map | Heat map of busy hours by day of week |
| Void & Discount Report | All voids and discounts with reason codes |
| Refund Report | All refunds by reason, product, employee |

### 12.3 Inventory Reports

| Report | Details |
|---|---|
| Stock on Hand | Current quantities and values at cost |
| Low Stock Alert | Items at or below reorder point |
| Stock Movement | All receipts, sales, adjustments, transfers per period |
| Stock Count Variance | Expected vs. actual from cycle counts |
| Inventory Valuation | Total stock value by costing method |
| Supplier Performance | On-time delivery %, fill rate, lead time per supplier |
| Wastage Report | Write-offs by reason, product, period |
| Purchase Order Status | All POs: open, partially received, received |

### 12.4 Employee Reports

| Report | Details |
|---|---|
| Timesheet | Hours worked per employee per period |
| Overtime Report | All OT hours and additional cost |
| Commission Report | Commission earned per employee per period |
| Tip Report | Tips received per employee per shift |
| Payroll Summary | Gross pay, deductions, net pay per employee |
| Schedule vs Actual | Planned vs. clocked hours per shift |
| Sales Performance | Revenue per employee, upsell rate |

### 12.5 Customer Reports

| Report | Details |
|---|---|
| Customer Growth | New vs. returning customers over time |
| Top Customers | By revenue, visit frequency, LTV |
| Customer RFM | Recency/Frequency/Monetary segmentation matrix |
| Loyalty Report | Points issued, redeemed, expired; tier distribution |
| Churn Risk | Customers at risk based on inactivity |

### 12.6 Financial Reports

> Covered in Section 8.7 — see Accounting & Finance.

### 12.7 Report Features

- Date range picker: today, yesterday, this week, last week, this month, last month, YTD, custom
- Period comparison: current vs. prior period / prior year
- Store filter: one store, multiple stores, or all
- Export: PDF (formatted), Excel (raw data), CSV
- Scheduled delivery: email report as PDF/CSV daily/weekly/monthly at configured time
- Custom report builder (Phase 3): drag-and-drop fields, custom filters, save report

---

## 13. Offline Architecture

### 13.1 Core Principle

**The local database is always the source of truth. The cloud is a replica.**

```
┌─────────────────────────────────────────────────────┐
│                 .NET 8 Application                   │
│  ┌───────────┐     ┌──────────────┐                  │
│  │  React UI │────▶│  Local API   │                  │
│  └───────────┘     │  (Kestrel)   │                  │
│                    └──────┬───────┘                  │
│                           │                          │
│                    ┌──────▼───────┐                  │
│                    │  SQLite DB   │  ◀── Source of   │
│                    │  (WAL mode)  │       Truth      │
│                    └──────┬───────┘                  │
│                           │                          │
│                    ┌──────▼───────┐                  │
│                    │  Sync Engine │                  │
│                    │ (Worker Svc) │                  │
│                    └──────┬───────┘                  │
└───────────────────────────┼─────────────────────────┘
                            │ HTTPS (when online)
                    ┌───────▼───────┐
                    │  PostgreSQL   │
                    │  (Cloud)      │
                    └───────────────┘
```

### 13.2 SQLite Local Database

- SQLite 3.45+ with WAL (Write-Ahead Logging) mode enabled
- Encrypted at rest: SQLCipher AES-256
- FTS5 full-text search index on Products (name, SKU, barcode)
- All tables include: `CreatedAt`, `UpdatedAt`, `DeletedAt` (soft delete), `SyncVersion` (long)
- Foreign key enforcement: `PRAGMA foreign_keys = ON`

### 13.3 Sync Engine

```csharp
public class SyncEngine : BackgroundService
{
    // Runs continuously, syncs on:
    // 1. Network becomes available
    // 2. Every 30 seconds when online
    // 3. On explicit user-triggered sync

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await foreach (var connectivity in _networkMonitor.Changes(ct))
        {
            if (connectivity == NetworkStatus.Online)
                await SyncPendingChangesAsync(ct);
        }
    }

    private async Task SyncPendingChangesAsync(CancellationToken ct)
    {
        // 1. Collect rows where SyncVersion > LastSyncedVersion
        // 2. Compress (Brotli) and POST to /api/sync/push
        // 3. GET /api/sync/pull?since={LastSyncedVersion}
        // 4. Apply pulled changes with conflict resolution
        // 5. Update LastSyncedVersion
    }
}
```

### 13.4 Conflict Resolution Rules

| Entity | Strategy | Rule |
|---|---|---|
| Orders / Transactions | Last-Write-Wins | Transactions are immutable once completed. No conflict possible |
| Inventory stock levels | Server Merge | Sum of all offline deductions applied to server stock |
| Customer profile | Last-Write-Wins + field-level | Most recent field value wins per field |
| Table status | Last-Write-Wins | Most recent timestamp wins |
| Shift / schedule | Manual flag | Flagged for manager review if true conflict |
| Config / settings | Server wins | Server config always wins for settings |

### 13.5 LAN Sync (Multi-Device)

- Devices on the same local network discover each other via mDNS
- Peer-to-peer sync over local TCP/IP: < 50ms table status, < 100ms inventory
- SignalR hub runs on primary POS terminal, other terminals connect
- LAN sync works completely without internet: all devices stay in sync

### 13.6 Sync Status UI

- 🟢 Green dot: fully synced
- 🟡 Amber: sync pending (changes queued)
- 🔴 Red: offline — working locally
- Click status dot → detailed sync log: last synced time, pending changes count, errors

### 13.7 Offline Capability Matrix

| Feature | Offline Capable |
|---|---|
| Process sale (all payment types except remote) | ✅ Full |
| Table management | ✅ Full |
| Receipt printing | ✅ Full |
| Inventory deduction | ✅ Full |
| Loyalty points earn/redeem | ✅ Full |
| Employee time clock | ✅ Full |
| Reporting (local data) | ✅ Full |
| Cloud sync | ❌ Queued until online |
| Email / SMS receipts | ❌ Queued until online |
| Remote card payment | ⚠️ Store-and-forward mode |
| Cross-store stock query | ❌ Last-known data only |

---

## 14. Security & Compliance

### 14.1 Authentication

- **Employee login**: PIN (4–8 digit, hashed with bcrypt) for quick POS login
- **Manager login**: Email + password + optional TOTP (2FA) for back-office
- **JWT tokens**: RS256 signed, 15-minute access token + 30-day refresh token
- **Token storage**: Secure HttpOnly cookie (web) or OS Credential Manager
- **Session management**: Single active session per employee on POS; back-office allows multiple

### 14.2 Authorisation (RBAC)

```csharp
// Server-side permission check — not just UI
[Authorize]
[RequirePermission(Permission.ApplyManagerDiscount)]
public async Task<IResult> ApplyDiscountAsync(...)
{
    // Permission verified before any business logic executes
}
```

- Every API endpoint validates JWT + permissions
- Permissions enforced at API controller/handler level
- UI reflects permissions (hides/disables elements) but does NOT replace server enforcement
- Audit every permission denial: who, what, when

### 14.3 Data Encryption

- **SQLite at rest**: SQLCipher AES-256, key derived from machine + user credentials
- **Sensitive fields**: Tax numbers, bank accounts, card tokens — encrypted with AES-256-GCM at application layer
- **In transit**: TLS 1.3 minimum, HSTS, certificate pinning for API calls
- **PAN data**: NEVER stored. Card processing fully delegated to certified P2PE terminal hardware

### 14.4 Audit Trail

```csharp
public class AuditLog
{
    public Guid Id { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public Guid EmployeeId { get; set; }
    public string Action { get; set; }       // "VoidOrder", "ApplyDiscount", "EditEmployee"
    public string EntityType { get; set; }
    public Guid EntityId { get; set; }
    public string PreviousValue { get; set; } // JSON snapshot
    public string NewValue { get; set; }      // JSON snapshot
    public string IpAddress { get; set; }
    public string RegisterId { get; set; }
    public string Hmac { get; set; }          // HMAC-SHA256 signature
}
```

- Every mutation (sale, void, refund, discount, employee change, config change) logs an audit entry
- Entries are append-only: no updates or deletes
- HMAC-SHA256 signature per entry to detect tampering
- Audit log viewer in settings (manager+): filter by employee, action, date
- Export audit log for compliance

### 14.5 PCI-DSS

- No card data stored (PAN, CVV, expiry never touch application DB)
- P2PE certified terminals (Stripe, Square)
- TLS 1.3 in transit
- Access controls and audit logs
- Annual vulnerability scanning (Phase 3 — engage QSA)
- Network segmentation for POS terminals

---

## 15. Integrations

### 15.1 Payment Gateways

| Gateway | Phase | Notes |
|---|---|---|
| Stripe Terminal | Phase 1 | S700 reader, Apple/Google Pay |
| Square Terminal | Phase 1 | Square Terminal SDK |
| Adyen | Phase 2 | Enterprise, international |
| PayPal / Braintree | Phase 2 | Consumer markets |
| Custom gateway | Phase 2 | Via payment plugin interface |

### 15.2 Accounting Software

- **QuickBooks Online**: OAuth 2.0, bidirectional sync: sales summary, expenses, suppliers, CoA
- **Xero**: Same feature set, APAC/UK focused
- **MYOB** (Phase 2): Australian market
- **CSV/XLSX export**: Universal fallback for any accounting software

### 15.3 E-commerce

- **Shopify**: Product catalogue sync, real-time inventory sync, online orders → POS queue
- **WooCommerce**: Same via WooCommerce REST API
- **Custom webhook**: Any platform can push orders to `/api/webhooks/order`

### 15.4 Hardware Drivers (.NET)

```csharp
public interface IReceiptPrinter
{
    Task PrintReceiptAsync(ReceiptData data, CancellationToken ct);
    Task OpenCashDrawerAsync(CancellationToken ct);
    Task<PrinterStatus> GetStatusAsync(CancellationToken ct);
}

// Implementations:
// EpsonEscPosPrinter : IReceiptPrinter
// StarMicronicsEscPosPrinter : IReceiptPrinter
// ZebraZplLabelPrinter : ILabelPrinter
```

| Hardware | Protocol | Notes |
|---|---|---|
| Epson TM Series | ESC/POS | USB, Ethernet, Bluetooth |
| Star Micronics | ESC/POS / StarPRNT | USB, Ethernet, Bluetooth, LAN |
| Bixolon | ESC/POS | USB, Ethernet |
| Zebra (labels) | ZPL | USB, Ethernet |
| Generic USB cash drawer | RJ-11 from printer | Auto-open on cash payment |
| USB HID barcode scanner | HID keyboard emulation | Plug-and-play |
| BT barcode scanner | SPP profile | Pair with OS |
| Scales | OPOS / HID | USB, weight-based pricing |
| Stripe Reader S700 | Stripe SDK | EMV, NFC, display |
| Square Terminal | Square SDK | All-in-one payment device |

### 15.5 Communications

- **SendGrid**: Transactional email (receipts, invoices, booking confirmations)
- **Twilio**: SMS (receipts, reservation reminders, marketing campaigns, OTP)
- **Mailchimp**: Audience sync, campaign triggers
- **Slack webhook**: Send operational alerts (low stock, EOD summary) to Slack channel

### 15.6 Tax

- **Avalara AvaTax**: Real-time tax calculation by jurisdiction (Phase 2)
- **Vertex** (Phase 3): Enterprise tax compliance
- **Built-in manual tax rules**: Always available as fallback

---

## 16. Settings & Configuration

### 16.1 Settings Hierarchy

```
Global (Owner level)
    └── Store Level
            └── Register Level
                    └── User Level
```

Each level inherits from the level above and can override specific values.

### 16.2 Settings Categories

- **General**: Business name, logo, currency, timezone, language, date/number formats
- **Tax**: Tax rates per category, inclusive/exclusive, tax rounding
- **Payments**: Enable/disable payment methods, surcharge rules, tip prompts
- **Receipts**: Header/footer text, logo, fields to show, print triggers
- **Hardware**: Printer assignment, cash drawer trigger, card reader pairing
- **POS Layout**: Quick-key grid configuration, category order, colour themes
- **Loyalty**: Points ratio, redemption value, tier thresholds, expiry
- **Discounts**: Allowed discount types per role, threshold for manager approval
- **Notifications**: Low stock threshold, email/push alerts
- **Accounting**: Default accounts, tax accounts, payment account mapping
- **Integrations**: API keys, OAuth connections, webhook URLs
- **Security**: PIN complexity rules, session timeout, 2FA requirement by role
- **Regional**: Currency, tax terminology (GST/VAT/Sales Tax), date format, address format

---

## 17. Project File Structure

```
ScalaPOS/
├── src/
│   │
│   ├── ScalaPOS.Core/                          # Domain Layer (no dependencies)
│   │   ├── Entities/
│   │   │   ├── Order.cs
│   │   │   ├── OrderItem.cs
│   │   │   ├── Product.cs
│   │   │   ├── ProductVariant.cs
│   │   │   ├── Recipe.cs
│   │   │   ├── Inventory.cs
│   │   │   ├── StockMovement.cs
│   │   │   ├── PurchaseOrder.cs
│   │   │   ├── Customer.cs
│   │   │   ├── Employee.cs
│   │   │   ├── TimeEntry.cs
│   │   │   ├── Shift.cs
│   │   │   ├── Table.cs
│   │   │   ├── Reservation.cs
│   │   │   ├── Account.cs
│   │   │   ├── JournalEntry.cs
│   │   │   ├── Invoice.cs
│   │   │   ├── Expense.cs
│   │   │   ├── LoyaltyTransaction.cs
│   │   │   └── AuditLog.cs
│   │   ├── Enums/
│   │   ├── Interfaces/
│   │   │   ├── Repositories/
│   │   │   └── Services/
│   │   └── ValueObjects/
│   │
│   ├── ScalaPOS.Application/                   # Application Layer (CQRS)
│   │   ├── Features/
│   │   │   ├── Orders/
│   │   │   │   ├── Commands/CreateOrder/
│   │   │   │   ├── Commands/CompleteOrder/
│   │   │   │   ├── Commands/VoidOrder/
│   │   │   │   ├── Commands/RefundOrder/
│   │   │   │   ├── Commands/SplitBill/
│   │   │   │   └── Queries/GetOrderHistory/
│   │   │   ├── Products/
│   │   │   ├── Inventory/
│   │   │   ├── Tables/
│   │   │   ├── Employees/
│   │   │   ├── TimeEntries/
│   │   │   ├── Shifts/
│   │   │   ├── Accounting/
│   │   │   ├── Customers/
│   │   │   ├── Loyalty/
│   │   │   ├── Promotions/
│   │   │   ├── Reports/
│   │   │   └── Sync/
│   │   ├── Common/
│   │   │   ├── Behaviours/         # Validation, logging, auth pipeline behaviours
│   │   │   └── Interfaces/
│   │   └── DTOs/
│   │
│   ├── ScalaPOS.Infrastructure/                # Infrastructure Layer
│   │   ├── Persistence/
│   │   │   ├── AppDbContext.cs
│   │   │   ├── Configurations/     # EF Core entity configurations
│   │   │   ├── Migrations/
│   │   │   ├── Repositories/
│   │   │   └── Seeders/
│   │   ├── Services/
│   │   │   ├── PaymentGateways/    # Stripe, Square implementations
│   │   │   ├── Hardware/           # ESC/POS, barcode, cash drawer
│   │   │   ├── Accounting/         # Journal posting service
│   │   │   ├── Notifications/      # Email, SMS, push
│   │   │   └── Sync/               # Cloud sync implementation
│   │   └── External/               # 3rd party API clients
│   │
│   ├── ScalaPOS.Api/                           # Presentation Layer
│   │   ├── Endpoints/
│   │   │   ├── OrderEndpoints.cs
│   │   │   ├── ProductEndpoints.cs
│   │   │   ├── InventoryEndpoints.cs
│   │   │   ├── TableEndpoints.cs
│   │   │   ├── EmployeeEndpoints.cs
│   │   │   ├── TimeEntryEndpoints.cs
│   │   │   ├── AccountingEndpoints.cs
│   │   │   ├── CustomerEndpoints.cs
│   │   │   ├── ReportEndpoints.cs
│   │   │   └── SyncEndpoints.cs
│   │   ├── Hubs/
│   │   │   ├── PosHub.cs           # SignalR: table sync, KDS, live orders
│   │   │   └── SyncHub.cs          # SignalR: device sync on LAN
│   │   ├── Middleware/
│   │   │   ├── AuditMiddleware.cs
│   │   │   └── ExceptionMiddleware.cs
│   │   └── Program.cs
│   │
│   ├── ScalaPOS.Sync/                          # Background Sync Worker
│   │   ├── SyncEngine.cs
│   │   ├── ConflictResolver.cs
│   │   └── NetworkMonitor.cs
│   │
│   └── ScalaPOS.Tests/
│       ├── Unit/
│       ├── Integration/
│       └── E2E/
│
├── client/                                     # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui components (auto-generated)
│   │   │   ├── pos/                # POS-specific components
│   │   │   ├── tables/             # Floor plan components
│   │   │   ├── charts/             # Recharts wrappers
│   │   │   └── shared/             # Shared layout, nav, forms
│   │   ├── features/
│   │   │   ├── pos/                # Checkout, cart, payment, split
│   │   │   ├── tables/             # Floor plan, reservations, waitlist
│   │   │   ├── inventory/          # Products, stock, POs
│   │   │   ├── kitchen/            # KDS screen
│   │   │   ├── hr/                 # Employees, time clock, scheduling
│   │   │   ├── accounting/         # GL, AR, AP, expenses, reports
│   │   │   ├── customers/          # CRM, loyalty
│   │   │   ├── reports/            # Dashboard, all reports
│   │   │   └── settings/           # All settings pages
│   │   ├── hooks/
│   │   │   ├── useSignalR.ts       # SignalR connection hook
│   │   │   ├── useOfflineSync.ts   # Dexie.js offline queue
│   │   │   ├── useBarcodeScanner.ts
│   │   │   └── useHardwarePrinter.ts
│   │   ├── stores/
│   │   │   ├── cartStore.ts        # Zustand: active cart
│   │   │   ├── sessionStore.ts     # Zustand: current employee, register
│   │   │   ├── syncStore.ts        # Zustand: sync status
│   │   │   └── settingsStore.ts    # Zustand: cached settings
│   │   ├── lib/
│   │   │   ├── api.ts              # TanStack Query + axios client
│   │   │   ├── offline-db.ts       # Dexie.js schema
│   │   │   └── utils.ts
│   │   └── types/
│   │       └── index.ts
│   ├── tailwind.config.ts
│   ├── components.json             # shadcn/ui config
│   └── vite.config.ts
│
└── docker/
    ├── docker-compose.yml          # Local dev: API + PostgreSQL + Redis
    └── docker-compose.prod.yml
```

---

## 18. Database Schema Overview

### Core Tables (SQLite local + PostgreSQL cloud)

```sql
-- Multi-tenancy
Tenants (Id, Name, Plan, Settings)
Stores (Id, TenantId, Name, Address, Settings)
Registers (Id, StoreId, Name, HardwareProfile)

-- Products & Inventory
Categories (Id, StoreId, Name, ParentCategoryId, SortOrder, Color, Icon)
Products (Id, StoreId, Name, Sku, Barcode, Price, Cost, CategoryId, CostingMethod,
          ReorderPoint, ReorderQty, TrackInventory, IsActive, SyncVersion)
ProductVariants (Id, ProductId, Sku, Barcode, Price, Cost, Attributes)
ProductModifierGroups (Id, ProductId, Name, IsRequired, MinSelections, MaxSelections)
ProductModifiers (Id, GroupId, Name, PriceAdjustment)
Recipes (Id, ProductId, Yield, YieldUnit, Notes)
RecipeIngredients (Id, RecipeId, IngredientProductId, Quantity, Unit, WastagePercent)
InventoryLevels (Id, ProductId, StoreId, QtyOnHand, QtyCommitted, UpdatedAt, SyncVersion)
StockMovements (Id, ProductId, StoreId, Type, Qty, CostPerUnit, Reason, ReferenceId, CreatedAt)
PurchaseOrders (Id, StoreId, SupplierId, Status, OrderedAt, ExpectedAt, Notes)
PurchaseOrderLines (Id, PurchaseOrderId, ProductId, QtyOrdered, QtyReceived, UnitCost)

-- Sales
Orders (Id, StoreId, RegisterId, TableId, EmployeeId, CustomerId, Type, Status,
        SubTotal, DiscountAmount, TaxAmount, TipAmount, Total, CreatedAt, CompletedAt, SyncVersion)
OrderItems (Id, OrderId, ProductId, VariantId, Qty, UnitPrice, DiscountAmount, TaxAmount, Notes)
OrderItemModifiers (Id, OrderItemId, ModifierId, Name, PriceAdjustment)
Payments (Id, OrderId, Method, Amount, TipAmount, Reference, ProcessedAt, Status)
Refunds (Id, OrderId, EmployeeId, Reason, Amount, Method, CreatedAt)
Discounts (Id, OrderId, OrderItemId, Type, Amount, Reason, EmployeeId, ManagerId)

-- Tables
FloorPlans (Id, StoreId, Name, LayoutJson, IsActive)
Tables (Id, FloorPlanId, Name, Capacity, Shape, PositionX, PositionY, Width, Height)
TableSessions (Id, TableId, OrderId, ServerId, Covers, Status, SeatedAt, ClearedAt)
Reservations (Id, StoreId, TableId, GuestName, Phone, Email, PartySize, ReservationTime,
              DurationMins, Status, ConfirmationCode, Notes)
Waitlist (Id, StoreId, GuestName, Phone, PartySize, JoinedAt, NotifiedAt, Status)

-- HR
Employees (Id, StoreId, FirstName, LastName, Email, Phone, PinHash, RoleId, 
           EmploymentType, HourlyRate, Salary, StartDate, IsActive)
Roles (Id, StoreId, Name, Permissions)  -- Permissions as JSON array
TimeEntries (Id, EmployeeId, StoreId, ClockIn, ClockOut, BreakMinutes, IsApproved, Notes)
Shifts (Id, EmployeeId, StoreId, Date, StartTime, EndTime, Role, Published)
CommissionRules (Id, StoreId, Name, Type, Amount, Percentage, CategoryId, RoleId)
CommissionEarnings (Id, EmployeeId, OrderId, RuleId, Amount, Period)
TipRecords (Id, EmployeeId, ShiftDate, Amount, PoolMethod)

-- Accounting
Accounts (Id, StoreId, Code, Name, Type, SubType, IsSystemAccount)
JournalEntries (Id, StoreId, Date, Description, Reference, CreatedAt, EmployeeId)
JournalLines (Id, JournalEntryId, AccountId, Debit, Credit, Description)
Suppliers (Id, StoreId, Name, ContactName, Email, Phone, PaymentTermsDays, TaxNumber)
SupplierInvoices (Id, SupplierId, InvoiceNumber, InvoiceDate, DueDate, Total, Status)
SupplierPayments (Id, SupplierInvoiceId, Amount, Date, Method, Reference)
Invoices (Id, CustomerId, StoreId, InvoiceNumber, IssueDate, DueDate, Total, Status)
InvoiceLines (Id, InvoiceId, Description, Quantity, UnitPrice, TaxAmount)
InvoicePayments (Id, InvoiceId, Amount, Date, Method)
Expenses (Id, StoreId, EmployeeId, Category, Amount, Date, Description, ReceiptUrl, IsApproved)

-- Customers & Loyalty
Customers (Id, TenantId, Name, Email, Phone, DateOfBirth, Type, CompanyName,
           TaxNumber, CreditLimit, AccountBalance, LoyaltyPoints, TierId, Notes)
LoyaltyTransactions (Id, CustomerId, OrderId, Type, Points, BalanceAfter, CreatedAt)
LoyaltyPrograms (Id, TenantId, PointsPerDollar, DollarPerPoint, ExpiryDays)
LoyaltyTiers (Id, ProgramId, Name, MinPoints, PointsMultiplier, SortOrder)
Promotions (Id, StoreId, Name, Type, DiscountMethod, Value, Conditions,
            StartDate, EndDate, MaxRedemptions, UseCount, IsActive)

-- Settings & Config
Settings (Id, Scope, ScopeId, Key, Value, UpdatedAt)
AuditLogs (Id, Timestamp, EmployeeId, Action, EntityType, EntityId, 
           PreviousValue, NewValue, Hmac)
SyncState (Id, DeviceId, LastSyncVersion, LastSyncAt, PendingCount)
```

---

## 19. API Endpoint Map

### Orders

```
POST   /api/v1/orders                    Create new order
GET    /api/v1/orders/{id}               Get order details
PUT    /api/v1/orders/{id}/items         Add/update items
DELETE /api/v1/orders/{id}/items/{itemId} Remove item
POST   /api/v1/orders/{id}/complete      Complete order (process payment)
POST   /api/v1/orders/{id}/void          Void order
POST   /api/v1/orders/{id}/refund        Refund order
POST   /api/v1/orders/{id}/split         Split bill
POST   /api/v1/orders/merge              Merge orders
GET    /api/v1/orders/open               Get all open orders
GET    /api/v1/orders/history            Order history with filters
```

### Products & Inventory

```
GET    /api/v1/products                  List products (FTS, category filter)
POST   /api/v1/products                  Create product
PUT    /api/v1/products/{id}             Update product
GET    /api/v1/inventory/levels          Stock levels (store, low-stock filter)
POST   /api/v1/inventory/adjust          Manual stock adjustment
POST   /api/v1/inventory/transfer        Transfer between locations
GET    /api/v1/inventory/purchase-orders List POs
POST   /api/v1/inventory/purchase-orders Create PO
POST   /api/v1/inventory/purchase-orders/{id}/receive  Receive stock against PO
POST   /api/v1/inventory/stock-counts    Create/submit stock count
```

### Tables

```
GET    /api/v1/floor-plans               List floor plans
PUT    /api/v1/floor-plans/{id}          Save floor plan layout
GET    /api/v1/tables/live-status        All tables with current status
POST   /api/v1/tables/{id}/seat          Seat guests
POST   /api/v1/tables/{id}/clear         Mark table cleared
POST   /api/v1/tables/merge              Merge tables
POST   /api/v1/tables/{id}/transfer      Transfer to another table
GET    /api/v1/reservations              List reservations
POST   /api/v1/reservations              Create reservation
GET    /api/v1/waitlist                  Get waitlist
POST   /api/v1/waitlist                  Add to waitlist
```

### HR & Employees

```
GET    /api/v1/employees                 List employees
POST   /api/v1/employees                 Create employee
PUT    /api/v1/employees/{id}            Update employee
POST   /api/v1/time-entries/clock-in     Clock in
POST   /api/v1/time-entries/clock-out    Clock out
GET    /api/v1/time-entries              Time entries (employee, date range)
PUT    /api/v1/time-entries/{id}         Manager edit time entry
GET    /api/v1/shifts                    Shift schedule
POST   /api/v1/shifts                    Create shifts
POST   /api/v1/payroll/run               Run payroll
GET    /api/v1/payroll/{periodId}        Get payroll run details
```

### Accounting

```
GET    /api/v1/accounts                  Chart of accounts
POST   /api/v1/journal-entries           Create manual journal entry
GET    /api/v1/journal-entries           General ledger
GET    /api/v1/suppliers                 List suppliers
POST   /api/v1/suppliers/{id}/invoices   Create supplier invoice
POST   /api/v1/suppliers/{id}/payments   Record payment
GET    /api/v1/customers/{id}/invoices   Customer invoices
POST   /api/v1/expenses                  Record expense
GET    /api/v1/reports/pl                Profit & Loss report
GET    /api/v1/reports/balance-sheet     Balance Sheet
GET    /api/v1/reports/cash-flow         Cash Flow Statement
GET    /api/v1/reports/tax-summary       Tax Summary
```

### Reports & Dashboard

```
GET    /api/v1/dashboard/kpis            Real-time KPI tiles
GET    /api/v1/reports/sales             Sales report
GET    /api/v1/reports/sales/by-product  Sales by product
GET    /api/v1/reports/inventory         Inventory report
GET    /api/v1/reports/employees         Employee report
GET    /api/v1/reports/customers         Customer report
POST   /api/v1/reports/schedule          Schedule report delivery
```

### Sync

```
POST   /api/v1/sync/push                 Push local changes to cloud
GET    /api/v1/sync/pull                 Pull cloud changes since version
GET    /api/v1/sync/status               Sync status for this device
```

---

## 20. Development Phases

### Phase 1 — MVP (Months 1–5)

**Goal**: First live restaurant or retail store paying customer

- [ ] Project scaffolding: .NET 8 solution, React/Vite/Tailwind/shadcn setup, EF Core SQLite migrations
- [ ] Auth: Employee PIN login, JWT, basic RBAC (Cashier, Manager, Owner)
- [ ] Product catalogue: categories, products, variants, barcode
- [ ] POS screen: cart, discounts, tax, cash payment, ESC/POS receipt printing
- [ ] Card payment: Stripe Terminal SDK integration
- [ ] Bill splitting: all 4 modes (equal, by-item, custom, percentage)
- [ ] Table management: floor plan designer, live status, merge/split, server assignment
- [ ] Basic inventory: stock levels, deduction on sale, low-stock alerts
- [ ] Recipe/BOM: ingredient deduction on restaurant menu items
- [ ] Employee time clock: PIN clock in/out, timesheet view
- [ ] Cash management: opening float, cash drop, blind close, Z-report
- [ ] Basic sales dashboard: revenue, transactions, average basket (today/this week)
- [ ] Offline: SQLite local DB, background sync, sync status indicator
- [ ] Refunds, voids, order history
- [ ] Multi-store foundation: store selector, per-store settings

### Phase 2 — Full Operations (Months 6–9)

- [ ] Purchase orders: create, send, receive, partial receipt
- [ ] Stock counts: cycle count, blind count, variance report
- [ ] Stock transfers between locations
- [ ] Reservations & waitlist
- [ ] Shift scheduling: drag-and-drop calendar, conflict detection, publish + notifications
- [ ] Commission tracking: rules, per-period report
- [ ] Tip pooling: multiple distribution methods
- [ ] Customer profiles: create at POS, purchase history, loyalty points
- [ ] Loyalty program: earn/redeem, tier progression
- [ ] Basic accounting: chart of accounts, auto journal entries for sales/purchases
- [ ] Accounts payable: supplier invoices, payments, ageing
- [ ] Expense management: record, receipt photo, approval
- [ ] QuickBooks / Xero sync
- [ ] Email receipts (SendGrid)
- [ ] Kitchen Display System (KDS)
- [ ] Shopify product/inventory sync
- [ ] Payroll run wizard + export

### Phase 3 — Enterprise & CRM (Months 10–13)

- [ ] Accounts receivable: B2B invoicing, overdue reminders
- [ ] P&L, Balance Sheet, Cash Flow reports
- [ ] Budget vs actual
- [ ] Full financial period close workflow
- [ ] QR self-ordering (guest web app)
- [ ] Advanced promotions: BOGO, bundle, segment-based
- [ ] Email/SMS marketing campaigns (Mailchimp, Twilio)
- [ ] Customer segmentation & automation
- [ ] Customer-facing display (CFD) mode
- [ ] Multi-currency support
- [ ] Adyen payment integration
- [ ] Employee self-service portal (view pay slips, availability)
- [ ] Leave management: annual leave, sick leave accrual
- [ ] Report scheduler: email PDF/CSV on schedule
- [ ] Custom report builder

### Phase 4 — Scale & Ecosystem (Months 14–18)

- [ ] WASM plugin SDK + marketplace (allow 3rd-party plugins)
- [ ] BI connector: Looker Studio, Power BI data export
- [ ] Avalara tax integration (automated jurisdiction rules)
- [ ] Biometric time clock (Windows Hello, Face ID)
- [ ] Enterprise SSO: SAML, OIDC
- [ ] Multi-company / franchise consolidation reporting
- [ ] White-label / OEM mode (rebrand for resellers)
- [ ] PCI-DSS Level 1 audit engagement
- [ ] 1M+ SKU catalogue optimisation (ElasticSearch integration for cloud)
- [ ] Advanced supplier management: scorecards, EDI orders

### Phase 5 — AI Features (Months 18–24)

- [ ] **AI demand forecasting**: Auto-generate PO suggestions based on sales velocity + seasonality
- [ ] **Menu engineering AI**: Flag low-margin popular items, underperforming high-margin items
- [ ] **Dynamic pricing suggestions**: Recommend price adjustments based on demand patterns
- [ ] **Customer churn prediction**: ML model predicts at-risk customers → auto win-back trigger
- [ ] **Natural language report queries**: "Show me last month's top 10 items by margin"
- [ ] **AI scheduling optimiser**: Suggest optimal shift schedule based on predicted traffic
- [ ] **Smart inventory alerts**: Beyond reorder point — considers upcoming events, seasonality
- [ ] **Voice commands**: Kitchen staff can update KDS order status by voice
- [ ] **Receipt OCR for expense management**: Scan paper receipt → auto-fill expense form

---

## 21. Sales Module

> Full B2B + B2C sales pipeline from quote to cash — unified with POS.

### 21.1 Sales Quotations & Orders

```csharp
public class SalesOrder
{
    public Guid Id { get; set; }
    public string Reference { get; set; }       // e.g. SO-2025-0042
    public Guid CustomerId { get; set; }
    public Guid SalesPersonId { get; set; }
    public SalesOrderStatus Status { get; set; } // Draft, Sent, Confirmed, Invoiced, Cancelled
    public List<SalesOrderLine> Lines { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal Total { get; set; }
    public DateOnly ExpiryDate { get; set; }
    public string TermsAndConditions { get; set; }
    public string InternalNotes { get; set; }
    public PricingPolicy PricingPolicy { get; set; }
}
```

- Create quotations with product lines, quantities, unit prices, discounts
- Send quotation to customer via email (PDF attached, online portal link)
- Customer accepts quotation online → auto-confirms to sales order
- Sales order confirmation: triggers stock reservation, creates delivery order
- Multiple price lists per customer group / currency / volume
- Customer-specific pricing and discount agreements
- Tax calculation per line (inclusive/exclusive, multi-rate)
- Delivery lead time estimation on quotation

### 21.2 Sales Pipeline (CRM Integration)

- Leads → Opportunities → Quotations → Sales Orders — unified funnel
- Kanban pipeline view per salesperson / team
- Win probability % per opportunity (manual or ML-assisted Phase 3)
- Activity scheduling: call, email, meeting reminders on opportunities
- Lost reason tracking with required field on opportunity close
- Sales team management: territories, targets, leaderboard
- Commission linked to closed sales orders (integrated with HR commission engine)

### 21.3 Pricing & Discounts

- **Price lists**: Multiple price lists per currency, customer group, or campaign period
- **Volume discounts**: Qty 1–9 = full price, 10–49 = 5% off, 50+ = 12% off
- **Customer-specific contract pricing**: Fixed price per product for a specific customer
- **Promotional periods**: Temporary price reduction with start/end date
- **Margin warning**: Alert salesperson if discount would put margin below threshold
- **Competitor pricing**: Log competitor prices for strategic reference

### 21.4 Delivery & Fulfilment

- Sales order → auto-creates delivery/picking order in Supply Chain module
- Partial deliveries: ship what's available, back-order the rest
- Multiple delivery addresses per customer
- Delivery confirmation: salesperson notified when goods dispatched
- Return merchandise authorisation (RMA): link return to original sale

### 21.5 Sales Reporting

| Report | Detail |
|---|---|
| Sales by Salesperson | Revenue, orders, win rate, avg deal size |
| Sales by Product | Revenue, qty, margin per product |
| Sales Pipeline | Open opportunities by stage and value |
| Forecast | Expected revenue for current/next quarter |
| Quotation Conversion Rate | Sent → Confirmed ratio |

---

## 22. Subscriptions & Rental

### 22.1 Subscriptions

```csharp
public class Subscription
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public Guid ProductId { get; set; }         // Subscription plan product
    public BillingPeriod Period { get; set; }   // Monthly, Quarterly, Annual
    public decimal Price { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public SubscriptionStatus Status { get; set; }
    public int TrialDays { get; set; }
    public bool AutoRenew { get; set; }
    public DateOnly NextBillingDate { get; set; }
    public List<SubscriptionLine> Lines { get; set; }
}
```

- Create subscription plans: monthly, quarterly, annual, custom interval
- Trial periods: configurable free trial days before first charge
- Auto-renewal with configurable reminder email (7 days, 3 days, 1 day before)
- Prorated billing: charge/credit difference when upgrading/downgrading mid-period
- Pause and resume subscriptions
- Cancellation with reason tracking, win-back email automation
- Dunning management: failed payment → retry schedule → suspension → cancellation
- MRR (Monthly Recurring Revenue) and ARR dashboard
- Churn rate, expansion revenue, contraction revenue metrics
- Upsell / cross-sell tracking: subscription upgrades from email campaigns

### 22.2 Rental

```csharp
public class RentalOrder
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public List<RentalLine> Lines { get; set; }
    public DateTimeOffset PickupDate { get; set; }
    public DateTimeOffset ReturnDate { get; set; }
    public RentalStatus Status { get; set; }   // Reserved, Active, Returned, Overdue
    public decimal SecurityDeposit { get; set; }
    public decimal LateFeePerDay { get; set; }
    public string Conditions { get; set; }     // Item condition on pickup
}
```

- Rental product catalogue: items available for hire with daily/weekly/monthly rates
- Availability calendar: see which items are booked when, block unavailable dates
- Rental agreement / contract generation (PDF)
- Security deposit: hold on card or manual collection, release on return
- Item condition tracking: photo + notes on pickup and return
- Late return fees: auto-calculate based on return date vs. due date
- Rental utilisation report: % of time items are rented vs. idle
- Integration with Inventory: rental items tracked as separate stock category

---

## 23. Supply Chain — Manufacturing & Quality

### 23.1 Manufacturing

```csharp
public class ManufacturingOrder
{
    public Guid Id { get; set; }
    public string Reference { get; set; }       // MO-2025-0001
    public Guid FinishedProductId { get; set; }
    public decimal Quantity { get; set; }
    public Guid BillOfMaterialsId { get; set; }
    public ManufacturingStatus Status { get; set; }
    public DateOnly ScheduledDate { get; set; }
    public List<WorkOrder> WorkOrders { get; set; }
    public List<MaterialConsumption> MaterialsConsumed { get; set; }
    public decimal ScrapQuantity { get; set; }
}

public class BillOfMaterials
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public BomType Type { get; set; }          // Manufacture, Kit, Phantom
    public decimal Quantity { get; set; }
    public List<BomLine> Components { get; set; }
    public List<WorkCenter> Routing { get; set; }
}
```

- **Bill of Materials (BOM)**: Multi-level BOM, kits, phantom (auto-expand on order)
- **Manufacturing Orders (MO)**: Create from sales order or manually, schedule production
- **Work Orders**: Break MO into work centre steps (Cut → Assemble → QC → Pack)
- **Work Centres**: Define machines/stations with capacity, cost per hour
- **Routing**: Define manufacturing steps sequence per product
- **Material consumption**: Record actual vs. planned material use per MO
- **By-products**: Record co-products and scrap produced during manufacturing
- **Real-time progress**: Work order status on shop floor tablet (kiosk mode)
- **Production planning**: Gantt view of scheduled orders vs. work centre capacity
- **Unbuild order**: Disassemble a finished product back into components

### 23.2 Product Lifecycle Management (PLM)

- **Versioned BOMs**: Track BOM revisions (v1.0, v1.1, v2.0) with change log
- **Engineering Change Orders (ECO)**: Formal request → review → approve → apply to BOM
- **Effectivity dates**: New BOM version activates from a specific date
- **Document attachment**: Link CAD files, spec sheets, test reports to product/BOM versions
- **Approval workflow**: ECO requires sign-off from engineering + production managers

### 23.3 Purchase (Supply Chain)

- **RFQ (Request for Quotation)**: Send RFQ to multiple suppliers, compare responses
- **Supplier price lists**: Auto-populate PO price from supplier agreement
- **Automated reordering**: Orderpoint rules trigger PO/MO/transfer when stock hits minimum
- **Three-way matching**: PO → Goods Receipt → Supplier Invoice must match before payment
- **Landed costs**: Distribute freight, customs, insurance costs across received stock
- **Drop shipping**: Supplier ships directly to customer, linked to sales order
- **Purchase analytics**: Spend by supplier/category, price variance vs. budget

### 23.4 Maintenance

```csharp
public class MaintenanceRequest
{
    public Guid Id { get; set; }
    public Guid EquipmentId { get; set; }
    public MaintenanceType Type { get; set; }   // Corrective, Preventive
    public string Description { get; set; }
    public Priority Priority { get; set; }
    public Guid AssignedTechnicianId { get; set; }
    public DateTimeOffset? ScheduledDate { get; set; }
    public DateTimeOffset? CompletedDate { get; set; }
    public decimal MaintenanceCost { get; set; }
    public List<SparePart> PartsUsed { get; set; }
}
```

- **Equipment registry**: Track all physical assets (machines, vehicles, equipment)
- **Preventive maintenance**: Schedule recurring maintenance by interval (days/hours/cycles)
- **Corrective maintenance**: Log breakdown, assign technician, track resolution time
- **Maintenance calendar**: Gantt view of all scheduled maintenance
- **Mean Time Between Failure (MTBF)**: Auto-calculated per equipment
- **Spare parts tracking**: Link maintenance to inventory parts consumed
- **Maintenance cost**: Track labour + parts cost per equipment over time
- **Downtime tracking**: Record when equipment was out of service

### 23.5 Quality Control

```csharp
public class QualityCheck
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public QualityCheckType Type { get; set; }  // Instructions, Pass/Fail, Measure, Photo
    public string Title { get; set; }
    public string Instructions { get; set; }
    public decimal? NormValue { get; set; }      // Expected measurement
    public decimal? Tolerance { get; set; }      // ± tolerance
    public QualityCheckResult Result { get; set; }
    public string FailureReason { get; set; }
    public List<string> PhotoEvidence { get; set; }
}
```

- **Quality control points**: Trigger QC checks on receipt, manufacturing, delivery
- **Check types**: Pass/Fail, numeric measurement with tolerance, photo evidence, instructions
- **Quality alerts**: Raise alert on failure → assign corrective action → track resolution
- **Control plans**: Define which checks run for which product/operation combination
- **Non-conformance reports (NCR)**: Formal record of quality failure with root cause analysis
- **Supplier quality**: Track defect rate per supplier, auto-flag repeat offenders
- **Quality KPIs**: First-pass yield, defect rate, NCR by category

---

## 24. HR Extended — Recruitment, Appraisals, Fleet

### 24.1 Recruitment

```csharp
public class JobPosition
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public Guid DepartmentId { get; set; }
    public int ExpectedNewEmployees { get; set; }
    public string Description { get; set; }
    public List<JobApplication> Applications { get; set; }
}

public class JobApplication
{
    public Guid Id { get; set; }
    public Guid JobPositionId { get; set; }
    public string CandidateName { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public string ResumeUrl { get; set; }
    public ApplicationStage Stage { get; set; } // New → Qualified → Interview → Offer → Hired/Refused
    public decimal? ExpectedSalary { get; set; }
    public Guid? InterviewerId { get; set; }
    public List<InterviewNote> Notes { get; set; }
}
```

- **Job positions**: Define open roles with department, expected headcount, description
- **Job board**: Publish positions to careers page (embeddable widget or standalone page)
- **Application pipeline**: Kanban board — New → Qualified → Interview → Offer → Hired / Refused
- **Resume parsing**: Upload CV → auto-extract name, email, phone, experience (AI — Phase 3)
- **Interview scheduling**: Book interview slots, send calendar invites to candidate + interviewer
- **Interview feedback forms**: Structured rating per competency, shared with hiring team
- **Offer letter generation**: Template-based PDF with salary, start date, benefits
- **Employee onboarding checklist**: Auto-created when applicant status → Hired
- **Source tracking**: Job board, referral, LinkedIn, direct — conversion rate per source
- **Referral program** (linked to Employees module): Employee refers candidate, earns bonus on hire

### 24.2 Time Off Management

```csharp
public class LeaveType
{
    public Guid Id { get; set; }
    public string Name { get; set; }            // Annual Leave, Sick Leave, Parental
    public bool RequiresApproval { get; set; }
    public bool AllowNegativeBalance { get; set; }
    public AccrualPolicy AccrualPolicy { get; set; }
    public int MaxCarryover { get; set; }
    public bool IsPaid { get; set; }
}
```

> Extends the basic Time Off already covered in HR section — adds enterprise features.

- **Leave types**: Annual, sick, parental, study, unpaid, public holiday — fully configurable
- **Accrual policies**: Accrue X days per month, or front-loaded at start of year
- **Leave balance**: Real-time balance per employee per leave type
- **Leave request workflow**: Employee requests → manager approves/refuses → calendar updated
- **Team calendar**: View all leaves across team to check coverage before approval
- **Leave carryover**: Auto-calculate at year-end, cap at maximum configurable days
- **Public holiday calendar**: Country/state-specific holidays auto-populate calendar
- **Leave reports**: Utilisation by type, department, employee — identify burnout risk
- **Integration with payroll**: Unpaid leave deducted from payroll run automatically

### 24.3 Appraisals (Performance Management)

```csharp
public class Appraisal
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid ManagerId { get; set; }
    public AppraisalPeriod Period { get; set; } // Annual, Semi-annual, Probation
    public DateOnly DueDate { get; set; }
    public AppraisalStatus Status { get; set; }
    public List<Goal> Goals { get; set; }
    public List<SkillAssessment> Skills { get; set; }
    public string EmployeeSelfAssessment { get; set; }
    public string ManagerFeedback { get; set; }
    public int OverallRating { get; set; }      // 1–5
    public string DevelopmentPlan { get; set; }
}
```

- **Appraisal cycles**: Annual, semi-annual, probation review — auto-scheduled
- **Goal setting**: Manager and employee agree on SMART goals for the period
- **Self-assessment**: Employee rates themselves on goals and competencies before review meeting
- **360° feedback** (Phase 3): Collect feedback from peers, direct reports, cross-functional partners
- **Competency framework**: Define company-wide or role-specific competency library
- **Skills tracking**: Track employee skill levels over time, identify gaps
- **Development plans**: Document agreed training, certifications, projects to develop skills
- **Salary review integration**: Appraisal rating → linked to salary review / increment workflow
- **Calibration view**: Manager-of-managers view — compare ratings across team to ensure consistency

### 24.4 Employee Referrals

- Employees submit referral: name, contact, role applied for
- Referral tracking: which stage the referred candidate is at
- Referral bonus rules: configurable payout amount, trigger (hired vs. 90-day retention)
- Referral leaderboard: gamified view of top referrers
- Payout: auto-integrates with payroll as one-time bonus on next payroll run
- Referral programme reporting: hired count, cost-per-hire via referral vs. other channels

### 24.5 Fleet Management

```csharp
public class Vehicle
{
    public Guid Id { get; set; }
    public string Make { get; set; }
    public string Model { get; set; }
    public int Year { get; set; }
    public string LicensePlate { get; set; }
    public string VIN { get; set; }
    public Guid AssignedDriverId { get; set; }
    public VehicleStatus Status { get; set; }  // Active, In Repair, Retired
    public DateOnly InsuranceExpiry { get; set; }
    public DateOnly RegistrationExpiry { get; set; }
    public decimal CurrentOdometer { get; set; }
    public List<FuelLog> FuelLogs { get; set; }
    public List<ServiceRecord> ServiceHistory { get; set; }
}
```

- **Vehicle registry**: Full details, photos, documents (registration, insurance) per vehicle
- **Driver assignment**: Assign vehicles to employees, track history of assignments
- **Fuel tracking**: Log fuel fill-ups, calculate fuel efficiency (km/L or mpg)
- **Odometer log**: Track mileage, trigger service reminders at mileage intervals
- **Service records**: Log all service/repairs with date, odometer, cost, workshop
- **Insurance & registration alerts**: Email reminders 60/30/7 days before expiry
- **Fleet cost analysis**: Total cost of ownership per vehicle (fuel + service + insurance)
- **GPS integration** (Phase 3): Real-time location via GPS device API
- **Trip logging**: Employee logs trip: start odometer, end odometer, purpose — for tax/expense

---

## 25. Services — Project, Helpdesk & Field Service

### 25.1 Project Management

```csharp
public class Project
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public Guid CustomerId { get; set; }
    public Guid ManagerId { get; set; }
    public ProjectStatus Status { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly Deadline { get; set; }
    public decimal Budget { get; set; }
    public bool IsBillable { get; set; }
    public List<ProjectTask> Tasks { get; set; }
    public List<Milestone> Milestones { get; set; }
}

public class ProjectTask
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public Guid AssigneeId { get; set; }
    public TaskStage Stage { get; set; }        // To Do, In Progress, Review, Done
    public Priority Priority { get; set; }
    public DateOnly Deadline { get; set; }
    public decimal PlannedHours { get; set; }
    public List<TimeLog> TimeLogs { get; set; }
}
```

- **Project views**: Kanban board, Gantt chart, list view, calendar view
- **Task management**: Create, assign, prioritise, and track tasks within projects
- **Sub-tasks**: Break complex tasks into smaller actionable sub-tasks
- **Milestones**: Define key project checkpoints with due dates
- **Gantt chart**: Visual timeline with dependencies between tasks
- **Time tracking**: Log time against tasks — integrates with Timesheets module
- **Billable projects**: Mark projects as billable, generate invoice from logged hours
- **Budget tracking**: Planned vs. actual cost (hours × rate + expenses)
- **Project templates**: Save project structure as template, clone for new similar projects
- **Collaboration**: Task comments, file attachments, @mentions notify team members
- **Project portal**: Optional client-facing view of project progress and milestones

### 25.2 Timesheets

```csharp
public class TimesheetEntry
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid? ProjectId { get; set; }
    public Guid? TaskId { get; set; }
    public DateOnly Date { get; set; }
    public decimal Hours { get; set; }
    public string Description { get; set; }
    public bool IsBillable { get; set; }
    public TimesheetStatus Status { get; set; } // Draft, Submitted, Approved
}
```

- Daily timesheet grid: employee fills hours per project/task per day
- Weekly submission: employee submits week for manager approval
- Manager approval: approve all, approve individual lines, or reject with comment
- Timer widget: start/stop timer per task — auto-fills timesheet on stop
- Mobile timesheet entry (responsive UI)
- Billable hours: filter timesheet entries by billable → generate client invoice
- Overtime: flag entries that exceed daily/weekly threshold
- Timesheet reports: utilisation % per employee, billable vs. non-billable hours
- Integration with payroll: approved hours flow into payroll calculation

### 25.3 Helpdesk (Support Ticketing)

```csharp
public class SupportTicket
{
    public Guid Id { get; set; }
    public string Reference { get; set; }       // TKT-2025-0001
    public Guid CustomerId { get; set; }
    public Guid? AssignedAgentId { get; set; }
    public Guid? TeamId { get; set; }
    public string Subject { get; set; }
    public string Description { get; set; }
    public TicketPriority Priority { get; set; }
    public TicketStatus Status { get; set; }    // New → Open → Pending → Resolved → Closed
    public TicketSource Source { get; set; }    // Email, Portal, Phone, Chat, POS
    public DateTimeOffset? FirstResponseAt { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public int SatisfactionRating { get; set; } // 1–5 CSAT score
    public List<TicketMessage> Messages { get; set; }
    public List<Guid> TagIds { get; set; }
}
```

- **Multi-channel intake**: Email (auto-parse → ticket), customer portal, phone log, POS "flag order" button
- **Ticket pipeline**: Kanban or list view per support team
- **SLA policies**: First response time and resolution time targets per priority level
- **SLA timers**: Live countdown on each ticket, escalate when breached
- **Canned responses**: Pre-written reply templates for common issues — insert with one click
- **Internal notes**: Agent-only notes not visible to customer
- **Ticket merging**: Combine duplicate tickets from same customer about same issue
- **Escalation rules**: Auto-reassign to senior agent if SLA timer breaches
- **Knowledge base integration**: Suggest relevant KB articles when agent types response
- **Customer satisfaction survey**: Auto-send CSAT survey 24h after ticket closed
- **Helpdesk reports**: Ticket volume, avg resolution time, CSAT score, agent performance

### 25.4 Field Service

```csharp
public class FieldServiceOrder
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public Guid? SupportTicketId { get; set; }
    public Guid TechnicianId { get; set; }
    public string ServiceType { get; set; }
    public Address ServiceLocation { get; set; }
    public DateTimeOffset ScheduledStart { get; set; }
    public DateTimeOffset ScheduledEnd { get; set; }
    public FieldServiceStatus Status { get; set; }
    public List<ServicePart> PartsUsed { get; set; }
    public List<TimesheetEntry> LaborLogs { get; set; }
    public string TechnicianNotes { get; set; }
    public string CustomerSignature { get; set; }  // Base64 signature
    public List<string> Photos { get; set; }
}
```

- **Dispatch board**: Calendar/map view of all field jobs, drag-and-drop scheduling
- **Technician mobile app** (PWA): Technician sees their day's jobs, gets directions, updates status
- **Job workflow on mobile**: En Route → Arrived → In Progress → Completed
- **Parts consumption**: Technician logs parts used from vehicle stock, deducts from inventory
- **Time logging**: Start/stop timer per job, syncs to timesheets
- **Customer signature capture**: Sign on technician's device at job completion
- **Photo documentation**: Before/after photos attached to service order
- **On-site invoicing**: Generate and email invoice to customer from field
- **GPS routing**: Optimised route for multiple jobs in a day (Google Maps integration)

### 25.5 Planning

- **Resource planning view**: Who is working on what, when — visual grid by employee × day
- **Shift planning integration**: Links to HR shift scheduling
- **Project resource allocation**: Assign employees to project phases, see capacity vs. demand
- **Availability management**: Block employee availability for training, leave, meetings
- **Capacity planning**: Flag over-allocated employees (> 100% of available hours)
- **Forecast report**: Expected hours by employee/team for next 4–12 weeks

### 25.6 Appointments

```csharp
public class AppointmentType
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public int DurationMinutes { get; set; }
    public bool RequiresConfirmation { get; set; }
    public string Location { get; set; }
    public List<Guid> StaffIds { get; set; }     // Who can take this appointment type
    public int MinBookingNoticeHours { get; set; }
    public int MaxAdvanceBookingDays { get; set; }
    public string ConfirmationEmailTemplate { get; set; }
    public string ReminderSmsTemplate { get; set; }
}
```

- **Online booking page**: Shareable link / embeddable widget for customers to self-book
- **Appointment types**: Define services (e.g. "30-min Haircut", "1-hr Consultation")
- **Staff availability**: Each appointment type shows only available staff time slots
- **Buffer time**: Automatic gap between appointments for cleanup/travel
- **Calendar view**: Staff see their day/week appointments, add walk-ins
- **Booking confirmation**: Automatic email + SMS on booking
- **Reminders**: SMS/email reminder 24h and 2h before appointment
- **Cancellation / rescheduling**: Self-service via confirmation email link
- **No-show tracking**: Mark no-shows, optionally charge no-show fee (Stripe)
- **POS integration**: Check-in appointment at POS → open order pre-loaded with services
- **Reporting**: Booking rate, no-show rate, revenue per appointment type, busiest time slots

---

## 26. Productivity — Knowledge Base & WhatsApp

### 26.1 Knowledge Base

```csharp
public class KnowledgeArticle
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public string Slug { get; set; }
    public Guid CategoryId { get; set; }
    public string Content { get; set; }          // Rich text / Markdown
    public KnowledgeVisibility Visibility { get; set; } // Internal, Customer
    public Guid AuthorId { get; set; }
    public bool IsPublished { get; set; }
    public int ViewCount { get; set; }
    public int HelpfulCount { get; set; }
    public int NotHelpfulCount { get; set; }
    public List<string> Tags { get; set; }
    public DateTimeOffset LastUpdatedAt { get; set; }
}
```

- **Rich text editor**: Format articles with headings, images, code blocks, tables, videos
- **Categories & hierarchy**: Organise articles in a nested category tree
- **Visibility levels**:
  - **Internal**: Only visible to employees (SOPs, training, how-to guides, product knowledge)
  - **Customer**: Public-facing help centre (FAQ, user guides, troubleshooting)
- **Full-text search**: Find articles in < 100ms (FTS5 SQLite or ElasticSearch cloud)
- **Article feedback**: Customers/staff rate articles (helpful / not helpful)
- **Related articles**: Auto-suggest related articles at article bottom
- **Helpdesk integration**: Suggest matching KB articles as agent types ticket response
- **Version history**: Track edits with author and timestamp — restore previous versions
- **Article analytics**: Views, helpfulness score, articles with high "not helpful" flagged for review
- **Translation**: Multi-language articles with language switcher (Phase 3)

### 26.2 WhatsApp Business Integration

```csharp
public class WhatsAppConversation
{
    public Guid Id { get; set; }
    public string PhoneNumber { get; set; }
    public Guid? CustomerId { get; set; }       // Linked customer if known
    public Guid? AssignedAgentId { get; set; }
    public ConversationStatus Status { get; set; }
    public List<WhatsAppMessage> Messages { get; set; }
    public DateTimeOffset LastMessageAt { get; set; }
    public string CustomerName { get; set; }    // From WhatsApp profile
}
```

- **WhatsApp Business API** integration (Meta Cloud API or Twilio WhatsApp)
- **Unified inbox**: All WhatsApp conversations in one team inbox, assign to agents
- **Auto-reply**: Trigger automated responses outside business hours or for common questions
- **Quick replies**: Saved message templates for agents — send with one click
- **Message templates**: Pre-approved WhatsApp Business message templates for outbound
- **Customer linking**: Incoming WhatsApp number → auto-link to CRM customer profile
- **Order notifications via WhatsApp**: Send order confirmation, delivery status, receipt link
- **Appointment reminders via WhatsApp**: Automated appointment reminder messages
- **Support tickets**: Escalate WhatsApp chat → create Helpdesk ticket with chat history attached
- **Broadcast messages**: Send approved template messages to customer segment (marketing)
- **Read receipts + typing indicators**: Real-time chat experience in agent interface

---

## 27. Documents & Digital Signing

### 27.1 Document Management

```csharp
public class Document
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string MimeType { get; set; }
    public string StorageUrl { get; set; }
    public Guid FolderId { get; set; }
    public Guid OwnerId { get; set; }
    public long FileSizeBytes { get; set; }
    public DocumentVisibility Visibility { get; set; }
    public List<DocumentTag> Tags { get; set; }
    public List<DocumentVersion> Versions { get; set; }
    public List<DocumentActivity> ActivityLog { get; set; }
}
```

- **Centralised document store**: Upload, organise, and share business documents
- **Folder hierarchy**: Custom folder structure per department, project, customer
- **File versioning**: Every upload creates a new version; revert to any previous version
- **Access control**: Set visibility per folder/document: All Staff, Department, Manager, Owner
- **Full-text search**: Search inside PDFs and Office documents (via Apache Tika integration)
- **Tagging**: Tag documents (Invoice, Contract, Receipt, Policy, HR) for cross-folder search
- **Linked records**: Attach documents to: Employees, Customers, Suppliers, Orders, Projects
- **Collaboration**: Comments on documents, @mention team members
- **Document requests**: Request a specific document from an employee/customer → upload link sent via email
- **Expiry tracking**: Flag documents with expiry dates (contracts, certifications, insurance)
- **Storage**: Local server storage or cloud (AWS S3, Azure Blob) — configurable

### 27.2 Digital Signing (Sign)

```csharp
public class SignatureRequest
{
    public Guid Id { get; set; }
    public string DocumentUrl { get; set; }
    public List<Signer> Signers { get; set; }   // Ordered signing sequence
    public SignatureStatus Status { get; set; }  // Draft, Sent, Partially Signed, Completed, Expired
    public DateTimeOffset ExpiresAt { get; set; }
    public string Message { get; set; }
    public bool RequiresSMSOTP { get; set; }     // Two-factor signature verification
    public string CompletedDocumentUrl { get; set; }
}

public class Signer
{
    public string Name { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public List<SignatureField> Fields { get; set; } // Where to sign/initial/date
    public DateTimeOffset? SignedAt { get; set; }
    public string IpAddress { get; set; }
}
```

- **Document preparation**: Upload PDF, drag-and-drop signature fields, initials, date, text fields
- **Multiple signers**: Sequential (must sign in order) or parallel (sign any order)
- **Email invitation**: Signers receive email with unique signing link — no account required
- **Identity verification**: Optional SMS OTP before signing for additional legal weight
- **Signature capture**: Draw signature on screen (mouse, touchscreen, stylus) or upload image
- **Audit trail**: Every view, sign, and decline action logged with timestamp + IP address
- **Signed document**: Final PDF with embedded audit certificate, stored in Documents module
- **Use cases**:
  - Employment contracts (Recruitment → Sign → Employee file)
  - Supplier agreements (Supplier record → Sign)
  - Rental agreements (Rental module → Sign)
  - Sales quotation customer acceptance (Sales → Sign)
  - Field service completion report (Field Service → customer signature)
- **Expiry & reminders**: Auto-expire after configurable days; send reminder emails to pending signers
- **Decline with reason**: Signer can decline and leave a reason — triggers notification to requester

---

## 28. Spreadsheet BI

### 28.1 Built-in Spreadsheet (Business Intelligence)

```csharp
// Server-side data connection — spreadsheet pulls live data from DB
public class SpreadsheetDataSource
{
    public string Name { get; set; }
    public DataSourceType Type { get; set; }   // SalesReport, InventoryLevel, HRTimesheet, Custom
    public string QueryDefinition { get; set; } // Saved query / view name
    public RefreshPolicy Refresh { get; set; }  // Manual, OnOpen, Scheduled
}
```

- **In-app spreadsheet editor**: Excel-like grid (react-spreadsheet or Handsontable) — no Excel required
- **Live data connections**: Connect spreadsheet cells/ranges to live database queries
  - e.g. Column A = all products, Column B = current stock level (auto-refreshes)
  - e.g. Sheet 1 = this month's sales by day (live from Orders table)
- **Formulas**: Standard spreadsheet functions (SUM, AVERAGE, IF, VLOOKUP, COUNTIF, etc.)
- **Pivot tables**: Drag-and-drop pivot analysis on any connected dataset
- **Charts**: Create bar, line, pie, scatter charts from spreadsheet data — embed in dashboards
- **What-if analysis**: Change assumption cells → formulas recalculate instantly (no DB refresh needed)
- **Templates**:
  - P&L monthly tracker
  - Cash flow forecast
  - Payroll cost model
  - Inventory reorder planner
  - Sales commission calculator
- **Export**: Download as .xlsx (SheetJS) or PDF
- **Share & permission**: Share spreadsheet read-only or editable with specific employees
- **Scheduled refresh**: Live data connections auto-refresh on schedule (hourly, daily)
- **Embed in dashboards**: Publish a chart from a spreadsheet as a widget on the reports dashboard

---

## 29. Updated Summary Statistics

| Category | Original | After Expansion |
|---|---|---|
| Total Feature Modules | 20 | **29** |
| Total Features | 200+ | **400+** |
| API Endpoints | 80+ | **150+** |
| Database Tables | 60+ | **100+** |
| Screens / Pages | 40+ | **75+** |
| Integrations | 20+ | **35+** |
| Background Services | 5 | **10+** |
| Development Phases | 5 | **6** |
| Estimated Timeline (full) | 24 months | **30–36 months** |

### New Modules Added (from Odoo reference)

| Module | Category | Phase |
|---|---|---|
| Sales (Quotations → Orders → Invoices) | Sales | Phase 2 |
| Subscriptions | Sales | Phase 2 |
| Rental | Sales | Phase 3 |
| Manufacturing & BOM | Supply Chain | Phase 3 |
| PLM (Engineering Change Orders) | Supply Chain | Phase 4 |
| Purchase (RFQ, 3-way matching, landed costs) | Supply Chain | Phase 2 |
| Maintenance | Supply Chain | Phase 3 |
| Quality Control | Supply Chain | Phase 3 |
| Recruitment | HR Extended | Phase 2 |
| Time Off (enterprise) | HR Extended | Phase 2 |
| Appraisals / Performance | HR Extended | Phase 3 |
| Employee Referrals | HR Extended | Phase 2 |
| Fleet Management | HR Extended | Phase 3 |
| Project Management | Services | Phase 2 |
| Timesheets | Services | Phase 2 |
| Helpdesk / Support Ticketing | Services | Phase 2 |
| Field Service | Services | Phase 3 |
| Planning / Resource Allocation | Services | Phase 3 |
| Appointments / Booking | Services | Phase 2 |
| Knowledge Base | Productivity | Phase 2 |
| WhatsApp Business Integration | Productivity | Phase 2 |
| Document Management | Productivity | Phase 2 |
| Digital Signing (Sign) | Productivity | Phase 3 |
| Spreadsheet BI | Productivity | Phase 3 |

---

> **Stack**: .NET 8 · ASP.NET Core · Entity Framework Core 8 · SignalR · SQLite · PostgreSQL · React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · TanStack Query · Zustand · Dexie.js · Framer Motion

> **Architecture**: Clean Architecture (Domain → Application → Infrastructure → API) · CQRS with MediatR · Offline-First with local SQLite source of truth · Background sync Worker Service · SignalR real-time multi-device

> **Target**: Full Odoo alternative — POS + ERP + HR + Supply Chain + Services + Productivity — purpose-built for .NET 8, React, and offline-first operation. Replace Toast + 7Shifts + MarketMan + QuickBooks + OpenTable + Odoo with one unified system built by you.

---
*Last updated: Added 24 new modules based on product scope expansion — Sales, Supply Chain, Manufacturing, PLM, Maintenance, Quality, Recruitment, Appraisals, Fleet, Project, Timesheets, Helpdesk, Field Service, Planning, Appointments, Knowledge Base, WhatsApp, Documents, Sign, Spreadsheet BI.*
