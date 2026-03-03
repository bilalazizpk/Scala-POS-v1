import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTickets, useCreateTicket, useUpdateTicketStatus, useAddTicketComment, useDeleteTicket, useAIDraftResponse } from '../../hooks';
import { useSignalRStore } from '../../store';
import { Headphones, Plus, Trash2, MessageSquare, ChevronRight, Flag, Circle, AlertCircle, Clock, CheckCircle2, X, Sparkles } from 'lucide-react';

// ── Config ────────────────────────────────────────────────────────────────────
const STATUSES = [
    { id: 'open', label: 'Open', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
    { id: 'in-progress', label: 'In Progress', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    { id: 'pending', label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-400' },
    { id: 'resolved', label: 'Resolved', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-400' },
    { id: 'closed', label: 'Closed', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
];

const PRIORITY_CFG = {
    low: { label: 'Low', dot: '🟢', color: 'text-green-600' },
    medium: { label: 'Medium', dot: '🟡', color: 'text-yellow-600' },
    high: { label: 'High', dot: '🟠', color: 'text-orange-600' },
    critical: { label: 'Critical', dot: '🔴', color: 'text-red-600' },
};

const CATEGORIES = ['bug', 'feature', 'maintenance', 'question', 'billing', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtTime = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// ── Create Ticket Modal ───────────────────────────────────────────────────────
const CreateModal = ({ onClose, onCreate }) => {
    const [form, setForm] = useState({ title: '', description: '', priority: 'medium', category: 'other', reportedBy: '' });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async () => {
        if (!form.title) return;
        setSaving(true);
        await onCreate(form);
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">New Support Ticket</h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Title *</label>
                        <input value={form.title} onChange={e => set('title', e.target.value)}
                            placeholder="Brief description of the issue" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                            placeholder="Steps to reproduce, expected vs actual..." className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Priority</label>
                            <select value={form.priority} onChange={e => set('priority', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                                {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CFG[p].label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
                            <select value={form.category} onChange={e => set('category', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Reported By</label>
                        <input value={form.reportedBy} onChange={e => set('reportedBy', e.target.value)}
                            placeholder="Your name" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                <div className="p-6 border-t flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                    <button onClick={handleSubmit} disabled={saving || !form.title}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                        {saving ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Ticket Detail Drawer ──────────────────────────────────────────────────────
const TicketDrawer = ({ ticket, onClose, onStatusChange, onAddComment, onDelete }) => {
    const [comment, setComment] = useState('');
    const [posting, setPosting] = useState(false);
    const pcfg = PRIORITY_CFG[ticket.priority] || PRIORITY_CFG.medium;

    const draftAI = useAIDraftResponse();

    const handleAIDraft = async () => {
        setComment('✨ AI is drafting a response...');
        try {
            const res = await draftAI.mutateAsync({
                ticketTitle: ticket.title,
                ticketDescription: ticket.description || '',
                customerName: ticket.reportedBy || 'Customer'
            });
            setComment(res.data.draft);
        } catch (err) {
            setComment('Failed to generate AI draft.');
        }
    };

    const postComment = async () => {
        if (!comment.trim()) return;
        setPosting(true);
        await onAddComment({ id: ticket.id, body: comment, authorName: 'Staff' });
        setComment('');
        setPosting(false);
    };

    return (
        <div className="fixed inset-0 z-40 flex justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b flex justify-between items-start">
                    <div>
                        <p className="text-xs text-gray-400 font-mono">{ticket.ticketNumber}</p>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight mt-0.5">{ticket.title}</h3>
                    </div>
                    <button onClick={onClose}><X className="w-5 h-5 text-gray-400 mt-1" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Priority</p>
                            <p className={`font-semibold ${pcfg.color}`}>{pcfg.dot} {pcfg.label}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Category</p>
                            <p className="font-semibold capitalize text-gray-700">{ticket.category}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Reported by</p>
                            <p className="font-semibold text-gray-700">{ticket.reportedBy || '—'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">Created</p>
                            <p className="font-semibold text-gray-700">{fmtDate(ticket.createdAt)}</p>
                        </div>
                    </div>

                    {/* Description */}
                    {ticket.description && (
                        <div>
                            <p className="text-xs text-gray-400 mb-1 font-medium">Description</p>
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{ticket.description}</p>
                        </div>
                    )}

                    {/* Status transitions */}
                    <div>
                        <p className="text-xs text-gray-400 mb-2 font-medium">Move to</p>
                        <div className="flex flex-wrap gap-2">
                            {STATUSES.filter(s => s.id !== ticket.status).map(s => (
                                <button key={s.id} onClick={() => onStatusChange({ id: ticket.id, status: s.id })}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${s.bg} ${s.text} ${s.border}`}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comments */}
                    <div>
                        <p className="text-xs text-gray-400 mb-2 font-medium">Comments ({ticket.comments?.length || 0})</p>
                        <div className="space-y-2">
                            {ticket.comments?.map(c => (
                                <div key={c.id} className="bg-blue-50 rounded-lg p-3 text-sm">
                                    <p className="font-semibold text-blue-800 text-xs mb-1">{c.authorName || 'Staff'} · {fmtTime(c.createdAt)}</p>
                                    <p className="text-gray-700">{c.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Comment input */}
                <div className="p-4 border-t bg-gray-50 space-y-2">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-gray-600">Reply</label>
                        <button
                            onClick={handleAIDraft}
                            disabled={draftAI.isPending}
                            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            {draftAI.isPending ? 'Drafting...' : 'AI Draft'}
                        </button>
                    </div>
                    <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                        placeholder="Add a comment..." className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500" />
                    <div className="flex gap-2 justify-between">
                        <button onClick={() => { if (window.confirm('Delete this ticket?')) { onDelete(ticket.id); onClose(); } }}
                            className="px-3 py-1.5 text-red-600 text-xs font-medium flex items-center gap-1 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                        <button onClick={postComment} disabled={posting || !comment.trim()}
                            className="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {posting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Kanban Card ───────────────────────────────────────────────────────────────
const KanbanCard = ({ ticket, onClick }) => {
    const pcfg = PRIORITY_CFG[ticket.priority] || PRIORITY_CFG.medium;
    return (
        <div onClick={onClick}
            className="bg-white border rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 space-y-2">
            <div className="flex justify-between items-start">
                <span className="text-xs text-gray-400 font-mono">{ticket.ticketNumber}</span>
                <span className={`text-xs font-semibold ${pcfg.color}`}>{pcfg.dot}</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 leading-snug">{ticket.title}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                <span className="bg-gray-100 px-2 py-0.5 rounded capitalize">{ticket.category}</span>
                {ticket.comments?.length > 0 && (
                    <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />{ticket.comments.length}</span>
                )}
                <span className="ml-auto">{fmtDate(ticket.updatedAt)}</span>
            </div>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const HelpdeskPage = () => {
    const [showCreate, setShowCreate] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const queryClient = useQueryClient();
    const connection = useSignalRStore(s => s.connection);

    const { data: tickets = [], isLoading } = useTickets();
    const createTicket = useCreateTicket();
    const updateStatus = useUpdateTicketStatus();
    const addComment = useAddTicketComment();
    const deleteTicket = useDeleteTicket();

    // SignalR live updates
    useEffect(() => {
        if (!connection) return;
        const refresh = () => queryClient.invalidateQueries({ queryKey: ['tickets'] });
        connection.on('TicketCreated', refresh);
        connection.on('TicketUpdated', refresh);
        connection.on('TicketDeleted', refresh);
        return () => {
            connection.off('TicketCreated', refresh);
            connection.off('TicketUpdated', refresh);
            connection.off('TicketDeleted', refresh);
        };
    }, [connection, queryClient]);

    // Keep selected ticket in sync with live data
    const liveSelected = selectedTicket
        ? tickets.find(t => t.id === selectedTicket.id) || selectedTicket
        : null;

    return (
        <div className="p-6 space-y-5 min-h-screen bg-gray-50">
            {showCreate && (
                <CreateModal
                    onClose={() => setShowCreate(false)}
                    onCreate={(data) => createTicket.mutateAsync(data)}
                />
            )}
            {liveSelected && (
                <TicketDrawer
                    ticket={liveSelected}
                    onClose={() => setSelectedTicket(null)}
                    onStatusChange={(data) => updateStatus.mutateAsync(data)}
                    onAddComment={(data) => addComment.mutateAsync(data)}
                    onDelete={(id) => deleteTicket.mutate(id)}
                />
            )}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Headphones className="w-6 h-6 text-blue-600" /> Helpdesk
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">{tickets.length} tickets · live via SignalR</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                    <Plus className="w-4 h-4" /> New Ticket
                </button>
            </div>

            {/* Summary chips */}
            <div className="flex flex-wrap gap-3">
                {STATUSES.map(s => {
                    const count = tickets.filter(t => t.status === s.id).length;
                    return (
                        <div key={s.id} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
                            {s.label}: {count}
                        </div>
                    );
                })}
            </div>

            {/* Kanban board */}
            {isLoading ? (
                <div className="flex gap-4">
                    {STATUSES.map(s => <div key={s.id} className="flex-1 h-64 bg-gray-200 rounded-2xl animate-pulse" />)}
                </div>
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {STATUSES.map(col => {
                        const colTickets = tickets.filter(t => t.status === col.id);
                        return (
                            <div key={col.id} className="flex-shrink-0 w-72 flex flex-col gap-3">
                                {/* Column header */}
                                <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${col.bg} ${col.border}`}>
                                    <span className={`text-sm font-semibold ${col.text}`}>{col.label}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white ${col.text}`}>{colTickets.length}</span>
                                </div>
                                {/* Cards */}
                                <div className="space-y-2 min-h-[80px]">
                                    {colTickets.map(t => (
                                        <KanbanCard key={t.id} ticket={t} onClick={() => setSelectedTicket(t)} />
                                    ))}
                                    {colTickets.length === 0 && (
                                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400">
                                            No tickets
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default HelpdeskPage;
