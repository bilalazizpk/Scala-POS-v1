import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useTimeEntries, useClockIn, useClockOut } from '../../hooks';

export const TimeClock = ({ staffList }) => {
    const { data: timeEntries = [], isLoading } = useTimeEntries();
    const clockInMutation = useClockIn();
    const clockOutMutation = useClockOut();

    const [selectedStaff, setSelectedStaff] = useState(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [action, setAction] = useState('in'); // 'in' or 'out'

    // Map time entries to staff to see who is currently clocked in
    const activeEntries = timeEntries.filter(t => !t.clockOut);
    const clockedInStaffIds = activeEntries.map(t => t.staffId);

    const handleAction = async (e) => {
        e.preventDefault();
        setError('');

        if (!selectedStaff || !pin) {
            setError('Please select your name and enter your PIN code.');
            return;
        }

        try {
            if (action === 'in') {
                await clockInMutation.mutateAsync({ staffId: selectedStaff.id, pinCode: pin });
            } else {
                await clockOutMutation.mutateAsync({ staffId: selectedStaff.id, notes: 'Clocked out via terminal' });
            }
            setSelectedStaff(null);
            setPin('');
            setAction('in');
        } catch (err) {
            setError(err?.response?.data || 'An error occurred with this action.');
        }
    };

    const getStaffStatusColor = (staffId) => {
        return clockedInStaffIds.includes(staffId)
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50';
    };

    if (isLoading) {
        return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-2 bg-slate-200 rounded"></div></div></div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Clock-in Terminal */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-blue-600 p-6 text-center text-white">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-90" />
                    <h2 className="text-2xl font-bold">Time Clock Terminal</h2>
                    <p className="text-blue-100 mt-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                <div className="p-6">
                    <form onSubmit={handleAction} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex gap-2 items-center">
                                <XCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee</label>
                            <select
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 text-lg"
                                value={selectedStaff?.id || ''}
                                onChange={(e) => {
                                    const staff = staffList.find(s => s.id === parseInt(e.target.value));
                                    setSelectedStaff(staff);

                                    // Auto select action based on current status
                                    if (staff && clockedInStaffIds.includes(staff.id)) {
                                        setAction('out');
                                    } else {
                                        setAction('in');
                                    }
                                }}
                            >
                                <option value="">--- Select Name ---</option>
                                {staffList.map(staff => (
                                    <option key={staff.id} value={staff.id}>
                                        {staff.firstName} {staff.lastName} ({staff.role})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedStaff && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Enter PIN Code</label>
                                <Input
                                    type="password"
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    placeholder="••••"
                                    className="text-center text-2xl tracking-widest py-3"
                                    maxLength={4}
                                    autoFocus
                                    required
                                />

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <Button
                                        type="button"
                                        onClick={() => setAction('in')}
                                        className={`py-4 text-lg ${action === 'in' ? 'bg-green-600 hover:bg-green-700 ring-4 ring-green-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        Clock In
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setAction('out')}
                                        className={`py-4 text-lg ${action === 'out' ? 'bg-red-600 hover:bg-red-700 ring-4 ring-red-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        Clock Out
                                    </Button>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full mt-6 py-4 text-lg"
                                    disabled={clockInMutation.isPending || clockOutMutation.isPending}
                                >
                                    Confirm Action
                                </Button>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Current Status Sidebar */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Currently Clocked In ({activeEntries.length})
                </h3>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {staffList.filter(s => clockedInStaffIds.includes(s.id)).length === 0 ? (
                        <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500">
                            No employees currently clocked in.
                        </div>
                    ) : (
                        staffList.map(staff => {
                            const isWorking = clockedInStaffIds.includes(staff.id);
                            if (!isWorking) return null;

                            const entry = activeEntries.find(t => t.staffId === staff.id);
                            const activeSince = new Date(entry.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                            return (
                                <div key={staff.id} className="bg-white border text-gray-700 border-green-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                                            {staff.firstName[0]}{staff.lastName[0]}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{staff.firstName} {staff.lastName}</p>
                                            <p className="text-xs text-gray-500 capitalize">{staff.role}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                            Active
                                        </span>
                                        <p className="text-xs text-gray-500 mt-1">Since {activeSince}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
