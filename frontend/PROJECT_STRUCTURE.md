# Scala POS - Frontend Project Structure

## ✅ Completed Setup

### 📦 Installed Packages
- **Zustand** - State management
- **@tanstack/react-query** - Server state management
- **react-router-dom** - Routing
- **lucide-react** - Icons
- **date-fns** - Date utilities

### 🗂️ Folder Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx          - Main navigation sidebar
│   │   └── Header.jsx            - Top header with user info
│   ├── pos/
│   │   ├── ProductGrid.jsx       - Product display grid
│   │   ├── CategoryTabs.jsx      - Category filters
│   │   └── Cart.jsx              - Shopping cart component
│   └── ui/
│       ├── Button.jsx            - Reusable button
│       ├── Input.jsx             - Reusable input
│       ├── Label.jsx             - Reusable label
│       └── Tabs.jsx              - Tab component
├── pages/
│   ├── Login/
│   │   └── LoginPage.jsx         - Authentication page
│   ├── Dashboard/
│   │   ├── DashboardLayout.jsx   - Dashboard shell
│   │   └── Overview.jsx          - Dashboard home
│   ├── POS/
│   │   └── POSPage.jsx           - Point of Sale interface
│   ├── ProductsPage.jsx          - Product management
│   └── OrdersPage.jsx            - Order management
├── store/
│   ├── index.js                  - Store exports
│   ├── authStore.js              - Authentication state
│   ├── cartStore.js              - Cart state
│   ├── posStore.js               - POS UI state
│   └── settingsStore.js          - App settings
├── hooks/
│   ├── index.js                  - Hook exports
│   ├── useProducts.js            - Product queries/mutations
│   └── useOrders.js              - Order queries/mutations
├── services/
│   └── api.js                    - API service layer
├── lib/
│   └── queryClient.js            - React Query config
├── App.jsx                       - Main app with routing
└── main.jsx                      - App entry point
```

## 🔧 State Management

### Zustand Stores

#### 1. **authStore** - Authentication
```javascript
- user, token, role, isAuthenticated
- login(), logout(), updateUser()
- hasPermission(permission)
```

#### 2. **cartStore** - Shopping Cart
```javascript
- items, orderType, tableNumber, customerInfo, discount
- addItem(), updateQuantity(), removeItem()
- setOrderType(), setDiscount()
- getSubtotal(), getTax(), getTotal(), clearCart()
```

#### 3. **posStore** - POS UI State
```javascript
- heldOrders, selectedCategory, searchQuery, isPaymentModalOpen
- holdOrder(), resumeOrder(), removeHeldOrder()
- setSelectedCategory(), setSearchQuery()
- openPaymentModal(), closePaymentModal()
```

#### 4. **settingsStore** - Application Settings
```javascript
- storeName, currency, taxRate, theme
- receiptSettings, printerSettings
- updateStoreInfo(), toggleTheme()
```

## 🌐 API Layer

### React Query Hooks

**Product Hooks:**
- `useProducts()` - Fetch all products
- `useProduct(id)` - Fetch single product
- `useCreateProduct()` - Create product mutation
- `useUpdateProduct()` - Update product mutation
- `useDeleteProduct()` - Delete product mutation
- `useSearchProducts(query)` - Search products

**Order Hooks:**
- `useOrders()` - Fetch all orders
- `useOrder(id)` - Fetch single order
- `useCreateOrder()` - Create order mutation
- `useUpdateOrder()` - Update order mutation
- `useDeleteOrder()` - Delete order mutation
- `useTotalSales()` - Fetch sales totals
- `useAddOrderItem()` - Add item to order

## 🛣️ Routing Structure

```
/ (Public)
  └── LoginPage

/dashboard (Protected)
  ├── / - Overview Dashboard
  ├── /pos - POS Interface
  ├── /products - Product Management
  ├── /orders - Order Management
  ├── /inventory - Inventory (Coming Soon)
  ├── /customers - Customers (Coming Soon)
  ├── /kitchen - Kitchen Display (Coming Soon)
  ├── /analytics - Analytics (Coming Soon)
  ├── /hr - HR Management (Coming Soon)
  └── /settings - Settings (Coming Soon)
```

## 🔐 Role-Based Access Control

Permissions defined in `authStore.hasPermission()`:

| Role     | Permissions |
|----------|-------------|
| admin    | Full access to all modules |
| manager  | All except some settings |
| cashier  | POS, limited customer access |
| kitchen  | Kitchen Display only |
| delivery | Delivery module only |

## 🎨 UI Components

All components use Tailwind CSS with consistent styling:
- Primary color: Blue (blue-600)
- Rounded corners: rounded-lg
- Shadow on cards: shadow
- Hover states on interactive elements

## 🚀 Getting Started

1. **Start Backend:**
   ```bash
   cd ..
   dotnet run
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Access Application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Swagger: http://localhost:5000/swagger

## 📝 Next Steps

Implement remaining modules:
1. ✅ Login & Authentication
2. ✅ Dashboard Overview
3. ✅ POS Interface
4. ✅ Products Management
5. ✅ Orders Management
6. ⏳ Inventory Management
7. ⏳ Customer CRM & Loyalty
8. ⏳ Kitchen Display System
9. ⏳ Analytics & Reports
10. ⏳ HR & Payroll
11. ⏳ Settings & Configuration

## 🔥 Features

- ✅ Modern React 18 with Hooks
- ✅ Zustand for client state
- ✅ React Query for server state
- ✅ React Router for navigation
- ✅ Protected routes with auth
- ✅ Role-based permissions
- ✅ Responsive Tailwind CSS
- ✅ Component-based architecture
- ✅ Clean folder structure
