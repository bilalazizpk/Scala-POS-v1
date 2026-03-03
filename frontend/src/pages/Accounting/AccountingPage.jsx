import React, { useState } from 'react';
import { useChartOfAccounts, useGeneralLedger, useProfitAndLoss } from '../../hooks';
import { BookOpen, DollarSign, TrendingUp, PieChart, Activity, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';

// Utility for formatting currency
const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount || 0);
};

const AccountsTab = () => {
    const { data: accounts, isLoading } = useChartOfAccounts();

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading Chart of Accounts...</div>;

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Chart of Accounts</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="p-3 text-sm font-medium text-gray-500">Code</th>
                            <th className="p-3 text-sm font-medium text-gray-500">Name</th>
                            <th className="p-3 text-sm font-medium text-gray-500">Type</th>
                            <th className="p-3 text-sm font-medium text-gray-500">Sub-Type</th>
                            <th className="p-3 text-sm font-medium text-gray-500 text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {accounts?.map((acc) => (
                            <tr key={acc.id} className="hover:bg-gray-50 transition">
                                <td className="p-3 text-sm font-medium text-blue-600">{acc.code}</td>
                                <td className="p-3 text-sm text-gray-900">{acc.name}</td>
                                <td className="p-3">
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-semibold">
                                        {acc.accountType}
                                    </span>
                                </td>
                                <td className="p-3 text-sm text-gray-600">{acc.subType}</td>
                                <td className={`p-3 text-sm text-right font-semibold ${acc.balance < 0 ? 'text-green-600' : 'text-gray-900'
                                    }`}>
                                    {/* Using Math.abs for display, usually Assets/Expenses carry debit balances (positive here), Revenue/Equity/Liab carry credit (-). */}
                                    {formatMoney(Math.abs(acc.balance))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const LedgerTab = () => {
    const { data: ledger, isLoading, refetch } = useGeneralLedger();

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading General Ledger...</div>;

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">General Ledger</h3>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="flex gap-2 items-center">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
            </div>

            <div className="space-y-6">
                {ledger?.map((entry) => (
                    <div key={entry.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 p-3 border-b flex justify-between items-center text-sm">
                            <div className="flex gap-4">
                                <span className="font-semibold text-gray-900">{new Date(entry.date).toLocaleString()}</span>
                                <span className="text-gray-500">Ref: {entry.reference}</span>
                            </div>
                            <span className="text-gray-600">{entry.description}</span>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-2 pl-4 w-32 font-medium text-gray-500">Account</th>
                                        <th className="p-2 font-medium text-gray-500">Description</th>
                                        <th className="p-2 text-right w-32 font-medium text-gray-500">Debit</th>
                                        <th className="p-2 text-right w-32 font-medium text-gray-500">Credit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {entry.lines?.map((line, i) => (
                                        <tr key={i} className="hover:bg-green-50/30">
                                            <td className="p-2 pl-4 text-blue-600">{line.code}</td>
                                            <td className="p-2 text-gray-700">{line.description}</td>
                                            <td className="p-2 text-right text-gray-900">{line.debit > 0 ? formatMoney(line.debit) : '-'}</td>
                                            <td className="p-2 text-right text-gray-900">{line.credit > 0 ? formatMoney(line.credit) : '-'}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-semibold">
                                        <td colSpan={2} className="p-2 pl-4 text-right text-gray-500">Totals:</td>
                                        <td className="p-2 text-right text-gray-900">{formatMoney(entry.totalDebit)}</td>
                                        <td className="p-2 text-right text-gray-900">{formatMoney(entry.totalCredit)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PnLTab = () => {
    const { data: pnl, isLoading } = useProfitAndLoss();

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading Profit & Loss...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                        <h4 className="text-2xl font-bold text-gray-900">{formatMoney(pnl?.totalRevenue)}</h4>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                        <Activity className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                        <h4 className="text-2xl font-bold text-gray-900">{formatMoney(pnl?.totalExpenses)}</h4>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        <PieChart className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Net Profit</p>
                        <h4 className={`text-2xl font-bold ${pnl?.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatMoney(pnl?.netProfit)}
                        </h4>
                    </div>
                </div>
            </div>
        </div>
    );
};


const AccountingPage = () => {
    const [activeTab, setActiveTab] = useState('ledger');

    const tabs = [
        { id: 'ledger', label: 'General Ledger', icon: BookOpen },
        { id: 'accounts', label: 'Chart of Accounts', icon: Activity },
        { id: 'pnl', label: 'Profit & Loss', icon: DollarSign },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Accounting & Finance</h1>
                    <p className="text-gray-500 mt-1">Double-entry ledger and financial reporting</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="animate-in fade-in duration-300">
                {activeTab === 'ledger' && <LedgerTab />}
                {activeTab === 'accounts' && <AccountsTab />}
                {activeTab === 'pnl' && <PnLTab />}
            </div>
        </div>
    );
};

export default AccountingPage;
