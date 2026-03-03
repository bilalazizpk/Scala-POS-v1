import React, { useState } from 'react';
import { useCartStore } from '../../store';
import { Trash2, Plus, Minus, ShoppingCart, UserPlus, User, X } from 'lucide-react';
import { Button } from '../ui/Button';
import PaymentModal from './PaymentModal';
import CustomerSelectModal from './CustomerSelectModal';
import SplitBillModal from './SplitBillModal';

const Cart = () => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const {
    items,
    updateQuantity,
    removeItem,
    addNote,
    getSubtotal,
    getTax,
    getTotal,
    clearCart,
    orderType,
    setOrderType,
    customerInfo,
    setCustomerInfo,
  } = useCartStore();

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const handleCheckout = () => {
    if (items.length === 0) return;
    setIsPaymentModalOpen(true);
  };

  return (
    <>
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Current Order
          </h2>
          <div className="flex gap-2 mt-3">
            {['dine-in', 'takeaway', 'delivery'].map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`px-3 py-1 rounded text-sm font-medium transition ${orderType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Selection */}
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          {customerInfo ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{customerInfo.firstName} {customerInfo.lastName}</p>
                  <div className="flex gap-2 text-xs font-medium mt-0.5">
                    <span className="text-blue-600">{customerInfo.membershipTier || 'Member'}</span>
                    <span className="text-green-600">• {customerInfo.loyaltyPoints} Pts</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCustomerInfo(null)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span className="text-sm font-medium">Attach Customer</span>
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="w-16 h-16 mb-3" />
              <p>Cart is empty</p>
              <p className="text-sm">Add items to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={`${item.id}-${index}`} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-blue-600">${item.price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="bg-white border rounded p-1 hover:bg-gray-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="bg-white border rounded p-1 hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <input
                      type="text"
                      placeholder="Add note (e.g., No onions)..."
                      value={item.notes || ''}
                      onChange={(e) => addNote(item.id, e.target.value)}
                      className="w-full text-sm p-1.5 border rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">${getSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (10%)</span>
              <span className="font-medium">${getTax().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-blue-600">${getTotal().toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 border-t space-y-2">
          <Button
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Checkout (${getTotal().toFixed(2)})
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={clearCart}
              disabled={items.length === 0}
              variant="outline"
              className="flex-1"
            >
              Clear
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsSplitModalOpen(true)}
              disabled={items.length === 0}
            >
              Split Bill
            </Button>
          </div>
        </div>
      </div>
      <CustomerSelectModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelect={setCustomerInfo}
      />
      <SplitBillModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
      />
    </>
  );
};

export default Cart;
