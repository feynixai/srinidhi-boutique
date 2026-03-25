'use client';
import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';

const DISMISS_KEY = 'sb-announcement-dismissed';
const DEFAULT_TEXT = 'Free Shipping on orders above ₹999 | Use code WELCOME10 for 10% off';
const DEFAULT_LINK = '/shop';

interface Announcement {
  text: string;
  link?: string;
  active: boolean;
}

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(true); // start hidden, reveal after check
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    // Check localStorage dismiss
    const key = `${DISMISS_KEY}-${new Date().toDateString()}`;
    if (localStorage.getItem(key)) return;

    // Fetch announcement from server (fallback to default)
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    fetch(`${API_URL}/api/announcements`)
      .then((r) => r.json())
      .then((data: Announcement) => {
        if (data.active) {
          setAnnouncement(data);
          setDismissed(false);
        }
      })
      .catch(() => {
        // Use default announcement if server unavailable
        setAnnouncement({ text: DEFAULT_TEXT, link: DEFAULT_LINK, active: true });
        setDismissed(false);
      });
  }, []);

  function dismiss() {
    setDismissed(true);
    const key = `${DISMISS_KEY}-${new Date().toDateString()}`;
    localStorage.setItem(key, '1');
  }

  if (dismissed || !announcement) return null;

  const content = (
    <span className="inline-block animate-marquee whitespace-nowrap">
      {announcement.text}&nbsp;&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;&nbsp;{announcement.text}&nbsp;&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;&nbsp;{announcement.text}
    </span>
  );

  return (
    <div className="relative bg-[#1a1a2e] text-[#c5a55a] text-xs font-medium py-2 px-10 overflow-hidden">
      <div className="overflow-hidden">
        {announcement.link ? (
          <a href={announcement.link} className="hover:text-white transition-colors">
            {content}
          </a>
        ) : (
          content
        )}
      </div>
      <button
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c5a55a]/60 hover:text-[#c5a55a] transition-colors p-1"
        aria-label="Dismiss announcement"
      >
        <FiX size={13} />
      </button>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
