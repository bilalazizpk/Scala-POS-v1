import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services/api';
import { useAIAnalyticsInsights } from '../../hooks';
import { BarChart2, TrendingUp, TrendingDown, Package, ShoppingCart, DollarSign, AlertTriangle, Download, RefreshCw, Sparkles, Send } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtMoney = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNum = (n) => Number(n || 0).toLocaleString();
const fmtPct = (n) => `${n > 0 ? '+' : ''}${Number(n || 0).toFixed(1)}%`;

const DAYS_OPTIONS = [7, 14, 30, 60, 90];

// Mini SVG sparkline (no library required)
const Sparkline = ({ data, width = 200, height = 48, color = '#6366f1' }) => {
    if (!data?.length) return null;
    const vals = data.map(d => d.revenue || 0);
    const max = Math.max(...vals, 1);
    const pts = vals
        .map((v, i) => `${(i / (vals.length - 1)) * width},${height - (v / max) * height}`)
        .join(' ');
    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
            <polyline points={`0,${height} ${pts} ${width},${height}`} fill={color} fillOpacity="0.12" stroke="none" />
        </svg>
    );
};

// Simple horizontal bar chart for categories/products
const HBar = ({ items = [], valueKey = 'revenue', labelKey = 'name', color = '#6366f1', fmtValue = fmtMoney }) => {
    if (!items || items.length === 0) {
        return <div className="text-gray-400 text-sm py-4 italic text-center">No data available for this period.</div>;
    }
    const max = Math.max(...items.map(i => i[valueKey] || 0), 1);
    return (
        <div className="space-y-2">
            {items.slice(0, 8).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                    <span className="w-36 text-xs text-gray-600 truncate shrink-0">{item[labelKey] || 'Unknown'}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div className="h-2.5 rounded-full transition-all"
                            style={{ width: `${((item[valueKey] || 0) / max) * 100}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 shrink-0 w-20 text-right">{fmtValue(item[valueKey])}</span>
                </div>
            ))}
        </div>
    );
};

// CSV export utility
const exportCSV = (rows, filename) => {
    if (!rows?.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    a.click(); URL.revokeObjectURL(url);
};

// KPI card
const KPICard = ({ title, value, change, icon: Icon, color = 'indigo', prefix = '' }) => {
    const up = change >= 0;
    return (
        <div className="bg-white border rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <div className={`p-2 rounded-xl bg-${color}-100`}><Icon className={`w-4 h-4 text-${color}-600`} /></div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{prefix}{value}</p>
            {change !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
                    {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {fmtPct(change)} vs previous period
                </div>
            )}
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const SpreadsheetBIPage = () => {
    const [days, setDays] = useState(30);
    const [tab, setTab] = useState('overview'); // overview | products | categories | payments | table

    // AI State
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const askAI = useAIAnalyticsInsights();

    const opts = { queryKey: ['analytics', days], staleTime: 30000 };

    const { data: kpis, isLoading: kpiLoading, refetch: refetchKPIs } = useQuery({
        ...opts, queryKey: ['analytics-kpi', days],
        queryFn: async () => (await analyticsService.getKPIs(days)).data
    });
    const { data: salesByDay = [] } = useQuery({
        ...opts, queryKey: ['analytics-sales', days],
        queryFn: async () => (await analyticsService.getSalesByDay(days)).data
    });
    const { data: topProducts = [] } = useQuery({
        ...opts, queryKey: ['analytics-products', days],
        queryFn: async () => (await analyticsService.getTopProducts(days, 10)).data
    });
    const { data: byCategory = [] } = useQuery({
        ...opts, queryKey: ['analytics-category', days],
        queryFn: async () => (await analyticsService.getRevenueByCategory(days)).data
    });
    const { data: byPayment = [] } = useQuery({
        ...opts, queryKey: ['analytics-payment', days],
        queryFn: async () => (await analyticsService.getRevenueByPayment(days)).data
    });
    const { data: ordersTable = [] } = useQuery({
        ...opts, queryKey: ['analytics-table', days],
        queryFn: async () => (await analyticsService.getOrdersTable(days, 200)).data
    });

    const totalRevFromChart = salesByDay.reduce((s, d) => s + (d.revenue || 0), 0);

    const handleAskAI = async (e) => {
        e.preventDefault();
        if (!aiQuery.trim() || !kpis) return;

        try {
            const res = await askAI.mutateAsync({
                question: aiQuery,
                contextData: kpis // pass current KPI state as context
            });
            setAiResponse(res.data.answer);
            setAiQuery('');
        } catch {
            setAiResponse('Failed to get an answer from AI.');
        }
    };

    return (
        <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><BarChart2 className="w-6 h-6 text-indigo-600" /> Business Intelligence</h1>
                    <p className="text-gray-500 mt-1 text-sm">Powered by live POS data</p>
                </div>
                <div className="flex gap-2 items-center">
                    {/* Days selector */}
                    <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5">
                        {DAYS_OPTIONS.map(d => (
                            <button key={d} onClick={() => setDays(d)}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition ${days === d ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                                {d}d
                            </button>
                        ))}
                    </div>
                    <button onClick={() => refetchKPIs()} className="p-2 border rounded-lg hover:bg-gray-50 transition">
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => exportCSV(ordersTable, `orders-${days}d.csv`)}
                        className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            {kpiLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard title="Total Revenue" value={fmtMoney(kpis?.revenue)} change={kpis?.revenueChange} icon={DollarSign} color="indigo" />
                    <KPICard title="Total Orders" value={fmtNum(kpis?.orders)} icon={ShoppingCart} color="blue" />
                    <KPICard title="Avg Order Value" value={fmtMoney(kpis?.avgOrderValue)} icon={TrendingUp} color="green" />
                    <KPICard title="Inventory Value" value={fmtMoney(kpis?.inventoryValue)} icon={Package} color="orange" />
                </div>
            )}

            {/* Low stock banner */}
            {kpis?.lowStockItems > 0 && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span><strong>{kpis.lowStockItems} items</strong> are at or below reorder level — check Supply Chain.</span>
                </div>
            )}

            {/* AI Assistant Box */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-indigo-100 rounded-lg shrink-0">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 space-y-3">
                        <div>
                            <h3 className="font-bold text-indigo-900">Ask Business AI</h3>
                            <p className="text-sm text-indigo-700">Chat with your data. Ask about trends, anomalies, or product performance.</p>
                        </div>

                        {aiResponse && (
                            <div className="bg-white/80 rounded-xl p-4 text-sm text-gray-800 leading-relaxed shadow-sm border border-indigo-50">
                                {aiResponse}
                            </div>
                        )}

                        <form onSubmit={handleAskAI} className="flex gap-2 relative">
                            <input
                                type="text"
                                value={aiQuery}
                                onChange={e => setAiQuery(e.target.value)}
                                placeholder="e.g., Why is my revenue down this week?"
                                className="flex-1 border-indigo-200 rounded-lg pl-4 pr-12 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                disabled={askAI.isPending}
                            />
                            <button
                                type="submit"
                                disabled={askAI.isPending || !aiQuery.trim()}
                                className="absolute right-2 top-1.5 p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Sparkline revenue chart */}
            <div className="bg-white border rounded-2xl p-5">
                <div className="flex justify-between items-baseline mb-4">
                    <div>
                        <h2 className="font-bold text-gray-900">Revenue Trend</h2>
                        <p className="text-xs text-gray-400">Last {days} days · {fmtMoney(totalRevFromChart)} total</p>
                    </div>
                </div>
                <div className="w-full overflow-x-auto">
                    <Sparkline data={salesByDay} width={700} height={80} color="#6366f1" />
                </div>
                {/* X axis labels — first, mid, last */}
                {salesByDay.length > 0 && (
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{salesByDay[0]?.date}</span>
                        <span>{salesByDay[Math.floor(salesByDay.length / 2)]?.date}</span>
                        <span>{salesByDay[salesByDay.length - 1]?.date}</span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5 w-max">
                {[['overview', 'Overview'], ['products', 'Top Products'], ['categories', 'By Category'], ['payments', 'By Payment'], ['table', 'Order Table']].map(([id, label]) => (
                    <button key={id} onClick={() => setTab(id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${tab === id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{label}</button>
                ))}
            </div>

            {/* Tab content */}
            {tab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white border rounded-2xl p-5">
                        <h3 className="font-bold text-gray-800 mb-4">Top Products by Revenue</h3>
                        <HBar items={topProducts} valueKey="revenue" labelKey="name" color="#6366f1" />
                    </div>
                    <div className="bg-white border rounded-2xl p-5">
                        <h3 className="font-bold text-gray-800 mb-4">Revenue by Category</h3>
                        <HBar items={byCategory} valueKey="revenue" labelKey="category" color="#10b981" />
                    </div>
                </div>
            )}

            {tab === 'products' && (
                <div className="bg-white border rounded-2xl p-5">
                    <h3 className="font-bold text-gray-800 mb-4">Top Products — last {days} days</h3>
                    <table className="w-full text-sm">
                        <thead className="border-b text-xs text-gray-500"><tr><th className="pb-2 text-left">Product</th><th className="pb-2 text-right">Qty Sold</th><th className="pb-2 text-right">Revenue</th></tr></thead>
                        <tbody className="divide-y">
                            {topProducts.map((p, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="py-2 font-medium text-gray-900">{p.name}</td>
                                    <td className="py-2 text-right text-gray-600">{fmtNum(p.quantitySold)}</td>
                                    <td className="py-2 text-right font-semibold text-gray-900">{fmtMoney(p.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button onClick={() => exportCSV(topProducts, `top-products-${days}d.csv`)} className="mt-3 text-xs text-indigo-600 font-medium flex items-center gap-1 hover:underline">
                        <Download className="w-3 h-3" /> Export CSV
                    </button>
                </div>
            )}

            {tab === 'categories' && (
                <div className="bg-white border rounded-2xl p-5">
                    <h3 className="font-bold text-gray-800 mb-4">Revenue by Category — last {days} days</h3>
                    <HBar items={byCategory} valueKey="revenue" labelKey="category" color="#10b981" />
                    <table className="w-full text-sm mt-5">
                        <thead className="border-b text-xs text-gray-500"><tr><th className="pb-2 text-left">Category</th><th className="pb-2 text-right">Qty</th><th className="pb-2 text-right">Revenue</th></tr></thead>
                        <tbody className="divide-y">
                            {byCategory.map((c, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="py-2 font-medium capitalize text-gray-900">{c.category}</td>
                                    <td className="py-2 text-right text-gray-600">{fmtNum(c.quantity)}</td>
                                    <td className="py-2 text-right font-semibold text-gray-900">{fmtMoney(c.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'payments' && (
                <div className="bg-white border rounded-2xl p-5">
                    <h3 className="font-bold text-gray-800 mb-4">Revenue by Payment Method — last {days} days</h3>
                    <HBar items={byPayment} valueKey="revenue" labelKey="method" color="#f59e0b" />
                    <table className="w-full text-sm mt-5">
                        <thead className="border-b text-xs text-gray-500"><tr><th className="pb-2 text-left">Method</th><th className="pb-2 text-right">Orders</th><th className="pb-2 text-right">Revenue</th></tr></thead>
                        <tbody className="divide-y">
                            {byPayment.map((p, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="py-2 font-medium capitalize text-gray-900">{p.method}</td>
                                    <td className="py-2 text-right text-gray-600">{fmtNum(p.count)}</td>
                                    <td className="py-2 text-right font-semibold text-gray-900">{fmtMoney(p.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'table' && (
                <div className="bg-white border rounded-2xl overflow-hidden">
                    <div className="p-4 flex justify-between items-center border-b">
                        <h3 className="font-bold text-gray-800">Orders — last {days} days ({ordersTable.length} rows)</h3>
                        <button onClick={() => exportCSV(ordersTable, `orders-${days}d.csv`)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">
                            <Download className="w-3.5 h-3.5" /> Export CSV
                        </button>
                    </div>
                    <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-50 border-b text-xs text-gray-500 z-10">
                                <tr><th className="p-3 text-left">Order #</th><th className="p-3 text-left">Date</th><th className="p-3 text-left">Type</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Payment</th><th className="p-3 text-left">Staff</th><th className="p-3 text-right">Sub</th><th className="p-3 text-right">Tax</th><th className="p-3 text-right">Discount</th><th className="p-3 text-right font-semibold text-gray-700">Total</th></tr>
                            </thead>
                            <tbody className="divide-y">
                                {ordersTable.map(o => (
                                    <tr key={o.id} className="hover:bg-gray-50">
                                        <td className="p-3 font-mono text-xs text-indigo-600">{o.orderNumber}</td>
                                        <td className="p-3 text-gray-600 text-xs">{o.date}</td>
                                        <td className="p-3 capitalize text-xs">{o.orderType}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${o.orderStatus === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{o.orderStatus}</span>
                                        </td>
                                        <td className="p-3 capitalize text-xs text-gray-600">{o.paymentMethod}</td>
                                        <td className="p-3 text-xs text-gray-600">{o.staff}</td>
                                        <td className="p-3 text-right text-xs">{fmtMoney(o.subTotal)}</td>
                                        <td className="p-3 text-right text-xs">{fmtMoney(o.tax)}</td>
                                        <td className="p-3 text-right text-xs text-red-500">{o.discount > 0 ? `-${fmtMoney(o.discount)}` : '—'}</td>
                                        <td className="p-3 text-right font-bold text-gray-900">{fmtMoney(o.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpreadsheetBIPage;
