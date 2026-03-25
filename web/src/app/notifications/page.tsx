'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { FiPackage, FiTag, FiZap, FiGift } from 'react-icons/fi';

interface Notification {
  id: string;
  type: 'order_update' | 'price_drop' | 'flash_sale' | 'loyalty_reward';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

const TYPE_CONFIG = {
  order_update: { icon: <FiPackage size={22} />, color: 'bg-blue-50 border-blue-200' },
  price_drop: { icon: <FiTag size={22} />, color: 'bg-green-50 border-green-200' },
  flash_sale: { icon: <FiZap size={22} />, color: 'bg-orange-50 border-orange-200' },
  loyalty_reward: { icon: <FiGift size={22} />, color: 'bg-purple-50 border-purple-200' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // For demo, use a mock userId from localStorage
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/user-notifications/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  async function markRead(id: string) {
    if (!userId) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user-notifications/${userId}/${id}/read`, { method: 'PATCH' });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    if (!userId) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user-notifications/${userId}/read-all`, { method: 'POST' });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  if (!userId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <BellIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
        <h1 className="font-serif text-2xl text-charcoal mb-3">Notifications</h1>
        <p className="text-charcoal/60 mb-6">Please log in to view your notifications.</p>
        <Link href="/login" className="btn-gold px-8 py-3 text-sm tracking-widest">LOGIN</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-charcoal">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-charcoal/60 text-sm mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm text-rose-gold hover:underline"
          >
            <CheckIcon className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <BellIcon className="w-16 h-16 mx-auto text-gray-200 mb-4" />
          <p className="text-charcoal/50">No notifications yet.</p>
          <p className="text-charcoal/40 text-sm mt-1">We'll let you know about your orders, price drops, and more.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.order_update;
            const content = (
              <div
                className={`border rounded p-4 flex gap-3 items-start transition-opacity ${cfg.color} ${n.read ? 'opacity-70' : ''}`}
                onClick={() => !n.read && markRead(n.id)}
              >
                <span className="text-[#c5a55a] flex-shrink-0 mt-0.5">{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold text-charcoal ${!n.read ? 'text-charcoal' : 'text-charcoal/70'}`}>
                      {n.title}
                    </p>
                    {!n.read && <span className="w-2 h-2 bg-rose-gold rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-charcoal/70 mt-0.5">{n.message}</p>
                  <p className="text-xs text-charcoal/40 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link} className="block cursor-pointer">{content}</Link>
            ) : (
              <div key={n.id} className="cursor-pointer">{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
