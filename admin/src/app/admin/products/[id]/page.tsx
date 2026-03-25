'use client';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminProduct } from '@/lib/api';
import { ProductForm } from '@/components/ProductForm';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: product, isLoading } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => getAdminProduct(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-gray-100 rounded animate-pulse" />
        <div className="card h-96 animate-pulse bg-gray-100" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="card text-center py-16">
        <div className="text-red-400 flex justify-center mb-3"><svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
        <p className="text-xl text-gray-500">Product not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-3xl font-bold">Edit Product</h1>
      <ProductForm product={product} />
    </div>
  );
}
