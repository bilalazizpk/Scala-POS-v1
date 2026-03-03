import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  Archive,
  Users,
  ChefHat,
  BarChart2,
  UserCog,
  Settings,
  LayoutGrid,
  CalendarDays,
  Shield,
  Headphones,
  Truck,
  FolderKanban,
  FileText,
  MessageCircle,
  CloudCog
} from 'lucide-react';

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "POS", icon: ShoppingCart, href: "/dashboard/pos" },
  { label: "Products", icon: Package, href: "/dashboard/products" },
  { label: "Orders", icon: ClipboardList, href: "/dashboard/orders" },
  { label: "Inventory", icon: Archive, href: "/dashboard/inventory" },
  { label: "Customers", icon: Users, href: "/dashboard/customers" },
  { label: "Kitchen", icon: ChefHat, href: "/dashboard/kitchen" },
  { label: "Tables", icon: LayoutGrid, href: "/dashboard/tables" },
  { label: "Analytics", icon: BarChart2, href: "/dashboard/analytics" },
  { label: "HR", icon: UserCog, href: "/dashboard/hr" },
  { label: "Accounting", icon: ClipboardList, href: "/dashboard/accounting" },
  { label: "Appointments", icon: CalendarDays, href: "/dashboard/appointments" },
  { label: "Security", icon: Shield, href: "/dashboard/security" },
  { label: "Helpdesk", icon: Headphones, href: "/dashboard/helpdesk" },
  { label: "Supply Chain", icon: Truck, href: "/dashboard/supplychain" },
  { label: "Projects", icon: FolderKanban, href: "/dashboard/projects" },
  { label: "Documents", icon: FileText, href: "/dashboard/documents" },
  { label: "WhatsApp", icon: MessageCircle, href: "/dashboard/whatsapp" },
  { label: "Analytics", icon: BarChart2, href: "/dashboard/analytics" },
  { label: "Offline Sync", icon: CloudCog, href: "/dashboard/sync" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

const Sidebar = ({ onItemClick }) => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white w-64">
      {/* Branding */}
      <div className="p-6">
        <h1 className="text-xl font-bold">Scala POS</h1>
        <p className="text-slate-400 text-xs mt-1">Point of Sale</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 transition-colors",
                isActive
                  ? "bg-blue-600 rounded-md text-white"
                  : "text-slate-300 hover:bg-slate-700 rounded-md"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        <p>© 2025 Scala POS</p>
      </div>
    </div>
  );
};

export default Sidebar;
