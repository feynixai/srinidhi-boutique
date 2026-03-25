'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { FiUserPlus, FiTrash2, FiMegaphone } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type AdminUser = { id: string; email: string; name?: string; role: string; active: boolean };

export default function SettingsPage() {
  const { data: session } = useSession();
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

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'OWNER' | 'STAFF'>('STAFF');
  const [addingAdmin, setAddingAdmin] = useState(false);

  const [announcement, setAnnouncement] = useState({
    text: 'Free Shipping on orders above ₹999 | Use code WELCOME10 for 10% off your first order',
    link: '/shop',
    active: true,
  });
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/admin/users`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setAdmins(data))
      .catch(() => {});

    fetch(`${API_URL}/api/announcements`)
      .then((r) => r.json())
      .then((data) => data && setAnnouncement(data))
      .catch(() => {});
  }, []);

  function handleSave() {
    setSaved(true);
    toast.success('Settings saved!');
    setTimeout(() => setSaved(false), 2000);
  }

  async function addAdmin() {
    if (!newEmail) return;
    setAddingAdmin(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, name: newName, role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdmins((prev) => [...prev.filter((a) => a.email !== data.email), data]);
        setNewEmail('');
        setNewName('');
        toast.success('Staff added');
      }
    } catch {
      toast.error('Failed to add staff');
    } finally {
      setAddingAdmin(false);
    }
  }

  async function saveAnnouncement() {
    setSavingAnnouncement(true);
    try {
      const res = await fetch(`${API_URL}/api/announcements`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcement),
      });
      if (res.ok) toast.success('Announcement updated!');
      else toast.error('Failed to save announcement');
    } catch {
      toast.error('Failed to save announcement');
    } finally {
      setSavingAnnouncement(false);
    }
  }

  async function removeAdmin(id: string) {
    try {
      await fetch(`${API_URL}/api/auth/admin/users/${id}`, { method: 'DELETE' });
      setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, active: false } : a)));
      toast.success('Staff deactivated');
    } catch {
      toast.error('Failed to remove');
    }
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
        <button onClick={handleSave} className="btn-action bg-rose-gold text-white px-6 py-2">
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
        <Toggle label="Cash on Delivery" desc="Allow customers to pay cash when order arrives" value={settings.codEnabled} onChange={(v) => setSettings({ ...settings, codEnabled: v })} />
        <Toggle label="Razorpay Online Payments" desc="Requires Razorpay API key in environment variables" value={settings.razorpayEnabled} onChange={(v) => setSettings({ ...settings, razorpayEnabled: v })} />
      </Section>

      <Section title="Shipping Settings">
        <Field label="Free Shipping Above (₹)" value={settings.freeShippingAbove} onChange={(v) => setSettings({ ...settings, freeShippingAbove: v })} type="number" />
        <Field label="COD Handling Charge (₹)" value={settings.codCharge} onChange={(v) => setSettings({ ...settings, codCharge: v })} type="number" />
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          <strong>International rates:</strong> US ₹1499 · UAE ₹999 · UK ₹1299 · Rest ₹1999
        </div>
      </Section>

      <Section title="Store Hours & Location">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
          <strong>Srinidhi Boutique</strong> · Hyderabad, Telangana<br />
          Mon–Sat: 10 AM – 8 PM · Sunday: 11 AM – 7 PM<br />
          WhatsApp orders accepted 24/7
        </div>
      </Section>

      {/* Store Announcement */}
      <Section title="Store Announcement Bar">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600">Shown as an animated banner at the top of the store.</p>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${announcement.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {announcement.active ? 'Active' : 'Hidden'}
            </span>
            <button
              onClick={() => setAnnouncement((a) => ({ ...a, active: !a.active }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${announcement.active ? 'bg-rose-gold' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${announcement.active ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Announcement Text</label>
          <input
            type="text"
            value={announcement.text}
            onChange={(e) => setAnnouncement((a) => ({ ...a, text: e.target.value }))}
            placeholder="Free Shipping on orders above ₹999"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-rose-gold"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Link (optional)</label>
          <input
            type="text"
            value={announcement.link}
            onChange={(e) => setAnnouncement((a) => ({ ...a, link: e.target.value }))}
            placeholder="/shop or /offers"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-rose-gold"
          />
        </div>
        {announcement.active && announcement.text && (
          <div className="bg-[#1a1a2e] text-[#c5a55a] text-xs rounded-lg px-4 py-2.5 flex items-center gap-2">
            <FiMegaphone size={13} />
            <span className="truncate">{announcement.text}</span>
          </div>
        )}
        <button
          onClick={saveAnnouncement}
          disabled={savingAnnouncement}
          className="w-full py-2 bg-[#1a1a2e] text-[#c5a55a] rounded-lg text-sm font-medium hover:bg-[#2d2d4e] disabled:opacity-60 transition-colors"
        >
          {savingAnnouncement ? 'Saving...' : 'Save Announcement'}
        </button>
      </Section>

      {/* Staff Management */}
      <Section title="Staff Management">
        {session?.user && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mb-4">
            Signed in as <strong>{session.user.email}</strong>
          </div>
        )}
        <div className="space-y-3 mb-4">
          {admins.map((admin) => (
            <div key={admin.id} className={`flex items-center justify-between p-3 rounded-lg border ${admin.active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
              <div>
                <p className="font-medium text-sm">{admin.name || admin.email}</p>
                <p className="text-xs text-gray-500">{admin.email} · {admin.role}</p>
                {!admin.active && <span className="text-xs text-red-500">Deactivated</span>}
              </div>
              {admin.active && admin.email !== session?.user?.email && (
                <button onClick={() => removeAdmin(admin.id)} className="text-red-400 hover:text-red-600 p-1">
                  <FiTrash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Add Staff Member</p>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="staff@gmail.com"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-gold"
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name (optional)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-gold"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as 'OWNER' | 'STAFF')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-gold"
          >
            <option value="STAFF">Staff</option>
            <option value="OWNER">Owner</option>
          </select>
          <button
            onClick={addAdmin}
            disabled={addingAdmin || !newEmail}
            className="w-full flex items-center justify-center gap-2 py-2 bg-[#8B1A4A] text-white rounded-lg text-sm font-medium hover:bg-[#7a1640] disabled:opacity-60"
          >
            <FiUserPlus size={15} /> Add Staff
          </button>
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
