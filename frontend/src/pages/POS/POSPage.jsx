import React from 'react';
import { useProducts, useCategories } from '../../hooks';
import { useCartStore, usePosStore } from '../../store';
import ProductGrid from '../../components/pos/ProductGrid';
import Cart from '../../components/pos/Cart';
import CategoryTabs from '../../components/pos/CategoryTabs';
import { Search } from 'lucide-react';

const POSPage = () => {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } = usePosStore();
  const addItem = useCartStore((state) => state.addItem);

  // Build category tabs: 'all' + real categories from API
  const categoryTabs = ['all', ...categories.map(c => c.name.toLowerCase())];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' ||
      product.category?.name?.toLowerCase() === selectedCategory ||
      categories.find(c => c.id === product.categoryId)?.name?.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* Products Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="bg-white border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Tabs — uses real API categories */}
        <CategoryTabs categories={categoryTabs} />

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ProductGrid products={filteredProducts} onAddItem={addItem} />
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white border-l">
        <Cart />
      </div>
    </div>
  );
};

export default POSPage;
