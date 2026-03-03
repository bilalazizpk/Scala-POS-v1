import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  orderType: 'dine-in', // 'dine-in', 'takeaway', 'delivery'
  tableNumber: null,
  customerInfo: null,
  discount: 0,
  discountType: 'percentage', // 'percentage' or 'fixed'

  // Add item to cart
  addItem: (product, quantity = 1, modifiers = []) => {
    const { items } = get();
    const existingItemIndex = items.findIndex(
      (item) => item.id === product.id && JSON.stringify(item.modifiers) === JSON.stringify(modifiers)
    );

    if (existingItemIndex > -1) {
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += quantity;
      set({ items: updatedItems });
    } else {
      set({
        items: [
          ...items,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity,
            modifiers,
            notes: '',
            subtotal: product.price * quantity,
          },
        ],
      });
    }
  },

  // Update item quantity
  updateQuantity: (itemId, quantity) => {
    const { items } = get();
    if (quantity <= 0) {
      set({ items: items.filter((item) => item.id !== itemId) });
    } else {
      set({
        items: items.map((item) =>
          item.id === itemId
            ? { ...item, quantity, subtotal: item.price * quantity }
            : item
        ),
      });
    }
  },

  // Remove item from cart
  removeItem: (itemId) => {
    set({ items: get().items.filter((item) => item.id !== itemId) });
  },

  // Add note to item
  addNote: (itemId, note) => {
    set({
      items: get().items.map((item) =>
        item.id === itemId ? { ...item, notes: note } : item
      ),
    });
  },

  // Set order type
  setOrderType: (type) => {
    set({ orderType: type });
  },

  // Set table number
  setTableNumber: (number) => {
    set({ tableNumber: number });
  },

  // Set customer info
  setCustomerInfo: (info) => {
    set({ customerInfo: info });
  },

  // Set discount
  setDiscount: (amount, type = 'percentage') => {
    set({ discount: amount, discountType: type });
  },

  // Calculate subtotal
  getSubtotal: () => {
    return get().items.reduce((total, item) => total + item.subtotal, 0);
  },

  // Calculate discount amount
  getDiscountAmount: () => {
    const { discount, discountType } = get();
    const subtotal = get().getSubtotal();
    
    if (discountType === 'percentage') {
      return (subtotal * discount) / 100;
    }
    return discount;
  },

  // Calculate tax (assuming 10% tax rate)
  getTax: () => {
    const subtotal = get().getSubtotal();
    const discountAmount = get().getDiscountAmount();
    return (subtotal - discountAmount) * 0.1;
  },

  // Calculate total
  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discountAmount = get().getDiscountAmount();
    const tax = get().getTax();
    return subtotal - discountAmount + tax;
  },

  // Clear cart
  clearCart: () => {
    set({
      items: [],
      orderType: 'dine-in',
      tableNumber: null,
      customerInfo: null,
      discount: 0,
      discountType: 'percentage',
    });
  },
}));
