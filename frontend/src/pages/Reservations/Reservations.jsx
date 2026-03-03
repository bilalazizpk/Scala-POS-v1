import React, { useState, useEffect } from 'react';
import {
    Users, UserPlus, Clock, Search, Filter,
    CheckCircle, XCircle, ChevronDown, ListTodo, MapPin
} from 'lucide-react';
import {
    reservationService,
    waitlistService
} from '../../services/api';
import usePosDataStore from '../../stores/posDataStore';

const Reservations = () => {
    const [activeTab, setActiveTab] = useState('reservations'); // 'reservations' or 'waitlist'

    // Data State
    const [reservations, setReservations] = useState([]);
    const [waitlist, setWaitlist] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // References to other stores (for table names mapping)
    const tables = usePosDataStore((state) => state.tables);

    useEffect(() => {
        fetchData();
        // In a full implementation, we would also wire up SignalR listeners here
        // for `ReceiveReservationUpdate` and `ReceiveWaitlistUpdate`.
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [resData, waitData] = await Promise.all([
                reservationService.getAll(),
                waitlistService.getAll()
            ]);
            setReservations(resData.data);
            setWaitlist(waitData.data);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getTableName = (tableId) => {
        if (!tableId || !tables) return 'Unassigned';
        const table = tables.find(t => t.id === tableId);
        return table ? table.name : 'Unassigned';
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">

            {/* Header Area */}
            <div className="bg-white border-b px-6 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Reservations & Waitlist</h1>
                        <p className="text-slate-500 mt-1">Manage booked tables and walk-in queue</p>
                    </div>

                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors shadow-sm">
                            <UserPlus className="w-4 h-4" />
                            Join Waitlist
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm">
                            <Users className="w-4 h-4" />
                            New Reservation
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 py-4 flex gap-4 border-b bg-white">
                <button
                    onClick={() => setActiveTab('reservations')}
                    className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'reservations' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    <MapPin className="w-4 h-4" />
                    Reservations
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === 'reservations' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                        {reservations.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('waitlist')}
                    className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'waitlist' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    <ListTodo className="w-4 h-4" />
                    Waitlist
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === 'waitlist' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                        {waitlist.length}
                    </span>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

                    {/* Toolbar */}
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search names..."
                                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 bg-white">
                            <Filter className="w-4 h-4 text-slate-500" />
                            Filter
                        </button>
                    </div>

                    {/* Table */}
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-500">Loading data...</div>
                    ) : activeTab === 'reservations' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                    <th className="px-6 py-3 font-medium">Time</th>
                                    <th className="px-6 py-3 font-medium">Customer</th>
                                    <th className="px-6 py-3 font-medium">Party</th>
                                    <th className="px-6 py-3 font-medium">Table</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Notes</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reservations.length === 0 ? (
                                    <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">No reservations found.</td></tr>
                                ) : (
                                    reservations.map(res => (
                                        <tr key={res.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                {new Date(res.reservationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                <div className="text-xs text-slate-500 font-normal">{new Date(res.reservationTime).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-slate-900">{res.customerName}</div>
                                                <div className="text-xs text-slate-500">{res.phoneNumber || 'No phone'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1 text-sm text-slate-700">
                                                    <Users className="w-4 h-4 text-slate-400" />
                                                    {res.partySize} ppl
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                    {getTableName(res.tableId)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${res.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                                                        res.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            res.status === 'Seated' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-slate-100 text-slate-800'
                                                    }`}>
                                                    {res.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                                                {res.notes || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button className="text-indigo-600 hover:text-indigo-900 transition-colors">Edit</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                    <th className="px-6 py-3 font-medium">Joined At</th>
                                    <th className="px-6 py-3 font-medium">Customer</th>
                                    <th className="px-6 py-3 font-medium">Party</th>
                                    <th className="px-6 py-3 font-medium">Quoted Wait</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {waitlist.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Waitlist is currently empty.</td></tr>
                                ) : (
                                    waitlist.map(entry => (
                                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                {new Date(entry.joinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-slate-900">{entry.customerName}</div>
                                                <div className="text-xs text-slate-500">{entry.phoneNumber || 'No phone'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1 text-sm text-slate-700">
                                                    <Users className="w-4 h-4 text-slate-400" />
                                                    {entry.partySize} ppl
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5 text-sm font-medium text-orange-600">
                                                    <Clock className="w-4 h-4" />
                                                    {entry.quotedWaitTime} min
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${entry.status === 'Waiting' ? 'bg-orange-100 text-orange-800' :
                                                        entry.status === 'Notified' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-slate-100 text-slate-800'
                                                    }`}>
                                                    {entry.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button className="text-indigo-600 hover:text-indigo-900 transition-colors mr-3">Notify</button>
                                                <button className="text-green-600 hover:text-green-900 transition-colors">Seat</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reservations;
