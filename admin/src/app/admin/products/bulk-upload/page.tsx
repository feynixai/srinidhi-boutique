'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { FiUploadCloud, FiTrash2, FiCheck, FiAlertCircle } from 'react-icons/fi';

interface ParsedProduct {
  name: string;
  price: number;
  comparePrice?: number;
  occasion: string[];
  sizes: string[];
  colors: string[];
  fabric?: string;
  stock: number;
  featured: boolean;
  bestSeller: boolean;
  images: string[];
}

function parseProducts(text: string): ParsedProduct[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const products: ParsedProduct[] = [];

  for (const line of lines) {
    // Name is everything before the first comma
    const firstComma = line.indexOf(',');
    if (firstComma === -1) continue;

    const name = line.substring(0, firstComma).trim();
    const rest = line.substring(firstComma + 1).toLowerCase();

    // Price: number after "price" (but not after "compare price" or "compare")
    let price = 0;
    const priceMatch = rest.match(/(?<![compare\s])price\s+(\d+(?:\.\d+)?)/);
    if (priceMatch) price = parseFloat(priceMatch[1]);

    // Compare price
    let comparePrice: number | undefined;
    const compareMatch = rest.match(/compare\s*(?:price)?\s+(\d+(?:\.\d+)?)/);
    if (compareMatch) comparePrice = parseFloat(compareMatch[1]);

    // Occasion: words after "occasion" until next keyword
    const occasionMatch = rest.match(/occasions?\s+(.+?)(?:,\s*(?:sizes?|colors?|fabric|stock|featured|best\s*seller|$))/);
    let occasion: string[] = [];
    if (occasionMatch) {
      occasion = occasionMatch[1]
        .split(/\s+and\s+|,\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Sizes
    const sizesMatch = rest.match(/sizes?\s+(.+?)(?:,\s*(?:colors?|fabric|stock|occasion|featured|best\s*seller|price|compare|$))/);
    let sizes: string[] = [];
    if (sizesMatch) {
      sizes = sizesMatch[1]
        .split(/\s+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
        .filter((s) => !['AND', ','].includes(s));
    }

    // Colors
    const colorsMatch = rest.match(/colors?\s+(.+?)(?:,\s*(?:sizes?|fabric|stock|occasion|featured|best\s*seller|price|compare|$))/);
    let colors: string[] = [];
    if (colorsMatch) {
      colors = colorsMatch[1]
        .split(/\s+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((s) => !['and', ','].includes(s.toLowerCase()))
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
    }

    // Fabric
    const fabricMatch = rest.match(/(?:^|,\s*)([a-z]+)\s+fabric/);
    let fabric: string | undefined;
    if (fabricMatch) {
      fabric = fabricMatch[1].charAt(0).toUpperCase() + fabricMatch[1].slice(1);
    }

    // Stock
    const stockMatch = rest.match(/stock\s+(\d+)/);
    const stock = stockMatch ? parseInt(stockMatch[1], 10) : 0;

    // Featured / BestSeller
    const featured = /\bfeatured\b/.test(rest);
    const bestSeller = /\bbest\s*seller\b/.test(rest);

    if (name && price > 0) {
      products.push({
        name,
        price,
        comparePrice,
        occasion,
        sizes,
        colors,
        fabric,
        stock,
        featured,
        bestSeller,
        images: [],
      });
    }
  }

  return products;
}

export default function BulkUploadPage() {
  const [rawText, setRawText] = useState('');
  const [products, setProducts] = useState<ParsedProduct[]>([]);
  const [parsed, setParsed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);

  function handleParse() {
    const parsed = parseProducts(rawText);
    setProducts(parsed);
    setParsed(true);
    setResult(null);
  }

  function updateProduct(index: number, field: keyof ParsedProduct, value: unknown) {
    setProducts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function removeProduct(index: number) {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    setUploading(true);
    setResult(null);
    try {
      const token = localStorage.getItem('admin_token');
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await api.post('/api/admin/products/bulk-create', { products }, { headers });
      setResult({ success: true, count: res.data.count });
      setProducts([]);
      setParsed(false);
      setRawText('');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Upload failed';
      setResult({ success: false, error: message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-3 md:p-6 max-w-6xl mx-auto">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Bulk Product Upload</h1>
        <p className="text-gray-500 mt-1">
          Type products in natural language, parse them, review, and upload all at once.
        </p>
      </div>

      {result && (
        <div
          className={`mb-6 p-4 rounded-xl border ${
            result.success
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {result.success ? <FiCheck size={20} /> : <FiAlertCircle size={20} />}
            <span className="font-medium">
              {result.success ? `Successfully created ${result.count} products!` : result.error}
            </span>
          </div>
        </div>
      )}

      {!parsed ? (
        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter products (one per line)
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={8}
            placeholder={`Red Kanjivaram Silk Saree, price 12500, compare price 15000, wedding and festival occasion, sizes Free Size, colors Red Gold, silk fabric, stock 5, featured

Blue Cotton Office Kurti, price 1200, compare 1800, office occasion, sizes S M L XL, colors Blue, cotton fabric, stock 20`}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#B76E79] focus:outline-none transition-colors text-gray-800 font-mono text-sm"
          />

          <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
            <strong>Format guide:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li><code>Product Name, price 1200</code> — name before first comma, price after &quot;price&quot;</li>
              <li><code>compare price 1500</code> or <code>compare 1500</code> — original price</li>
              <li><code>occasion wedding and festival</code> — occasions separated by &quot;and&quot; or commas</li>
              <li><code>sizes S M L XL</code> or <code>size Free Size</code></li>
              <li><code>colors Red Gold Blue</code></li>
              <li><code>silk fabric</code> or <code>cotton fabric</code></li>
              <li><code>stock 10</code></li>
              <li><code>featured</code> / <code>bestseller</code></li>
            </ul>
          </div>

          <button
            onClick={handleParse}
            disabled={!rawText.trim()}
            className="mt-4 px-6 py-3 bg-[#8B1A4A] text-white rounded-xl hover:bg-[#6d1439] transition-all font-medium disabled:opacity-40"
          >
            Parse Products
          </button>
        </div>
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <p className="text-gray-600 text-sm">
              <strong>{products.length}</strong> products parsed. Review and edit below.
            </p>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => { setParsed(false); setProducts([]); }}
                className="flex-1 sm:flex-none px-4 py-2 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all text-sm"
              >
                ← Back
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || products.length === 0}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-[#8B1A4A] text-white rounded-xl hover:bg-[#6d1439] transition-all font-medium disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
              >
                <FiUploadCloud size={18} />
                {uploading ? 'Uploading...' : `Upload All (${products.length})`}
              </button>
            </div>
          </div>

          {products.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
              No products were parsed. Check your input format and try again.
            </div>
          )}

          <div className="space-y-4">
            {products.map((product, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm p-4 md:p-6 border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    #{idx + 1} — {product.name}
                  </h3>
                  <button
                    onClick={() => removeProduct(idx)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Remove"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                    <input
                      value={product.name}
                      onChange={(e) => updateProduct(idx, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#B76E79] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) => updateProduct(idx, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#B76E79] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Compare Price (₹)</label>
                    <input
                      type="number"
                      value={product.comparePrice || ''}
                      onChange={(e) => updateProduct(idx, 'comparePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#B76E79] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Stock</label>
                    <input
                      type="number"
                      value={product.stock}
                      onChange={(e) => updateProduct(idx, 'stock', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#B76E79] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Sizes</label>
                    <input
                      value={product.sizes.join(' ')}
                      onChange={(e) => updateProduct(idx, 'sizes', e.target.value.split(/\s+/).filter(Boolean))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#B76E79] focus:outline-none"
                      placeholder="S M L XL"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Colors</label>
                    <input
                      value={product.colors.join(' ')}
                      onChange={(e) => updateProduct(idx, 'colors', e.target.value.split(/\s+/).filter(Boolean))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#B76E79] focus:outline-none"
                      placeholder="Red Blue Gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Fabric</label>
                    <input
                      value={product.fabric || ''}
                      onChange={(e) => updateProduct(idx, 'fabric', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#B76E79] focus:outline-none"
                      placeholder="Silk, Cotton..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Occasion</label>
                    <input
                      value={product.occasion.join(', ')}
                      onChange={(e) => updateProduct(idx, 'occasion', e.target.value.split(/,\s*/).filter(Boolean))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#B76E79] focus:outline-none"
                      placeholder="wedding, festival"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-4">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={product.featured}
                      onChange={(e) => updateProduct(idx, 'featured', e.target.checked)}
                      className="rounded border-gray-300 text-[#8B1A4A] focus:ring-[#B76E79]"
                    />
                    Featured
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={product.bestSeller}
                      onChange={(e) => updateProduct(idx, 'bestSeller', e.target.checked)}
                      className="rounded border-gray-300 text-[#8B1A4A] focus:ring-[#B76E79]"
                    />
                    Best Seller
                  </label>
                </div>

                {/* Image URLs */}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Image URLs (comma-separated)
                  </label>
                  <input
                    value={product.images.join(', ')}
                    onChange={(e) =>
                      updateProduct(
                        idx,
                        'images',
                        e.target.value.split(/,\s*/).map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#B76E79] focus:outline-none"
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    📸 Image upload coming soon — paste image URLs for now
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
