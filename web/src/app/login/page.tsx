'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { FiPhone, FiArrowRight } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/account';

  const [tab, setTab] = useState<'google' | 'phone'>('google');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    await signIn('google', { callbackUrl });
  }

  async function sendOtp() {
    if (!phone || phone.length < 10) {
      toast.error('Enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        toast.success('OTP sent!');
        if (data.otp) toast(`Dev OTP: ${data.otp}`, { icon: '🔑', duration: 10000 });
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (!otp || otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Store user in localStorage for now (NextAuth phone provider would be ideal)
        localStorage.setItem('sb_user', JSON.stringify(data.user));
        toast.success(`Welcome${data.user.name ? ', ' + data.user.name : ''}!`);
        router.push(callbackUrl);
      } else {
        toast.error(data.message || 'Invalid OTP');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFFF0] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-playfair text-3xl font-bold text-[#8B1A4A] mb-2">Welcome Back</h1>
          <p className="text-gray-500 text-sm">Sign in to access your orders, wishlist & more</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Tab switcher */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
            <button
              onClick={() => setTab('google')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'google' ? 'bg-[#8B1A4A] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Google
            </button>
            <button
              onClick={() => setTab('phone')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'phone' ? 'bg-[#8B1A4A] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Phone OTP
            </button>
          </div>

          {tab === 'google' && (
            <div className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-200 rounded-xl hover:border-[#B76E79] hover:bg-pink-50 transition-all font-medium text-gray-700 disabled:opacity-60"
              >
                <FcGoogle size={22} />
                Continue with Google
              </button>
              <p className="text-xs text-center text-gray-600">
                Secure sign-in with your Google account
              </p>
            </div>
          )}

          {tab === 'phone' && (
            <div className="space-y-4">
              {!otpSent ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium">+91</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#B76E79] text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={sendOtp}
                    disabled={loading || phone.length < 10}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#8B1A4A] text-white rounded-xl font-medium hover:bg-[#7a1640] transition-colors disabled:opacity-60"
                  >
                    <FiPhone size={16} />
                    Send OTP
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP sent to +91 {phone}</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#B76E79] text-sm tracking-widest text-center text-lg"
                      maxLength={6}
                    />
                  </div>
                  <button
                    onClick={verifyOtp}
                    disabled={loading || otp.length !== 6}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#8B1A4A] text-white rounded-xl font-medium hover:bg-[#7a1640] transition-colors disabled:opacity-60"
                  >
                    Verify OTP
                    <FiArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                    className="w-full text-center text-sm text-gray-500 hover:text-[#8B1A4A]"
                  >
                    Change number
                  </button>
                </>
              )}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-600">
              By signing in, you agree to our{' '}
              <a href="/shipping" className="text-[#B76E79] hover:underline">Terms & Privacy Policy</a>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Just browsing?{' '}
            <a href="/" className="text-[#8B1A4A] font-medium hover:underline">Continue as guest</a>
          </p>
        </div>
      </div>
    </div>
  );
}
