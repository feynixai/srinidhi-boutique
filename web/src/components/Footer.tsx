import Link from 'next/link';
import { FiInstagram, FiFacebook, FiYoutube } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

export function Footer() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+919876543210';
  const waLink = `https://wa.me/${whatsappNumber.replace('+', '')}?text=Hi! I'd like to know more about your collection.`;
  const instagramLink =
    process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://instagram.com/srinidhiboutique';
  const facebookLink =
    process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://facebook.com/srinidhiboutique';
  const youtubeLink =
    process.env.NEXT_PUBLIC_YOUTUBE_URL || 'https://youtube.com/@srinidhiboutique';

  return (
    <footer className="bg-white/60 backdrop-blur-xl border-t border-white/30 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="font-serif text-xl mb-3 text-[#1a1a2e]">Srinidhi Boutique</h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Premium women&apos;s fashion from the heart of Hyderabad. Discover handpicked sarees,
              kurtis, lehengas and more — crafted for the modern Indian woman.
            </p>
            <div className="flex items-center space-x-3 mt-4">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                className="p-2.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
              >
                <FaWhatsapp size={18} />
              </a>
              <a
                href={instagramLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow on Instagram"
                className="p-2.5 bg-gray-100 text-gray-500 rounded-full hover:bg-pink-100 hover:text-pink-500 transition-colors"
              >
                <FiInstagram size={18} />
              </a>
              <a
                href={facebookLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow on Facebook"
                className="p-2.5 bg-gray-100 text-gray-500 rounded-full hover:bg-blue-100 hover:text-blue-500 transition-colors"
              >
                <FiFacebook size={18} />
              </a>
              <a
                href={youtubeLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Watch on YouTube"
                className="p-2.5 bg-gray-100 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"
              >
                <FiYoutube size={18} />
              </a>
            </div>
            <p className="text-gray-400 text-xs mt-3">
              Follow us for style inspiration, new arrivals &amp; exclusive offers
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-[#1a1a2e]">
              Shop
            </h4>
            <ul className="space-y-2 text-sm text-gray-500">
              {['Sarees', 'Kurtis', 'Lehengas', 'Blouses', 'Accessories', 'Offers'].map((item) => (
                <li key={item}>
                  <Link
                    href={`/category/${item.toLowerCase()}`}
                    className="hover:text-[#c5a55a] transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-[#1a1a2e]">
              Help
            </h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#c5a55a] transition-colors"
                >
                  WhatsApp Us
                </a>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-[#c5a55a] transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-[#c5a55a] transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-[#c5a55a] transition-colors">
                  Returns &amp; Exchanges
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-[#c5a55a] transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[#c5a55a] transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#c5a55a] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#c5a55a] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
            <div className="mt-4 text-sm text-gray-500">
              <p>📍 Hyderabad, Telangana</p>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-700 transition-colors"
              >
                💬 WhatsApp: {whatsappNumber}
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-black/5 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Srinidhi Boutique. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#1a1a2e] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#1a1a2e] transition-colors">
              Terms
            </Link>
            <Link href="/faq" className="hover:text-[#1a1a2e] transition-colors">
              FAQ
            </Link>
          </div>
          <p>Free shipping above ₹999 · 7-day returns · Secure payments</p>
        </div>
      </div>

      {/* Floating WhatsApp */}
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 md:bottom-6 right-5 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors z-40"
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp size={22} />
      </a>
    </footer>
  );
}
