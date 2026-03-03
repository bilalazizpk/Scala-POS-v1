import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set) => ({
      // Store info
      storeName: 'Scala POS',
      storeAddress: '',
      storePhone: '',
      storeEmail: '',
      
      // Currency
      currency: 'USD',
      currencySymbol: '$',
      
      // Tax settings
      taxEnabled: true,
      taxRate: 10,
      taxLabel: 'VAT',
      
      // Receipt settings
      receiptHeader: 'Thank you for your purchase!',
      receiptFooter: 'Please come again',
      showLogo: true,
      
      // Printer settings
      printerEnabled: false,
      thermalPrinterPort: 'USB001',
      autoPrint: false,
      
      // Theme
      theme: 'light',
      
      // Update store info
      updateStoreInfo: (info) => {
        set(info);
      },

      // Update tax settings
      updateTaxSettings: (settings) => {
        set(settings);
      },

      // Update receipt settings
      updateReceiptSettings: (settings) => {
        set(settings);
      },

      // Update printer settings
      updatePrinterSettings: (settings) => {
        set(settings);
      },

      // Toggle theme
      toggleTheme: () => {
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' }));
      },
    }),
    {
      name: 'settings-storage',
    }
  )
);
