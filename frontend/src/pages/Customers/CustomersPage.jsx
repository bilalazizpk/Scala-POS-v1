import React, { useState } from 'react';
import { Search, Plus, User, Star, Phone, Mail, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const CustomersPage = () => {
  const [search, setSearch] = useState('');
  const [customers] = useState([
    {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
      loyaltyPoints: 250,
      membershipTier: 'Gold',
      totalSpent: 1250.00,
      visitCount: 25,
      lastVisit: '2025-02-25',
    },
    {
      id: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '555-5678',
      loyaltyPoints: 150,
      membershipTier: 'Silver',
      totalSpent: 750.00,
      visitCount: 15,
      lastVisit: '2025-02-28',
    },
    {
      id: 3,
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob@example.com',
      phone: '555-9012',
      loyaltyPoints: 450,
      membershipTier: 'Platinum',
      totalSpent: 4500.00,
      visitCount: 50,
      lastVisit: '2025-03-01',
    },
  ]);

  const getTierColor = (tier) => {
    const colors = {
      Platinum: 'bg-purple-100 text-purple-800 border-purple-200',
      Gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Silver: 'bg-gray-100 text-gray-800 border-gray-200',
      Bronze: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[tier] || colors.Bronze;
  };

  const filteredCustomers = customers.filter(customer =>
    customer.firstName.toLowerCase().includes(search.toLowerCase()) ||
    customer.lastName.toLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">Manage your customer relationships and loyalty</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Customers</p>
          <p className="text-3xl font-bold text-gray-900">{customers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Platinum Members</p>
          <p className="text-3xl font-bold text-purple-600">
            {customers.filter(c => c.membershipTier === 'Platinum').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Gold Members</p>
          <p className="text-3xl font-bold text-yellow-600">
            {customers.filter(c => c.membershipTier === 'Gold').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600">
            ${customers.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search customers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {customer.firstName} {customer.lastName}
                  </h3>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getTierColor(customer.membershipTier)}`}>
                    {customer.membershipTier}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                {customer.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                {customer.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                Last visit: {customer.lastVisit}
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Loyalty Points</span>
                <span className="font-semibold text-blue-600 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current" />
                  {customer.loyaltyPoints}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Spent</span>
                <span className="font-semibold text-green-600">${customer.totalSpent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Visits</span>
                <span className="font-semibold text-gray-900">{customer.visitCount}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                View Profile
              </Button>
              <Button size="sm" className="flex-1">
                Add Points
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomersPage;
