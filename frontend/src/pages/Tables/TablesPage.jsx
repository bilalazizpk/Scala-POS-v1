import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Clock, RefreshCw, Move, LayoutGrid, List } from 'lucide-react';
import api from '../../services/api';
import { useSignalRStore } from '../../store';

const STATUS_CONFIG = {
    available: { label: 'Available', color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-400', dot: '🟢' },
    occupied: { label: 'Occupied', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-400', dot: '🔴' },
    reserved: { label: 'Reserved', color: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-400', dot: '🟡' },
    cleaning: { label: 'Cleaning', color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-400', dot: '🔵' },
};

const SECTIONS = ['All', 'Indoor', 'Outdoor', 'Bar'];

// Time elapsed since seated
const getElapsed = (seatedAt) => {
    if (!seatedAt) return null;
    const mins = Math.floor((Date.now() - new Date(seatedAt)) / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const TableCard = ({ table, onStatusChange }) => {
    const cfg = STATUS_CONFIG[table.status] || STATUS_CONFIG.available;
    const elapsed = getElapsed(table.seatedAt);
    const isLong = elapsed && parseInt(elapsed) >= 45;

    return (
        <div
            className={`relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${cfg.border} ${cfg.bg}`}
            onClick={() => onStatusChange(table)}
        >
            {/* Shape indicator top-right */}
            <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${cfg.color}`} />

            {/* Table name & capacity */}
            <div className="mb-3">
                <h3 className="text-2xl font-bold text-gray-900">{table.name}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Users className="w-3 h-3" /> {table.capacity} seats · {table.shape}
                </p>
            </div>

            {/* Status badge */}
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.text} ${cfg.color} bg-opacity-20`}>
                {cfg.dot} {cfg.label}
            </span>

            {/* Occupied info */}
            {table.status === 'occupied' && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                    {table.guestCount && (
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {table.guestCount} guests
                        </p>
                    )}
                    {elapsed && (
                        <p className={`text-xs flex items-center gap-1 ${isLong ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                            <Clock className="w-3 h-3" /> {elapsed}
                            {isLong && ' ⚠️'}
                        </p>
                    )}
                </div>
            )}

            {/* Section tag */}
            <p className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium">{table.section}</p>
        </div>
    );
};

const StatusModal = ({ table, onClose, onSave }) => {
    const [status, setStatus] = useState(table.status);
    const [guests, setGuests] = useState(table.guestCount || '');
    const [notes, setNotes] = useState(table.notes || '');
    const [saving, setSaving] = useState(false);

    const statuses = Object.entries(STATUS_CONFIG).map(([id, cfg]) => ({ id, ...cfg }));

    const handleSave = async () => {
        setSaving(true);
        await onSave({ id: table.id, status, guestCount: guests ? parseInt(guests) : null, notes });
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">{table.name} — Update Status</h2>
                    <p className="text-sm text-gray-500 mt-1">{table.section} · {table.capacity} seats · {table.shape}</p>
                </div>
                <div className="p-6 space-y-5">
                    {/* Status selector */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Table Status</label>
                        <div className="grid grid-cols-2 gap-2">
                            {statuses.map(s => (
                                <button key={s.id} onClick={() => setStatus(s.id)}
                                    className={`p-3 rounded-xl border-2 text-sm font-medium transition flex items-center gap-2 ${status === s.id ? `${s.border} ${s.bg} ${s.text}` : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}>
                                    <span>{s.dot}</span> {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Guest count (if occupied) */}
                    {status === 'occupied' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Guests</label>
                            <input type="number" min="1" max={table.capacity} value={guests}
                                onChange={e => setGuests(e.target.value)}
                                placeholder={`1–${table.capacity}`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (optional)</label>
                        <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                            placeholder="e.g. Birthday party, allergy note..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="p-6 border-t flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Update Status'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AddTableModal = ({ onClose, onCreate }) => {
    const [form, setForm] = useState({ name: '', capacity: 4, shape: 'square', section: 'Indoor' });
    const [saving, setSaving] = useState(false);
    const handleSave = async () => {
        setSaving(true);
        await onCreate(form);
        setSaving(false);
        onClose();
    };
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
                <div className="p-5 border-b flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Add New Table</h2>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Table Name</label>
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. T7, B2" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (seats)</label>
                        <input type="number" min="1" max="20" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) })}
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shape</label>
                        <select value={form.shape} onChange={e => setForm({ ...form, shape: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                            <option value="square">Square</option>
                            <option value="circle">Round</option>
                            <option value="rectangle">Rectangle (long)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                        <select value={form.section} onChange={e => setForm({ ...form, section: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                            <option>Indoor</option>
                            <option>Outdoor</option>
                            <option>Bar</option>
                        </select>
                    </div>
                </div>
                <div className="p-5 border-t flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                    <button onClick={handleSave} disabled={saving || !form.name}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                        {saving ? 'Adding...' : 'Add Table'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const TablesPage = () => {
    const [activeSection, setActiveSection] = useState('All');
    const [selectedTable, setSelectedTable] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'floorplan'
    const [editMode, setEditMode] = useState(false);
    const [dragging, setDragging] = useState(null);
    const floorRef = useRef(null);
    const queryClient = useQueryClient();
    const connection = useSignalRStore(state => state.connection);

    const { data: tables = [], isLoading, refetch } = useQuery({
        queryKey: ['tables'],
        queryFn: async () => { const r = await api.get('/v1/tables'); return r.data; },
        refetchInterval: 30000,
    });

    useEffect(() => {
        if (!connection) return;

        const onTableUpdated = (updatedTable) => {
            console.log("SignalR: TableUpdated received:", updatedTable);
            queryClient.invalidateQueries({ queryKey: ['tables'] });
        };

        connection.on("TableUpdated", onTableUpdated);

        return () => {
            connection.off("TableUpdated", onTableUpdated);
        };
    }, [connection, queryClient]);

    const updateStatus = useMutation({
        mutationFn: async ({ id, ...update }) => {
            const r = await api.put(`/v1/tables/${id}/status`, update);
            return r.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
    });

    const updatePosition = useMutation({
        mutationFn: async ({ id, x, y }) => {
            const r = await api.put(`/v1/tables/${id}/position`, { x, y });
            return r.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
    });

    const createTable = useMutation({
        mutationFn: async (data) => { const r = await api.post('/v1/tables', data); return r.data; },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
    });

    const deleteTable = useMutation({
        mutationFn: async (id) => { await api.delete(`/v1/tables/${id}`); },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
    });

    const filtered = activeSection === 'All' ? tables : tables.filter(t => t.section === activeSection);

    // Summary counts
    const counts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
        acc[s] = tables.filter(t => t.status === s).length;
        return acc;
    }, {});

    return (
        <div className="space-y-6 p-6">
            {selectedTable && (
                <StatusModal table={selectedTable} onClose={() => setSelectedTable(null)}
                    onSave={(update) => updateStatus.mutateAsync(update)} />
            )}
            {showAddModal && (
                <AddTableModal onClose={() => setShowAddModal(false)}
                    onCreate={(data) => createTable.mutateAsync({ ...data, x: 100, y: 100, width: 80, height: 80 })} />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
                    <p className="text-gray-500 mt-1">{tables.length} tables · Real-time via SignalR</p>
                </div>
                <div className="flex gap-2 items-center">
                    {/* View Mode Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                        <button onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'grid' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                            <LayoutGrid className="w-4 h-4" /> Grid
                        </button>
                        <button onClick={() => setViewMode('floorplan')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'floorplan' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                            <Move className="w-4 h-4" /> Floor Plan
                        </button>
                    </div>

                    {viewMode === 'floorplan' && (
                        <button onClick={() => setEditMode(e => !e)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition border ${editMode ? 'bg-orange-100 border-orange-400 text-orange-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                            {editMode ? '🔓 Edit Mode ON' : '🔒 Edit Mode OFF'}
                        </button>
                    )}

                    <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                        <Plus className="w-4 h-4" /> Add Table
                    </button>
                </div>
            </div>

            {/* Status summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <div key={key} className={`rounded-xl p-4 border ${cfg.bg} ${cfg.border}`}>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">{cfg.label}</span>
                            <span className="text-xl">{cfg.dot}</span>
                        </div>
                        <p className={`text-3xl font-bold mt-1 ${cfg.text}`}>{counts[key] || 0}</p>
                    </div>
                ))}
            </div>

            {/* Section tabs (grid mode only) */}
            {viewMode === 'grid' && (
                <div className="flex gap-2">
                    {SECTIONS.map(s => (
                        <button key={s} onClick={() => setActiveSection(s)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeSection === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {s}
                            <span className="ml-1.5 text-xs opacity-75">
                                ({s === 'All' ? tables.length : tables.filter(t => t.section === s).length})
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* ======== FLOOR PLAN VIEW ======== */}
            {viewMode === 'floorplan' && (
                <div className="bg-gray-100 rounded-2xl border overflow-hidden" style={{ height: '600px' }}>
                    <div className="bg-white border-b px-4 py-2 flex items-center gap-4 text-xs text-gray-500">
                        {Object.entries(STATUS_CONFIG).map(([k, c]) => (
                            <span key={k} className="flex items-center gap-1">{c.dot} {c.label}</span>
                        ))}
                        {editMode && <span className="ml-auto text-orange-600 font-semibold">✏️ Drag tables to reposition. Changes are saved in real-time.</span>}
                    </div>
                    <svg
                        ref={floorRef}
                        className="w-full h-full bg-[#f8f9fa]"
                        style={{ cursor: editMode ? 'move' : 'default' }}
                        onMouseMove={(e) => {
                            if (!dragging || !editMode) return;
                            const rect = floorRef.current.getBoundingClientRect();
                            const nx = Math.round((e.clientX - rect.left - dragging.offX) / 10) * 10;
                            const ny = Math.round((e.clientY - rect.top - dragging.offY) / 10) * 10;
                            setDragging(d => ({ ...d, x: nx, y: ny }));
                        }}
                        onMouseUp={() => {
                            if (dragging && editMode) {
                                updatePosition.mutate({ id: dragging.id, x: dragging.x, y: dragging.y });
                                setDragging(null);
                            }
                        }}
                        onMouseLeave={() => setDragging(null)}
                    >
                        {/* Grid dots */}
                        <defs>
                            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                <circle cx="1" cy="1" r="0.5" fill="#d1d5db" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />

                        {tables.map(t => {
                            const cfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.available;
                            const isDraggingThis = dragging?.id === t.id;
                            const x = isDraggingThis ? dragging.x : t.positionX;
                            const y = isDraggingThis ? dragging.y : t.positionY;
                            const w = t.width || 80;
                            const h = t.height || 80;
                            const isCircle = t.shape === 'circle';
                            const isRect = t.shape === 'rectangle';
                            const fillColor = {
                                available: '#dcfce7', occupied: '#fee2e2',
                                reserved: '#fef9c3', cleaning: '#dbeafe'
                            }[t.status] || '#f1f5f9';
                            const strokeColor = {
                                available: '#16a34a', occupied: '#dc2626',
                                reserved: '#ca8a04', cleaning: '#2563eb'
                            }[t.status] || '#94a3b8';

                            return (
                                <g key={t.id} transform={`translate(${x},${y})`}
                                    style={{ cursor: editMode ? 'grab' : 'pointer' }}
                                    onMouseDown={(e) => {
                                        if (!editMode) return;
                                        e.preventDefault();
                                        const rect = floorRef.current.getBoundingClientRect();
                                        setDragging({ id: t.id, x: t.positionX, y: t.positionY, offX: e.clientX - rect.left - t.positionX, offY: e.clientY - rect.top - t.positionY });
                                    }}
                                    onClick={() => { if (!editMode) setSelectedTable(t); }}
                                >
                                    {isCircle ? (
                                        <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 2} ry={h / 2 - 2}
                                            fill={fillColor} stroke={strokeColor} strokeWidth={isDraggingThis ? 3 : 2} />
                                    ) : (
                                        <rect x={2} y={2} width={isRect ? w * 1.5 : w} height={h} rx={6}
                                            fill={fillColor} stroke={strokeColor} strokeWidth={isDraggingThis ? 3 : 2} />
                                    )}
                                    <text x={isCircle ? w / 2 : (isRect ? w * 0.75 : w / 2)} y={h / 2 - 4}
                                        textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">
                                        {t.name}
                                    </text>
                                    <text x={isCircle ? w / 2 : (isRect ? w * 0.75 : w / 2)} y={h / 2 + 12}
                                        textAnchor="middle" fontSize="10" fill="#64748b">
                                        {t.guestCount ? `${t.guestCount}/${t.capacity}` : `${t.capacity} seats`}
                                    </text>
                                    {t.status === 'occupied' && t.seatedAt && (
                                        <text x={isCircle ? w / 2 : (isRect ? w * 0.75 : w / 2)} y={h / 2 + 24}
                                            textAnchor="middle" fontSize="9" fill="#94a3b8">
                                            {getElapsed(t.seatedAt)}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
            )}

            {/* ======== GRID VIEW ======== */}
            {viewMode === 'grid' && (
                isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500 font-medium">No tables in this section</p>
                        <button onClick={() => setShowAddModal(true)} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                            Add Table
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filtered.map(t => (
                            <TableCard key={t.id} table={t} onStatusChange={setSelectedTable} />
                        ))}
                    </div>
                )
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 pt-2 border-t text-xs text-gray-500">
                <span className="font-medium">Tap a table to update its status.</span>
                {Object.entries(STATUS_CONFIG).map(([k, c]) => (
                    <span key={k} className="flex items-center gap-1">{c.dot} {c.label}</span>
                ))}
            </div>
        </div>
    );
};

export default TablesPage;
