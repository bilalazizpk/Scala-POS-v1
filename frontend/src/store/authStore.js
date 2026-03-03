import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,

      login: (userData) => {
        set({
          user: userData.user,
          token: userData.token,
          role: userData.role,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          role: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },

      hasPermission: (permission) => {
        const { role } = get();
        if (!role) return false;
        
        const permissions = {
          admin: ['pos', 'dashboard', 'menu', 'stock', 'hr', 'operations', 'customers', 'settings'],
          manager: ['pos', 'dashboard', 'menu', 'stock', 'hr', 'operations', 'customers'],
          cashier: ['pos', 'customers_limited'],
          kitchen: ['kds'],
          delivery: ['delivery'],
        };
        
        return permissions[role]?.includes(permission) || false;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
