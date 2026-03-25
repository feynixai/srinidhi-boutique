'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  featured: boolean;
  active: boolean;
  productIds: string[];
  createdAt: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function CollectionsAdminPage() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', featured: false });

  const { data: collections = [], isLoading } = useQuery<Collection[]>({
    queryKey: ['admin-collections'],
    queryFn: () => fetch(`${API}/collections`).then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-collections'] });
      setCreating(false);
      setForm({ name: '', description: '', featured: false });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await fetch(`${API}/collections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-collections'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`${API}/collections/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-collections'] }),
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Collections</h1>
          <p className="text-gray-500 text-sm mt-1">Curated product groups shown on the store</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-700"
        >
          + New Collection
        </button>
      </div>

      {creating && (
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold mb-4">New Collection</h2>
          <div className="space-y-3">
            <input
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              placeholder="Collection name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <textarea
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
              rows={2}
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              />
              Feature on homepage
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => form.name.trim() && createMutation.mutate()}
                disabled={!form.name.trim() || createMutation.isPending}
                className="bg-green-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
              <button onClick={() => setCreating(false)} className="border px-4 py-2 rounded text-sm text-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />)}</div>
      ) : collections.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No collections yet.</div>
      ) : (
        <div className="space-y-3">
          {collections.map((col) => (
            <div key={col.id} className="bg-white rounded-xl border shadow-sm p-5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">{col.name}</h3>
                  {col.featured && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Featured</span>}
                  {!col.active && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Hidden</span>}
                </div>
                {col.description && <p className="text-sm text-gray-500 truncate mt-0.5">{col.description}</p>}
                <p className="text-xs text-gray-400 mt-1">{col.productIds.length} products · /collection/{col.slug}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/collection/${col.slug}`}
                  target="_blank"
                  className="text-xs text-blue-500 hover:underline"
                >
                  View →
                </Link>
                <button
                  onClick={() => toggleActive.mutate({ id: col.id, active: !col.active })}
                  className={`text-xs px-3 py-1.5 rounded font-medium ${col.active ? 'border text-gray-600 hover:bg-gray-50' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                  {col.active ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => confirm(`Delete "${col.name}"?`) && deleteMutation.mutate(col.id)}
                  className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
