'use client';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FiUser, FiMapPin, FiPackage, FiHeart, FiLogOut, FiEdit2, FiSave } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Address = {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
};

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [phoneUser, setPhoneUser] = useState<{ id: string; name?: string; phone?: string } | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses'>('profile');

  useEffect(() => {
    const stored = localStorage.getItem('sb_user');
    if (stored) setPhoneUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated' && !phoneUser) {
      router.push('/login?callbackUrl=/account');
    }
  }, [status, phoneUser, router]);

  const user = session?.user || (phoneUser ? { name: phoneUser.name, email: null, image: null } : null);
  const userId = (session?.user as ({ id?: string } | null | undefined))?.id || phoneUser?.id;

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_URL}/api/users/${userId}/profile`)
      .then((r) => r.json())
      .then((u) => {
        setNameInput(u.name || '');
        setAddresses(Array.isArray(u.addresses) ? u.addresses : []);
      })
      .catch(() => {});
  }, [userId]);

  async function saveName() {
    if (!userId) return;
    try {
      await fetch(`${API_URL}/api/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput }),
      });
      toast.success('Name updated');
      setEditingName(false);
    } catch {
      toast.error('Failed to update');
    }
  }

  async function saveAddresses(updated: Address[]) {
    if (!userId) return;
    await fetch(`${API_URL}/api/users/${userId}/addresses`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresses: updated }),
    });
    setAddresses(updated);
  }

  function removeAddress(id: string) {
    saveAddresses(addresses.filter((a) => a.id !== id));
    toast.success('Address removed');
  }

  function setDefault(id: string) {
    saveAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
  }

  function handleSignOut() {
    localStorage.removeItem('sb_user');
    signOut({ callbackUrl: '/' });
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B76E79] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FFFFF0] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-[#8B1A4A]">My Account</h1>
            <p className="text-gray-500 text-sm mt-1">{user.email || phoneUser?.phone}</p>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#8B1A4A]">
            <FiLogOut size={16} /> Sign out
          </button>
        </div>

        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'profile', icon: FiUser, label: 'Profile' },
            { key: 'addresses', icon: FiMapPin, label: 'Addresses' },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${activeTab === key ? 'bg-[#8B1A4A] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
          <Link href="/orders" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 whitespace-nowrap">
            <FiPackage size={15} /> My Orders
          </Link>
          <Link href="/wishlist" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 whitespace-nowrap">
            <FiHeart size={15} /> Wishlist
          </Link>
        </div>

        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-4">
              {user.image ? (
                <img src={user.image} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#B76E79] flex items-center justify-center text-white text-2xl font-bold">
                  {(nameInput || user.name || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                {editingName ? (
                  <div className="flex gap-2 items-center">
                    <input
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#B76E79]"
                      placeholder="Your name"
                    />
                    <button onClick={saveName} className="p-2 text-[#8B1A4A]"><FiSave size={18} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800">{nameInput || user.name || 'Add your name'}</p>
                    <button onClick={() => setEditingName(true)} className="text-gray-400 hover:text-[#8B1A4A]"><FiEdit2 size={14} /></button>
                  </div>
                )}
                <p className="text-sm text-gray-500">{user.email || phoneUser?.phone}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'addresses' && (
          <div className="space-y-4">
            {addresses.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-500">
                <FiMapPin size={32} className="mx-auto mb-3 text-gray-300" />
                <p>No saved addresses yet.</p>
                <p className="text-sm mt-1">Save an address during checkout to see it here.</p>
              </div>
            )}
            {addresses.map((addr) => (
              <div key={addr.id} className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{addr.name}</p>
                    <p className="text-sm text-gray-600">{addr.phone}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {addr.line1}{addr.line2 && `, ${addr.line2}`}<br />
                      {addr.city}, {addr.state} {addr.pincode}<br />
                      {addr.country || 'India'}
                    </p>
                    {addr.isDefault && (
                      <span className="mt-2 inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Default</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    {!addr.isDefault && (
                      <button onClick={() => setDefault(addr.id)} className="text-[#8B1A4A] hover:underline">Set default</button>
                    )}
                    <button onClick={() => removeAddress(addr.id)} className="text-red-500 hover:underline">Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
