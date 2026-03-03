import React, { useState } from 'react';
import {
    Users, Plus, Search, Edit2, Trash2, X, Eye, EyeOff,
    BadgeCheck, Shield, Coffee, ChefHat, Truck, Calendar as CalendarIcon, Clock
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { useStaff, useCreateStaff, useUpdateStaff, useDeleteStaff } from '../../hooks';
import { ShiftCalendar } from './ShiftCalendar';
import { TimeClock } from './TimeClock';

const ROLES = [
    { id: 'admin', label: 'Admin', icon: Shield, color: 'bg-red-100 text-red-700', badge: 'bg-red-500' },
    { id: 'manager', label: 'Manager', icon: BadgeCheck, color: 'bg-purple-100 text-purple-700', badge: 'bg-purple-500' },
    { id: 'cashier', label: 'Cashier', icon: Coffee, color: 'bg-blue-100 text-blue-700', badge: 'bg-blue-500' },
    { id: 'kitchen', label: 'Kitchen', icon: ChefHat, color: 'bg-orange-100 text-orange-700', badge: 'bg-orange-500' },
    { id: 'delivery', label: 'Delivery', icon: Truck, color: 'bg-green-100 text-green-700', badge: 'bg-green-500' },
];

const getRoleConfig = (role) => ROLES.find(r => r.id === role) || ROLES[2];

const StaffCard = ({ staff, onEdit, onDelete }) => {
    const roleConfig = getRoleConfig(staff.role);
    const Icon = roleConfig.icon;
    const initials = `${staff.firstName[0]}${staff.lastName[0]}`.toUpperCase();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className={`h-1.5 ${roleConfig.badge}`} />
            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${roleConfig.color}`}>
                            {initials}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{staff.firstName} {staff.lastName}</h3>
                            <p className="text-sm text-gray-500">{staff.employeeId}</p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleConfig.color}`}>
                        <Icon className="w-3 h-3" />
                        {roleConfig.label}
                    </span>
                </div>

                <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="w-14 text-gray-400 text-xs">Email</span>
                        <span className="truncate">{staff.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-14 text-gray-400 text-xs">Phone</span>
                        <span>{staff.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-14 text-gray-400 text-xs">Rate</span>
                        <span className="font-medium text-gray-900">${staff.hourlyRate?.toFixed(2)}/hr</span>
                    </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-50">
                    <button
                        onClick={() => onEdit(staff)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(staff)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
};

const defaultForm = {
    firstName: '', lastName: '', email: '', phone: '',
    role: 'cashier', pinCode: '', hourlyRate: '', employeeId: '',
};

const StaffModal = ({ isOpen, onClose, editStaff, onCreate, onUpdate }) => {
    const [form, setForm] = useState(editStaff || defaultForm);
    const [showPin, setShowPin] = useState(false);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        setForm(editStaff || defaultForm);
        setShowPin(false);
    }, [editStaff, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editStaff) {
                await onUpdate({ ...form, id: editStaff.id });
            } else {
                await onCreate(form);
            }
            onClose();
        } catch (err) {
            alert('Failed to save staff member. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-xl font-bold text-gray-900">
                        {editStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input id="firstName" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                                className="mt-1" required placeholder="John" />
                        </div>
                        <div>
                            <Label htmlFor="lastName">Last Name *</Label>
                            <Input id="lastName" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                                className="mt-1" required placeholder="Smith" />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                            className="mt-1" placeholder="john@example.com" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                className="mt-1" placeholder="+1 234 567 8900" />
                        </div>
                        <div>
                            <Label htmlFor="employeeId">Employee ID</Label>
                            <Input id="employeeId" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}
                                className="mt-1" placeholder="EMP004" />
                        </div>
                    </div>

                    <div>
                        <Label>Role *</Label>
                        <div className="grid grid-cols-5 gap-2 mt-1">
                            {ROLES.map(role => {
                                const Icon = role.icon;
                                return (
                                    <button key={role.id} type="button" onClick={() => setForm({ ...form, role: role.id })}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 text-xs font-medium transition ${form.role === role.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}>
                                        <Icon className="w-4 h-4" />
                                        {role.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="pinCode">PIN Code *</Label>
                            <div className="relative mt-1">
                                <Input id="pinCode" type={showPin ? 'text' : 'password'} value={form.pinCode}
                                    onChange={e => setForm({ ...form, pinCode: e.target.value })}
                                    required maxLength={6} placeholder="4-6 digits" />
                                <button type="button" onClick={() => setShowPin(!showPin)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                            <Input id="hourlyRate" type="number" value={form.hourlyRate}
                                onChange={e => setForm({ ...form, hourlyRate: e.target.value })}
                                className="mt-1" step="0.01" min="0" placeholder="15.00" />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={loading}>
                            {loading ? 'Saving...' : editStaff ? 'Update Staff' : 'Add Staff Member'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const HRPage = () => {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editStaff, setEditStaff] = useState(null);
    const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'schedule'

    const { data: staffList = [], isLoading } = useStaff();
    const createStaff = useCreateStaff();
    const updateStaff = useUpdateStaff();
    const deleteStaff = useDeleteStaff();

    const filtered = staffList.filter(s => {
        const matchSearch = `${s.firstName} ${s.lastName} ${s.email} ${s.employeeId}`
            .toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === 'all' || s.role === roleFilter;
        return matchSearch && matchRole;
    });

    const roleCounts = ROLES.reduce((acc, r) => {
        acc[r.id] = staffList.filter(s => s.role === r.id).length;
        return acc;
    }, {});

    const handleDelete = async (staff) => {
        if (!window.confirm(`Remove ${staff.firstName} ${staff.lastName} from staff?`)) return;
        await deleteStaff.mutateAsync(staff.id);
    };

    const handleEdit = (staff) => {
        setEditStaff(staff);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditStaff(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <StaffModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editStaff={editStaff}
                onCreate={(data) => createStaff.mutateAsync(data)}
                onUpdate={(data) => updateStaff.mutateAsync(data)}
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">HR & Staff Management</h1>
                    <p className="text-gray-600 mt-1">{staffList.length} total staff members</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('directory')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'directory' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users className="w-4 h-4" /> Directory
                    </button>
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'schedule' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <CalendarIcon className="w-4 h-4" /> Schedule
                    </button>
                    <button
                        onClick={() => setActiveTab('clock')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'clock' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Clock className="w-4 h-4" /> Time Clock
                    </button>
                </div>

                {activeTab === 'directory' && (
                    <Button onClick={handleAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4" />
                        Add Staff Member
                    </Button>
                )}
            </div>

            {activeTab === 'schedule' ? (
                <ShiftCalendar staffList={staffList} />
            ) : activeTab === 'clock' ? (
                <TimeClock staffList={staffList} />
            ) : (
                <>
                    {/* Role Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {ROLES.map(role => {
                            const Icon = role.icon;
                            return (
                                <button key={role.id} onClick={() => setRoleFilter(roleFilter === role.id ? 'all' : role.id)}
                                    className={`p-3 rounded-xl border-2 transition text-left ${roleFilter === role.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'
                                        }`}>
                                    <div className={`inline-flex p-1.5 rounded-lg mb-2 ${role.color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <p className="text-xs text-gray-500">{role.label}</p>
                                    <p className="text-xl font-bold text-gray-900">{roleCounts[role.id] || 0}</p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search & Filter */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search staff by name, email, or ID..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Staff Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-white rounded-xl h-48 animate-pulse border border-gray-100" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No staff members found</p>
                            <p className="text-gray-400 text-sm mt-1">
                                {search ? 'Try a different search term' : 'Add your first staff member to get started'}
                            </p>
                            {!search && (
                                <Button onClick={handleAdd} className="mt-4 bg-blue-600 hover:bg-blue-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Staff Member
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map(staff => (
                                <StaffCard key={staff.id} staff={staff} onEdit={handleEdit} onDelete={handleDelete} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default HRPage;
