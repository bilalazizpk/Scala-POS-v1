import React from 'react';
import { Plus } from 'lucide-react';

const ProductGrid = ({ products, onAddItem }) => {
  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onAddItem(product)}
          className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 text-left group"
        >
          <div className="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 text-4xl">🍽️</span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-blue-600">${product.price.toFixed(2)}</span>
            <div className="bg-blue-600 text-white p-2 rounded-full group-hover:scale-110 transition">
              <Plus className="w-4 h-4" />
            </div>
          </div>
          {product.stockQuantity <= 5 && (
            <p className="text-xs text-red-600 mt-2">Low stock: {product.stockQuantity}</p>
          )}
        </button>
      ))}
    </div>
  );
};

export default ProductGrid;
