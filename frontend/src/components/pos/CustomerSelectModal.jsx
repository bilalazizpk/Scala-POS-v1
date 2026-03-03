import React, { useState, useEffect } from 'react';
import { X, Search, UserCircle, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { customerService } from '../../services/api';

const CustomerSelectModal = ({ isOpen, onClose, onSelect }) => {
    const [customers, setCustomers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadCustomers();
        }
    }, [isOpen]);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const res = await customerService.getAll();
            setCustomers(res.data);
        } catch (err) {
            console.error('Error loading customers:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery)
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <UserCircle className="w-6 h-6 text-blue-600" />
                        Select Customer
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="text-center text-gray-500 p-8">
                            No customers found.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredCustomers.map(customer => (
                                <div
                                    key={customer.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-500 cursor-pointer transition"
                                    onClick={() => {
                                        onSelect(customer);
                                        onClose();
                                    }}
                                >
                                    <div>
                                        <h3 className="font-semibold">{customer.firstName} {customer.lastName}</h3>
                                        <p className="text-sm text-gray-500">{customer.email} • {customer.phone}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
                      ${customer.membershipTier === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                                                customer.membershipTier === 'Silver' ? 'bg-gray-200 text-gray-800' :
                                                    customer.membershipTier === 'Bronze' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-blue-100 text-blue-800'}`}>
                                            <Star className="w-3 h-3" />
                                            {customer.membershipTier || 'Member'}
                                        </span>
                                        <p className="text-sm font-medium mt-1 text-green-600">{customer.loyaltyPoints} Pts</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerSelectModal;
