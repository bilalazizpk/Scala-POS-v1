import React from 'react';
import { usePosStore } from '../../store';

const CategoryTabs = ({ categories }) => {
  const { selectedCategory, setSelectedCategory } = usePosStore();

  return (
    <div className="bg-white border-b px-4 py-3">
      <div className="flex gap-2 overflow-x-auto">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryTabs;
