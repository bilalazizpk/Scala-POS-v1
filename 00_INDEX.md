# SCALA POS — Developer Documentation Index
### Stack: .NET 8 · React 18 · TypeScript · Tailwind CSS · shadcn/ui · SQLite · PostgreSQL

---

## 📁 Document Map

| File | Role | Responsibility |
|---|---|---|
| [`01_SENIOR_ARCHITECT.md`](./01_SENIOR_ARCHITECT.md) | 🏛️ Senior / Architect | System design, patterns, security, DevOps, CI/CD, sync engine, decisions |
| [`02_BACKEND_DEV.md`](./02_BACKEND_DEV.md) | ⚙️ Backend Developer | .NET 8, C# domain models, APIs, business logic, SignalR, integrations |
| [`03_FRONTEND_DEV.md`](./03_FRONTEND_DEV.md) | 🎨 Frontend Developer | React, TypeScript, shadcn/ui, Tailwind, screens, state, offline UI |
| [`04_DATABASE.md`](./04_DATABASE.md) | 🗄️ Database Engineer | Schema, migrations, indexes, EF Core config, queries, sync tables |
| [`05_FEATURES.md`](./05_FEATURES.md) | 📋 All / Reference | Full feature list, all modules, API map, roadmap phases |

---

## 🗂️ Module → Owner Matrix

| Module | Senior | Backend | Frontend | Database |
|---|---|---|---|---|
| Auth & RBAC | ✅ Design | ✅ Implement | ✅ UI | ✅ Tables |
| POS Core | ✅ Design | ✅ API | ✅ Checkout UI | ✅ Orders schema |
| Bill Splitting | ✅ Design | ✅ Logic | ✅ Split UI | ✅ Payments schema |
| Table Management | — | ✅ SignalR | ✅ Floor plan + Drag & Drop | ✅ Tables schema |
| Inventory | — | ✅ FIFO/LIFO | ✅ Stock UI | ✅ Inventory schema |
| Kitchen / KDS | — | ✅ Routing | ✅ KDS screen | ✅ Item Status DB |
| Accounting / ERP | ✅ Design | ✅ Ledger logic | ✅ Reports UI | ✅ GL schema |
| HR & Payroll | — | ✅ Payroll calc | ✅ HR screens | ✅ HR schema |
| CRM & Loyalty | — | ✅ Points engine | ✅ Customer UI | ✅ CRM schema |
| Offline Sync | ✅ LocalStorage queue | ✅ `SyncLog` API (Push/Pull) | ✅ Admin Sync Dashboard | ✅ `SyncLog` schema |
| Supply Chain | — | ✅ PO + Supplier API | ✅ PO + Supplier UI | ✅ Supply schema |
| Services / Projects | — | ✅ Project + Task API | ✅ Kanban board UI | ✅ Project schema |
| Helpdesk | — | ✅ SLA engine + Comments | ✅ Kanban board UI | ✅ Tickets schema |
| Appointments | — | ✅ Booking API | ✅ Calendar + Timeline UI | ✅ Appt schema |
| Documents / Sign | ✅ Storage | ✅ Upload/Download/Archive | ✅ File grid + filters | ✅ Docs schema |
| WhatsApp | — | ✅ Meta API | ✅ Inbox UI | ✅ Chat schema |
| Spreadsheet BI | ✅ Design | ✅ 6 aggregation queries | ✅ KPI + charts + grid + CSV export | — |
| Security & Audit | ✅ PCI-DSS | ✅ AuditLog + AuditService | ✅ Audit Viewer UI | ✅ Audit table |
| DevOps / Deploy | ✅ All | — | — | ✅ Migrations |

---

## 🚦 Development Phase Summary

| Phase | Timeline | Lead Focus |
|---|---|---|
| Phase 1 — MVP | Months 1–5 | Senior sets up arch + CI/CD; Backend API + auth; Frontend POS screen; DB migrations |
| Phase 2 — Operations | Months 6–9 | Backend: inventory/HR/accounting; Frontend: dashboards/scheduling; DB: new tables |
| Phase 3 — Enterprise | Months 10–13 | Backend: supply chain/services; Frontend: project/helpdesk/field; DB: schema expansion |
| Phase 4 — Scale | Months 14–18 | Senior: performance/security/plugins; Backend: manufacturing/PLM; DB: indexing |
| Phase 5 — AI | Months 18–24 | Senior: ML pipeline; Backend: forecast API; Frontend: AI widgets |
| Phase 6 — Polish | Months 24–30 | All: accessibility, i18n, white-label, marketplace |

---

## 🔗 Quick Reference

- **API Base URL**: `https://api.scalapos.com/v1` (cloud) · `http://localhost:5000/api/v1` (local)
- **SignalR Hub**: `/hubs/pos` — table status, KDS, live orders, sync events
- **Auth**: JWT Bearer RS256 · 15-min access token · 30-day refresh
- **Local DB**: SQLite with WAL mode, SQLCipher AES-256
- **Cloud DB**: PostgreSQL 16 on AWS RDS / Supabase
- **Repo**: Monorepo — `/src` (.NET) + `/client` (React)
- **Migrations**: EF Core — run `dotnet ef database update`
- **Frontend dev**: `cd client && npm run dev` (Vite on port 5173)
- **Backend dev**: `dotnet run --project src/ScalaPOS.Api`
