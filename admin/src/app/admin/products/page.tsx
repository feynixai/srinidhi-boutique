'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiSearch, FiFilter } from 'react-icons/fi';
import { getAdminProducts, deleteProduct, updateProductStock, updateProductActive, getCategories } from '@/lib/api';

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
        className="w-16 border border-[#c5a55a] rounded-lg px-2 py-1 text-sm focus:outline-none text-center bg-white"
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

function StatusToggle({ productId, active }: { productId: string; active: boolean }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => updateProductActive(productId, !active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(active ? 'Product hidden from store' : 'Product now live');
    },
    onError: () => toast.error('Failed to update status'),
  });

  return (
    <button
      onClick={(e) => { e.stopPropagation(); mutation.mutate(); }}
      disabled={mutation.isPending}
      title={active ? 'Click to deactivate' : 'Click to activate'}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 disabled:opacity-50 flex-shrink-0 ${
        active ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          active ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, categoryFilter],
    queryFn: () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoryFilter) params.categoryId = categoryFilter;
      return getAdminProducts(params);
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Products</h1>
          <p className="text-gray-400 text-sm mt-0.5">{data?.total ?? 0} total products</p>
        </div>
        <Link href="/admin/products/new"
          className="btn-action bg-[#c5a55a] text-[#1a1a2e] flex items-center gap-2 w-full sm:w-auto justify-center font-bold">
          <FiPlus size={18} /> Add New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-white/80 border border-white/50 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#c5a55a] transition-colors"
          />
        </div>
        <div className="relative sm:w-48">
          <FiFilter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-white/80 border border-white/50 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#c5a55a] transition-colors appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Table */}
      {isLoading ? (
        <div className="glass-card p-0 overflow-hidden">
          <div className="space-y-0 divide-y divide-black/5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="w-12 h-16 bg-gray-200 animate-pulse rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 animate-pulse rounded w-48" />
                  <div className="h-3 bg-gray-100 animate-pulse rounded w-24" />
                </div>
                <div className="h-4 bg-gray-200 animate-pulse rounded w-20" />
              </div>
            ))}
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card text-center py-20">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-xl text-gray-500 mb-4">No products found</p>
          {search || categoryFilter ? (
            <button
              onClick={() => { setSearch(''); setCategoryFilter(''); }}
              className="text-[#c5a55a] hover:underline text-sm font-medium"
            >
              Clear filters
            </button>
          ) : (
            <Link href="/admin/products/new" className="btn-action bg-[#c5a55a] text-[#1a1a2e] inline-flex items-center gap-2 font-bold">
              <FiPlus size={16} /> Add First Product
            </Link>
          )}
        </div>
      ) : (
        <div className="glass-card p-0 overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[56px_1fr_120px_100px_80px_100px_80px] items-center gap-4 px-6 py-3 bg-[#f5f5f0]/80 text-xs uppercase tracking-widest text-gray-400 font-semibold border-b border-white/30">
            <span>Image</span>
            <span>Product</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Status</span>
            <span>Category</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-black/5">
            {products.map((product) => (
              <div
                key={product.id}
                className={`flex md:grid md:grid-cols-[56px_1fr_120px_100px_80px_100px_80px] items-center gap-3 md:gap-4 px-4 md:px-6 py-4 hover:bg-white/40 transition-colors ${
                  !product.active ? 'opacity-60' : ''
                }`}
              >
                {/* Image */}
                <div className="relative w-12 h-16 flex-shrink-0 bg-[#f5e8d8] rounded-lg overflow-hidden">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[#c5a55a] text-xs font-serif font-bold">SB</span>
                    </div>
                  )}
                </div>

                {/* Name + mobile info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1a1a2e] text-sm line-clamp-2 leading-snug">{product.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 md:hidden">{product.category?.name}</p>
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
                        className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors md:hidden ${
                          product.stock <= 0
                            ? 'bg-red-100 text-red-600'
                            : product.stock <= 5
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title="Click to edit stock"
                      >
                        {product.stock <= 0 ? 'Out of stock' : `Stock: ${product.stock}`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="hidden md:block">
                  <p className="font-bold text-[#1a1a2e] text-sm">₹{Number(product.price).toLocaleString('en-IN')}</p>
                  {product.comparePrice && (
                    <p className="text-xs text-gray-400 line-through">₹{Number(product.comparePrice).toLocaleString('en-IN')}</p>
                  )}
                </div>

                {/* Stock */}
                <div className="hidden md:flex items-center">
                  {editingStock === product.id ? (
                    <InlineStockEdit
                      productId={product.id}
                      stock={product.stock}
                      onDone={() => setEditingStock(null)}
                    />
                  ) : (
                    <button
                      onClick={() => setEditingStock(product.id)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                        product.stock <= 0
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : product.stock <= 5
                          ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Click to edit stock"
                    >
                      {product.stock <= 0 ? '0 — Out' : product.stock}
                    </button>
                  )}
                </div>

                {/* Status toggle */}
                <div className="hidden md:flex items-center">
                  <StatusToggle productId={product.id} active={product.active} />
                </div>

                {/* Category */}
                <div className="hidden md:block">
                  <p className="text-xs text-gray-500 truncate">{product.category?.name || '—'}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto md:ml-0 md:justify-end">
                  {/* Status toggle on mobile */}
                  <div className="md:hidden">
                    <StatusToggle productId={product.id} active={product.active} />
                  </div>
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    title="Edit"
                  >
                    <FiEdit2 size={15} />
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(`Remove "${product.name}"?`)) {
                        deleteMutation.mutate(product.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
