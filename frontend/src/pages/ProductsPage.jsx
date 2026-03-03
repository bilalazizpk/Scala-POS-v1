import React, { useState } from 'react';
import { useProducts, useCreateProduct, useDeleteProduct, useSearchProducts } from '../hooks';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Label from '../components/ui/Label.jsx';

const ProductsPage = () => {
  const [search, setSearch] = useState('');

  const { data: products = [], isLoading, error } = useProducts();
  const { data: searchResults = [] } = useSearchProducts(search);
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();

  const displayProducts = search.trim() ? searchResults : products;

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleAddProduct = async () => {
    try {
      await createProduct.mutateAsync({
        name: 'New Product',
        description: '',
        price: 0,
        stockQuantity: 0
      });
    } catch (err) {
      console.error('Failed to add product', err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await deleteProduct.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete product', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Products</h2>
        <Button onClick={handleAddProduct}>Add Product</Button>
      </div>

      <div>
        <Label htmlFor="search">Search Products</Label>
        <Input
          id="search"
          placeholder="Search by name..."
          value={search}
          onChange={handleSearch}
          className="mt-2"
        />
      </div>

      {error && <div className="bg-red-100 text-red-800 p-4 rounded">{error.message}</div>}

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Qty</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayProducts.map((product) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4">{product.id}</td>
                  <td className="px-6 py-4">{product.name}</td>
                  <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">{product.stockQuantity || 0}</td>
                  <td className="px-6 py-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
