import React, { useState, useMemo } from 'react';
import { X, Users, Scissors, Equal, List, Sliders, CreditCard, DollarSign, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCartStore } from '../../store';
import { useCreateOrder } from '../../hooks';

// ─── helpers ────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
    { id: 'cash', label: 'Cash', Icon: DollarSign, color: 'bg-emerald-500 hover:bg-emerald-600' },
    { id: 'card', label: 'Card', Icon: CreditCard, color: 'bg-blue-500   hover:bg-blue-600' },
];

const MODES = [
    { id: 'equal', label: 'Equal Split', desc: 'Divide total equally', Icon: Equal },
    { id: 'byitem', label: 'By Item', desc: 'Assign items per person', Icon: List },
    { id: 'custom', label: 'Custom %', desc: 'Set % per person', Icon: Sliders },
];

// ─── subcomponents ──────────────────────────────────────────────────────────

function PartyBadge({ index, color }) {
    const hue = (index * 67 + 200) % 360;
    return (
        <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold"
            style={{ background: `hsl(${hue},65%,52%)` }}
        >
            P{index + 1}
        </span>
    );
}

// ─── Phase 0: Mode selection & party count ───────────────────────────────────

function PhaseSetup({ mode, setMode, parties, setParties, total, onNext }) {
    return (
        <div className="space-y-6">
            {/* Modes */}
            <div className="grid grid-cols-3 gap-3">
                {MODES.map(({ id, label, desc, Icon }) => (
                    <button
                        key={id}
                        onClick={() => setMode(id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${mode === id
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                            }`}
                    >
                        <Icon className="w-6 h-6" />
                        <span className="font-semibold text-sm">{label}</span>
                        <span className="text-xs text-gray-400">{desc}</span>
                    </button>
                ))}
            </div>

            {/* Party count */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                <span className="font-medium text-gray-700">Number of Parties</span>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setParties(Math.max(2, parties - 1))}
                        className="w-9 h-9 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-2xl font-bold text-gray-900 w-8 text-center">{parties}</span>
                    <button
                        onClick={() => setParties(Math.min(10, parties + 1))}
                        className="w-9 h-9 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex justify-between text-sm text-gray-500">
                <span>Total Bill</span>
                <span className="font-bold text-gray-800 text-lg">${total.toFixed(2)}</span>
            </div>

            <button
                onClick={onNext}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition"
            >
                Confirm Split →
            </button>
        </div>
    );
}

// ─── Phase 1: By-Item assignment ─────────────────────────────────────────────

function PhaseByItem({ items, assignments, setAssignments, parties }) {
    const toggle = (itemId, partyIdx) => {
        setAssignments(prev => ({ ...prev, [itemId]: partyIdx }));
    };

    return (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">${item.price.toFixed(2)} × {item.quantity}</p>
                    </div>
                    <div className="flex gap-1 ml-3">
                        {Array.from({ length: parties }).map((_, idx) => {
                            const hue = (idx * 67 + 200) % 360;
                            const assigned = assignments[item.id] === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => toggle(item.id, idx)}
                                    className={`w-8 h-8 rounded-full text-xs font-bold transition border-2 ${assigned
                                        ? 'text-white border-transparent scale-110'
                                        : 'bg-white border-gray-200 text-gray-400 hover:scale-105'
                                        }`}
                                    style={assigned ? { background: `hsl(${hue},65%,52%)`, borderColor: `hsl(${hue},65%,42%)` } : {}}
                                >
                                    P{idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Phase 1: Custom % sliders ───────────────────────────────────────────────

function PhaseCustom({ percentages, setPercentages, parties, total }) {
    const update = (idx, val) => {
        const next = [...percentages];
        next[idx] = Number(val);
        setPercentages(next);
    };

    const sum = percentages.reduce((a, b) => a + b, 0);
    const remaining = 100 - sum;

    return (
        <div className="space-y-4">
            {Array.from({ length: parties }).map((_, idx) => {
                const hue = (idx * 67 + 200) % 360;
                const amt = (total * percentages[idx]) / 100;
                return (
                    <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="font-semibold" style={{ color: `hsl(${hue},65%,42%)` }}>
                                Party {idx + 1}
                            </span>
                            <span className="text-gray-600">
                                {percentages[idx]}% — <span className="font-bold">${amt.toFixed(2)}</span>
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={percentages[idx]}
                            onChange={e => update(idx, e.target.value)}
                            className="w-full h-2 rounded-full accent-indigo-600"
                        />
                    </div>
                );
            })}
            <p className={`text-center text-sm font-medium ${Math.abs(remaining) > 0.5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {Math.abs(remaining) > 0.5
                    ? `⚠ ${remaining.toFixed(0)}% unallocated`
                    : '✓ 100% allocated'}
            </p>
        </div>
    );
}

// ─── Phase 2: Payment collection ─────────────────────────────────────────────

function PhasePayments({ partyAmounts, payments, onPay, processing }) {
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    const totalBill = partyAmounts.reduce((s, a) => s + a, 0);
    const remaining = Math.max(0, totalBill - totalPaid);

    return (
        <div className="space-y-4">
            {/* Progress bar */}
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Collected</span>
                    <span className="font-bold text-gray-900">${totalPaid.toFixed(2)} / ${totalBill.toFixed(2)}</span>
                </div>
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-500 rounded-full"
                        style={{ width: `${Math.min(100, (totalPaid / totalBill) * 100)}%` }}
                    />
                </div>
                {remaining > 0 && (
                    <p className="text-right text-xs text-gray-400 mt-1">Remaining: ${remaining.toFixed(2)}</p>
                )}
            </div>

            {/* Party cards */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {partyAmounts.map((amt, idx) => {
                    const hue = (idx * 67 + 200) % 360;
                    const payment = payments.find(p => p.partyIndex === idx);

                    return (
                        <div
                            key={idx}
                            className={`rounded-xl border-2 p-4 transition-all ${payment
                                ? 'border-emerald-200 bg-emerald-50'
                                : 'border-gray-200 bg-white'
                                }`}
                        >
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <PartyBadge index={idx} />
                                    <span className="font-semibold text-gray-800">Party {idx + 1}</span>
                                </div>
                                <span className="text-lg font-bold" style={{ color: `hsl(${hue},65%,42%)` }}>
                                    ${amt.toFixed(2)}
                                </span>
                            </div>

                            {payment ? (
                                <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                                    <CheckCircle className="w-4 h-4" />
                                    Paid via {payment.method}
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    {PAYMENT_METHODS.map(({ id, label, Icon, color }) => (
                                        <button
                                            key={id}
                                            onClick={() => onPay(amt, id, idx)}
                                            disabled={processing}
                                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white text-sm font-semibold transition ${color} disabled:opacity-50`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Phase 3: Done ───────────────────────────────────────────────────────────

function PhaseDone({ partyAmounts, payments }) {
    return (
        <div className="text-center space-y-4 py-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Bill Split Complete!</h3>
            <p className="text-gray-500">All parties have paid.</p>

            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mt-4">
                {payments.map((p, i) => (
                    <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                            <PartyBadge index={p.partyIndex} /> Party {p.partyIndex + 1}
                        </span>
                        <span className="font-bold text-gray-800">
                            ${p.amount.toFixed(2)} <span className="text-gray-400 font-normal">({p.method})</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

const SplitBillModal = ({ isOpen, onClose }) => {
    const [phase, setPhase] = useState(0); // 0=setup, 1=assign/sliders, 2=payments, 3=done
    const [mode, setMode] = useState('equal');
    const [parties, setParties] = useState(2);
    const [assignments, setAssignments] = useState({});
    const [percentages, setPercentages] = useState([50, 50]);
    const [createdOrderId, setCreatedOrderId] = useState(null);
    const [payments, setPayments] = useState([]);
    const [processing, setProcessing] = useState(false);

    const { items, getTotal, getSubtotal, getTax, getDiscountAmount, orderType, tableNumber, customerInfo, clearCart } = useCartStore();
    const createOrder = useCreateOrder();

    const total = getTotal();

    // Compute per-party amounts
    const partyAmounts = useMemo(() => {
        if (mode === 'equal') {
            return Array.from({ length: parties }, () => total / parties);
        }
        if (mode === 'byitem') {
            const amounts = Array.from({ length: parties }, () => 0);
            items.forEach(item => {
                const p = assignments[item.id] ?? 0;
                amounts[p] = (amounts[p] || 0) + item.subtotal;
            });
            return amounts;
        }
        if (mode === 'custom') {
            return percentages.slice(0, parties).map(pct => (total * pct) / 100);
        }
        return [];
    }, [mode, parties, total, items, assignments, percentages]);

    // Reset when closing
    const handleClose = () => {
        setPhase(0);
        setMode('equal');
        setParties(2);
        setAssignments({});
        setPercentages([50, 50]);
        setCreatedOrderId(null);
        setPayments([]);
        setProcessing(false);
        onClose();
    };

    // When parties change, re-initialise percentages
    const handleSetParties = (n) => {
        setParties(n);
        const even = Math.floor(100 / n);
        const last = 100 - even * (n - 1);
        setPercentages(Array.from({ length: n }, (_, i) => (i === n - 1 ? last : even)));
    };

    // Phase 0 → next
    const handleSetupNext = () => {
        if (mode === 'equal') {
            setPhase(2); // skip assignment phase
        } else {
            setPhase(1);
        }
    };

    // Phase 1 → next: create order in db
    const handleAssignNext = async () => {
        setProcessing(true);
        try {
            const res = await createOrder.mutateAsync({
                orderNumber: `ORD-${Date.now()}`,
                orderDate: new Date().toISOString(),
                subTotal: getSubtotal(),
                tax: getTax(),
                discount: getDiscountAmount(),
                totalAmount: total,
                orderStatus: 'Pending',
                orderType,
                tableNumber,
                paymentMethod: 'split',
                paymentStatus: 'pending',
                customerId: customerInfo?.id,
                notes: `Split bill — ${mode} mode, ${parties} parties`,
                items: items.map(i => ({
                    productId: i.id,
                    quantity: i.quantity,
                    unitPrice: i.price,
                    totalPrice: i.subtotal,
                    notes: i.notes || '',
                })),
            });
            setCreatedOrderId(res?.id ?? res?.data?.id);
            setPhase(2);
        } catch {
            alert('Failed to create order for split bill. Please try again.');
        }
        setProcessing(false);
    };

    // Handle equal-mode order creation (enters phase 2 without phase 1 UI)
    const handleEqualConfirm = async () => {
        setProcessing(true);
        try {
            const res = await createOrder.mutateAsync({
                orderNumber: `ORD-${Date.now()}`,
                orderDate: new Date().toISOString(),
                subTotal: getSubtotal(),
                tax: getTax(),
                discount: getDiscountAmount(),
                totalAmount: total,
                orderStatus: 'Pending',
                orderType,
                tableNumber,
                paymentMethod: 'split',
                paymentStatus: 'pending',
                customerId: customerInfo?.id,
                notes: `Split bill — equal mode, ${parties} parties`,
                items: items.map(i => ({
                    productId: i.id,
                    quantity: i.quantity,
                    unitPrice: i.price,
                    totalPrice: i.subtotal,
                    notes: i.notes || '',
                })),
            });
            setCreatedOrderId(res?.id ?? res?.data?.id);
            setProcessing(false);
        } catch {
            alert('Failed to create order. Please try again.');
            setProcessing(false);
        }
    };

    // Trigger order creation when we land on phase 2 from equal-mode setup
    React.useEffect(() => {
        if (phase === 2 && mode === 'equal' && !createdOrderId && !processing) {
            handleEqualConfirm();
        }
    }, [phase]); // eslint-disable-line

    // Pay one party
    const handlePay = async (amount, method, partyIndex) => {
        if (!createdOrderId) return;
        setProcessing(true);
        try {
            const res = await fetch(`http://localhost:5000/api/v1/orders/${createdOrderId}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    paymentMethod: method,
                    note: `Split — Party ${partyIndex + 1}`,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                const nextPayments = [...payments, { partyIndex, amount, method }];
                setPayments(nextPayments);

                const paid = nextPayments.reduce((s, p) => s + p.amount, 0);
                if (paid >= total - 0.01) {
                    setPhase(3);
                    setTimeout(() => {
                        clearCart();
                        handleClose();
                    }, 3000);
                }
            } else {
                alert('Payment failed. Please try again.');
            }
        } catch {
            alert('Network error. Please try again.');
        }
        setProcessing(false);
    };

    const phase1Title = mode === 'byitem' ? 'Assign Items to Parties' : 'Set Amounts per Party';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[92dvh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <Scissors className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">Split Bill</h2>
                            <p className="text-xs text-gray-400">
                                {phase === 0 && 'Choose how to split'}
                                {phase === 1 && phase1Title}
                                {phase === 2 && 'Collect payments'}
                                {phase === 3 && 'All done!'}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 transition">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Step dots */}
                <div className="flex items-center justify-center gap-2 py-3 shrink-0">
                    {['Setup', 'Assign', 'Payments', 'Done'].map((label, i) => {
                        if (mode === 'equal' && i === 1) return null; // skip assign dot for equal
                        return (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all ${phase === i ? 'w-6 bg-indigo-600' : i < phase ? 'w-3 bg-indigo-300' : 'w-3 bg-gray-200'
                                    }`}
                            />
                        );
                    })}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 pb-4">
                    {phase === 0 && (
                        <PhaseSetup
                            mode={mode}
                            setMode={setMode}
                            parties={parties}
                            setParties={handleSetParties}
                            total={total}
                            onNext={handleSetupNext}
                        />
                    )}

                    {phase === 1 && mode === 'byitem' && (
                        <div className="space-y-4">
                            <PhaseByItem
                                items={items}
                                assignments={assignments}
                                setAssignments={setAssignments}
                                parties={parties}
                            />
                            <button
                                onClick={handleAssignNext}
                                disabled={processing}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-60"
                            >
                                {processing ? 'Creating Order…' : 'Continue to Payments →'}
                            </button>
                        </div>
                    )}

                    {phase === 1 && mode === 'custom' && (
                        <div className="space-y-4">
                            <PhaseCustom
                                percentages={percentages}
                                setPercentages={setPercentages}
                                parties={parties}
                                total={total}
                            />
                            <button
                                onClick={handleAssignNext}
                                disabled={processing || Math.abs(percentages.reduce((a, b) => a + b, 0) - 100) > 0.5}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
                            >
                                {processing ? 'Creating Order…' : 'Continue to Payments →'}
                            </button>
                        </div>
                    )}

                    {phase === 2 && (
                        <PhasePayments
                            partyAmounts={partyAmounts}
                            payments={payments}
                            onPay={handlePay}
                            processing={processing}
                        />
                    )}

                    {phase === 3 && (
                        <PhaseDone partyAmounts={partyAmounts} payments={payments} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SplitBillModal;
