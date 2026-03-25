'use client';
import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+919876543210';
  const waBase = whatsappNumber.replace('+', '');

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleWhatsApp(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error('Please enter your name and message');
      return;
    }
    setSending(true);
    const msg = encodeURIComponent(
      `Hi! I'm ${form.name}${form.phone ? ` (${form.phone})` : ''}.\n\n${form.message}`
    );
    window.open(`https://wa.me/${waBase}?text=${msg}`, '_blank');
    toast.success('Opening WhatsApp...');
    setSending(false);
    setForm({ name: '', phone: '', email: '', message: '' });
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
            <form onSubmit={handleWhatsApp} className="space-y-4">
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
              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3.5 text-sm font-medium tracking-widest hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                <FaWhatsapp size={18} />
                SEND VIA WHATSAPP
              </button>
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
          </div>
        </div>
      </section>
    </div>
  );
}
