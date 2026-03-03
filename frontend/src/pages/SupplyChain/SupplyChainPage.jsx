import React, { useState } from 'react';
import { useSuppliers, useCreateSupplier, useDeleteSupplier, usePurchaseOrders, useCreatePO, useUpdatePOStatus } from '../../hooks';
import { Truck, Plus, Package, CheckCircle, Clock, Send, X, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

const STATUS_CFG = {
    draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-600', actions: ['sent', 'cancelled'] },
    sent: { label: 'Sent', bg: 'bg-blue-100', text: 'text-blue-700', actions: ['received', 'cancelled'] },
    'partially-received': { label: 'Partly Received', bg: 'bg-yellow-100', text: 'text-yellow-700', actions: ['received', 'cancelled'] },
    received: { label: 'Received', bg: 'bg-green-100', text: 'text-green-700', actions: [] },
    cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-600', actions: [] },
};

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtMoney = (n) => `$${(n || 0).toFixed(2)}`;

// ── Supplier Form Modal ────────────────────────────────────────────────────────
const SupplierModal = ({ onClose, onCreate }) => {
    const [form, setForm] = useState({ name: '', contactName: '', email: '', phone: '', paymentTerms: 'Net 30', address: '', notes: '' });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const save = async () => {
        if (!form.name) return;
        setSaving(true);
        await onCreate(form);
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="p-5 border-b flex justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Add Supplier</h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-5 space-y-3">
                    {[['name', 'Supplier Name *'], ['contactName', 'Contact Name'], ['email', 'Email'], ['phone', 'Phone'], ['paymentTerms', 'Payment Terms'], ['address', 'Address']].map(([k, lbl]) => (
                        <div key={k}>
                            <label className="text-xs font-medium text-gray-600 block mb-0.5">{lbl}</label>
                            <input value={form[k]} onChange={e => set(k, e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                    ))}
                </div>
                <div className="p-5 border-t flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                    <button onClick={save} disabled={saving || !form.name}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Add Supplier'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Create PO Modal ────────────────────────────────────────────────────────────
const CreatePOModal = ({ suppliers, onClose, onCreate }) => {
    const [supplierId, setSupplierId] = useState('');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState([{ itemName: '', unit: 'each', quantity: 1, unitCost: 0 }]);
    const [saving, setSaving] = useState(false);

    const addLine = () => setLines(l => [...l, { itemName: '', unit: 'each', quantity: 1, unitCost: 0 }]);
    const removeLine = (i) => setLines(l => l.filter((_, idx) => idx !== i));
    const setLine = (i, k, v) => setLines(l => l.map((row, idx) => idx === i ? { ...row, [k]: v } : row));
    const total = lines.reduce((s, l) => s + (parseFloat(l.quantity) || 0) * (parseFloat(l.unitCost) || 0), 0);

    const save = async () => {
        if (!supplierId) return;
        setSaving(true);
        await onCreate({
            supplierId: parseInt(supplierId),
            orderDate: new Date(orderDate).toISOString(),
            expectedDate: expectedDate ? new Date(expectedDate).toISOString() : null,
            notes,
            lines: lines.map(l => ({ itemName: l.itemName, unit: l.unit, quantity: parseFloat(l.quantity) || 0, unitCost: parseFloat(l.unitCost) || 0 }))
        });
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
                <div className="p-5 border-b flex justify-between">
                    <h2 className="text-xl font-bold text-gray-900">New Purchase Order</h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Supplier *</label>
                            <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                                <option value="">Select supplier…</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Order Date</label>
                            <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Expected Delivery</label>
                            <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 block mb-1">Notes</label>
                            <input value={notes} onChange={e => setNotes(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>

                    {/* Lines */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Line Items</label>
                            <button onClick={addLine} className="text-xs text-blue-600 font-medium">+ Add Line</button>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="text-xs text-gray-500 border-b">
                                <tr><th className="pb-1 text-left">Item</th><th className="pb-1 text-center w-16">Unit</th><th className="pb-1 text-center w-16">Qty</th><th className="pb-1 text-center w-20">Cost</th><th className="pb-1 text-right w-20">Total</th><th className="w-8" /></tr>
                            </thead>
                            <tbody className="divide-y">
                                {lines.map((l, i) => (
                                    <tr key={i}>
                                        <td className="py-1 pr-2"><input value={l.itemName} onChange={e => setLine(i, 'itemName', e.target.value)} placeholder="Item name" className="w-full border-0 border-b focus:border-blue-500 text-sm outline-none py-1" /></td>
                                        <td className="py-1 px-1"><input value={l.unit} onChange={e => setLine(i, 'unit', e.target.value)} className="w-14 border rounded px-1 text-xs text-center" /></td>
                                        <td className="py-1 px-1"><input type="number" min="0" value={l.quantity} onChange={e => setLine(i, 'quantity', e.target.value)} className="w-14 border rounded px-1 text-xs text-center" /></td>
                                        <td className="py-1 px-1"><input type="number" min="0" step="0.01" value={l.unitCost} onChange={e => setLine(i, 'unitCost', e.target.value)} className="w-18 border rounded px-1 text-xs text-center" /></td>
                                        <td className="py-1 text-right text-xs font-medium">{fmtMoney((+l.quantity) * (+l.unitCost))}</td>
                                        <td className="py-1 pl-2"><button onClick={() => removeLine(i)} className="text-gray-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="text-right text-sm font-bold text-gray-900 mt-2">Total: {fmtMoney(total * 1.1)}</div>
                    </div>
                </div>
                <div className="p-5 border-t flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                    <button onClick={save} disabled={saving || !supplierId}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                        {saving ? 'Creating...' : 'Create PO'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const SupplyChainPage = () => {
    const [tab, setTab] = useState('pos'); // 'pos' | 'suppliers'
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [showPOModal, setShowPOModal] = useState(false);
    const [expandedPO, setExpandedPO] = useState(null);

    const { data: suppliers = [] } = useSuppliers();
    const { data: purchaseOrders = [], isLoading } = usePurchaseOrders();
    const createSupplier = useCreateSupplier();
    const deleteSupplier = useDeleteSupplier();
    const createPO = useCreatePO();
    const updatePOStatus = useUpdatePOStatus();

    const posByStatus = (status) => purchaseOrders.filter(p => p.status === status).length;

    return (
        <div className="p-6 space-y-5">
            {showSupplierModal && <SupplierModal onClose={() => setShowSupplierModal(false)} onCreate={(d) => createSupplier.mutateAsync(d)} />}
            {showPOModal && <CreatePOModal suppliers={suppliers} onClose={() => setShowPOModal(false)} onCreate={(d) => createPO.mutateAsync(d)} />}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Truck className="w-6 h-6 text-indigo-600" /> Supply Chain</h1>
                    <p className="text-gray-500 mt-1 text-sm">{suppliers.length} suppliers · {purchaseOrders.length} purchase orders</p>
                </div>
                <div className="flex gap-2">
                    {tab === 'suppliers' && (
                        <button onClick={() => setShowSupplierModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                            <Plus className="w-4 h-4" /> Add Supplier
                        </button>
                    )}
                    {tab === 'pos' && (
                        <button onClick={() => setShowPOModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                            <Plus className="w-4 h-4" /> New Purchase Order
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1 w-max gap-1">
                {[['pos', 'Purchase Orders'], ['suppliers', 'Suppliers']].map(([id, label]) => (
                    <button key={id} onClick={() => setTab(id)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === id ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* PO Status Summary */}
            {tab === 'pos' && (
                <div className="flex flex-wrap gap-3">
                    {Object.entries(STATUS_CFG).map(([k, cfg]) => (
                        <div key={k} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}: {posByStatus(k)}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Purchase Orders Tab ── */}
            {tab === 'pos' && (
                <div className="space-y-2">
                    {isLoading ? [...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />) :
                        purchaseOrders.length === 0 ? (
                            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No purchase orders yet</p>
                                <button onClick={() => setShowPOModal(true)} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                                    Create First PO
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white border rounded-2xl overflow-hidden">
                                {purchaseOrders.map(po => {
                                    const cfg = STATUS_CFG[po.status] || STATUS_CFG.draft;
                                    const isExpanded = expandedPO === po.id;
                                    return (
                                        <div key={po.id} className="border-b last:border-0">
                                            <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition cursor-pointer"
                                                onClick={() => setExpandedPO(isExpanded ? null : po.id)}>
                                                <span className="font-mono text-sm font-semibold text-gray-700">{po.poNumber}</span>
                                                <span className="flex-1 text-sm text-gray-600">{po.supplier?.name}</span>
                                                <span className="text-sm text-gray-500">{fmtDate(po.orderDate)}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                                                <span className="text-sm font-bold text-gray-900">{fmtMoney(po.total)}</span>
                                                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                            </div>
                                            {isExpanded && (
                                                <div className="px-4 pb-4 bg-gray-50 border-t">
                                                    <table className="w-full text-sm mt-3">
                                                        <thead className="text-xs text-gray-500"><tr><th className="text-left pb-1">Item</th><th className="text-center pb-1">Unit</th><th className="text-center pb-1">Qty</th><th className="text-right pb-1">Unit Cost</th><th className="text-right pb-1">Total</th></tr></thead>
                                                        <tbody className="divide-y">
                                                            {po.lines?.map(l => (
                                                                <tr key={l.id}><td className="py-1">{l.itemName}</td><td className="text-center py-1 text-gray-500">{l.unit}</td><td className="text-center py-1">{l.quantityOrdered}</td><td className="text-right py-1">{fmtMoney(l.unitCost)}</td><td className="text-right py-1 font-medium">{fmtMoney(l.lineTotal)}</td></tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    <div className="flex gap-2 mt-3 justify-end">
                                                        {cfg.actions.map(next => (
                                                            <button key={next} onClick={() => updatePOStatus.mutate({ id: po.id, status: next })}
                                                                className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 font-medium capitalize flex items-center gap-1">
                                                                {next === 'sent' && <Send className="w-3 h-3" />}
                                                                {next === 'received' && <CheckCircle className="w-3 h-3" />}
                                                                Mark {next}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    }
                </div>
            )}

            {/* ── Suppliers Tab ── */}
            {tab === 'suppliers' && (
                <div className="bg-white border rounded-2xl overflow-hidden">
                    {suppliers.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No suppliers yet</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b"><tr><th className="p-3 text-left font-medium text-gray-500">Name</th><th className="p-3 text-left font-medium text-gray-500">Contact</th><th className="p-3 text-left font-medium text-gray-500">Email</th><th className="p-3 text-left font-medium text-gray-500">Phone</th><th className="p-3 text-left font-medium text-gray-500">Terms</th><th className="p-3 w-12" /></tr></thead>
                            <tbody className="divide-y">
                                {suppliers.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="p-3 font-semibold text-gray-900">{s.name}</td>
                                        <td className="p-3 text-gray-600">{s.contactName || '—'}</td>
                                        <td className="p-3 text-gray-600">{s.email || '—'}</td>
                                        <td className="p-3 text-gray-600">{s.phone || '—'}</td>
                                        <td className="p-3 text-gray-600">{s.paymentTerms || '—'}</td>
                                        <td className="p-3">
                                            <button onClick={() => { if (window.confirm('Delete supplier?')) deleteSupplier.mutate(s.id); }}
                                                className="text-gray-300 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default SupplyChainPage;
