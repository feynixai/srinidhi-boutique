import { ProductForm } from '@/components/ProductForm';

export default function NewProductPage() {
  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-3xl font-bold">Add New Product</h1>
      <ProductForm />
    </div>
  );
}
