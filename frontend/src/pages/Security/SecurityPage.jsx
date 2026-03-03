import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditService } from '../../services/api';
import { Shield, RefreshCw, AlertTriangle, CheckCircle, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORIES = ['all', 'order', 'payment', 'auth', 'inventory', 'settings', 'user_mgmt'];
const RESULTS = ['all', 'success', 'failure', 'warning'];

const fmtTs = (iso) => new Date(iso).toLocaleString();

const ResultBadge = ({ result }) => {
    const cfg = {
        success: 'bg-green-100 text-green-700',
        failure: 'bg-red-100 text-red-700',
        warning: 'bg-yellow-100 text-yellow-700',
    }[result] || 'bg-gray-100 text-gray-600';
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg}`}>{result}</span>;
};

const CategoryBadge = ({ cat }) => (
    <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 font-medium">{cat}</span>
);

const SecurityPage = () => {
    const [category, setCategory] = useState('all');
    const [result, setResult] = useState('all');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 50;

    const { data: summary } = useQuery({
        queryKey: ['audit-summary'],
        queryFn: async () => (await auditService.getSummary()).data,
        staleTime: 30000,
    });

    const { data: logsData, isLoading, refetch } = useQuery({
        queryKey: ['audit-logs', category, result, page],
        queryFn: async () => (await auditService.getLogs({
            page,
            pageSize: PAGE_SIZE,
            category: category === 'all' ? undefined : category,
            result: result === 'all' ? undefined : result,
        })).data,
        staleTime: 10000,
    });

    const totalPages = logsData ? Math.ceil(logsData.total / PAGE_SIZE) : 1;

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-blue-600" /> Security & Audit Log
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Immutable record of all system events</p>
                </div>
                <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Summary widgets (7-day) */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border rounded-xl p-4">
                        <p className="text-xs text-gray-500 font-medium">Events (7 days)</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{summary.total7Days}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            <p className="text-xs font-medium">Failures</p>
                        </div>
                        <p className="text-3xl font-bold text-red-700 mt-1">{summary.failures}</p>
                    </div>
                    {Object.entries(summary.byCategory || {}).slice(0, 2).map(([cat, count]) => (
                        <div key={cat} className="bg-white border rounded-xl p-4">
                            <p className="text-xs text-gray-500 font-medium capitalize">{cat} events</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{count}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center bg-gray-50 p-3 rounded-xl border">
                <Filter className="w-4 h-4 text-gray-400" />
                <div className="flex gap-1 flex-wrap">
                    <span className="text-xs text-gray-500 font-medium mr-1">Category:</span>
                    {CATEGORIES.map(c => (
                        <button key={c} onClick={() => { setCategory(c); setPage(1); }}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition ${category === c ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-100'}`}>
                            {c}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1 flex-wrap ml-4">
                    <span className="text-xs text-gray-500 font-medium mr-1">Result:</span>
                    {RESULTS.map(r => (
                        <button key={r} onClick={() => { setResult(r); setPage(1); }}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition ${result === r ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-100'}`}>
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Audit log table */}
            <div className="bg-white border rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading audit logs...</div>
                ) : (
                    <>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3 font-medium text-gray-500 w-44">Timestamp</th>
                                    <th className="p-3 font-medium text-gray-500 w-28">Category</th>
                                    <th className="p-3 font-medium text-gray-500 w-40">Action</th>
                                    <th className="p-3 font-medium text-gray-500">Description</th>
                                    <th className="p-3 font-medium text-gray-500 w-24">Entity</th>
                                    <th className="p-3 font-medium text-gray-500 w-24">User</th>
                                    <th className="p-3 font-medium text-gray-500 w-24">Result</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {logsData?.logs?.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-gray-400">No audit events match your filters.</td></tr>
                                ) : (
                                    logsData?.logs?.map(log => (
                                        <tr key={log.id} className={`hover:bg-gray-50 transition ${log.result === 'failure' ? 'bg-red-50/30' : ''}`}>
                                            <td className="p-3 text-xs text-gray-500 whitespace-nowrap">{fmtTs(log.timestamp)}</td>
                                            <td className="p-3"><CategoryBadge cat={log.category} /></td>
                                            <td className="p-3 font-mono text-xs text-gray-700">{log.action}</td>
                                            <td className="p-3 text-gray-700">{log.description}</td>
                                            <td className="p-3 text-xs text-gray-500">
                                                {log.entityType && <span className="font-medium">{log.entityType}</span>}
                                                {log.entityId && <span className="text-gray-400"> #{log.entityId}</span>}
                                            </td>
                                            <td className="p-3 text-xs text-gray-600">{log.userName || log.userId}</td>
                                            <td className="p-3"><ResultBadge result={log.result} /></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
                            <span className="text-gray-500">
                                {logsData?.total} total events
                            </span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className="p-1.5 border rounded hover:bg-gray-100 disabled:opacity-40">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-gray-600">Page {page} of {totalPages}</span>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                                    className="p-1.5 border rounded hover:bg-gray-100 disabled:opacity-40">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SecurityPage;
