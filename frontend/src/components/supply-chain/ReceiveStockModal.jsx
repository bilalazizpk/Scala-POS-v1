import React, { useState, useEffect } from 'react';
import { X, PackageOpen } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { purchaseOrderService } from '../../services/api';

const ReceiveStockModal = ({ po, isOpen, onClose, onSuccess }) => {
    const [receiveLines, setReceiveLines] = useState({});

    useEffect(() => {
        if (po && isOpen) {
            // Init state with 0 received for what's remaining
            const initial = {};
            po.lines.forEach(line => {
                const remaining = line.quantityOrdered - line.quantityReceived;
                initial[line.id] = remaining > 0 ? remaining : 0;
            });
            setReceiveLines(initial);
        }
    }, [po, isOpen]);

    const receiveMutation = useMutation({
        mutationFn: (data) => purchaseOrderService.receive(po.id, data),
        onSuccess: () => {
            onSuccess();
        }
    });

    if (!isOpen || !po) return null;

    const handleUpdate = (id, value) => {
        setReceiveLines(prev => ({
            ...prev,
            [id]: Math.max(0, parseInt(value, 10) || 0)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            receivedLines: Object.entries(receiveLines).map(([id, qty]) => ({
                purchaseOrderLineId: parseInt(id, 10),
                quantityReceived: qty
            })).filter(l => l.quantityReceived > 0)
        };

        if (payload.receivedLines.length === 0) return;

        receiveMutation.mutate(payload);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <PackageOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Receive Stock</h2>
                            <p className="text-sm text-gray-500">Record incoming stock for {po.poNumber}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Item</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Ordered</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Previously Received</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Receive Now</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {po.lines.map(line => {
                                    const remaining = line.quantityOrdered - line.quantityReceived;
                                    return (
                                        <tr key={line.id} className="bg-white">
                                            <td className="px-4 py-4">
                                                <span className="font-medium text-gray-900">{line.itemName}</span>
                                                <span className="text-xs text-gray-500 ml-2">({line.unit})</span>
                                            </td>
                                            <td className="px-4 py-4 text-right font-medium text-gray-600">
                                                {line.quantityOrdered}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                    {line.quantityReceived}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 w-32">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={remaining}
                                                    value={receiveLines[line.id] ?? 0}
                                                    onChange={(e) => handleUpdate(line.id, e.target.value)}
                                                    disabled={remaining <= 0}
                                                    className="w-full px-3 py-1.5 text-right border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-400"
                                                />
                                                {remaining > 0 && <div className="text-[10px] text-gray-400 text-right mt-1">Max: {remaining}</div>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={receiveMutation.isPending}
                        className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {receiveMutation.isPending ? 'Saving...' : 'Confirm Receipt'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ReceiveStockModal;
