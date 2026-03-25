/**
 * Simple in-memory cache with TTL
 * For production, replace with Redis via ioredis
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  size(): number {
    return this.store.size;
  }

  // Clean up expired entries (call periodically)
  gc(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}

export const cache = new MemoryCache();

// Run GC every 5 minutes
setInterval(() => cache.gc(), 5 * 60 * 1000);

export const TTL = {
  PRODUCTS: 5 * 60 * 1000,   // 5 minutes
  CATEGORIES: 10 * 60 * 1000, // 10 minutes
  FEATURED: 5 * 60 * 1000,    // 5 minutes
};
