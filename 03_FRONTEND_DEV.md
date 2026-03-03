# SCALA POS — Frontend Developer Guide
### Role: React 18 · TypeScript · Tailwind CSS · shadcn/ui · TanStack · Zustand · Framer Motion

---

## Table of Contents

1. [Project Setup & Config](#1-project-setup--config)
2. [Folder Structure](#2-folder-structure)
3. [Design System (Tailwind + shadcn/ui)](#3-design-system-tailwind--shadcnui)
4. [State Management](#4-state-management)
5. [Routing (TanStack Router)](#5-routing-tanstack-router)
6. [API Layer (TanStack Query)](#6-api-layer-tanstack-query)
7. [Offline Support (Dexie.js)](#7-offline-support-dexiejs)
8. [Real-Time (SignalR)](#8-real-time-signalr)
9. [Key Screens — Components & Logic](#9-key-screens--components--logic)
10. [Forms (React Hook Form + Zod)](#10-forms-react-hook-form--zod)
11. [Data Tables (TanStack Table)](#11-data-tables-tanstack-table)
12. [Charts & Visualisations](#12-charts--visualisations)
13. [Hardware Interactions (Browser)](#13-hardware-interactions-browser)
14. [Animations (Framer Motion)](#14-animations-framer-motion)
15. [Module-by-Module Frontend Tasks](#15-module-by-module-frontend-tasks)

---

## 1. Project Setup & Config

### package.json (key dependencies)
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-router": "^1.0.0",
    "@tanstack/react-table": "^8.0.0",
    "zustand": "^4.5.0",
    "react-hook-form": "^7.51.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.3.0",
    "@microsoft/signalr": "^8.0.0",
    "dexie": "^3.2.0",
    "dexie-react-hooks": "^1.1.0",
    "framer-motion": "^11.0.0",
    "recharts": "^2.12.0",
    "d3": "^7.9.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "zxing-js": "^0.21.0",
    "@react-pdf/renderer": "^3.4.0",
    "date-fns": "^3.6.0",
    "axios": "^1.7.0",
    "sonner": "^1.5.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "@testing-library/react": "^15.0.0",
    "vitest": "^1.5.0",
    "playwright": "^1.44.0"
  }
}
```

### tailwind.config.ts
```typescript
import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // shadcn/ui CSS variable mapping
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        // POS-specific status colours
        'status-free': 'hsl(142 71% 45%)',
        'status-occupied': 'hsl(0 84% 60%)',
        'status-reserved': 'hsl(48 96% 53%)',
        'status-cleaning': 'hsl(217 91% 60%)',
        'status-attention': 'hsl(25 95% 53%)',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        }
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/hubs': { target: 'ws://localhost:5000', ws: true }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          tanstack: ['@tanstack/react-query', '@tanstack/react-router', '@tanstack/react-table'],
          charts: ['recharts', 'd3'],
          motion: ['framer-motion'],
        }
      }
    }
  }
})
```

---

## 2. Folder Structure

```
client/src/
├── components/
│   ├── ui/                     # shadcn/ui auto-generated (DO NOT EDIT MANUALLY)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ... (all shadcn components)
│   ├── pos/
│   │   ├── QuickKeyGrid.tsx    # configurable product button grid
│   │   ├── CartPanel.tsx       # active order line items
│   │   ├── PaymentPanel.tsx    # payment method selection
│   │   ├── SplitBillModal.tsx  # all 4 split modes
│   │   ├── ItemModifierModal.tsx
│   │   ├── DiscountModal.tsx
│   │   ├── RefundModal.tsx
│   │   └── ReceiptModal.tsx
│   ├── tables/
│   │   ├── FloorPlan.tsx       # SVG floor plan renderer
│   │   ├── TableNode.tsx       # single table SVG element
│   │   ├── FloorPlanEditor.tsx # drag-and-drop designer
│   │   ├── ReservationForm.tsx
│   │   └── WaitlistPanel.tsx
│   ├── inventory/
│   │   ├── ProductForm.tsx
│   │   ├── VariantMatrix.tsx   # attribute × value grid
│   │   ├── RecipeBuilder.tsx   # ingredient BOM editor
│   │   ├── StockCountSheet.tsx
│   │   └── PurchaseOrderForm.tsx
│   ├── hr/
│   │   ├── TimeClockKiosk.tsx  # full-screen PIN clock
│   │   ├── ShiftCalendar.tsx   # drag-and-drop schedule
│   │   ├── PayrollReview.tsx
│   │   └── EmployeeForm.tsx
│   ├── accounting/
│   │   ├── JournalEntryForm.tsx
│   │   ├── InvoiceBuilder.tsx
│   │   └── PandLChart.tsx
│   ├── kds/
│   │   └── KdsScreen.tsx       # full-screen kitchen display
│   └── shared/
│       ├── AppLayout.tsx
│       ├── Sidebar.tsx
│       ├── SyncStatusDot.tsx
│       ├── BarcodeScanner.tsx
│       ├── DataTable.tsx       # TanStack Table wrapper
│       ├── DateRangePicker.tsx
│       ├── CurrencyInput.tsx
│       ├── PrintButton.tsx
│       └── EmptyState.tsx
├── features/
│   ├── pos/
│   │   ├── hooks/
│   │   │   ├── useCart.ts
│   │   │   ├── usePayment.ts
│   │   │   └── useSplitBill.ts
│   │   ├── PosPage.tsx
│   │   └── types.ts
│   ├── tables/
│   │   ├── hooks/
│   │   │   ├── useTableStatus.ts
│   │   │   └── useReservations.ts
│   │   ├── TablesPage.tsx
│   │   └── types.ts
│   ├── inventory/ ...
│   ├── hr/ ...
│   ├── accounting/ ...
│   ├── customers/ ...
│   ├── reports/ ...
│   └── settings/ ...
├── hooks/
│   ├── useSignalR.ts           # SignalR connection + event subscriptions
│   ├── useOfflineQueue.ts      # Dexie.js pending operations
│   ├── useBarcodeScanner.ts    # USB HID + camera scanner
│   ├── useKeyboardShortcuts.ts # F1-F12 POS shortcuts
│   ├── usePermission.ts        # check current employee permissions
│   └── usePrintReceipt.ts      # ESC/POS + PDF generation
├── stores/
│   ├── cartStore.ts            # Zustand: active cart state
│   ├── sessionStore.ts         # Zustand: employee + register session
│   ├── syncStore.ts            # Zustand: sync status
│   └── settingsStore.ts        # Zustand: app settings
├── lib/
│   ├── api.ts                  # Axios instance + TanStack Query defaults
│   ├── offline-db.ts           # Dexie schema + table definitions
│   ├── signalr.ts              # SignalR connection factory
│   ├── permissions.ts          # Permission enum mirror from backend
│   └── utils.ts                # cn(), formatCurrency(), formatDate()
└── types/
    └── index.ts                # All shared TypeScript types
```

---

## 3. Design System (Tailwind + shadcn/ui)

### Install shadcn/ui components
```bash
# Init
npx shadcn-ui@latest init

# Add components as needed:
npx shadcn-ui@latest add button card dialog form input label
npx shadcn-ui@latest add select checkbox switch textarea
npx shadcn-ui@latest add table badge avatar skeleton
npx shadcn-ui@latest add dropdown-menu context-menu sheet
npx shadcn-ui@latest add toast sonner (for notifications)
npx shadcn-ui@latest add calendar date-picker
npx shadcn-ui@latest add command (for search/combobox)
npx shadcn-ui@latest add tabs separator scroll-area
npx shadcn-ui@latest add alert alert-dialog
npx shadcn-ui@latest add progress slider
```

### Global CSS Variables (src/index.css)
```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --primary: 217 91% 60%;       /* Blue — matches brand */
    --primary-foreground: 0 0% 100%;
    --secondary: 210 40% 96%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --border: 214.3 31.8% 91.4%;
    --radius: 0.5rem;
    /* POS-specific: */
    --pos-bg: 222.2 84% 4.9%;     /* Dark mode for POS screen */
    --pos-surface: 217.2 32.6% 17.5%;
  }
  .dark { /* dark mode overrides */ }
  .pos-theme {
    --background: var(--pos-bg);
    --foreground: 0 0% 98%;
  }
}
```

### Utility Function
```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'AUD'): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(amount)
}

export function formatDate(date: string | Date, format = 'dd/MM/yyyy HH:mm'): string {
  return dateFns.format(new Date(date), format)
}
```

---

## 4. State Management

### Cart Store (Zustand)
```typescript
// src/stores/cartStore.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface CartState {
  orderId: string | null
  items: CartItem[]
  customerId: string | null
  tableId: string | null
  orderType: OrderType
  subtotal: number
  taxAmount: number
  discountAmount: number
  total: number

  addItem: (product: Product, variant?: ProductVariant, qty?: number, modifiers?: Modifier[]) => void
  removeItem: (itemId: string) => void
  updateQty: (itemId: string, qty: number) => void
  applyDiscount: (discount: DiscountInput) => void
  setCustomer: (customerId: string | null) => void
  setTable: (tableId: string | null) => void
  clearCart: () => void
  holdOrder: () => void
  recallOrder: (orderId: string) => void
}

export const useCartStore = create<CartState>()(
  immer((set, get) => ({
    orderId: null,
    items: [],
    customerId: null,
    tableId: null,
    orderType: 'dine-in',
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    total: 0,

    addItem: (product, variant, qty = 1, modifiers = []) =>
      set(state => {
        const existing = state.items.find(
          i => i.productId === product.id && i.variantId === variant?.id && i.modifiers.length === 0
        )
        if (existing && modifiers.length === 0) {
          existing.qty += qty
        } else {
          state.items.push({
            id: crypto.randomUUID(),
            productId: product.id,
            variantId: variant?.id ?? null,
            name: variant ? `${product.name} — ${Object.values(variant.attributes).join('/')}` : product.name,
            qty,
            unitPrice: variant?.price ?? product.basePrice,
            modifiers,
            notes: null,
            lineTotal: (variant?.price ?? product.basePrice) * qty,
          })
        }
        recalcTotals(state)
      }),

    removeItem: (itemId) =>
      set(state => {
        state.items = state.items.filter(i => i.id !== itemId)
        recalcTotals(state)
      }),

    clearCart: () => set({ orderId: null, items: [], customerId: null, tableId: null,
      subtotal: 0, taxAmount: 0, discountAmount: 0, total: 0 }),
  }))
)

function recalcTotals(state: CartState) {
  state.subtotal = state.items.reduce((s, i) => s + i.lineTotal, 0)
  state.taxAmount = state.subtotal * 0.1  // simplified — real: per-item tax from API
  state.total = state.subtotal + state.taxAmount - state.discountAmount
}
```

### Session Store (Zustand)
```typescript
// src/stores/sessionStore.ts
interface SessionState {
  employee: Employee | null
  register: Register | null
  store: Store | null
  isAuthenticated: boolean
  permissions: bigint                    // bitmask matching C# Permission enum

  login: (employee: Employee, register: Register) => void
  logout: () => void
  hasPermission: (perm: Permission) => boolean
}

export const useSessionStore = create<SessionState>()(persist(
  (set, get) => ({
    employee: null, register: null, store: null,
    isAuthenticated: false, permissions: 0n,

    login: (employee, register) => set({
      employee, register, isAuthenticated: true,
      permissions: BigInt(employee.role.permissionsBitmask),
      store: register.store,
    }),

    logout: () => set({ employee: null, register: null, isAuthenticated: false, permissions: 0n }),

    hasPermission: (perm: Permission) => (get().permissions & BigInt(perm)) !== 0n,
  }),
  { name: 'pos-session', storage: createJSONStorage(() => sessionStorage) }
))
```

### Sync Store (Zustand)
```typescript
export const useSyncStore = create<{
  status: 'synced' | 'pending' | 'offline' | 'syncing' | 'error'
  pendingCount: number
  lastSyncedAt: Date | null
  error: string | null
}>()(set => ({
  status: 'synced', pendingCount: 0, lastSyncedAt: null, error: null,
}))
```

---

## 5. Routing (TanStack Router)

```typescript
// src/routes/__root.tsx — authenticated layout
export const rootRoute = createRootRoute({ component: AppLayout })

// src/routes/index.tsx → /pos  (POS checkout — default route)
// src/routes/tables/index.tsx → /tables
// src/routes/inventory/index.tsx → /inventory
// src/routes/inventory/products/$productId.tsx → /inventory/products/:id
// src/routes/hr/index.tsx → /hr
// src/routes/hr/employees/$employeeId.tsx
// src/routes/accounting/index.tsx
// src/routes/customers/index.tsx
// src/routes/reports/index.tsx
// src/routes/settings/index.tsx
// src/routes/kds.tsx → /kds (kiosk mode — no sidebar)
// src/routes/clock.tsx → /clock (time clock kiosk)
// src/routes/login.tsx → /login (unauthenticated)

// Route guards:
export const protectedRoute = createRoute({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) throw redirect({ to: '/login' })
  }
})

// Permission guard:
export const managerRoute = createRoute({
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission(Permission.ManageSettings))
      throw redirect({ to: '/pos' })
  }
})
```

---

## 6. API Layer (TanStack Query)

### API Client Setup
```typescript
// src/lib/api.ts
import axios from 'axios'
import { QueryClient } from '@tanstack/react-query'

export const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
})

// Attach JWT token to every request
apiClient.interceptors.request.use(config => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
apiClient.interceptors.response.use(
  res => res,
  async error => {
    if (error.response?.status === 401) {
      await refreshTokenAsync()
      return apiClient.request(error.config)
    }
    return Promise.reject(error)
  }
)

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,       // 2 minutes
      gcTime: 1000 * 60 * 10,          // 10 minutes
      retry: 2,
      networkMode: 'offlineFirst',     // use cache when offline
    },
    mutations: { networkMode: 'offlineFirst' }
  }
})
```

### Query Hooks (per feature)
```typescript
// src/features/inventory/hooks.ts
export function useProducts(query?: string, categoryId?: string) {
  return useQuery({
    queryKey: ['products', { query, categoryId }],
    queryFn: () => apiClient.get<Product[]>('/products', { params: { q: query, categoryId } })
      .then(r => r.data),
    placeholderData: keepPreviousData,   // no flash on filter change
  })
}

export function useStockLevels(storeId: string) {
  return useQuery({
    queryKey: ['inventory', 'levels', storeId],
    queryFn: () => apiClient.get<StockLevel[]>('/inventory/levels', { params: { storeId } })
      .then(r => r.data),
    refetchInterval: 30_000,             // refresh every 30s
  })
}

// src/features/pos/hooks.ts
export function useCompleteOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CompleteOrderRequest) =>
      apiClient.post<CompleteOrderResult>(`/orders/${data.orderId}/complete`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['orders', 'open'] })
      qc.invalidateQueries({ queryKey: ['inventory', 'levels'] })
      qc.invalidateQueries({ queryKey: ['tables'] })
    },
  })
}
```

---

## 7. Offline Support (Dexie.js)

```typescript
// src/lib/offline-db.ts
import Dexie, { type EntityTable } from 'dexie'

interface OfflineProduct { id: string; name: string; sku: string; barcode?: string; price: number; categoryId: string; syncedAt: Date }
interface OfflinePendingOp { id?: number; type: string; payload: object; createdAt: Date; attempts: number }

class ScalaPosOfflineDb extends Dexie {
  products!: EntityTable<OfflineProduct, 'id'>
  pendingOps!: EntityTable<OfflinePendingOp, 'id'>
  openOrders!: EntityTable<{ id: string; data: object; updatedAt: Date }, 'id'>
  settings!: EntityTable<{ key: string; value: unknown }, 'key'>

  constructor() {
    super('ScalaPOSOffline')
    this.version(1).stores({
      products: 'id, barcode, name, categoryId',   // indexed fields
      pendingOps: '++id, type, createdAt',
      openOrders: 'id, updatedAt',
      settings: 'key',
    })
  }
}

export const offlineDb = new ScalaPosOfflineDb()

// Sync products from API → IndexedDB for offline search
export async function syncProductsToOfflineDb(products: Product[]) {
  await offlineDb.products.bulkPut(products.map(p => ({ ...p, syncedAt: new Date() })))
}

// Queue an operation when offline
export async function queueOfflineOperation(type: string, payload: object) {
  await offlineDb.pendingOps.add({ type, payload, createdAt: new Date(), attempts: 0 })
}
```

### Offline Product Search Hook
```typescript
// Falls back to IndexedDB when API is unavailable
export function useProductSearch(query: string) {
  const isOnline = useNetworkStatus()

  const apiQuery = useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => apiClient.get<Product[]>('/products', { params: { q: query } }).then(r => r.data),
    enabled: isOnline && query.length > 0,
  })

  const offlineQuery = useLiveQuery(
    () => query.length > 0
      ? offlineDb.products.where('name').startsWithIgnoreCase(query).or('barcode').equals(query).limit(20).toArray()
      : offlineDb.products.orderBy('name').limit(50).toArray(),
    [query],
    []
  )

  return isOnline ? apiQuery : { data: offlineQuery, isLoading: false, error: null }
}
```

---

## 8. Real-Time (SignalR)

```typescript
// src/hooks/useSignalR.ts
import * as signalR from '@microsoft/signalr'
import { useEffect, useRef } from 'react'

export function useSignalR(storeId: string) {
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const { setStatus } = useSyncStore()
  const qc = useQueryClient()

  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/pos', { accessTokenFactory: getAccessToken })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    conn.on('TableStatusChanged', (tableId: string, status: string) => {
      qc.setQueryData(['tables', storeId], (old: Table[] | undefined) =>
        old?.map(t => t.id === tableId ? { ...t, status } : t) ?? []
      )
    })

    conn.on('KdsNewOrder', (order: KitchenOrder) => {
      qc.setQueryData(['kds', 'orders'], (old: KitchenOrder[] | undefined) => [order, ...(old ?? [])])
    })

    conn.on('StockLevelChanged', (productId: string, newQty: number) => {
      qc.setQueryData(['inventory', 'levels', storeId], (old: StockLevel[] | undefined) =>
        old?.map(l => l.productId === productId ? { ...l, qtyOnHand: newQty } : l) ?? []
      )
    })

    conn.on('OrderCompleted', (orderId: string) => {
      qc.invalidateQueries({ queryKey: ['orders', 'open'] })
    })

    conn.onreconnecting(() => setStatus('reconnecting'))
    conn.onreconnected(() => {
      setStatus('online')
      qc.invalidateQueries({ queryKey: ['tables'] })
      qc.invalidateQueries({ queryKey: ['orders', 'open'] })
    })
    conn.onclose(() => setStatus('offline'))

    conn.start()
      .then(() => conn.invoke('JoinStore', storeId))
      .then(() => setStatus('online'))

    connectionRef.current = conn
    return () => { conn.stop() }
  }, [storeId])

  return connectionRef
}
```

---

## 9. Key Screens — Components & Logic

### POS Screen (3-panel layout)
```tsx
// src/features/pos/PosPage.tsx
export default function PosPage() {
  const { items, total, addItem, clearCart } = useCartStore()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { data: products } = useProductSearch(searchQuery)
  const { hasPermission } = useSessionStore()

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'F1': () => clearCart(),
    'F2': () => document.getElementById('product-search')?.focus(),
    'F9': () => openCashDrawer(),
    'F12': () => navigate({ to: '/shift/close' }),
    'Escape': () => setSearchQuery(''),
  })

  return (
    <div className="flex h-screen bg-background overflow-hidden pos-theme">
      {/* LEFT: Product Catalogue */}
      <div className="flex flex-col w-[400px] border-r border-border">
        <ProductSearch value={searchQuery} onChange={setSearchQuery} />
        <CategoryTabs value={activeCategory} onChange={setActiveCategory} />
        <QuickKeyGrid
          products={products ?? []}
          category={activeCategory}
          onSelect={(product, variant) => addItem(product, variant)}
          className="flex-1 overflow-auto"
        />
      </div>

      {/* CENTRE: Cart */}
      <div className="flex flex-col flex-1 min-w-0">
        <CartHeader />
        <CartItemList
          items={items}
          className="flex-1 overflow-auto"
        />
        <CartFooter total={total} />
      </div>

      {/* RIGHT: Payment Panel */}
      <div className="flex flex-col w-[320px] border-l border-border">
        <CustomerSelector />
        <PaymentPanel />
        <ActionButtons />
      </div>
    </div>
  )
}
```

### Split Bill Modal
```tsx
// src/components/pos/SplitBillModal.tsx
type SplitMode = 'equal' | 'by-item' | 'custom' | 'percentage'

export function SplitBillModal({ order, onClose }: Props) {
  const [mode, setMode] = useState<SplitMode>('equal')
  const [parties, setParties] = useState(2)
  const [assignments, setAssignments] = useState<ItemAssignment[]>([])

  const partyColors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500']

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col gap-0 p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>Split Bill — {order.reference}</DialogTitle>
        </DialogHeader>

        {/* Mode selector */}
        <div className="flex gap-2 p-4 border-b">
          {(['equal', 'by-item', 'custom', 'percentage'] as SplitMode[]).map(m => (
            <Button key={m} variant={mode === m ? 'default' : 'outline'}
              onClick={() => setMode(m)} className="flex-1 capitalize">
              {m.replace('-', ' ')}
            </Button>
          ))}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Order items (left) */}
          <div className="w-1/2 overflow-auto border-r p-4 space-y-2">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-muted-foreground">× {item.qty}</div>
                </div>
                <div className="font-semibold">{formatCurrency(item.lineTotal)}</div>
                {mode === 'by-item' && (
                  <div className="flex gap-1 ml-2">
                    {Array.from({ length: parties }).map((_, pi) => (
                      <button key={pi}
                        onClick={() => assignItemToParty(item.id, pi)}
                        className={cn('w-7 h-7 rounded-full text-xs font-bold text-white',
                          partyColors[pi],
                          isAssigned(item.id, pi) ? 'ring-2 ring-offset-1 ring-foreground' : 'opacity-40'
                        )}>
                        {pi + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Party totals (right) */}
          <div className="w-1/2 p-4 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Parties</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setParties(p => Math.max(2, p - 1))}>−</Button>
                <span className="w-8 text-center font-bold">{parties}</span>
                <Button size="sm" variant="outline" onClick={() => setParties(p => Math.min(8, p + 1))}>+</Button>
              </div>
            </div>

            {Array.from({ length: parties }).map((_, pi) => (
              <SplitPartyCard key={pi}
                partyNumber={pi + 1}
                color={partyColors[pi]}
                amount={calculatePartyAmount(pi, mode, order, assignments, parties)}
                onCharge={() => chargeParty(pi)}
              />
            ))}

            <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
              <span>Remaining</span>
              <span className="font-medium">{formatCurrency(remainingBalance)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Floor Plan (SVG)
```tsx
// src/components/tables/FloorPlan.tsx
export function FloorPlan({ floorPlanId, onTableClick }: Props) {
  const { data: tables } = useTableLiveStatus(floorPlanId)
  const [selected, setSelected] = useState<string | null>(null)
  const [viewBox, setViewBox] = useState('0 0 1200 800')

  const statusColors: Record<TableStatus, string> = {
    free:       '#22c55e',
    occupied:   '#ef4444',
    reserved:   '#eab308',
    cleaning:   '#3b82f6',
    attention:  '#f97316',
    closed:     '#6b7280',
  }

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-xl overflow-hidden">
      <svg viewBox={viewBox} className="w-full h-full">
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>

        {/* Tables */}
        {tables?.map(table => (
          <TableNode key={table.id}
            table={table}
            color={statusColors[table.status]}
            isSelected={selected === table.id}
            onClick={() => { setSelected(table.id); onTableClick(table) }}
          />
        ))}
      </svg>

      {/* Status Legend */}
      <div className="absolute bottom-4 right-4 flex gap-3">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}/>
            <span className="text-xs text-white/60 capitalize">{status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TableNode({ table, color, isSelected, onClick }: TableNodeProps) {
  const shape = table.shape === 'circle'
    ? <circle cx={table.x + table.width/2} cy={table.y + table.height/2} r={table.width/2}
        fill={`${color}22`} stroke={color} strokeWidth={isSelected ? 3 : 1.5}/>
    : <rect x={table.x} y={table.y} width={table.width} height={table.height} rx={8}
        fill={`${color}22`} stroke={color} strokeWidth={isSelected ? 3 : 1.5}/>

  return (
    <g onClick={onClick} className="cursor-pointer" style={{ transition: 'all 0.2s' }}>
      {shape}
      <text x={table.x + table.width/2} y={table.y + table.height/2 - 6}
        textAnchor="middle" fill="white" fontSize={13} fontWeight="600">
        {table.name}
      </text>
      {table.status === 'occupied' && (
        <text x={table.x + table.width/2} y={table.y + table.height/2 + 12}
          textAnchor="middle" fill={color} fontSize={10}>
          {table.elapsedMinutes}m · {formatCurrency(table.orderTotal)}
        </text>
      )}
    </g>
  )
}
```

### KDS Screen (Kitchen Display)
```tsx
// src/components/kds/KdsScreen.tsx — Full-screen, no nav
export default function KdsScreen() {
  const { stationId } = useParams()
  const { data: orders } = useKdsOrders(stationId)
  const bumpItem = useBumpKdsItem()

  const ageColor = (minutes: number) =>
    minutes < 5 ? 'border-emerald-500' : minutes < 10 ? 'border-amber-500' : 'border-red-500 animate-pulse'

  return (
    <div className="h-screen bg-gray-950 p-4 overflow-auto">
      <div className="grid grid-cols-4 gap-4">
        {orders?.map(order => (
          <motion.div key={order.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn('bg-gray-900 rounded-xl border-2 p-4', ageColor(order.elapsedMinutes))}>
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-white text-lg">#{order.reference}</span>
              <span className={cn('text-sm font-mono', order.elapsedMinutes >= 10 ? 'text-red-400' : 'text-gray-400')}>
                {order.elapsedMinutes}m
              </span>
            </div>
            {order.items.map(item => (
              <button key={item.id}
                onClick={() => bumpItem.mutate({ orderId: order.id, itemId: item.id, stationId })}
                className={cn('w-full text-left p-2 rounded-lg mb-2 transition-all',
                  item.status === 'bumped'
                    ? 'bg-gray-800 opacity-40 line-through text-gray-500'
                    : 'bg-gray-800 text-white hover:bg-gray-700')}>
                <div className="font-medium">{item.qty}× {item.name}</div>
                {item.modifiers.map(m => (
                  <div key={m} className="text-xs text-amber-400 ml-2">+ {m}</div>
                ))}
                {item.notes && <div className="text-xs text-blue-400 ml-2 italic">{item.notes}</div>}
              </button>
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
```

---

## 10. Forms (React Hook Form + Zod)

```typescript
// Example: Product form with validation
const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  cost: z.number().min(0).optional(),
  categoryId: z.string().uuid('Select a category'),
  reorderPoint: z.number().min(0).default(0),
  trackInventory: z.boolean().default(true),
})

type ProductFormValues = z.infer<typeof productSchema>

function ProductForm({ product, onSave }: Props) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product ?? { price: 0, trackInventory: true, reorderPoint: 0 },
  })

  const { mutate: saveProduct, isPending } = useSaveProduct()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(data => saveProduct(data))} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Product Name</FormLabel>
            <FormControl><Input {...field} placeholder="e.g. Flat White" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem>
              <FormLabel>Sell Price</FormLabel>
              <FormControl>
                <CurrencyInput value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="cost" render={({ field }) => (
            <FormItem>
              <FormLabel>Cost Price</FormLabel>
              <FormControl><CurrencyInput value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Saving...' : 'Save Product'}
        </Button>
      </form>
    </Form>
  )
}
```

---

## 11. Data Tables (TanStack Table)

```tsx
// Reusable DataTable wrapper using TanStack Table + shadcn/ui Table
export function DataTable<TData>({ columns, data, searchColumn, onRowClick }: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, globalFilter },
  })

  return (
    <div className="space-y-4">
      {searchColumn && (
        <Input placeholder="Search..." value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="max-w-sm" />
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => (
                  <TableHead key={header.id} onClick={header.column.getToggleSortingHandler()}
                    className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id} onClick={() => onRowClick?.(row.original)}
                className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
```

---

## 12. Charts & Visualisations

```tsx
// Real-time sales dashboard chart
export function SalesTrendChart({ storeId, dateRange }: Props) {
  const { data } = useSalesTrend(storeId, dateRange)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
        <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 11 }}/>
        <YAxis tickFormatter={v => `$${v}`} tick={{ fill: '#6b7280', fontSize: 11 }}/>
        <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: '#1e293b', border: 'none' }}/>
        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revenueGrad)" strokeWidth={2}/>
      </AreaChart>
    </ResponsiveContainer>
  )
}
```

---

## 13. Hardware Interactions (Browser)

### Barcode Scanner (USB HID as keyboard)
```typescript
// src/hooks/useBarcodeScanner.ts
// USB barcode scanners type very fast (< 50ms per char) and end with Enter
export function useBarcodeScanner(onScan: (barcode: string) => void) {
  const bufferRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && bufferRef.current.length > 3) {
        onScan(bufferRef.current)
        bufferRef.current = ''
        return
      }
      if (e.key.length === 1) {
        bufferRef.current += e.key
        clearTimeout(timerRef.current)
        // If no new chars in 100ms, assume user typed — not a scanner
        timerRef.current = setTimeout(() => { bufferRef.current = '' }, 100)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onScan])
}
```

---

## 14. Animations (Framer Motion)

```tsx
// Cart item add animation
<AnimatePresence>
  {items.map(item => (
    <motion.div key={item.id}
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
      <CartItem item={item} />
    </motion.div>
  ))}
</AnimatePresence>

// Page transitions
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
}
<motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
  transition={{ duration: 0.2 }}>
  {children}
</motion.div>
```

---

## 15. Module-by-Module Frontend Tasks

### Phase 1 — Frontend Checklist
**Auth**
- [ ] Login page (PIN numpad + email/password)
- [ ] Session store (Zustand + sessionStorage persist)
- [ ] Protected route guard
- [ ] Permission hook (usePermission)
- [ ] Token refresh logic

**POS Screen**
- [ ] 3-panel layout (catalogue / cart / payment)
- [ ] QuickKeyGrid with configurable buttons + pages
- [ ] Product search bar (debounced, offline fallback)
- [ ] Cart item list (add, remove, qty, notes)
- [ ] Item modifier modal
- [ ] Discount modal (manager PIN flow)
- [ ] Cash payment (tendered input, change display)
- [ ] Card payment (Stripe Terminal UI flow)
- [ ] Receipt modal (print/email/skip)
- [ ] Hold order / recall order
- [ ] F1-F12 keyboard shortcuts
- [ ] Barcode scanner hook (USB HID)
- [ ] Split bill modal (all 4 modes + party payment)

**Table Management**
- [ ] SVG floor plan renderer
- [ ] Table node (all shapes, all status colours)
- [ ] Table click → open order
- [ ] Table status legend
- [ ] Reservation form
- [ ] Waitlist panel
- [ ] Live status via SignalR (useSignalR hook)
- [ ] Floor plan editor (dnd-kit drag-and-drop, manager only)

**Inventory**
- [ ] Product list with DataTable
- [ ] Product form (create/edit + Zod validation)
- [ ] Variant matrix editor
- [ ] Recipe / BOM builder
- [ ] Stock level indicators (RAG colours)
- [ ] Low stock badges
- [ ] Purchase order form + receive stock workflow
- [ ] Stock count sheet

**HR**
- [ ] Time clock kiosk (full-screen PIN numpad)
- [ ] Employee list + form
- [ ] Timesheet view per employee
- [ ] Shift calendar (drag-and-drop dnd-kit)

**Reports**
- [ ] KPI tiles (live, auto-refresh)
- [ ] Sales trend AreaChart
- [ ] Date range picker
- [ ] Store filter
- [ ] Export button (PDF / CSV)

**Shared**
- [ ] Sync status dot (green/amber/red)
- [ ] App sidebar with module nav
- [ ] Toast notifications (Sonner)
- [ ] Confirm dialog (shadcn AlertDialog)
- [ ] DataTable wrapper (TanStack Table)
- [ ] Currency input
- [ ] Empty state component
- [ ] Loading skeletons (shadcn Skeleton)

**Phase 2 — Additional Frontend Tasks**
- [ ] Accounting: P&L chart, journal entry form, AR/AP tables
- [ ] Payroll: review + approve wizard
- [ ] Loyalty: customer profile card, points display, tier badge
- [ ] Promotions builder UI
- [ ] Shift scheduling: full calendar + publish flow
- [ ] KDS screen (full-screen kiosk, order cards, bump)
- [ ] CFD (customer-facing display) screen
- [ ] Helpdesk: ticket list (Kanban), ticket detail + chat thread
- [ ] Project: Kanban board + Gantt chart (D3 or react-gantt)
- [ ] Appointment booking widget (embeddable)
- [ ] WhatsApp inbox (chat UI)
- [ ] Knowledge base: article editor (rich text)
- [ ] Document manager: upload, folder tree, version history
- [ ] Spreadsheet BI: grid editor with live data connections
- [ ] Digital signing: PDF viewer + field placement + signature capture
