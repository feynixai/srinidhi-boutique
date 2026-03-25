'use client';
import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { FiMail, FiMapPin, FiPhone, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const FAQS = [
  {
    q: 'How long does delivery take?',
    a: 'Standard delivery takes 4–7 business days across India. Express delivery (1–2 days) is available for Hyderabad and major cities. Enter your pincode on the product page for an exact estimate.',
  },
  {
    q: 'What is your return policy?',
    a: 'We offer easy 7-day returns from the date of delivery. Items must be unworn, unwashed, with original tags attached. Customised or stitched items cannot be returned. WhatsApp us to initiate a return.',
  },
  {
    q: 'How do I find the right size?',
    a: 'Each product page has a Size Guide button showing detailed measurements. For kurtis and tops, we recommend going one size up if you\'re between sizes. For sarees, one size fits all. WhatsApp us if you need personalised size advice.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept UPI (Google Pay, PhonePe, Paytm), all credit/debit cards, net banking via Razorpay, and Cash on Delivery (COD) for orders up to ₹5,000.',
  },
  {
    q: 'Can I order via WhatsApp?',
    a: 'Yes! Just click the "Order via WhatsApp" button on any product page. Share your size, colour preference, and delivery address. We\'ll confirm availability and payment details within 30 minutes.',
  },
  {
    q: 'Do you ship outside India?',
    a: 'Currently we only ship within India. We\'re working on international shipping and hope to launch it soon. Stay tuned!',
  },
  {
    q: 'Is my payment secure?',
    a: 'Absolutely. All online payments are processed through Razorpay, a PCI-DSS certified payment gateway. We never store your card details.',
  },
  {
    q: 'How do I track my order?',
    a: 'Once your order is shipped, you\'ll receive a tracking ID via WhatsApp. You can also visit our Track Order page and enter your order number and phone number.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="text-sm font-medium text-charcoal">{q}</span>
        {open
          ? <FiChevronUp size={16} className="text-rose-gold flex-shrink-0" />
          : <FiChevronDown size={16} className="text-charcoal/40 flex-shrink-0" />}
      </button>
      {open && (
        <p className="pb-4 text-sm text-charcoal/60 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+919876543210';
  const waBase = whatsappNumber.replace('+', '');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error('Please enter your name and message');
      return;
    }
    setSending(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await fetch(`${apiUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      toast.success('Message sent! We\'ll get back to you soon.');
      setForm({ name: '', phone: '', email: '', message: '' });
    } catch {
      // Fallback: open WhatsApp
      const msg = encodeURIComponent(
        `Hi! I'm ${form.name}${form.phone ? ` (${form.phone})` : ''}.\n\n${form.message}`
      );
      window.open(`https://wa.me/${waBase}?text=${msg}`, '_blank');
      toast.success('Opening WhatsApp...');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-cream py-16 text-center px-4 border-b border-gold/20">
        <p className="text-gold uppercase tracking-[0.3em] text-xs font-medium mb-3">Get in Touch</p>
        <h1 className="font-serif text-4xl text-charcoal mb-3">Contact Us</h1>
        <div className="divider-gold" />
        <p className="text-charcoal/60 text-sm mt-3 max-w-sm mx-auto">
          We're always happy to help — whether it's finding the right outfit or tracking your order.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="font-serif text-2xl text-charcoal mb-6">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Your Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Full name"
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-rose-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Phone Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-rose-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Email (optional)</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-rose-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Message *</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="How can we help you?"
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-rose-gold resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 bg-charcoal text-white py-3.5 text-sm font-medium tracking-widest hover:bg-charcoal/80 transition-colors disabled:opacity-50"
                >
                  {sending ? 'SENDING...' : 'SEND MESSAGE'}
                </button>
                <a
                  href={`https://wa.me/${waBase}?text=${encodeURIComponent(`Hi! I'm ${form.name || 'a customer'}. ${form.message || 'I need help.'}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-500 text-white px-5 py-3.5 text-sm font-medium hover:bg-green-600 transition-colors"
                >
                  <FaWhatsapp size={18} />
                </a>
              </div>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-2xl text-charcoal mb-6">Find Us</h2>
              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-cream flex items-center justify-center flex-shrink-0 rounded-sm">
                    <FiMapPin className="text-rose-gold" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-charcoal text-sm mb-0.5">Store Address</p>
                    <p className="text-charcoal/60 text-sm leading-relaxed">
                      Srinidhi Boutique<br />
                      Banjara Hills Road No. 12<br />
                      Hyderabad, Telangana — 500034
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-cream flex items-center justify-center flex-shrink-0 rounded-sm">
                    <FaWhatsapp className="text-green-500" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-charcoal text-sm mb-0.5">WhatsApp</p>
                    <a
                      href={`https://wa.me/${waBase}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline text-sm"
                    >
                      {whatsappNumber}
                    </a>
                    <p className="text-charcoal/50 text-xs mt-0.5">Usually replies within 30 minutes</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-cream flex items-center justify-center flex-shrink-0 rounded-sm">
                    <FiPhone className="text-rose-gold" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-charcoal text-sm mb-0.5">Phone</p>
                    <a href={`tel:${whatsappNumber}`} className="text-rose-gold hover:underline text-sm">
                      {whatsappNumber}
                    </a>
                    <p className="text-charcoal/50 text-xs mt-0.5">Mon–Sat, 10am–8pm</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-cream flex items-center justify-center flex-shrink-0 rounded-sm">
                    <FiMail className="text-rose-gold" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-charcoal text-sm mb-0.5">Email</p>
                    <a href="mailto:hello@srinidhiboutique.com" className="text-rose-gold hover:underline text-sm">
                      hello@srinidhiboutique.com
                    </a>
                    <p className="text-charcoal/50 text-xs mt-0.5">We reply within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-cream p-5 rounded-sm">
              <h3 className="font-serif text-lg text-charcoal mb-3">Store Hours</h3>
              <div className="space-y-1.5 text-sm">
                {[
                  { day: 'Monday – Friday', time: '10:00 AM – 8:00 PM' },
                  { day: 'Saturday', time: '10:00 AM – 9:00 PM' },
                  { day: 'Sunday', time: '11:00 AM – 7:00 PM' },
                ].map((h) => (
                  <div key={h.day} className="flex justify-between">
                    <span className="text-charcoal/60">{h.day}</span>
                    <span className="font-medium text-charcoal">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-gray-100 rounded-sm overflow-hidden">
              <div className="relative h-48 flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                <div className="text-center">
                  <FiMapPin size={32} className="text-rose-gold mx-auto mb-2" />
                  <p className="text-sm font-medium text-charcoal">Banjara Hills, Hyderabad</p>
                  <a
                    href="https://maps.google.com/?q=Banjara+Hills+Road+12+Hyderabad"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-rose-gold hover:underline mt-1 inline-block"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-cream py-16 px-4 border-t border-gold/20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-gold uppercase tracking-[0.2em] text-xs font-medium mb-3">Answers</p>
            <h2 className="font-serif text-3xl text-charcoal mb-2">Frequently Asked Questions</h2>
            <div className="divider-gold" />
          </div>
          <div className="bg-white rounded-sm divide-y divide-gray-100 px-6">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
          <p className="text-center text-charcoal/50 text-sm mt-6">
            Still have questions?{' '}
            <a
              href={`https://wa.me/${waBase}?text=${encodeURIComponent('Hi! I have a question.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 font-medium hover:underline"
            >
              WhatsApp us
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
