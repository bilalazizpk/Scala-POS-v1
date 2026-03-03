# SCALA POS — Senior Architect Guide
### Role: System Architecture · Security · DevOps · Patterns · Performance · Decisions

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Clean Architecture & CQRS](#2-clean-architecture--cqrs)
3. [Offline-First Design](#3-offline-first-design)
4. [Sync Engine & Conflict Resolution](#4-sync-engine--conflict-resolution)
5. [Security Architecture](#5-security-architecture)
6. [Real-Time Architecture (SignalR)](#6-real-time-architecture-signalr)
7. [Multi-Tenancy Design](#7-multi-tenancy-design)
8. [Performance & Scalability](#8-performance--scalability)
9. [DevOps & CI/CD](#9-devops--cicd)
10. [Plugin System (WASM)](#10-plugin-system-wasm)
11. [Key Architecture Decisions (ADRs)](#11-key-architecture-decisions-adrs)
12. [Tech Debt & Risk Register](#12-tech-debt--risk-register)

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT DEVICES                           │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │   POS Terminal │  │  Manager Tablet│  │   KDS / CFD      │  │
│  │ React + Vite   │  │ React + Vite   │  │ React (kiosk)    │  │
│  └───────┬────────┘  └───────┬────────┘  └────────┬─────────┘  │
│          │                   │                     │            │
│          └───────────────────┼─────────────────────┘            │
│                              │  Tauri IPC / HTTP                │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    LOCAL .NET 8 API (Kestrel)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  REST API    │  │  SignalR Hub │  │  Worker Services     │  │
│  │  Minimal APIs│  │  /hubs/pos   │  │  Sync + Hangfire     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                       │              │
│  ┌──────▼─────────────────▼───────────────────────▼──────────┐  │
│  │            Application Layer (MediatR CQRS)               │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼────────────────────────────────┐  │
│  │              SQLite (WAL + SQLCipher AES-256)             │  │
│  │            Source of Truth — Always Available             │  │
│  └──────────────────────────┬────────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTPS + WebSocket (when online)
┌─────────────────────────────▼───────────────────────────────────┐
│                       CLOUD TIER (AWS)                          │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │ ASP.NET Core   │  │  PostgreSQL 16  │  │   Redis 7        │  │
│  │ (cloud API)    │  │  + TimescaleDB  │  │  (sessions/cache)│  │
│  └────────────────┘  └────────────────┘  └──────────────────┘  │
│  ┌────────────────┐  ┌────────────────┐                         │
│  │   S3 Storage   │  │  Kubernetes    │                         │
│  │ (docs/media)   │  │  HPA autoscale │                         │
│  └────────────────┘  └────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Offline-first**: SQLite is always the source of truth. Cloud is a replica.
2. **Clean Architecture**: Domain → Application → Infrastructure → API. No reverse dependencies.
3. **CQRS with MediatR**: Commands and Queries are separated. No fat repositories.
4. **Eventual Consistency**: Acceptable for inventory sync. Unacceptable for payment.
5. **Security-in-depth**: Auth at every layer — API, Application, DB (RLS).
6. **Fail safe**: Any crash/restart must produce zero data loss. WAL + persistent sync queue.

---

## 2. Clean Architecture & CQRS

### Layer Dependency Rule
```
API → Application → Core (Domain)
Infrastructure → Application → Core (Domain)
NOTHING depends on API or Infrastructure
```

### Project References
```
ScalaPOS.Core          ← no dependencies
ScalaPOS.Application   ← references Core only
ScalaPOS.Infrastructure← references Core + Application
ScalaPOS.Api           ← references Application + Infrastructure
ScalaPOS.Sync          ← references Application + Infrastructure
ScalaPOS.Tests         ← references all (test project)
```

### CQRS with MediatR Pattern

```csharp
// Command (write) — in ScalaPOS.Application/Features/Orders/Commands/
public record CompleteOrderCommand(Guid OrderId, List<PaymentDto> Payments) : IRequest<OrderResult>;

public class CompleteOrderHandler : IRequestHandler<CompleteOrderCommand, OrderResult>
{
    public async Task<OrderResult> Handle(CompleteOrderCommand cmd, CancellationToken ct)
    {
        // 1. Load order from repo
        // 2. Validate business rules (domain)
        // 3. Execute: post payments, deduct inventory, earn loyalty points
        // 4. Save to SQLite
        // 5. Queue sync event
        // 6. Return result
    }
}

// Query (read) — separate from command
public record GetOrderHistoryQuery(Guid StoreId, DateRange Range, int Page) : IRequest<PagedResult<OrderSummaryDto>>;

public class GetOrderHistoryHandler : IRequestHandler<GetOrderHistoryQuery, PagedResult<OrderSummaryDto>>
{
    // Reads DIRECTLY from SQLite using Dapper for performance — skips EF Core overhead
}
```

### Pipeline Behaviours (Cross-Cutting)
```csharp
// Applied to ALL commands/queries in order:
// 1. LoggingBehaviour       — log request + response + duration
// 2. ValidationBehaviour    — run FluentValidation rules; throw if invalid
// 3. AuthorisationBehaviour — check employee has Permission flag for this command
// 4. AuditBehaviour         — write AuditLog entry after successful command
// 5. SyncQueueBehaviour     — enqueue changed entities after successful command
```

---

## 3. Offline-First Design

### The Golden Rule
> **Write locally first. Always. Cloud sync is async. Never block a sale waiting for the internet.**

### SQLite Configuration (must be set on every connection)
```csharp
public class AppDbContext : DbContext
{
    protected override void OnConfiguring(DbContextOptionsBuilder options)
    {
        options.UseSqlite(connectionString, o => o.CommandTimeout(30));
    }
}

// Applied via EF Core migration or raw SQL on startup:
// PRAGMA journal_mode = WAL;
// PRAGMA synchronous = NORMAL;
// PRAGMA foreign_keys = ON;
// PRAGMA temp_store = MEMORY;
// PRAGMA cache_size = -64000;  -- 64MB page cache
// key = '<SQLCipher key>';      -- AES-256 encryption
```

### Row-Level Change Tracking (All sync-tracked tables)
Every table that participates in sync MUST have:
```sql
SyncVersion   INTEGER NOT NULL DEFAULT 0,  -- monotonic counter, incremented on every update
UpdatedAt     TEXT NOT NULL,                -- ISO8601 UTC timestamp
DeletedAt     TEXT,                         -- soft delete — NULL = alive
DeviceId      TEXT NOT NULL                 -- which device last wrote this row
```

### Sync State Machine
```
[ONLINE]  ──write local──► [PENDING SYNC] ──push to cloud──► [SYNCED]
             │                                                      │
             └──────── network lost ──────────────────────────────── ┘
                              │
                         [OFFLINE]
                    (all writes to SQLite only,
                     SyncQueue table accumulates)
```

---

## 4. Sync Engine & Conflict Resolution

### SyncEngine Worker Service
```csharp
public class SyncEngine : BackgroundService
{
    private readonly TimeSpan _interval = TimeSpan.FromSeconds(30);

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            if (await _networkMonitor.IsOnlineAsync())
            {
                await PushLocalChangesAsync(ct);
                await PullRemoteChangesAsync(ct);
                await UpdateSyncVersionAsync(ct);
            }
            await Task.Delay(_interval, ct);
        }
    }

    private async Task PushLocalChangesAsync(CancellationToken ct)
    {
        var pending = await _db.SyncQueue
            .Where(q => q.Status == SyncStatus.Pending)
            .OrderBy(q => q.CreatedAt)
            .Take(500)                          // batch size
            .ToListAsync(ct);

        var compressed = Compress(Serialize(pending)); // Brotli
        var response = await _httpClient.PostAsync("/api/sync/push", compressed, ct);

        if (response.IsSuccessStatusCode)
            await MarkSyncedAsync(pending.Select(p => p.Id), ct);
        else
            await IncrementRetryCountAsync(pending, ct); // exponential backoff
    }
}
```

### Conflict Resolution Matrix

| Entity Type | Strategy | Implementation |
|---|---|---|
| **Completed Order / Payment** | Immutable — no conflict possible | Orders are append-only once completed |
| **Inventory Stock Level** | Server Merge (sum deltas) | `new_qty = server_qty + (local_change_delta)` |
| **Table Status** | Last Write Wins (HLC timestamp) | Hybrid Logical Clock per device |
| **Customer Profile** | Field-level LWW | Each field has own `updated_at`; merge per field |
| **Employee Time Entry** | Manual flag | Conflict flagged → manager reviews dashboard |
| **Settings / Config** | Server Wins | Server config always authoritative |
| **PO / Invoice Status** | State machine merge | States have ordering: Draft < Sent < Received; never go backwards |

### Hybrid Logical Clock (HLC) — For ordering concurrent events
```csharp
public struct HLC
{
    public long WallTime { get; init; }    // milliseconds since epoch
    public int Logical { get; init; }      // counter for same-millisecond events
    public string NodeId { get; init; }    // device identifier

    public static HLC Now(HLC? last = null)
    {
        var wall = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        if (last == null || wall > last.Value.WallTime)
            return new HLC { WallTime = wall, Logical = 0, NodeId = _deviceId };
        return new HLC { WallTime = last.Value.WallTime, Logical = last.Value.Logical + 1, NodeId = _deviceId };
    }
}
```

### LAN Peer Sync (Zero internet, multiple devices)
```csharp
// Device A hosts a local SignalR hub
// Device B, C discover Device A via mDNS (.local DNS-SD)
// All devices sync through Device A's local SQLite → share changes over LAN
// When any device gets internet → it pushes on behalf of the group

public class MdnsDiscovery
{
    // Advertise: _scalapos._tcp.local. port 5001
    // Browse: find other _scalapos instances on LAN
    // Connect: establish SignalR to primary (first found)
}
```

---

## 5. Security Architecture

### Authentication Flow
```
Employee PIN → bcrypt verify → issue JWT (RS256, 15min) + RefreshToken (SHA-256 hash, 30 days)
Manager password → bcrypt verify + optional TOTP → same JWT flow
JWT stored in: memory (JS) + HttpOnly cookie for refresh
API validates: JWT signature → expiry → EmployeeId in DB → store membership
```

### RSA Key Management
```csharp
// Keys generated once on first run, stored in OS secure storage:
// Windows: DPAPI (Data Protection API)
// Linux:   /etc/scalapos/keys/ (600 permissions, root only)
// macOS:   Keychain

services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo("/etc/scalapos/keys"))
    .ProtectKeysWithDpapi();  // Windows
```

### Authorisation — Every API endpoint enforces permissions
```csharp
// Custom attribute — applied at handler level, checked in AuthorisationBehaviour
[RequirePermission(Permission.ApplyManagerDiscount)]

// Permission enum stored as long bitmask in JWT claim "perms"
// Employee has RoleId → Role has Permissions bitmask
// Claim: "perms": 9223372036854775807  (bitmask of all allowed permissions)

public class AuthorisationBehaviour<TRequest, TResponse>
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        var requiredPerm = typeof(TRequest).GetCustomAttribute<RequirePermissionAttribute>();
        if (requiredPerm != null)
        {
            var perms = _currentUser.Permissions;
            if (!perms.HasFlag(requiredPerm.Permission))
                throw new ForbiddenException($"Permission denied: {requiredPerm.Permission}");
        }
        return await next();
    }
}
```

### PCI-DSS Compliance Checklist
- ✅ No PAN, CVV, track data stored anywhere in SQLite or PostgreSQL
- ✅ P2PE certified terminals (Stripe Reader S700, Square Terminal) — card data never touches our app
- ✅ TLS 1.3 minimum on all connections
- ✅ JWT RS256 — asymmetric, tokens cannot be forged without private key
- ✅ Audit log is append-only with HMAC-SHA256 per entry
- ✅ Access controls: RBAC enforced at API layer (not just UI)
- ✅ Patch management: Dependabot on all NuGet + npm dependencies
- ⬜ Annual penetration test (Phase 4 — engage external QSA)
- ⬜ Network segmentation for POS terminals (Phase 4 — firewall rules)

### Data Encryption Layers
```
Layer 1: SQLite database file → SQLCipher AES-256-CBC (whole-DB encryption)
Layer 2: Sensitive fields (TaxNumber, BankAccount, CardToken) → AES-256-GCM at application layer
Layer 3: Cloud transit → TLS 1.3
Layer 4: Cloud at-rest → PostgreSQL TDE + AWS KMS
Layer 5: S3 documents → SSE-S3 (AES-256)
```

### Audit Log — Tamper-Evident
```csharp
public class AuditEntry
{
    // After building the entry, compute HMAC over all fields:
    public string Hmac { get; set; }  // HMAC-SHA256(secret_key, entry_json)
}

// Verification: recompute HMAC → compare → any tampering detected
// Secret key: stored in OS secure storage, never in DB
// Audit table: has INSERT trigger, no UPDATE or DELETE permissions granted
```

---

## 6. Real-Time Architecture (SignalR)

### Hub Design
```csharp
[Authorize]
public class PosHub : Hub
{
    // Groups:
    // - "store:{storeId}"          — all devices in a store
    // - "floor:{floorPlanId}"      — devices viewing a specific floor plan
    // - "kds:{stationId}"          — KDS screens for a station
    // - "device:{deviceId}"        — single device (private messages)

    public async Task JoinStore(Guid storeId)
    {
        await ValidateStoreAccess(storeId);
        await Groups.AddToGroupAsync(Context.ConnectionId, $"store:{storeId}");
        // Broadcast current state to joining device (table statuses, open orders)
        await SendCurrentStateAsync(storeId);
    }
}
```

### Real-Time Events (server → clients)
```typescript
// Frontend subscribes to these events via SignalR:
type PosHubEvents = {
  TableStatusChanged: (tableId: string, status: TableStatus, orderId: string) => void
  OrderCreated:       (order: OrderSummary) => void
  OrderUpdated:       (orderId: string, changes: Partial<Order>) => void
  OrderCompleted:     (orderId: string) => void
  KdsItemBumped:      (orderId: string, itemId: string, stationId: string) => void
  KdsNewOrder:        (kitchenOrder: KitchenOrder) => void
  StockLevelChanged:  (productId: string, newQty: number) => void
  SyncComplete:       (syncedEntities: number) => void
  EmployeeClockEvent: (employeeId: string, type: 'in' | 'out') => void
}
```

### Reconnection Strategy (Frontend)
```typescript
const connection = new signalR.HubConnectionBuilder()
  .withUrl('/hubs/pos', { accessTokenFactory: () => getAccessToken() })
  .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // retry intervals ms
  .configureLogging(signalR.LogLevel.Warning)
  .build()

connection.onreconnecting(() => setSyncStatus('reconnecting'))
connection.onreconnected(() => {
  setSyncStatus('online')
  // Re-fetch current state — may have missed events during disconnect
  queryClient.invalidateQueries({ queryKey: ['tables'] })
  queryClient.invalidateQueries({ queryKey: ['orders', 'open'] })
})
```

---

## 7. Multi-Tenancy Design

### Tenant Isolation Strategy: Schema-per-Tenant (PostgreSQL)
```sql
-- Each tenant gets their own PostgreSQL schema
-- schema: tenant_abc123
-- Tables: tenant_abc123.orders, tenant_abc123.products, etc.

-- Cloud API sets search_path on every connection:
SET search_path = 'tenant_{tenantId}', public;
```

```csharp
public class TenantDbContextFactory
{
    public AppDbContext CreateForTenant(string tenantId)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString, o =>
                o.MigrationsHistoryTable("__EFMigrationsHistory", $"tenant_{tenantId}"))
            .Options;
        return new AppDbContext(options, tenantId);
    }
}
```

### Scale Thresholds
- 1–500 tenants: Schema-per-tenant in single PostgreSQL cluster
- 500–5,000 tenants: Shard across multiple PostgreSQL clusters by tenant hash
- 5,000+ tenants: Each shard managed by dedicated RDS instance + PgBouncer

### Local SQLite — Single Tenant
Local SQLite never has multi-tenancy concerns. It serves ONE store only. The cloud API handles cross-store aggregation.

---

## 8. Performance & Scalability

### Local Performance Targets (SQLite)
| Operation | Target | Approach |
|---|---|---|
| Product search (FTS) | < 50ms | FTS5 index on name, SKU, barcode |
| Create order + items | < 10ms | Single transaction, WAL mode |
| Stock deduction (N items) | < 5ms | Indexed ProductId + StoreId lookup |
| Open order list (50 orders) | < 20ms | Covering index on status + storeId |
| Receipt generation | < 100ms | In-memory Razor template |
| Dashboard KPIs | < 200ms | Pre-aggregated summary tables |

### Summary Tables Pattern (avoid expensive aggregations at query time)
```sql
-- Updated by trigger or background job after every order:
CREATE TABLE daily_sales_summary (
    store_id    TEXT NOT NULL,
    date        TEXT NOT NULL,
    revenue     REAL NOT NULL DEFAULT 0,
    tx_count    INTEGER NOT NULL DEFAULT 0,
    avg_basket  REAL GENERATED ALWAYS AS (CASE WHEN tx_count > 0 THEN revenue / tx_count ELSE 0 END) STORED,
    PRIMARY KEY (store_id, date)
);

-- Dashboard reads this — never hits raw orders table for KPIs
```

### Cloud Performance Targets (PostgreSQL)
| Concurrent stores | Architecture |
|---|---|
| 1–100 | Single RDS instance (db.r6g.large), PgBouncer |
| 100–500 | Read replica for reporting queries |
| 500–2000 | Citus sharding on store_id hash |
| 2000+ | Dedicated cluster per region |

### API Rate Limiting
```csharp
// Applied per API key, not per IP
builder.Services.AddRateLimiter(options =>
{
    options.AddTokenBucketLimiter("default", o =>
    {
        o.TokenLimit = 1000;
        o.ReplenishmentPeriod = TimeSpan.FromMinutes(1);
        o.TokensPerPeriod = 1000;
    });
});
```

---

## 9. DevOps & CI/CD

### Repository Structure
```
.github/
  workflows/
    backend.yml     # build + test .NET on PR
    frontend.yml    # build + test React on PR
    deploy.yml      # deploy to staging/prod on main merge
    db-migrate.yml  # run EF migrations on deploy
```

### Backend CI (backend.yml)
```yaml
- name: Build
  run: dotnet build --configuration Release

- name: Test
  run: dotnet test --no-build --logger "trx;LogFileName=results.trx"

- name: Code Coverage
  run: dotnet test --collect:"XPlat Code Coverage" -- DataCollectionRunSettings.DataCollectionConfiguration.Configuration.Format=cobertura

- name: Publish Coverage
  uses: codecov/codecov-action@v3
```

### Frontend CI (frontend.yml)
```yaml
- name: Install
  run: npm ci

- name: Lint
  run: npm run lint

- name: Type Check
  run: npm run type-check

- name: Test
  run: npm run test -- --coverage

- name: Build
  run: npm run build
```

### Deployment Strategy
```
Branch: feature/* → PR → main
main → auto-deploy → staging environment
staging → manual approval → production

Blue/Green deployment on AWS ECS:
1. Build new Docker image
2. Deploy to Blue environment
3. Run smoke tests
4. Shift 10% traffic to Blue
5. Monitor error rate for 5 min
6. Shift 100% to Blue
7. Keep Green for 30-min rollback window
```

### Docker Setup
```dockerfile
# Backend
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "ScalaPOS.Api.dll"]

# Environment variables (set in ECS task definition, never in Dockerfile):
# DB_CONNECTION_STRING, JWT_PRIVATE_KEY, REDIS_URL, AWS_S3_BUCKET, STRIPE_KEY
```

### Infrastructure (Terraform)
```hcl
module "rds" {
  source           = "./modules/rds"
  instance_class   = "db.r6g.large"
  engine           = "postgres"
  engine_version   = "16.1"
  multi_az         = true            # HA
  backup_retention = 7               # days
}

module "elasticache" {
  source         = "./modules/elasticache"
  node_type      = "cache.t4g.medium"
  cluster_mode   = true
}

module "ecs" {
  source         = "./modules/ecs"
  desired_count  = 2
  min_capacity   = 2
  max_capacity   = 20              # HPA
  cpu_target     = 70              # scale up above 70% CPU
}
```

### Monitoring Stack
- **Metrics**: AWS CloudWatch + custom .NET metrics (System.Diagnostics.Metrics)
- **Logging**: Serilog → CloudWatch Logs → Seq dashboard
- **Tracing**: OpenTelemetry → AWS X-Ray (distributed tracing across API + Worker)
- **Alerts**: CloudWatch Alarm → SNS → PagerDuty → on-call engineer
- **Uptime**: Pingdom external health checks every 1 minute
- **Error tracking**: Sentry.io SDK in both .NET and React

### Health Checks
```csharp
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("sqlite")
    .AddNpgSql(pgConnStr, name: "postgres")
    .AddRedis(redisUrl, name: "redis")
    .AddUrlGroup(new Uri("https://api.stripe.com/v1"), name: "stripe")
    .AddSignalRHub("/hubs/pos", name: "signalr");

// Exposed at: GET /health → { status, checks: [{name, status, duration}] }
// Kubernetes liveness: /health/live
// Kubernetes readiness: /health/ready
```

---

## 10. Plugin System (WASM)

### Architecture
```
Third-party plugin (any language compiled to WASM)
        ↓
  Wasmtime runtime (sandboxed, no filesystem/network access by default)
        ↓
  Plugin Host API (C# interface exposed to WASM)
        ↓
  ScalaPOS.Application (calls use cases via MediatR)
```

### Plugin Host Interface (exposed to WASM plugins)
```csharp
public interface IPluginHostApi
{
    // POS lifecycle hooks
    Task OnOrderCreated(OrderDto order);
    Task<decimal> OnCalculateDiscount(OrderDto order, EmployeeDto employee);
    Task OnOrderCompleted(CompletedOrderDto order);

    // Read-only data access
    Task<ProductDto?> GetProductByBarcodeAsync(string barcode);
    Task<CustomerDto?> GetCustomerByIdAsync(Guid id);
    Task<decimal> GetStockLevelAsync(Guid productId);

    // Limited write actions
    Task AddOrderItemAsync(Guid orderId, Guid productId, decimal qty);
    Task SetCustomerAsync(Guid orderId, Guid customerId);
    Task LogAsync(string message, LogLevel level);
}
```

### Plugin Manifest (plugin.json)
```json
{
  "id": "com.acme.gift-cards",
  "name": "Acme Gift Cards",
  "version": "1.0.0",
  "permissions": ["read:products", "write:order_items", "read:customers"],
  "hooks": ["OnOrderCompleted", "OnCalculateDiscount"],
  "entrypoint": "plugin.wasm"
}
```

---

## 11. Key Architecture Decisions (ADRs)

### ADR-001: SQLite as local source of truth (not IndexedDB)
- **Decision**: Use SQLite via .NET (not browser IndexedDB)
- **Reason**: Full SQL power, FTS5, transactions, ACID compliance, SQLCipher encryption. IndexedDB is too limited for complex queries.
- **Trade-off**: Requires .NET runtime on device. Acceptable since app is not purely browser-based.

### ADR-002: Clean Architecture over anemic CRUD
- **Decision**: Domain models with behaviour, CQRS, no fat repositories
- **Reason**: Business rules (commission calc, loyalty points, tax engine) are complex. Anemic models push logic into controllers/services creating spaghetti.
- **Trade-off**: More files, steeper learning curve for junior devs. Mitigated by templates.

### ADR-003: Minimal APIs over MVC Controllers
- **Decision**: ASP.NET Core 8 Minimal APIs
- **Reason**: Less ceremony, better performance (fewer middleware layers), easier to understand flow.
- **Trade-off**: Less automatic convention-based features. Solved by endpoint organiser classes.

### ADR-004: PostgreSQL schema-per-tenant (not row-level tenant_id)
- **Decision**: Each tenant = own PostgreSQL schema
- **Reason**: Row-level isolation requires every query to include `WHERE tenant_id = X` — easy to forget, catastrophic if missed. Schema isolation is enforced by DB engine.
- **Trade-off**: Schema migrations must run per-tenant. Solved by automated migration runner on deploy.

### ADR-005: SignalR over raw WebSockets
- **Decision**: Microsoft SignalR hub
- **Reason**: Auto-reconnect, group management, fallback transports (long polling if WebSocket blocked), typed hub interfaces. No need to build all this manually.
- **Trade-off**: Requires .NET server. Acceptable since cloud API is already .NET.

### ADR-006: Dexie.js for frontend offline cache (not Redux-offline)
- **Decision**: Dexie.js wrapping IndexedDB for React-side offline queue
- **Reason**: Dexie has excellent TypeScript support, reactive queries, and a rich query API. Redux-offline is unmaintained.
- **Trade-off**: Two caches exist: Dexie (frontend) and SQLite (backend). Kept in sync by local API.

---

## 12. Tech Debt & Risk Register

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| SQLite performance at 1M+ products | High | Medium | FTS5 + covering indexes + summary tables + eventual ElasticSearch for cloud |
| Schema migration on 500+ tenants | High | High | Automated per-tenant migration runner in deploy pipeline; backward-compatible migrations |
| SignalR connection at 1000+ concurrent devices per store | Medium | Low | Redis backplane for multi-server SignalR; horizontal scale |
| Sync conflict creates data inconsistency in inventory | High | Medium | Soft lock + delta merge strategy; manual resolution dashboard |
| PCI-DSS audit failure | Critical | Low | Engage QSA in Phase 4; follow checklist from Phase 1 |
| WASM plugin sandbox escape | High | Very Low | Wasmtime capability-based security; no filesystem/network permissions by default |
| EF Core migration lock on PostgreSQL | Medium | Medium | Use concurrent index creation; run migrations in maintenance window |
| .NET 8 → .NET 9 upgrade breaking changes | Low | High | Stay on .NET LTS (8 is LTS until Nov 2026). Plan upgrade in Phase 4 |
