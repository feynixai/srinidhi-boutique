import Link from 'next/link';
import { FiInstagram, FiFacebook, FiYoutube } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

export function Footer() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+919876543210';
  const waLink = `https://wa.me/${whatsappNumber.replace('+', '')}?text=Hi! I'd like to know more about your collection.`;

  return (
    <footer className="bg-charcoal text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="font-serif text-xl mb-3">Srinidhi Boutique</h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Premium women's fashion from the heart of Hyderabad. Discover handpicked
              sarees, kurtis, lehengas and more — crafted for the modern Indian woman.
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 transition-colors">
                <FaWhatsapp size={22} />
              </a>
              <a href="#" className="text-gray-400 hover:text-soft-pink transition-colors">
                <FiInstagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <FiFacebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-red-400 transition-colors">
                <FiYoutube size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm uppercase tracking-wider mb-3 text-gray-300">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {['Sarees', 'Kurtis', 'Lehengas', 'Blouses', 'Accessories', 'Offers'].map((item) => (
                <li key={item}>
                  <Link href={`/category/${item.toLowerCase()}`}
                    className="hover:text-white transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-sm uppercase tracking-wider mb-3 text-gray-300">Help</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href={waLink} target="_blank" rel="noopener noreferrer"
                className="hover:text-white transition-colors">WhatsApp Us</a></li>
              <li><Link href="/track" className="hover:text-white transition-colors">Track Order</Link></li>
              <li><Link href="/returns" className="hover:text-white transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="/size-guide" className="hover:text-white transition-colors">Size Guide</Link></li>
            </ul>
            <div className="mt-4 text-sm text-gray-400">
              <p>📍 Hyderabad, Telangana</p>
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 transition-colors">
                💬 WhatsApp: {whatsappNumber}
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-10 pt-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Srinidhi Boutique. All rights reserved.</p>
          <p className="mt-1">Free shipping on orders above ₹999 · 7-day easy returns · Secure payments</p>
        </div>
      </div>

      {/* Floating WhatsApp */}
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors z-40"
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp size={24} />
      </a>
    </footer>
  );
}
