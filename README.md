# Scala POS (Point of Sale) System

A modern, high-performance Point of Sale (POS) management system built with **ASP.NET Core 8.0 Web API** and **React (Vite) + Tailwind CSS**.

## 🚀 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | .NET 8.0 (ASP.NET Core Web API) |
| **Frontend** | React 18, Vite, Tailwind CSS |
| **State Management** | Zustand (Global), TanStack Query (Server State) |
| **Database** | SQLite with Entity Framework Core 8.0 |
| **Icons & UI** | Lucide React, Custom UI Components |
| **API Client** | Axios |

## ✨ Core Features

### 🛒 POS & Sales
- **Dynamic POS Interface**: Fast, searchable product grid with category filtering.
- **Smart Cart Management**: Real-time total calculation, quantity adjustments.
- **Payment Processing**: Integrated payment modal (Ready for gateway integration).
- **Order Management**: Comprehensive order history and status tracking.

### 📦 Inventory & Products
- **Rich Product Catalog**: Multi-category support, SKU tracking, pricing, and stock management.
- **Category System**: Customizable categories with icons and color coding.
- **Inventory Tracking**: Real-time stock updates and low-stock alerts.

### 👥 CRM & Staff
- **Customer Management**: Detailed customer profiles, loyalty points tracking, and membership tiers.
- **Staff Management**: Role-based access control (RBAC) with secure PIN codes.
- **Role Permissions**: Admin, Manager, and Cashier roles with specific access levels.

### 📊 Analytics & Kitchen
- **Sales Analytics**: Visual overview of revenue and performance metrics.
- **Kitchen Display System (KDS)**: Real-time order monitoring for kitchen staff.
- **Dashboard Overview**: Quick stats on daily sales, new customers, and popular items.

## 📂 Project Structure

```
Scala POS/
├── Controllers/            # ASP.NET Core API Controllers
├── Models/                 # EF Core Data Models (Product, Order, Staff, etc.)
├── Data/                   # DbContext & Database Seeding logic
├── frontend/               # React (Vite) Frontend
│   ├── src/
│   │   ├── components/     # Modular UI & Feature components
│   │   ├── hooks/          # Custom TanStack Query hooks
│   │   ├── pages/          # Main application views
│   │   ├── store/          # Zustand global state stores
│   │   └── services/       # API service layer (Axios)
└── posdb.db                # SQLite Database file
```

## 🏁 Getting Started

### Prerequisites
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js (v18+)](https://nodejs.org/)

### 1. Backend Setup
```bash
# From the root directory
dotnet restore
dotnet build
dotnet run
```
*The API will be available at `http://localhost:5000` (or `http://localhost:5001` for HTTPS).*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*The frontend will be available at `http://localhost:5173`.*

## 🛣️ Page Map & Routes

| Route | Page | Description |
| :--- | :--- | :--- |
| `/` | **Login** | Secure entry with Role/PIN validation. |
| `/dashboard` | **Overview** | Business KPIs and live activity feed. |
| `/dashboard/pos` | **POS Terminal** | Main sales interface with quick-add. |
| `/dashboard/products` | **Products** | Inventory catalog and price management. |
| `/dashboard/orders` | **Orders** | Full transaction history and receipt viewing. |
| `/dashboard/inventory`| **Inventory** | Stock adjustments and SKU tracking. |
| `/dashboard/customers`| **Customers** | CRM and loyalty program management. |
| `/dashboard/kitchen`  | **Kitchen Display**| Live prep queue for orders. |
| `/dashboard/analytics`| **Analytics** | Deep-dive reports and sales charts. |
| `/dashboard/hr` | **HR Manager** | Staff scheduling and performance (Coming Soon). |
| `/dashboard/settings` | **Settings** | Global system and tax configuration. |

## 🛡️ Role-Based Access Control (RBAC)

| Feature | Admin | Manager | Cashier |
| :--- | :---: | :---: | :---: |
| Process Sales | ✅ | ✅ | ✅ |
| View Analytics | ✅ | ✅ | ❌ |
| Manage Products | ✅ | ✅ | ❌ |
| System Settings | ✅ | ❌ | ❌ |
| Manage Staff | ✅ | ❌ | ❌ |

## 🛠️ API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/products` | `GET` | Retrieve all active products. |
| `/api/orders` | `POST` | Create a new transaction. |
| `/api/customers` | `GET` | Fetch CRM data. |
| `/api/inventory` | `PUT` | Update stock levels. |

*Full documentation is available via **Swagger** at `/swagger` when running in development.*

## 🗺️ Roadmap

- [x] Full REST API Backend (ASP.NET Core 8.0)
- [x] Modern React Frontend (Vite + Tailwind)
- [x] Real-time Cart & Category Filtering
- [x] SQLite Database Integration
- [ ] Hardware Integration (Thermal Printer, Cash Drawer)
- [ ] Payment Gateway Integration (Stripe/PayPal)
- [ ] Offline Support (PWA)
- [ ] Advanced Reporting (PDF/Excel Export)

---
**Version**: 2.0 (Modern Web Edition)
**Status**: Active Development
