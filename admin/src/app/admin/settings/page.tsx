'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    storeName: 'Srinidhi Boutique',
    storePhone: '+91 98765 43210',
    storeEmail: 'hello@srinidhboutique.com',
    storeAddress: 'Hyderabad, Telangana, India',
    whatsappNumber: '919876543210',
    upiId: 'srinidhioboutique@ybl',
    gstIn: '',
    freeShippingAbove: '999',
    codCharge: '50',
    codEnabled: true,
    razorpayEnabled: false,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  });

  function handleSave() {
    setSaved(true);
    toast.success('Settings saved!');
    setTimeout(() => setSaved(false), 2000);
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card space-y-4">
      <h2 className="font-bold text-lg border-b border-gray-100 pb-3">{title}</h2>
      {children}
    </div>
  );

  const Field = ({
    label, value, onChange, type = 'text', placeholder,
  }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-rose-gold"
      />
    </div>
  );

  const Toggle = ({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-sm">{label}</p>
        {desc && <p className="text-xs text-gray-500">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-rose-gold' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 pb-10 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <button
          onClick={handleSave}
          className="btn-action bg-rose-gold text-white px-6 py-2"
        >
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <Section title="Store Information">
        <Field label="Store Name" value={settings.storeName} onChange={(v) => setSettings({ ...settings, storeName: v })} />
        <Field label="Phone Number" value={settings.storePhone} onChange={(v) => setSettings({ ...settings, storePhone: v })} />
        <Field label="Email" value={settings.storeEmail} onChange={(v) => setSettings({ ...settings, storeEmail: v })} type="email" />
        <Field label="Address" value={settings.storeAddress} onChange={(v) => setSettings({ ...settings, storeAddress: v })} />
        <Field label="GSTIN" value={settings.gstIn} onChange={(v) => setSettings({ ...settings, gstIn: v })} placeholder="e.g. 36ABCDE1234F1Z5" />
      </Section>

      <Section title="Payment Settings">
        <Field label="UPI ID" value={settings.upiId} onChange={(v) => setSettings({ ...settings, upiId: v })} placeholder="yourstore@ybl" />
        <Field label="WhatsApp Number (for UPI QR)" value={settings.whatsappNumber} onChange={(v) => setSettings({ ...settings, whatsappNumber: v })} placeholder="919876543210" />
        <Toggle
          label="Cash on Delivery"
          desc="Allow customers to pay cash when order arrives"
          value={settings.codEnabled}
          onChange={(v) => setSettings({ ...settings, codEnabled: v })}
        />
        <Toggle
          label="Razorpay Online Payments"
          desc="Requires Razorpay API key in environment variables"
          value={settings.razorpayEnabled}
          onChange={(v) => setSettings({ ...settings, razorpayEnabled: v })}
        />
      </Section>

      <Section title="Shipping Settings">
        <Field
          label="Free Shipping Above (₹)"
          value={settings.freeShippingAbove}
          onChange={(v) => setSettings({ ...settings, freeShippingAbove: v })}
          type="number"
        />
        <Field
          label="COD Handling Charge (₹)"
          value={settings.codCharge}
          onChange={(v) => setSettings({ ...settings, codCharge: v })}
          type="number"
        />
      </Section>

      <Section title="Store Hours & Location">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
          <strong>Srinidhi Boutique</strong> · Hyderabad, Telangana<br />
          Mon–Sat: 10 AM – 8 PM · Sunday: 11 AM – 7 PM<br />
          WhatsApp orders accepted 24/7
        </div>
      </Section>

      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-action bg-rose-gold text-white px-8 py-3 text-base">
          {saved ? 'Settings Saved!' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
}
