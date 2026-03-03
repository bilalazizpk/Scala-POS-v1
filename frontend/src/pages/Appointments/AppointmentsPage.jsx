import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    useAppointments,
    useCreateAppointment,
    useUpdateAppointmentStatus,
    useDeleteAppointment,
} from '../../hooks';
import { useSignalRStore } from '../../store';
import {
    CalendarDays, ChevronLeft, ChevronRight, Plus, Clock,
    Users, Phone, Trash2, CheckCircle, XCircle
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────
const STATUS = {
    pending: { label: 'Pending', bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800', dot: '🟡' },
    confirmed: { label: 'Confirmed', bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800', dot: '🔵' },
    seated: { label: 'Seated', bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800', dot: '🟢' },
    cancelled: { label: 'Cancelled', bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-500', dot: '⚪' },
    'no-show': { label: 'No-show', bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800', dot: '🔴' },
};

const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtDate = (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const toISODate = (d) => d.toISOString().split('T')[0];

// ── Create / Edit Modal ───────────────────────────────────────────────────────
const AppointmentModal = ({ onClose, onCreate, selectedDate }) => {
    const [form, setForm] = useState({
        title: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        partySize: 2,
        startTime: `${toISODate(selectedDate)}T19:00`,
        endTime: `${toISODate(selectedDate)}T20:30`,
        notes: '',
    });
    const [saving, setSaving] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async () => {
        if (!form.customerName) return;
        setSaving(true);
        await onCreate({
            ...form,
            startTime: new Date(form.startTime).toISOString(),
            endTime: new Date(form.endTime).toISOString(),
        });
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">New Appointment</h2>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Title / Occasion</label>
                        <input value={form.title} onChange={e => set('title', e.target.value)}
                            placeholder="e.g. Birthday Dinner" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Customer Name *</label>
                            <input value={form.customerName} onChange={e => set('customerName', e.target.value)}
                                placeholder="Full name" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Party Size</label>
                            <input type="number" min="1" max="20" value={form.partySize} onChange={e => set('partySize', +e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
                            <input value={form.customerPhone} onChange={e => set('customerPhone', e.target.value)}
                                placeholder="+1 555 0100" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                            <input type="email" value={form.customerEmail} onChange={e => set('customerEmail', e.target.value)}
                                placeholder="email@example.com" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Start Time</label>
                            <input type="datetime-local" value={form.startTime} onChange={e => set('startTime', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">End Time</label>
                            <input type="datetime-local" value={form.endTime} onChange={e => set('endTime', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
                        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                            placeholder="Dietary restrictions, special requests..." className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
                    </div>
                </div>
                <div className="p-6 border-t flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                    <button onClick={handleSubmit} disabled={saving || !form.customerName}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Book Appointment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Single Appointment Card ───────────────────────────────────────────────────
const ApptCard = ({ appt, onStatusChange, onDelete }) => {
    const cfg = STATUS[appt.status] || STATUS.pending;
    return (
        <div className={`rounded-xl border-l-4 ${cfg.border} ${cfg.bg} p-4 space-y-2`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${cfg.text}`}>{cfg.dot} {cfg.label}</p>
                    <h4 className="font-bold text-gray-900">{appt.customerName}</h4>
                    {appt.title && <p className="text-xs text-gray-500 italic">{appt.title}</p>}
                </div>
                <button onClick={() => onDelete(appt.id)} className="text-gray-300 hover:text-red-500 transition">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {fmtTime(appt.startTime)} – {fmtTime(appt.endTime)}</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {appt.partySize} guests</span>
                {appt.customerPhone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {appt.customerPhone}</span>}
            </div>

            {appt.notes && <p className="text-xs text-gray-500 bg-white/60 rounded px-2 py-1">{appt.notes}</p>}

            {/* Quick status actions */}
            <div className="flex gap-2 pt-1 flex-wrap">
                {appt.status === 'pending' && (
                    <button onClick={() => onStatusChange(appt.id, 'confirmed')}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">
                        <CheckCircle className="w-3 h-3" /> Confirm
                    </button>
                )}
                {(appt.status === 'pending' || appt.status === 'confirmed') && (
                    <button onClick={() => onStatusChange(appt.id, 'seated')}
                        className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700">
                        <CheckCircle className="w-3 h-3" /> Seat
                    </button>
                )}
                {appt.status !== 'cancelled' && appt.status !== 'no-show' && (
                    <>
                        <button onClick={() => onStatusChange(appt.id, 'no-show')}
                            className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200">
                            No-show
                        </button>
                        <button onClick={() => onStatusChange(appt.id, 'cancelled')}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200">
                            <XCircle className="w-3 h-3" /> Cancel
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const AppointmentsPage = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const queryClient = useQueryClient();
    const connection = useSignalRStore(s => s.connection);

    const dateStr = toISODate(selectedDate);
    const { data: appointments = [], isLoading } = useAppointments(dateStr);
    const createAppt = useCreateAppointment();
    const updateStatus = useUpdateAppointmentStatus();
    const deleteAppt = useDeleteAppointment();

    // SignalR live updates
    useEffect(() => {
        if (!connection) return;
        const handler = () => queryClient.invalidateQueries({ queryKey: ['appointments'] });
        connection.on('AppointmentUpdated', handler);
        connection.on('AppointmentDeleted', handler);
        return () => {
            connection.off('AppointmentUpdated', handler);
            connection.off('AppointmentDeleted', handler);
        };
    }, [connection, queryClient]);

    const navigate = (days) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d);
    };

    const statusCounts = Object.keys(STATUS).reduce((acc, k) => {
        acc[k] = appointments.filter(a => a.status === k).length;
        return acc;
    }, {});

    const hours = Array.from({ length: 14 }, (_, i) => i + 9); // 9 AM – 10 PM

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            {showModal && (
                <AppointmentModal
                    selectedDate={selectedDate}
                    onClose={() => setShowModal(false)}
                    onCreate={(data) => createAppt.mutateAsync(data)}
                />
            )}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Appointments & Reservations</h1>
                    <p className="text-gray-500 mt-1 text-sm">{appointments.length} bookings for this day</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                    <Plus className="w-4 h-4" /> New Booking
                </button>
            </div>

            {/* Date navigation */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 border rounded-lg hover:bg-gray-50"><ChevronLeft className="w-5 h-5" /></button>
                <div className="flex-1 text-center">
                    <p className="font-semibold text-gray-900 text-lg">{fmtDate(selectedDate)}</p>
                </div>
                <button onClick={() => navigate(1)} className="p-2 border rounded-lg hover:bg-gray-50"><ChevronRight className="w-5 h-5" /></button>
                <button onClick={() => setSelectedDate(new Date())}
                    className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200">Today</button>
            </div>

            {/* Status summary bar */}
            <div className="flex flex-wrap gap-3">
                {Object.entries(STATUS).map(([k, cfg]) => (
                    <div key={k} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                        {cfg.dot} {cfg.label}: {statusCounts[k] || 0}
                    </div>
                ))}
            </div>

            {/* Two-column layout: Hour Timeline + List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Timeline */}
                <div className="bg-white border rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b bg-gray-50">
                        <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Daily Timeline</h3>
                    </div>
                    <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
                        {hours.map(h => {
                            const hourStr = `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;
                            const apptInHour = appointments.filter(a => new Date(a.startTime).getHours() === h);
                            return (
                                <div key={h} className="flex border-b min-h-[52px]">
                                    <div className="w-14 flex-shrink-0 text-right pr-3 py-2 text-xs text-gray-400 font-medium border-r">{hourStr}</div>
                                    <div className="flex-1 p-1 space-y-1">
                                        {apptInHour.map(a => {
                                            const cfg = STATUS[a.status] || STATUS.pending;
                                            return (
                                                <div key={a.id} className={`rounded px-2 py-1 text-xs ${cfg.bg} border ${cfg.border}`}>
                                                    <span className="font-semibold">{fmtTime(a.startTime)}</span>
                                                    {' '}{a.customerName}
                                                    {a.partySize > 1 && <span className="text-gray-500"> ({a.partySize})</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Detail List */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-gray-700 text-sm">All Bookings</h3>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                            <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No bookings for this day</p>
                            <button onClick={() => setShowModal(true)}
                                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                                Add Booking
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '500px' }}>
                            {appointments.map(a => (
                                <ApptCard
                                    key={a.id}
                                    appt={a}
                                    onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
                                    onDelete={(id) => { if (window.confirm('Delete this appointment?')) deleteAppt.mutate(id); }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppointmentsPage;
