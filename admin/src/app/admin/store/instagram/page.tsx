'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiImage, FiX, FiCheck, FiInstagram, FiExternalLink } from 'react-icons/fi';

interface InstagramPost {
  id: number;
  imageUrl: string;
  caption: string;
  postUrl: string;
  type: 'photo' | 'reel';
}

const DEFAULT_POSTS: InstagramPost[] = [
  { id: 1, imageUrl: 'https://picsum.photos/seed/ig1/400/400', caption: 'New collection just dropped ✨', postUrl: 'https://instagram.com/srinidhiboutique', type: 'photo' },
  { id: 2, imageUrl: 'https://picsum.photos/seed/ig2/400/400', caption: 'Festival season ready 🌸', postUrl: 'https://instagram.com/srinidhiboutique', type: 'reel' },
  { id: 3, imageUrl: 'https://picsum.photos/seed/ig3/400/400', caption: 'Kanjivaram silk sarees 💫', postUrl: 'https://instagram.com/srinidhiboutique', type: 'photo' },
  { id: 4, imageUrl: 'https://picsum.photos/seed/ig4/400/400', caption: 'Bridal lehenga lookbook 👰', postUrl: 'https://instagram.com/srinidhiboutique', type: 'photo' },
  { id: 5, imageUrl: 'https://picsum.photos/seed/ig5/400/400', caption: 'Chikankari kurti vibes 🌿', postUrl: 'https://instagram.com/srinidhiboutique', type: 'reel' },
  { id: 6, imageUrl: 'https://picsum.photos/seed/ig6/400/400', caption: 'Office-to-party outfits 🎉', postUrl: 'https://instagram.com/srinidhiboutique', type: 'photo' },
];

const FEED_KEY = 'sb-instagram-feed';
const HANDLE_KEY = 'sb-instagram-handle';

export default function InstagramFeedManager() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [handle, setHandle] = useState('srinidhiboutique');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<InstagramPost | null>(null);
  const [mounted, setMounted] = useState(false);
  const [editingHandle, setEditingHandle] = useState(false);
  const [handleDraft, setHandleDraft] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FEED_KEY);
      setPosts(stored ? JSON.parse(stored) : DEFAULT_POSTS);
    } catch {
      setPosts(DEFAULT_POSTS);
    }
    try {
      const storedHandle = localStorage.getItem(HANDLE_KEY);
      if (storedHandle) setHandle(storedHandle);
    } catch {}
    setMounted(true);
  }, []);

  const persist = useCallback((updated: InstagramPost[]) => {
    setPosts(updated);
    localStorage.setItem(FEED_KEY, JSON.stringify(updated));
  }, []);

  const saveHandle = (value: string) => {
    const clean = value.replace(/^@/, '').trim();
    setHandle(clean);
    localStorage.setItem(HANDLE_KEY, clean);
    setEditingHandle(false);
  };

  const deletePost = (id: number) => persist(posts.filter((p) => p.id !== id));

  const startEdit = (post: InstagramPost) => {
    setEditingId(post.id);
    setEditForm({ ...post });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(null); };

  const saveEdit = () => {
    if (!editForm) return;
    persist(posts.map((p) => p.id === editForm.id ? editForm : p));
    cancelEdit();
  };

  const addPost = () => {
    const newId = posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1;
    const newPost: InstagramPost = {
      id: newId,
      imageUrl: 'https://picsum.photos/seed/ig-new/400/400',
      caption: 'New post caption',
      postUrl: `https://instagram.com/${handle}`,
      type: 'photo',
    };
    persist([...posts, newPost]);
    startEdit(newPost);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#c5a55a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass = "w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-[#1a1a2e] text-sm focus:outline-none focus:ring-2 focus:ring-[#c5a55a]/30 focus:border-[#c5a55a] transition-all";
  const labelClass = "text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1 block";

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e]">
          Instagram <span className="text-[#c5a55a]">Feed</span>
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Manage Instagram posts shown on the homepage</p>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <FiInstagram className="text-[#c5a55a] mt-0.5 flex-shrink-0" size={18} />
        <p className="text-amber-800 text-sm">
          Since Instagram API requires authentication, manage your feed posts here manually. Add the image URL, caption, and link to each post.
        </p>
      </div>

      {/* Instagram Handle */}
      <div className="bg-white/60 backdrop-blur-xl border border-gray-200/60 rounded-3xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[#1a1a2e] font-semibold text-sm">Instagram Handle</h2>
          {!editingHandle && (
            <button
              onClick={() => { setHandleDraft(handle); setEditingHandle(true); }}
              className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-[#c5a55a]/10 hover:text-[#c5a55a] transition-colors"
            >
              <FiEdit2 size={14} />
            </button>
          )}
        </div>
        {editingHandle ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">@</span>
            <input
              type="text"
              value={handleDraft}
              onChange={(e) => setHandleDraft(e.target.value.replace(/^@/, ''))}
              className={inputClass + ' flex-1'}
              placeholder="srinidhiboutique"
              autoFocus
            />
            <button onClick={() => setEditingHandle(false)} className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
              <FiX size={16} />
            </button>
            <button onClick={() => saveHandle(handleDraft)} className="p-2 rounded-xl bg-[#c5a55a]/10 text-[#c5a55a] hover:bg-[#c5a55a]/20 transition-colors">
              <FiCheck size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-[#1a1a2e]">@{handle}</span>
            <a
              href={`https://instagram.com/${handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#c5a55a] hover:text-[#1a1a2e] transition-colors"
            >
              <FiExternalLink size={14} />
            </a>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">Used for the &ldquo;Follow&rdquo; CTA button on the homepage.</p>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white/60 backdrop-blur-xl border border-gray-200/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
          >
            {editingId === post.id && editForm ? (
              /* Edit Mode */
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[#1a1a2e] font-semibold text-sm">Editing Post #{post.id}</h3>
                  <div className="flex gap-2">
                    <button onClick={cancelEdit} className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors">
                      <FiX size={16} />
                    </button>
                    <button onClick={saveEdit} className="p-2 rounded-xl bg-[#c5a55a]/10 text-[#c5a55a] hover:bg-[#c5a55a]/20 transition-colors">
                      <FiCheck size={16} />
                    </button>
                  </div>
                </div>

                <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={editForm.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>

                <label className="block">
                  <span className={labelClass}>Image URL</span>
                  <input type="text" value={editForm.imageUrl} onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })} className={inputClass} placeholder="https://..." />
                </label>
                <label className="block">
                  <span className={labelClass}>Caption</span>
                  <input type="text" value={editForm.caption} onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })} className={inputClass} placeholder="Short caption..." />
                </label>
                <label className="block">
                  <span className={labelClass}>Instagram Post URL</span>
                  <input type="text" value={editForm.postUrl} onChange={(e) => setEditForm({ ...editForm, postUrl: e.target.value })} className={inputClass} placeholder="https://instagram.com/p/..." />
                </label>
                <label className="block">
                  <span className={labelClass}>Type</span>
                  <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value as 'photo' | 'reel' })} className={inputClass}>
                    <option value="photo">Photo</option>
                    <option value="reel">Reel</option>
                  </select>
                </label>
              </div>
            ) : (
              /* View Mode */
              <div>
                <div className="relative aspect-square bg-gray-100">
                  <img src={post.imageUrl} alt={post.caption} className="w-full h-full object-cover" />
                  {post.type === 'reel' && (
                    <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm">
                      REEL
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all" />
                </div>
                <div className="p-3">
                  <p className="text-sm text-[#1a1a2e] font-medium line-clamp-1 mb-1">{post.caption}</p>
                  <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#c5a55a] hover:underline truncate block">
                    {post.postUrl}
                  </a>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <div className="flex-1" />
                    <button onClick={() => startEdit(post)} className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-[#c5a55a]/10 hover:text-[#c5a55a] transition-colors">
                      <FiEdit2 size={14} />
                    </button>
                    <button onClick={() => deletePost(post.id)} className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Post */}
      <button
        onClick={addPost}
        className="w-full py-4 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#c5a55a] hover:text-[#c5a55a] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
      >
        <FiPlus size={18} />
        Add New Post
      </button>
    </div>
  );
}
