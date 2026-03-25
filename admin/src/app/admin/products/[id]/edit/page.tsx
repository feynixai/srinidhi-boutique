'use client';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProductForm } from '@/components/ProductForm';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: product, isLoading } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => api.get(`/api/admin/products`).then((r) =>
      r.data.products.find((p: { id: string }) => p.id === id)
    ),
  });

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-10 bg-gray-100 animate-pulse rounded-lg w-48" />
      {[1, 2, 3].map((i) => <div key={i} className="card h-32 animate-pulse bg-gray-100" />)}
    </div>
  );

  if (!product) return <div className="text-center py-20 text-gray-400 text-xl">Product not found</div>;

  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-3xl font-bold">Edit Product</h1>
      <ProductForm product={product} />
    </div>
  );
}
