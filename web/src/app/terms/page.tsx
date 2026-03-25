import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Srinidhi Boutique',
  description: 'Terms and conditions for shopping at Srinidhi Boutique.',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <p className="text-rose-gold uppercase tracking-[0.2em] text-xs font-semibold mb-2">Legal</p>
        <h1 className="font-serif text-4xl text-charcoal">Terms & Conditions</h1>
        <div className="divider-gold mt-4" />
        <p className="text-charcoal/50 text-sm mt-4">Last updated: March 2026</p>
      </div>

      <div className="prose prose-sm max-w-none text-charcoal/80 leading-relaxed space-y-8">
        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">1. Acceptance of Terms</h2>
          <p>By accessing and using the Srinidhi Boutique website (srinidhiboutique.com) and placing orders, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our website or services.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">2. Products and Pricing</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>All prices are in Indian Rupees (INR) and inclusive of GST unless stated otherwise.</li>
            <li>Prices are subject to change without notice. The price at the time of order placement will apply.</li>
            <li>Product images are representative and actual product may slightly differ in colour due to screen settings.</li>
            <li>We reserve the right to limit quantities or discontinue products at any time.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">3. Orders and Payment</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>An order is confirmed only after successful payment or COD confirmation.</li>
            <li>We accept Razorpay (credit/debit cards, UPI, net banking) and Cash on Delivery.</li>
            <li>COD is available for orders up to ₹5,000 at select pin codes.</li>
            <li>We reserve the right to cancel any order due to pricing errors, fraud, or stock unavailability. You will receive a full refund in such cases.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">4. Shipping and Delivery</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Standard delivery: 5–7 business days across India; 10–14 days for international orders.</li>
            <li>Free shipping on orders above ₹999 within India.</li>
            <li>Delivery timelines are estimates and may vary due to courier delays, festivals, or natural events.</li>
            <li>We are not responsible for delays caused by incorrect addresses provided at checkout.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">5. Returns and Exchanges</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Returns accepted within 7 days of delivery for unused, unwashed items with original tags.</li>
            <li>Sale items, customised orders, and inner wear are not eligible for return.</li>
            <li>To initiate a return, WhatsApp us or use the returns page on our website.</li>
            <li>Refunds are processed within 5–7 business days after we receive and inspect the returned item.</li>
            <li>Shipping charges for returns are borne by the customer unless the item was defective or incorrectly sent.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">6. Coupons and Offers</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Coupon codes are valid for one-time use per customer unless stated otherwise.</li>
            <li>Coupons cannot be combined with other offers or applied to already discounted items.</li>
            <li>We reserve the right to withdraw offers at any time without prior notice.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">7. Intellectual Property</h2>
          <p>All content on this website - including text, images, logos, and design - is the property of Srinidhi Boutique and protected by copyright. You may not reproduce or use any content without prior written permission.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">8. Limitation of Liability</h2>
          <p>Srinidhi Boutique's liability is limited to the value of the specific order in dispute. We are not liable for indirect, incidental, or consequential damages arising from use of our website or products.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">9. Governing Law</h2>
          <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Hyderabad, Telangana.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">10. Contact</h2>
          <p>For any questions about these terms: legal@srinidhiboutique.com | WhatsApp: +91-9876543210</p>
        </section>
      </div>
    </div>
  );
}
