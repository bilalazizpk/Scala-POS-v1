import React, { useState } from 'react';
import { Package, AlertTriangle, TrendingDown, TrendingUp, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const InventoryPage = () => {
  const [inventory] = useState([
    {
      id: 1,
      productName: 'Burger Deluxe',
      sku: 'FOOD-001',
      currentStock: 50,
      minStock: 20,
      reorderLevel: 30,
      unit: 'pieces',
      costPrice: 5.50,
      lastRestocked: '2025-02-25',
    },
    {
      id: 2,
      productName: 'Caesar Salad',
      sku: 'FOOD-002',
      currentStock: 15,
      minStock: 20,
      reorderLevel: 30,
      unit: 'pieces',
      costPrice: 4.00,
      lastRestocked: '2025-02-20',
    },
    {
      id: 3,
      productName: 'Espresso',
      sku: 'BEV-001',
      currentStock: 100,
      minStock: 50,
      reorderLevel: 70,
      unit: 'servings',
      costPrice: 0.80,
      lastRestocked: '2025-02-28',
    },
    {
      id: 4,
      productName: 'Chocolate Cake',
      sku: 'DES-001',
      currentStock: 8,
      minStock: 10,
      reorderLevel: 15,
      unit: 'slices',
      costPrice: 2.50,
      lastRestocked: '2025-02-27',
    },
  ]);

  const getStockStatus = (item) => {
    if (item.currentStock <= item.minStock) return { label: 'Critical', color: 'bg-red-100 text-red-800 border-red-200' };
    if (item.currentStock <= item.reorderLevel) return { label: 'Low', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    return { label: 'Good', color: 'bg-green-100 text-green-800 border-green-200' };
  };

  const lowStockItems = inventory.filter(item => item.currentStock <= item.reorderLevel);
  const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.costPrice), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Track and manage your stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Receive Stock
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-3xl font-bold text-gray-900">{inventory.length}</p>
            </div>
            <Package className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-3xl font-bold text-yellow-600">{lowStockItems.length}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inventory Value</p>
              <p className="text-3xl font-bold text-green-600">${totalValue.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Items</p>
              <p className="text-3xl font-bold text-red-600">
                {inventory.filter(item => item.currentStock <= item.minStock).length}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800">Low Stock Alert</h3>
              <p className="text-sm text-yellow-700">
                {lowStockItems.length} item(s) need restocking
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">SKU</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Current Stock</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Unit</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cost Price</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Last Restocked</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {inventory.map((item) => {
              const status = getStockStatus(item);
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{item.productName}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.sku}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-900">{item.currentStock}</span>
                      <span className="text-gray-600"> / {item.reorderLevel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.unit}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">${item.costPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.lastRestocked}</td>
                  <td className="px-6 py-4">
                    <Button size="sm" variant="outline">
                      Restock
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryPage;
