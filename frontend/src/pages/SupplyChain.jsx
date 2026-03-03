import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, PackageOpen, Eye, Clock, Download, CheckCircle, Package } from 'lucide-react';
import { purchaseOrderService } from '../services/api';
import NewPurchaseOrderModal from '../components/supply-chain/NewPurchaseOrderModal';
import ReceiveStockModal from '../components/supply-chain/ReceiveStockModal';
import { format } from 'date-fns';

const StatusBadge = ({ status }) => {
    const styles = {
        'draft': 'bg-gray-100 text-gray-800',
        'sent': 'bg-blue-100 text-blue-800',
        'partially-received': 'bg-amber-100 text-amber-800',
        'received': 'bg-emerald-100 text-emerald-800',
        'cancelled': 'bg-red-100 text-red-800',
    };

    const icons = {
        'draft': <Clock className="w-3 h-3 mr-1" />,
        'sent': <Package className="w-3 h-3 mr-1" />,
        'partially-received': <PackageOpen className="w-3 h-3 mr-1" />,
        'received': <CheckCircle className="w-3 h-3 mr-1" />
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${styles[status] || styles['draft']}`}>
            {icons[status] || null}
            {status.replace('-', ' ')}
        </span>
    );
};

const SupplyChain = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);

    // Modal tracking
    const [receivingPo, setReceivingPo] = useState(null);

    const { data: pos = [], isLoading, refetch } = useQuery({
        queryKey: ['purchaseOrders'],
        queryFn: async () => {
            const { data } = await purchaseOrderService.getAll();
            return data;
        }
    });

    const filteredPOs = pos.filter(po => {
        const matchesSearch = po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            po.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || po.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
                    <p className="text-sm text-gray-500">Manage supplier orders and receive stock</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button
                        onClick={() => setIsNewModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        New P.O.
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by PO Number or Supplier..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white min-w-[150px]"
                >
                    <option value="all">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="partially-received">Partially Received</option>
                    <option value="received">Received</option>
                </select>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">PO Number</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date / Expected</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading purchase orders...</td>
                                </tr>
                            ) : filteredPOs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        <PackageOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        No purchase orders found
                                    </td>
                                </tr>
                            ) : (
                                filteredPOs.map((po) => (
                                    <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-semibold text-gray-900">{po.poNumber}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{po.supplier?.name || 'Unknown Supplier'}</div>
                                            <div className="text-sm text-gray-500">{po.lines?.length || 0} items</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900">{format(new Date(po.orderDate), 'MMM d, yyyy')}</div>
                                            <div className="text-sm text-gray-500">Exp: {po.expectedDate ? format(new Date(po.expectedDate), 'MMM d, yyyy') : '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-medium text-gray-900">${po.total.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={po.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {(po.status === 'sent' || po.status === 'partially-received') && (
                                                    <button
                                                        onClick={() => setReceivingPo(po)}
                                                        className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                                                    >
                                                        Receive
                                                    </button>
                                                )}
                                                <button className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <NewPurchaseOrderModal
                isOpen={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                onSuccess={() => {
                    setIsNewModalOpen(false);
                    refetch();
                }}
            />

            <ReceiveStockModal
                po={receivingPo}
                isOpen={!!receivingPo}
                onClose={() => setReceivingPo(null)}
                onSuccess={() => {
                    setReceivingPo(null);
                    refetch();
                }}
            />
        </div>
    );
};

export default SupplyChain;
