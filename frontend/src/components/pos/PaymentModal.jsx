import React, { useState } from 'react';
import { X, CreditCard, Wallet, Smartphone, DollarSign, Check, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { useCartStore } from '../../store';
import { useCreateOrder } from '../../hooks';

const PaymentModal = ({ isOpen, onClose }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const { items, getTotal, orderType, tableNumber, clearCart, customerInfo } = useCartStore();
  const createOrder = useCreateOrder();

  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  const baseTotal = getTotal();
  const pointsDiscount = pointsToRedeem * 0.01;
  const total = Math.max(0, baseTotal - pointsDiscount);
  const change = cashReceived ? parseFloat(cashReceived) - total : 0;

  // Max points allowed: either all points they have, or enough points to cover the entire order
  const maxRedeemablePoints = customerInfo
    ? Math.min(customerInfo.loyaltyPoints, Math.floor(baseTotal / 0.01))
    : 0;


  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: DollarSign, color: 'bg-green-500' },
    { id: 'card', label: 'Card', icon: CreditCard, color: 'bg-blue-500' },
    { id: 'qr', label: 'QR Code', icon: Smartphone, color: 'bg-purple-500' },
    { id: 'wallet', label: 'E-Wallet', icon: Wallet, color: 'bg-orange-500' },
  ];

  const handlePayment = async () => {
    if (paymentMethod === 'cash' && parseFloat(cashReceived) < total) {
      alert('Insufficient cash received');
      return;
    }

    setProcessing(true);

    try {
      // Create order
      await createOrder.mutateAsync({
        orderNumber: `ORD-${Date.now()}`,
        orderDate: new Date().toISOString(),
        subTotal: useCartStore.getState().getSubtotal(),
        tax: useCartStore.getState().getTax(),
        discount: useCartStore.getState().getDiscountAmount(),
        totalAmount: total,
        orderStatus: 'Completed',
        orderType: orderType,
        tableNumber: tableNumber,
        paymentMethod: paymentMethod,
        paymentStatus: 'paid',
        customerId: customerInfo?.id,
        pointsRedeemed: pointsToRedeem,
        pointsDiscountAmount: pointsDiscount,
        items: items.map(i => ({
          productId: i.id,
          quantity: i.quantity,
          unitPrice: i.price,
          totalPrice: i.subtotal,
          notes: i.notes || ''
        })),
      });

      setSuccess(true);

      // Show success for 2 seconds then close
      setTimeout(() => {
        clearCart();
        setSuccess(false);
        setProcessing(false);
        onClose();
      }, 2000);
    } catch (error) {
      setProcessing(false);
      alert('Payment failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-12 max-w-md text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">Order completed</p>
          {customerInfo && (
            <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
              <p><strong>{customerInfo.firstName}</strong> earned points for this purchase!</p>
              {pointsToRedeem > 0 && <p className="text-green-600 mt-1">Redeemed {pointsToRedeem} points (-${pointsDiscount.toFixed(2)})</p>}
            </div>
          )}
          {paymentMethod === 'cash' && change > 0 && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Change to return</p>
              <p className="text-2xl font-bold text-green-600">${change.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Loyalty Program */}
          {customerInfo && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    Loyalty Program
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Available: {customerInfo.loyaltyPoints} Points
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Value</p>
                  <p className="text-lg font-bold text-green-600">${(customerInfo.loyaltyPoints * 0.01).toFixed(2)}</p>
                </div>
              </div>

              {maxRedeemablePoints > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium text-gray-700">
                    <span>Redeem Points</span>
                    <span>{pointsToRedeem} pts (-${pointsDiscount.toFixed(2)})</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={maxRedeemablePoints}
                    step="10"
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0</span>
                    <span>{maxRedeemablePoints} (Max)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Items ({items.length})</span>
                <span className="font-medium">${useCartStore.getState().getSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (10%)</span>
                <span className="font-medium">${useCartStore.getState().getTax().toFixed(2)}</span>
              </div>
              {useCartStore.getState().discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-${useCartStore.getState().getDiscountAmount().toFixed(2)}</span>
                </div>
              )}
              {pointsToRedeem > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Loyalty Discount</span>
                  <span>-${pointsDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-lg">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-blue-600">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Select Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;

                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className={`${method.color} p-3 rounded-full`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-medium text-gray-900">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cash Received
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 50, 100].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCashReceived(amount.toString())}
                    className="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              {/* Change Calculation */}
              {cashReceived && parseFloat(cashReceived) >= total && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-green-800 font-medium">Change to Return</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${change.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {cashReceived && parseFloat(cashReceived) < total && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <span className="text-red-600 text-sm font-medium">
                    Insufficient amount. Need ${(total - parseFloat(cashReceived)).toFixed(2)} more
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Card/Digital Payment Info */}
          {paymentMethod !== 'cash' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm text-center">
                {paymentMethod === 'card' && 'Please insert or tap card on the terminal'}
                {paymentMethod === 'qr' && 'Show QR code to customer to scan'}
                {paymentMethod === 'wallet' && 'Customer will pay via e-wallet app'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={processing || (paymentMethod === 'cash' && parseFloat(cashReceived) < total)}
          >
            {processing ? 'Processing...' : `Complete Payment - $${total.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
