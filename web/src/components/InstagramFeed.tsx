'use client';

import { useState, useEffect } from 'react';

interface InstagramPost {
  id: number;
  imageUrl: string;
  caption: string;
  postUrl: string;
  type: 'photo' | 'reel';
}

const DEFAULT_POSTS: InstagramPost[] = [
  { id: 1, imageUrl: 'https://picsum.photos/seed/ig1/400/400', caption: 'New collection just dropped ✨', postUrl: 'https://instagram.com/srinidhi_boutique_by_suji', type: 'photo' },
  { id: 2, imageUrl: 'https://picsum.photos/seed/ig2/400/400', caption: 'Festival season ready 🌸', postUrl: 'https://instagram.com/srinidhi_boutique_by_suji', type: 'reel' },
  { id: 3, imageUrl: 'https://picsum.photos/seed/ig3/400/400', caption: 'Kanjivaram silk sarees 💫', postUrl: 'https://instagram.com/srinidhi_boutique_by_suji', type: 'photo' },
  { id: 4, imageUrl: 'https://picsum.photos/seed/ig4/400/400', caption: 'Bridal lehenga lookbook 👰', postUrl: 'https://instagram.com/srinidhi_boutique_by_suji', type: 'photo' },
  { id: 5, imageUrl: 'https://picsum.photos/seed/ig5/400/400', caption: 'Chikankari kurti vibes 🌿', postUrl: 'https://instagram.com/srinidhi_boutique_by_suji', type: 'reel' },
  { id: 6, imageUrl: 'https://picsum.photos/seed/ig6/400/400', caption: 'Office-to-party outfits 🎉', postUrl: 'https://instagram.com/srinidhi_boutique_by_suji', type: 'photo' },
];

// Instagram logo SVG (simplified)
function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function ReelIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
    </svg>
  );
}

export function InstagramFeed() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [handle, setHandle] = useState('srinidhi_boutique_by_suji');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sb-instagram-feed');
      setPosts(stored ? JSON.parse(stored) : DEFAULT_POSTS);
    } catch {
      setPosts(DEFAULT_POSTS);
    }
    try {
      const storedHandle = localStorage.getItem('sb-instagram-handle');
      if (storedHandle) setHandle(storedHandle);
    } catch {}
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const displayPosts = posts.slice(0, 6);

  return (
    <section className="bg-[#1a1a2e] py-14">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-[#c5a55a]">
            <InstagramIcon size={20} />
          </span>
          <p className="text-[#c5a55a] uppercase tracking-[0.3em] text-xs font-medium">Follow Our Story</p>
        </div>
        <h2 className="font-serif text-3xl text-white mb-2 font-bold">@{handle}</h2>
        <p className="text-white/50 text-sm">Tag us in your photos to be featured</p>
      </div>

      {/* Feed Grid — horizontal scroll on mobile, grid on desktop */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-8">
        {/* Mobile: horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:hidden">
          {displayPosts.map((post) => (
            <a
              key={post.id}
              href={post.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-[160px] group"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-800">
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <InstagramIcon size={24} />
                  </span>
                </div>
                {post.type === 'reel' && (
                  <span className="absolute top-2 right-2 bg-black/60 text-white backdrop-blur-sm rounded-full p-1">
                    <ReelIcon size={12} />
                  </span>
                )}
              </div>
              <p className="text-white/60 text-xs mt-1.5 line-clamp-1 px-0.5">{post.caption}</p>
            </a>
          ))}
        </div>

        {/* Desktop: grid */}
        <div className="hidden sm:grid grid-cols-3 md:grid-cols-6 gap-3">
          {displayPosts.map((post) => (
            <a
              key={post.id}
              href={post.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-800">
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex flex-col items-center justify-center gap-1">
                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <InstagramIcon size={22} />
                  </span>
                  <p className="text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center px-2 line-clamp-2">
                    {post.caption}
                  </p>
                </div>
                {post.type === 'reel' && (
                  <span className="absolute top-2 right-2 bg-black/60 text-white backdrop-blur-sm rounded-full p-1">
                    <ReelIcon size={12} />
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <a
          href={`https://instagram.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-[#c5a55a] px-8 py-3 rounded-full text-xs tracking-widest hover:bg-white/20 transition-all"
        >
          <InstagramIcon size={14} />
          FOLLOW @{handle}
        </a>
      </div>
    </section>
  );
}
