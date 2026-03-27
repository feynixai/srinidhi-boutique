'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { createProduct, updateProduct, getCategories, Product } from '@/lib/api';

interface ProductFormProps {
  product?: Product;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const OCCASIONS = ['wedding', 'festival', 'casual', 'party'];

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price ? String(product.price) : '',
    comparePrice: product?.comparePrice ? String(product.comparePrice) : '',
    images: product?.images || [''],
    categoryId: product?.categoryId || '',
    sizes: product?.sizes || [],
    colors: product?.colors || [''],
    fabric: product?.fabric || '',
    occasion: product?.occasion || [],
    stock: product?.stock ? String(product.stock) : '0',
    featured: product?.featured || false,
    bestSeller: product?.bestSeller || false,
    onOffer: product?.onOffer || false,
    offerPercent: product?.offerPercent ? String(product.offerPercent) : '',
    active: product?.active ?? true,
    reelUrl: product?.reelUrl || '',
  });

  const [submitting, setSubmitting] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  function toggleArrayItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Product name is required'); return; }
    if (!form.price || isNaN(Number(form.price))) { toast.error('Valid price is required'); return; }

    setSubmitting(true);
    try {
      const data = {
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
        images: form.images.filter(Boolean),
        categoryId: form.categoryId || undefined,
        sizes: form.sizes,
        colors: form.colors.filter(Boolean),
        fabric: form.fabric || undefined,
        occasion: form.occasion,
        stock: Number(form.stock),
        featured: form.featured,
        bestSeller: form.bestSeller,
        onOffer: form.onOffer,
        offerPercent: form.offerPercent ? Number(form.offerPercent) : undefined,
        active: form.active,
        reelUrl: form.reelUrl || undefined,
      };

      if (isEdit && product) {
        await updateProduct(product.id, data);
        toast.success('Product updated!');
      } else {
        await createProduct(data);
        toast.success('Product created!');
      }
      router.push('/admin/products');
    } catch {
      toast.error('Failed to save product');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Basic Info */}
      <div className="card space-y-4">
        <h2 className="text-xl font-bold">Basic Information</h2>
        <div>
          <label className="block text-base font-semibold mb-2">Product Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-rose-gold"
            placeholder="e.g. Kanjivaram Silk Saree"
          />
        </div>
        <div>
          <label className="block text-base font-semibold mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-rose-gold"
            rows={4}
            placeholder="Describe the product..."
          />
        </div>
        <div>
          <label className="block text-base font-semibold mb-2">Category</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-rose-gold bg-white"
          >
            <option value="">Select category</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Pricing */}
      <div className="card space-y-4">
        <h2 className="text-xl font-bold">Pricing</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-base font-semibold mb-2">Selling Price (₹) *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-rose-gold"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-base font-semibold mb-2">Original Price (₹)</label>
            <input
              type="number"
              value={form.comparePrice}
              onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-rose-gold"
              placeholder="Strike-through price"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-base font-semibold mb-2">Stock Quantity</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-rose-gold"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-base font-semibold mb-2">Offer % (if on sale)</label>
            <input
              type="number"
              value={form.offerPercent}
              onChange={(e) => setForm({ ...form, offerPercent: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-rose-gold"
              placeholder="e.g. 20"
              max={100}
            />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="card space-y-3">
        <h2 className="text-xl font-bold">Product Images</h2>
        {form.images.map((img, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={img}
              onChange={(e) => {
                const newImgs = [...form.images];
                newImgs[i] = e.target.value;
                setForm({ ...form, images: newImgs });
              }}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-rose-gold"
              placeholder="Image URL"
            />
            {i > 0 && (
              <button type="button"
                onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })}
                className="px-3 text-red-500 hover:bg-red-50 rounded-xl">
                ✕
              </button>
            )}
          </div>
        ))}
        <button type="button"
          onClick={() => setForm({ ...form, images: [...form.images, ''] })}
          className="text-rose-gold font-medium text-sm hover:underline">
          + Add image URL
        </button>
      </div>

      {/* Sizes */}
      <div className="card">
        <h2 className="text-xl font-bold mb-3">Sizes</h2>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setForm({ ...form, sizes: toggleArrayItem(form.sizes, size) })}
              className={`px-4 py-2.5 border-2 rounded-xl text-base font-medium transition-colors ${
                form.sizes.includes(size)
                  ? 'border-rose-gold bg-rose-gold text-white'
                  : 'border-gray-200 hover:border-rose-gold'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="card space-y-3">
        <h2 className="text-xl font-bold">Colors</h2>
        {form.colors.map((color, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={color}
              onChange={(e) => {
                const newColors = [...form.colors];
                newColors[i] = e.target.value;
                setForm({ ...form, colors: newColors });
              }}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-rose-gold"
              placeholder="e.g. Rose Gold"
            />
            {i > 0 && (
              <button type="button"
                onClick={() => setForm({ ...form, colors: form.colors.filter((_, j) => j !== i) })}
                className="px-3 text-red-500 hover:bg-red-50 rounded-xl">
                ✕
              </button>
            )}
          </div>
        ))}
        <button type="button"
          onClick={() => setForm({ ...form, colors: [...form.colors, ''] })}
          className="text-rose-gold font-medium text-sm hover:underline">
          + Add color
        </button>
      </div>

      {/* Occasion */}
      <div className="card">
        <h2 className="text-xl font-bold mb-3">Occasion</h2>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((occ) => (
            <button
              key={occ}
              type="button"
              onClick={() => setForm({ ...form, occasion: toggleArrayItem(form.occasion, occ) })}
              className={`px-4 py-2.5 border-2 rounded-xl text-base font-medium capitalize transition-colors ${
                form.occasion.includes(occ)
                  ? 'border-rose-gold bg-rose-gold text-white'
                  : 'border-gray-200 hover:border-rose-gold'
              }`}
            >
              {occ}
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="card space-y-4">
        <h2 className="text-xl font-bold">Additional Details</h2>
        <div>
          <label className="block text-base font-semibold mb-2">Fabric</label>
          <input
            value={form.fabric}
            onChange={(e) => setForm({ ...form, fabric: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-rose-gold"
            placeholder="e.g. Pure Kanjivaram Silk"
          />
        </div>
        <div>
          <label className="block text-base font-semibold mb-2">Instagram Reel URL <span className="text-gray-400 font-normal text-sm">(optional)</span></label>
          <input
            value={form.reelUrl}
            onChange={(e) => setForm({ ...form, reelUrl: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-rose-gold"
            placeholder="https://www.instagram.com/reel/..."
          />
          <p className="text-xs text-gray-400 mt-1">If set, an embedded Instagram reel will appear on the product page.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'featured', label: 'Featured Product' },
            { key: 'bestSeller', label: 'Best Seller' },
            { key: 'onOffer', label: 'On Offer / Sale' },
            { key: 'active', label: 'Active (visible in store)' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form[key as keyof typeof form] as boolean}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                className="w-5 h-5 accent-rose-gold"
              />
              <span className="text-base font-medium">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="flex-1 btn-action bg-gray-100 text-gray-700 text-lg"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 btn-action bg-rose-gold text-white text-lg disabled:opacity-50"
        >
          {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
