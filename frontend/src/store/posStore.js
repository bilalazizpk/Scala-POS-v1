import { create } from 'zustand';

export const usePosStore = create((set, get) => ({
  // Held orders
  heldOrders: [],
  
  // Current selected category
  selectedCategory: 'all',
  
  // Search query
  searchQuery: '',
  
  // Payment modal state
  isPaymentModalOpen: false,
  
  // Hold current order
  holdOrder: (order) => {
    const { heldOrders } = get();
    set({
      heldOrders: [
        ...heldOrders,
        {
          ...order,
          heldAt: new Date().toISOString(),
          id: Date.now(),
        },
      ],
    });
  },

  // Resume held order
  resumeOrder: (orderId) => {
    const { heldOrders } = get();
    const order = heldOrders.find((o) => o.id === orderId);
    if (order) {
      set({
        heldOrders: heldOrders.filter((o) => o.id !== orderId),
      });
      return order;
    }
    return null;
  },

  // Remove held order
  removeHeldOrder: (orderId) => {
    set({
      heldOrders: get().heldOrders.filter((o) => o.id !== orderId),
    });
  },

  // Set selected category
  setSelectedCategory: (category) => {
    set({ selectedCategory: category });
  },

  // Set search query
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  // Toggle payment modal
  togglePaymentModal: () => {
    set({ isPaymentModalOpen: !get().isPaymentModalOpen });
  },

  // Open payment modal
  openPaymentModal: () => {
    set({ isPaymentModalOpen: true });
  },

  // Close payment modal
  closePaymentModal: () => {
    set({ isPaymentModalOpen: false });
  },
}));
