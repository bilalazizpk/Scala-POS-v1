import React, { useState, useMemo } from 'react';
import { X, Plus, Search, Trash2, Package } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { purchaseOrderService } from '../../services/api';
import api from '../../services/api';

const NewPurchaseOrderModal = ({ isOpen, onClose, onSuccess }) => {
    const [supplierId, setSupplierId] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // We reuse api.get direct calls to fetch necessary lookup data
    const { data: suppliers = [] } = useQuery({
        queryKey: ['po-suppliers'],
        queryFn: async () => {
            const { data } = await api.get('/v1/suppliers');
            return data;
        },
        enabled: isOpen
    });

    const { data: inventory = [] } = useQuery({
        queryKey: ['po-inventory'],
        queryFn: async () => {
            const { data } = await api.get('/v1/inventory');
            return data;
        },
        enabled: isOpen
    });

    const createPoMutation = useMutation({
        mutationFn: purchaseOrderService.create,
        onSuccess: () => {
            reset();
            onSuccess();
        }
    });

    const filteredInventory = useMemo(() => {
        if (!searchTerm) return [];
        return inventory.filter(i =>
            i.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5); // show top 5 matches
    }, [inventory, searchTerm]);

    const reset = () => {
        setSupplierId('');
        setNotes('');
        setLines([]);
        setSearchTerm('');
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const addLine = (item) => {
        if (lines.find(l => l.inventoryItemId === item.id)) return; // already added

        setLines([...lines, {
            inventoryItemId: item.id,
            itemName: item.product?.name || 'Unknown Item',
            unit: item.unit || 'Each',
            quantityOrdered: 1,
            unitCost: item.costPrice || 0
        }]);
        setSearchTerm(''); // clear search
    };

    const removeLine = (id) => {
        setLines(lines.filter(l => l.inventoryItemId !== id));
    };

    const updateLine = (id, field, value) => {
        setLines(lines.map(l => {
            if (l.inventoryItemId === id) {
                return { ...l, [field]: value };
            }
            return l;
        }));
    };

    const subtotal = lines.reduce((sum, l) => sum + (l.quantityOrdered * l.unitCost), 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!supplierId || lines.length === 0) return;

        createPoMutation.mutate({
            supplierId: parseInt(supplierId, 10),
            notes,
            lines: lines.map(l => ({
                inventoryItemId: l.inventoryItemId,
                itemName: l.itemName,
                unit: l.unit,
                quantityOrdered: parseFloat(l.quantityOrdered) || 0,
                unitCost: parseFloat(l.unitCost) || 0
            }))
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Create Purchase Order</h2>
                            <p className="text-sm text-gray-500">Draft a new P.O. to send to a supplier</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                                <select
                                    value={supplierId}
                                    onChange={(e) => setSupplierId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">Select a supplier</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Delivery instructions, references..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h3>

                            {/* Item Search */}
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search inventory to add..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                                />

                                {filteredInventory.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden">
                                        {filteredInventory.map(item => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => addLine(item)}
                                                className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.product?.name}</p>
                                                    <p className="text-sm text-gray-500">SKU: {item.sku} • Stock: {item.currentStock} {item.unit}</p>
                                                </div>
                                                <Plus className="w-4 h-4 text-indigo-600" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Items Table */}
                            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-100 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Item</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Unit Cost ($)</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Line Total</th>
                                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">x</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {lines.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                                    Search above to add items to your purchase order.
                                                </td>
                                            </tr>
                                        ) : (
                                            lines.map(line => (
                                                <tr key={line.inventoryItemId} className="bg-white">
                                                    <td className="px-4 py-3">
                                                        <span className="font-medium text-gray-900">{line.itemName}</span>
                                                        <span className="text-xs text-gray-500 ml-2">({line.unit})</span>
                                                    </td>
                                                    <td className="px-4 py-3 w-32">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={line.quantityOrdered}
                                                            onChange={(e) => updateLine(line.inventoryItemId, 'quantityOrdered', e.target.value)}
                                                            className="w-full px-2 py-1 text-right border border-gray-300 rounded focus:border-indigo-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 w-32">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={line.unitCost}
                                                            onChange={(e) => updateLine(line.inventoryItemId, 'unitCost', e.target.value)}
                                                            className="w-full px-2 py-1 text-right border border-gray-300 rounded focus:border-indigo-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                                                        ${(line.quantityOrdered * line.unitCost).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeLine(line.inventoryItemId)}
                                                            className="text-red-400 hover:text-red-600 p-1"
                                                        >
                                                            <Trash2 className="w-4 h-4 mx-auto" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex items-center justify-between rounded-b-2xl">
                    <div className="text-lg">
                        <span className="text-gray-500">Subtotal:</span>
                        <span className="font-bold text-gray-900 ml-2">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!supplierId || lines.length === 0 || createPoMutation.isPending}
                            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {createPoMutation.isPending ? 'Saving...' : 'Create Purchase Order'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default NewPurchaseOrderModal;
