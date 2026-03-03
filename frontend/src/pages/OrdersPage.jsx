import React from 'react';
import { useOrders, useCreateOrder, useDeleteOrder, useTotalSales } from '../hooks';
import Button from '../components/ui/Button.jsx';

const OrdersPage = () => {
  const { data: orders = [], isLoading, error } = useOrders();
  const { data: salesData } = useTotalSales();
  const createOrder = useCreateOrder();
  const deleteOrder = useDeleteOrder();

  const totalSales = salesData?.totalSales || 0;

  const handleCreateOrder = async () => {
    try {
      await createOrder.mutateAsync({
        orderDate: new Date().toISOString(),
        totalAmount: 0,
        orderStatus: 'Pending'
      });
    } catch (err) {
      console.error('Failed to create order', err);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await deleteOrder.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete order', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Orders</h2>
        <Button onClick={handleCreateOrder}>Create Order</Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-sm text-gray-600">Total Sales</p>
        <p className="text-2xl font-bold text-blue-600">${totalSales.toFixed(2)}</p>
      </div>

      {error && <div className="bg-red-100 text-red-800 p-4 rounded">{error.message}</div>}

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4">{order.id}</td>
                  <td className="px-6 py-4">{new Date(order.orderDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">${order.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded text-sm bg-yellow-100 text-yellow-800">
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
