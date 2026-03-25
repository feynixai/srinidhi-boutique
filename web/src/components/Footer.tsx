import Link from 'next/link';
import { FiInstagram, FiFacebook, FiYoutube } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

export function Footer() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+919876543210';
  const waLink = `https://wa.me/${whatsappNumber.replace('+', '')}?text=Hi! I'd like to know more about your collection.`;
  const instagramLink = process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://instagram.com/srinidhiboutique';
  const facebookLink = process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://facebook.com/srinidhiboutique';
  const youtubeLink = process.env.NEXT_PUBLIC_YOUTUBE_URL || 'https://youtube.com/@srinidhiboutique';

  return (
    <footer className="bg-[#f5f5f0] border-t border-white/40 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="glass-card p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="font-bold text-xl mb-3 text-[#1a1a2e] tracking-tight">
                Srinidhi <span className="text-[#c5a55a]">Boutique</span>
              </h3>
              <p className="text-[#6b7280] text-sm leading-relaxed max-w-xs">
                Premium women&apos;s fashion from the heart of Hyderabad. Discover handpicked
                sarees, kurtis, lehengas and more — crafted for the modern Indian woman.
              </p>
              <div className="flex items-center space-x-3 mt-4">
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  aria-label="Chat on WhatsApp"
                  className="w-9 h-9 flex items-center justify-center bg-green-500/10 text-green-600 rounded-full hover:bg-green-500/20 transition-colors">
                  <FaWhatsapp size={18} />
                </a>
                <a href={instagramLink} target="_blank" rel="noopener noreferrer"
                  aria-label="Follow on Instagram"
                  className="w-9 h-9 flex items-center justify-center bg-[#1a1a2e]/5 text-[#6b7280] rounded-full hover:bg-pink-100 hover:text-pink-500 transition-colors">
                  <FiInstagram size={18} />
                </a>
                <a href={facebookLink} target="_blank" rel="noopener noreferrer"
                  aria-label="Follow on Facebook"
                  className="w-9 h-9 flex items-center justify-center bg-[#1a1a2e]/5 text-[#6b7280] rounded-full hover:bg-blue-100 hover:text-blue-500 transition-colors">
                  <FiFacebook size={18} />
                </a>
                <a href={youtubeLink} target="_blank" rel="noopener noreferrer"
                  aria-label="Watch on YouTube"
                  className="w-9 h-9 flex items-center justify-center bg-[#1a1a2e]/5 text-[#6b7280] rounded-full hover:bg-red-100 hover:text-red-500 transition-colors">
                  <FiYoutube size={18} />
                </a>
              </div>
              <p className="text-[#6b7280] text-xs mt-3">Follow us for style inspiration, new arrivals & exclusive offers</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-[#1a1a2e]">Shop</h4>
              <ul className="space-y-2 text-sm text-[#6b7280]">
                {['Sarees', 'Kurtis', 'Lehengas', 'Blouses', 'Accessories', 'Offers'].map((item) => (
                  <li key={item}>
                    <Link href={`/category/${item.toLowerCase()}`}
                      className="hover:text-[#c5a55a] transition-colors">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-[#1a1a2e]">Help</h4>
              <ul className="space-y-2 text-sm text-[#6b7280]">
                <li><a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="hover:text-[#c5a55a] transition-colors">WhatsApp Us</a></li>
                <li><Link href="/track-order" className="hover:text-[#c5a55a] transition-colors">Track Order</Link></li>
                <li><Link href="/orders" className="hover:text-[#c5a55a] transition-colors">My Orders</Link></li>
                <li><Link href="/returns" className="hover:text-[#c5a55a] transition-colors">Returns & Exchanges</Link></li>
                <li><Link href="/shipping" className="hover:text-[#c5a55a] transition-colors">Shipping Info</Link></li>
                <li><Link href="/faq" className="hover:text-[#c5a55a] transition-colors">FAQ</Link></li>
                <li><Link href="/about" className="hover:text-[#c5a55a] transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-[#c5a55a] transition-colors">Contact</Link></li>
              </ul>
              <div className="mt-4 text-sm text-[#6b7280]">
                <p>📍 Hyderabad, Telangana</p>
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-500 transition-colors">
                  💬 {whatsappNumber}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[#6b7280]">
          <p>© {new Date().getFullYear()} Srinidhi Boutique. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#c5a55a] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#c5a55a] transition-colors">Terms</Link>
            <Link href="/faq" className="hover:text-[#c5a55a] transition-colors">FAQ</Link>
          </div>
          <p>Free shipping above ₹999 · 7-day returns · Secure payments</p>
        </div>
      </div>
    </footer>
  );
}
