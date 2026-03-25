'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import { getAdminProducts, deleteProduct, updateProductStock } from '@/lib/api';

function InlineStockEdit({ productId, stock, onDone }: { productId: string; stock: number; onDone: () => void }) {
  const [value, setValue] = useState(String(stock));
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => updateProductStock(productId, parseInt(value, 10)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Stock updated');
      onDone();
    },
    onError: () => toast.error('Failed to update stock'),
  });

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') mutation.mutate(); if (e.key === 'Escape') onDone(); }}
        className="w-16 border border-rose-gold rounded px-2 py-1 text-sm focus:outline-none text-center"
        autoFocus
      />
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="text-green-600 hover:text-green-700 p-1"
        title="Save"
      >
        <FiCheck size={14} />
      </button>
      <button onClick={onDone} className="text-gray-400 hover:text-gray-600 p-1" title="Cancel">
        <FiX size={14} />
      </button>
    </div>
  );
}

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: () => getAdminProducts(search ? { search } : {}),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product removed');
    },
    onError: () => toast.error('Failed to remove product'),
  });

  const products = data?.products || [];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Products</h1>
        <Link href="/admin/products/new"
          className="btn-action bg-rose-gold text-white flex items-center gap-2 w-full sm:w-auto justify-center">
          <FiPlus size={20} /> Add New Product
        </Link>
      </div>

      <div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full max-w-md border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-rose-gold"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="card h-48 animate-pulse bg-gray-100" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="card text-center py-20">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-xl text-gray-500 mb-4">No products found</p>
          <Link href="/admin/products/new" className="btn-action bg-rose-gold text-white inline-block">
            Add Your First Product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className={`card relative ${!product.active ? 'opacity-60' : ''}`}>
              <div className="flex gap-3">
                <div className="relative w-16 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  {product.images?.[0] && (
                    <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="64px" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base line-clamp-2 leading-tight">{product.name}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{product.category?.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-rose-gold font-bold">₹{Number(product.price).toLocaleString('en-IN')}</p>
                    {!product.active && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Inactive</span>}
                    {product.stock <= 5 && product.stock > 0 && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">Low Stock</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {editingStock === product.id ? (
                      <InlineStockEdit
                        productId={product.id}
                        stock={product.stock}
                        onDone={() => setEditingStock(null)}
                      />
                    ) : (
                      <button
                        onClick={() => setEditingStock(product.id)}
                        className={`text-xs font-medium hover:underline ${product.stock <= 0 ? 'text-red-600' : product.stock <= 5 ? 'text-orange-600' : 'text-gray-500'}`}
                        title="Click to edit stock"
                      >
                        {product.stock <= 0 ? 'Out of Stock' : `Stock: ${product.stock}`} ✏️
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 text-blue-600 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-100 transition-colors"
                >
                  <FiEdit2 size={16} /> Edit
                </Link>
                <button
                  onClick={() => {
                    if (confirm(`Remove "${product.name}"?`)) {
                      deleteMutation.mutate(product.id);
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-600 py-2.5 rounded-lg font-medium text-sm hover:bg-red-100 transition-colors"
                >
                  <FiTrash2 size={16} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
