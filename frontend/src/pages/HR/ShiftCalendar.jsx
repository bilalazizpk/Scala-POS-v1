import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Plus, X } from 'lucide-react';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

// Quick modal for creating/editing a shift
const ShiftModal = ({ isOpen, onClose, selectedSlot, selectedEvent, onSave, staffList }) => {
    const defaultStart = selectedSlot?.start || new Date();
    const defaultEnd = selectedSlot?.end || moment(defaultStart).add(4, 'hours').toDate();

    const [form, setForm] = useState({
        staffId: selectedEvent?.staffId || (staffList.length > 0 ? staffList[0].id : ''),
        startTime: moment(selectedEvent?.start || defaultStart).format('YYYY-MM-DDTHH:mm'),
        endTime: moment(selectedEvent?.end || defaultEnd).format('YYYY-MM-DDTHH:mm'),
        role: selectedEvent?.role || 'cashier',
        notes: selectedEvent?.notes || '',
        color: selectedEvent?.color || '#3b82f6'
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...form,
            staffId: parseInt(form.staffId),
            startTime: new Date(form.startTime).toISOString(),
            endTime: new Date(form.endTime).toISOString()
        }, selectedEvent?.id);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <h2 className="text-lg font-bold text-gray-900">
                        {selectedEvent ? 'Edit Shift' : 'Schedule New Shift'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm">
                    <div>
                        <label className="block font-medium text-gray-700 mb-1">Staff Member</label>
                        <select
                            value={form.staffId}
                            onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                            className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                            required
                        >
                            {staffList.map(s => (
                                <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-medium text-gray-700 mb-1">Start Time</label>
                            <input
                                type="datetime-local"
                                value={form.startTime}
                                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-medium text-gray-700 mb-1">End Time</label>
                            <input
                                type="datetime-local"
                                value={form.endTime}
                                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-medium text-gray-700 mb-1">Role</label>
                            <select
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            >
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="cashier">Cashier</option>
                                <option value="kitchen">Kitchen</option>
                            </select>
                        </div>
                        <div>
                            <label className="block font-medium text-gray-700 mb-1">Color Marker</label>
                            <input
                                type="color"
                                value={form.color}
                                onChange={(e) => setForm({ ...form, color: e.target.value })}
                                className="w-full h-9 border border-gray-300 rounded-lg cursor-pointer"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block font-medium text-gray-700 mb-1">Notes</label>
                        <input
                            type="text"
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            placeholder="e.g. Opening shift..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                    </div>
                    <div className="pt-3 border-t">
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">
                            {selectedEvent ? 'Update Shift' : 'Create Shift'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const ShiftCalendar = ({ staffList }) => {
    const queryClient = useQueryClient();
    const [dateRange, setDateRange] = useState({
        start: moment().startOf('month').toISOString(),
        end: moment().endOf('month').toISOString()
    });

    const [modalState, setModalState] = useState({ isOpen: false, selectedSlot: null, selectedEvent: null });

    // Fetch shifts data
    const { data: shifts = [], isLoading } = useQuery({
        queryKey: ['shifts', dateRange],
        queryFn: async () => {
            const res = await api.get(`/shifts?start=${dateRange.start}&end=${dateRange.end}`);
            return res.data;
        }
    });

    // Mutations for CQRS backend
    const createShift = useMutation({
        mutationFn: async (shift) => api.post('/shifts', shift),
        onSuccess: () => queryClient.invalidateQueries(['shifts'])
    });

    const updateShift = useMutation({
        mutationFn: async ({ id, ...update }) => api.put(`/shifts/${id}`, { id, ...update }),
        onSuccess: () => queryClient.invalidateQueries(['shifts'])
    });

    // Map Backend DTOs to React-Big-Calendar format
    const events = shifts.map(s => ({
        id: s.id,
        title: `${s.staffName} (${s.role})`,
        start: new Date(s.startTime),
        end: new Date(s.endTime),
        staffId: s.staffId,
        role: s.role,
        notes: s.notes,
        color: s.color,
        resource: s
    }));

    const handleSelectSlot = (slotInfo) => {
        setModalState({ isOpen: true, selectedSlot: slotInfo, selectedEvent: null });
    };

    const handleSelectEvent = (event) => {
        setModalState({ isOpen: true, selectedSlot: null, selectedEvent: event });
    };

    const handleEventDrop = async ({ event, start, end }) => {
        // Find existing to merge other fields
        const resource = event.resource;
        await updateShift.mutateAsync({
            id: event.id,
            staffId: resource.staffId,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            role: resource.role,
            notes: resource.notes,
            color: resource.color
        });
    };

    const handleEventResize = async ({ event, start, end }) => {
        const resource = event.resource;
        await updateShift.mutateAsync({
            id: event.id,
            staffId: resource.staffId,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            role: resource.role,
            notes: resource.notes,
            color: resource.color
        });
    };

    const handleSaveForm = async (formData, id) => {
        if (id) {
            await updateShift.mutateAsync({ id, ...formData });
        } else {
            await createShift.mutateAsync(formData);
        }
    };

    const handleRangeChange = (range) => {
        if (Array.isArray(range)) {
            // week view array
            setDateRange({ start: range[0].toISOString(), end: range[range.length - 1].toISOString() });
        } else {
            // month view object
            setDateRange({ start: range.start.toISOString(), end: range.end.toISOString() });
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-[calc(100vh-14rem)]">
            <ShiftModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, selectedSlot: null, selectedEvent: null })}
                selectedSlot={modalState.selectedSlot}
                selectedEvent={modalState.selectedEvent}
                onSave={handleSaveForm}
                staffList={staffList}
            />

            <div className="relative h-full">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/50 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-sm text-gray-500 font-medium">Loading schedule...</p>
                    </div>
                )}

                <DnDCalendar
                    localizer={localizer}
                    events={events}
                    onEventDrop={handleEventDrop}
                    onEventResize={handleEventResize}
                    selectable
                    resizable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    onRangeChange={handleRangeChange}
                    defaultView="week"
                    step={30}
                    timeslots={2}
                    eventPropGetter={(event) => ({
                        style: {
                            backgroundColor: event.color,
                            borderRadius: '6px',
                            border: 'none',
                            opacity: 0.9,
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '500',
                            padding: '2px 6px'
                        }
                    })}
                    className="font-sans text-sm"
                />
            </div>

            <p className="mt-4 text-xs text-gray-500 font-medium text-center">
                💡 Tip: You can drag and drop shifts, or drag their edges to resize them. Click any empty slot to create a new shift.
            </p>
        </div>
    );
};
