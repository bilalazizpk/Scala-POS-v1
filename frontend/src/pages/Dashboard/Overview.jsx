import React, { useMemo } from 'react';
import { DollarSign, ShoppingCart, Users, TrendingUp, Package } from 'lucide-react';
import { useOrders, useTotalSales, useProducts } from '../../hooks';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, trend, color, isLoading }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        {isLoading ? (
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        )}
        {trend && (
          <p className="text-sm text-green-600 mt-2 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const Overview = () => {
  const { data: totalSalesData, isLoading: isSalesLoading } = useTotalSales();
  const { data: orders = [], isLoading: isOrdersLoading } = useOrders();
  const { data: products = [], isLoading: isProductsLoading } = useProducts();

  // Calculate daily stats
  const today = new Date().setHours(0, 0, 0, 0);
  const todaysOrders = useMemo(() =>
    orders.filter(order => new Date(order.orderDate).setHours(0, 0, 0, 0) === today),
    [orders, today]
  );

  const topSellingItems = useMemo(() => {
    const itemMap = {};
    orders.forEach(order => {
      order.orderItems?.forEach(item => {
        if (!itemMap[item.product?.name]) {
          itemMap[item.product?.name] = { count: 0, price: item.unitPrice };
        }
        itemMap[item.product?.name].count += item.quantity;
      });
    });
    return Object.entries(itemMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);
  }, [orders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales"
          value={`$${totalSalesData?.totalSales?.toLocaleString() || '0.00'}`}
          icon={DollarSign}
          isLoading={isSalesLoading}
          color="bg-blue-500"
        />
        <StatCard
          title="Orders Today"
          value={todaysOrders.length.toString()}
          icon={ShoppingCart}
          isLoading={isOrdersLoading}
          color="bg-green-500"
        />
        <StatCard
          title="Active Products"
          value={products.filter(p => p.isActive).length.toString()}
          icon={Package}
          isLoading={isProductsLoading}
          color="bg-purple-500"
        />
        <StatCard
          title="Avg Order Value"
          value={`$${orders.length > 0 ? (totalSalesData?.totalSales / orders.length).toFixed(2) : '0.00'}`}
          icon={TrendingUp}
          isLoading={isSalesLoading || isOrdersLoading}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {isOrdersLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded"></div>)
            ) : orders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No orders found.</p>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium text-gray-900">Order #{order.orderNumber || order.id}</p>
                    <p className="text-sm text-gray-600">{format(new Date(order.orderDate), 'MMM dd, HH:mm')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${order.totalAmount?.toFixed(2)}</p>
                    <p className={`text-sm ${order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-600'}`}>
                      {order.paymentStatus || 'Pending'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h2>
          <div className="space-y-3">
            {isOrdersLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded"></div>)
            ) : topSellingItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No sales data yet.</p>
            ) : (
              topSellingItems.map(([name, data], i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium text-gray-900">{name}</p>
                    <p className="text-sm text-gray-600">{data.count} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${(data.price * data.count).toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
