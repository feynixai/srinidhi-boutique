'use client';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ShippingPage() {
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState<{
    available: boolean; city?: string; state?: string; deliveryDays?: number; deliveryDate?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkPincode() {
    if (!pincode.match(/^\d{6}$/)) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/pincode/${pincode}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ available: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl mb-3">Shipping Information</h1>
        <p className="text-gray-500">We deliver across India with care and speed.</p>
      </div>

      {/* Pincode Checker */}
      <div className="bg-warm-white rounded-sm p-6 mb-10">
        <h2 className="font-serif text-xl mb-4">Check Delivery to Your Pincode</h2>
        <div className="flex gap-3">
          <input
            value={pincode}
            onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); setResult(null); }}
            onKeyDown={(e) => e.key === 'Enter' && checkPincode()}
            placeholder="Enter 6-digit pincode"
            maxLength={6}
            className="flex-1 border border-gray-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-rose-gold text-sm"
          />
          <button onClick={checkPincode} disabled={loading || pincode.length < 6} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
            {loading ? '...' : 'Check'}
          </button>
        </div>
        {result && (
          <div className={`mt-4 p-4 rounded-sm ${result.available ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {result.available ? (
              <div>
                <p className="font-medium text-green-700">Delivery available!</p>
                {result.city && <p className="text-sm text-green-600 mt-1">{result.city}, {result.state}</p>}
                {result.deliveryDate && (
                  <p className="text-sm text-green-600 mt-1">
                    Estimated delivery: <strong>{result.deliveryDate}</strong> ({result.deliveryDays} days)
                  </p>
                )}
              </div>
            ) : (
              <p className="text-red-700 font-medium">Sorry, we don&apos;t deliver to this pincode yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Shipping Policy */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>, title: 'Free Shipping', desc: 'On all orders above ₹999' },
            { icon: <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>, title: 'Careful Packaging', desc: 'Every item packed with love' },
            { icon: <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>, title: 'Easy Returns', desc: '7-day hassle-free return policy' },
          ].map((item) => (
            <div key={item.title} className="text-center p-5 bg-white border border-gray-100 rounded-sm">
              <div className="text-[#c5a55a] flex justify-center mb-2">{item.icon}</div>
              <h3 className="font-medium mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-100 rounded-sm p-6">
          <h2 className="font-serif text-xl mb-4">Shipping Policy</h2>
          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <div>
              <h3 className="font-medium text-charcoal mb-1">Standard Shipping</h3>
              <p>Orders are typically dispatched within 1-2 business days. Delivery takes 3-7 business days depending on your location. Orders to Hyderabad and surrounding areas may arrive faster.</p>
            </div>
            <div>
              <h3 className="font-medium text-charcoal mb-1">Shipping Charges</h3>
              <ul className="list-disc ml-4 space-y-1">
                <li>Free shipping on orders above ₹999</li>
                <li>₹99 flat shipping for orders below ₹999</li>
                <li>COD available for an additional ₹50 handling charge</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-charcoal mb-1">Delivery Timeframes</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Location</th>
                    <th className="text-left py-2 font-medium">Delivery Days</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Hyderabad & Secunderabad', '1-2 days'],
                    ['Andhra Pradesh & Telangana', '2-3 days'],
                    ['Major metros (Bengaluru, Mumbai, Delhi, Chennai)', '2-4 days'],
                    ['Rest of India', '4-7 days'],
                    ['Remote areas', '7-10 days'],
                  ].map(([loc, days]) => (
                    <tr key={loc} className="border-b border-gray-50">
                      <td className="py-2 text-gray-600">{loc}</td>
                      <td className="py-2 text-gray-600">{days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="font-medium text-charcoal mb-1">Tracking Your Order</h3>
              <p>Once your order is shipped, you&apos;ll receive a tracking ID. You can track your order on our <a href="/track-order" className="text-rose-gold hover:underline">Track Order</a> page or contact us on WhatsApp.</p>
            </div>
            <div>
              <h3 className="font-medium text-charcoal mb-1">Damaged or Lost Packages</h3>
              <p>If your package arrives damaged or is lost in transit, please contact us within 48 hours with photos. We&apos;ll replace or refund immediately.</p>
            </div>
          </div>
        </div>

        <div className="bg-rose-gold/5 border border-rose-gold/20 rounded-sm p-5 text-center">
          <p className="text-sm text-charcoal">Questions about your shipment?</p>
          <a
            href="https://wa.me/919876543210?text=Hi! I have a question about my order shipping."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 bg-green-500 text-white px-6 py-2.5 rounded-sm text-sm font-medium hover:bg-green-600 transition-colors"
          >
            <span>WhatsApp Us</span>
          </a>
        </div>
      </div>
    </div>
  );
}
