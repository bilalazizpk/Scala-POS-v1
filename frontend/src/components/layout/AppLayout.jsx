import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Sheet, SheetContent, SheetHeader, SheetClose } from '../ui/Sheet';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store';
import { Button } from '../ui/Button';

const AppLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar (lg+) */}
      <aside className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 border-none bg-slate-900 w-64">
          <SheetHeader className="p-0">
            <SheetClose onOpenChange={setIsMobileMenuOpen} />
          </SheetHeader>
          <Sidebar onItemClick={closeMobileMenu} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Hamburger Button (Mobile Only) */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-md transition-colors text-slate-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4">
              <h2 className="text-lg font-semibold text-gray-900 leading-tight">
                Welcome back, {user?.username || 'Admin'}
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full capitalize w-fit">
                {role || 'Cashier'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            {/* Notification Bell */}
            <button className="p-2 hover:bg-gray-100 rounded-full relative text-gray-500 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* User Profile Icon */}
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
              <User className="w-5 h-5" />
            </button>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2 border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
            
            {/* Logout Button (Mobile Icon Only) */}
            <button 
              onClick={handleLogout}
              className="sm:hidden p-2 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-full"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
