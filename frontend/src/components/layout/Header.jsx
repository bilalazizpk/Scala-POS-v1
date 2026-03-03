import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { LogOut, Bell, User } from 'lucide-react';
import { Button } from '../ui/Button';

const Header = () => {
  const navigate = useNavigate();
  const { user, role, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white border-b h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Welcome back, {user?.username || 'User'}</h2>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full capitalize">
          {role}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-100 rounded-lg relative">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <User className="w-5 h-5 text-gray-600" />
        </button>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </header>
  );
};

export default Header;
