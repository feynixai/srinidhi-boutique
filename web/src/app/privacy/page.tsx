import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Srinidhi Boutique',
  description: 'Privacy policy for Srinidhi Boutique — how we collect, use and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <p className="text-rose-gold uppercase tracking-[0.2em] text-xs font-semibold mb-2">Legal</p>
        <h1 className="font-serif text-4xl text-charcoal">Privacy Policy</h1>
        <div className="divider-gold mt-4" />
        <p className="text-charcoal/50 text-sm mt-4">Last updated: March 2026</p>
      </div>

      <div className="prose prose-sm max-w-none text-charcoal/80 leading-relaxed space-y-8">
        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">1. Information We Collect</h2>
          <p>When you shop with Srinidhi Boutique, we collect information you provide directly:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Name, phone number, and email address</li>
            <li>Delivery address and billing information</li>
            <li>Payment details (processed securely by Razorpay — we never store card numbers)</li>
            <li>Order history and preferences</li>
            <li>Communications sent via WhatsApp, email, or our chat</li>
          </ul>
          <p className="mt-3">We also collect data automatically through your use of our website, including device type, browser, pages visited, and IP address.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To process and deliver your orders</li>
            <li>To send order confirmations, shipping updates, and delivery notifications</li>
            <li>To respond to your queries and provide customer support</li>
            <li>To personalise your shopping experience and recommend products</li>
            <li>To send promotional offers, flash sales, and new arrivals (only if you have opted in)</li>
            <li>To comply with legal obligations and prevent fraud</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">3. Sharing Your Information</h2>
          <p>We do not sell your personal data. We share your information only with:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Payment processors</strong> (Razorpay) to complete transactions</li>
            <li><strong>Shipping partners</strong> (Shiprocket, India Post, Blue Dart) to deliver your orders</li>
            <li><strong>WhatsApp Business API</strong> providers to send you order updates</li>
            <li>Legal authorities when required by law</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">4. Data Security</h2>
          <p>We implement industry-standard security measures including SSL encryption, secure payment processing through Razorpay, and restricted access to personal data. However, no internet transmission is 100% secure, and we cannot guarantee absolute security.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">5. Cookies</h2>
          <p>We use essential cookies to maintain your shopping cart, session, and preferences. We also use analytics cookies to understand how customers use our website. You can disable cookies in your browser settings, but this may affect some website functionality.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">6. Your Rights</h2>
          <p>Under applicable Indian data protection laws, you have the right to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your personal data (subject to legal requirements)</li>
            <li>Opt out of marketing communications at any time</li>
          </ul>
          <p className="mt-3">To exercise these rights, contact us at privacy@srinidhiboutique.com or WhatsApp us at +91-9876543210.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">7. Retention</h2>
          <p>We retain your personal data for as long as necessary to fulfil the purposes described in this policy, comply with legal obligations, resolve disputes, and enforce our agreements. Order records are typically retained for 7 years as required by Indian tax laws.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">8. Children's Privacy</h2>
          <p>Our website is not directed to children under the age of 18. We do not knowingly collect personal information from minors.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">9. Changes to this Policy</h2>
          <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date. Continued use of our website after changes constitutes acceptance of the revised policy.</p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-charcoal mb-3">10. Contact Us</h2>
          <p>For any privacy-related questions or concerns:</p>
          <ul className="list-none mt-2 space-y-1">
            <li>Email: privacy@srinidhiboutique.com</li>
            <li>WhatsApp: +91-9876543210</li>
            <li>Address: Srinidhi Boutique, Banjara Hills, Hyderabad — 500034, Telangana, India</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
