import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Package, Calendar } from 'lucide-react';
import { useOrders, useTotalSales, useProducts } from '../../hooks';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const StatCard = ({ title, value, sub, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

const DATE_RANGES = [
  { label: 'Today', days: 0 },
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: 'All Time', days: 9999 },
];

const AnalyticsPage = () => {
  const [rangeDays, setRangeDays] = useState(7);
  const { data: orders = [], isLoading: loadingOrders } = useOrders();
  const { data: totalSalesData, isLoading: loadingSales } = useTotalSales();
  const { data: products = [] } = useProducts();

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (rangeDays === 9999) return orders;
    const cutoff = new Date();
    if (rangeDays === 0) cutoff.setHours(0, 0, 0, 0);
    else cutoff.setDate(cutoff.getDate() - rangeDays);
    return orders.filter(o => new Date(o.orderDate) >= cutoff);
  }, [orders, rangeDays]);

  // — Hourly Sales (bar chart) —
  const hourlySales = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({
      hour: `${h.toString().padStart(2, '0')}:00`,
      sales: 0, orders: 0,
    }));
    filteredOrders.forEach(o => {
      const h = new Date(o.orderDate).getHours();
      hours[h].sales += o.totalAmount || 0;
      hours[h].orders += 1;
    });
    // Only return hours that have data or are typical business hours (7-22)
    return hours.filter((h, i) => i >= 7 && i <= 22);
  }, [filteredOrders]);

  // — Daily Sales (line chart) —
  const dailySales = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      const d = new Date(o.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!map[d]) map[d] = { date: d, sales: 0, orders: 0 };
      map[d].sales += o.totalAmount || 0;
      map[d].orders += 1;
    });
    return Object.values(map).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14);
  }, [filteredOrders]);

  // — Order Type breakdown (pie) —
  const orderTypeData = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      const t = o.orderType || 'unknown';
      map[t] = (map[t] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  // — Top Products —
  const topProducts = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      o.orderItems?.forEach(item => {
        const name = item.product?.name || `Product #${item.productId}`;
        if (!map[name]) map[name] = { name, qty: 0, revenue: 0 };
        map[name].qty += item.quantity;
        map[name].revenue += item.totalPrice || (item.unitPrice * item.quantity);
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredOrders]);

  // — Payment method breakdown —
  const paymentData = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      const m = o.paymentMethod || 'unknown';
      map[m] = (map[m] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [filteredOrders]);

  const totalRevenue = filteredOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const avgOrder = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-500 mt-1">Real-time data from your orders</p>
        </div>
        <div className="flex gap-2">
          {DATE_RANGES.map(r => (
            <button key={r.days} onClick={() => setRangeDays(r.days)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${rangeDays === r.days ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Revenue" value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign} color="bg-blue-500" sub={`${filteredOrders.length} orders`} />
        <StatCard title="Orders" value={filteredOrders.length.toString()}
          icon={ShoppingCart} color="bg-green-500" sub={`Avg $${avgOrder.toFixed(2)}`} />
        <StatCard title="Active Products" value={products.filter(p => p.isActive).length.toString()}
          icon={Package} color="bg-purple-500" sub={`${products.length} total`} />
        <StatCard title="All-Time Revenue" value={`$${(totalSalesData?.totalSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp} color="bg-orange-500" sub="Since launch" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Hourly Sales Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" /> Hourly Sales (Business Hours)
          </h2>
          {loadingOrders ? (
            <div className="h-52 bg-gray-100 animate-pulse rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourlySales} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Sales']} />
                <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Daily Trend Line Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" /> Revenue Trend
          </h2>
          {dailySales.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
              No order data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailySales} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`$${parseFloat(v).toFixed(2)}`, 'Revenue']} />
                <Line type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top Products table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No sales data for this period</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => {
                const maxRev = topProducts[0]?.revenue || 1;
                const pct = Math.round((p.revenue / maxRev) * 100);
                return (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="w-5 text-sm text-gray-400 font-medium text-right">#{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{p.name}</span>
                        <span className="text-sm text-gray-500">{p.qty} sold · <span className="font-semibold text-gray-900">${p.revenue.toFixed(2)}</span></span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Type Pie */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Order Types</h2>
          {orderTypeData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No data</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={orderTypeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {orderTypeData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {orderTypeData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="capitalize text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment methods */}
      {paymentData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Payment Methods</h2>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={paymentData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
