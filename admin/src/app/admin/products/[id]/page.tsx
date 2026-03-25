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
        <p className="text-4xl mb-3">❌</p>
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
