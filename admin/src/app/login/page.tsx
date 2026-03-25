'use client';
import { signIn, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { FiEye, FiEyeOff } from 'react-icons/fi';

// Hardcoded admin credentials (works without backend server)
const ADMIN_CREDENTIALS = [
  { email: 'admin@srinidhiboutique.com', password: 'Srinidhi@2026', name: 'Admin' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AdminLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (session) router.replace('/admin');
  }, [session, router]);

  // Check if user has admin_token on mount
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          router.replace('/admin');
        } else {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          document.cookie = 'admin_token=; path=/; max-age=0';
        }
      } catch {
        localStorage.removeItem('admin_token');
      }
    }
  }, [router]);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    // Try server first, fall back to client-side check
    let authenticated = false;

    try {
      const res = await fetch(`${API_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.admin));
        document.cookie = `admin_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        authenticated = true;
      }
    } catch {
      // Server not available — use client-side fallback
    }

    if (!authenticated) {
      // Client-side credential check (works without backend)
      const match = ADMIN_CREDENTIALS.find(
        (c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password
      );
      if (match) {
        // Create a simple token (header.payload.signature format)
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(
          JSON.stringify({
            email: match.email,
            name: match.name,
            role: 'OWNER',
            exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
          })
        );
        const token = `${header}.${payload}.client-auth`;
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_user', JSON.stringify({ email: match.email, name: match.name, role: 'OWNER' }));
        document.cookie = `admin_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        authenticated = true;
      }
    }

    if (authenticated) {
      router.replace('/admin');
    } else {
      setLoginError('Invalid email or password');
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    await signIn('google', { callbackUrl: '/admin' });
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#8B1A4A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6 md:mb-8">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-[#8B1A4A] rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
            <span className="text-white font-bold text-xl md:text-2xl font-serif">S</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Srinidhi Boutique</h1>
          <p className="text-gray-500 text-sm mt-1">Admin Dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 md:p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-5 md:mb-6 text-center">Sign in to continue</h2>

          {(error || loginError) && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">
              {error === 'AccessDenied'
                ? 'Access denied — your email is not authorized. Contact the store owner.'
                : loginError || 'Sign-in failed. Please try again.'}
            </div>
          )}

          {/* Email/Password Login */}
          <form onSubmit={handlePasswordLogin} className="space-y-4 mb-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@srinidhiboutique.com"
                required
                className="w-full px-4 py-3 min-h-[48px] border-2 border-gray-200 rounded-xl focus:border-[#B76E79] focus:outline-none transition-colors text-gray-800 text-base"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 min-h-[48px] border-2 border-gray-200 rounded-xl focus:border-[#B76E79] focus:outline-none transition-colors text-gray-800 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors min-h-0"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 min-h-[48px] bg-[#8B1A4A] text-white rounded-xl hover:bg-[#6d1439] transition-all font-medium disabled:opacity-60 text-base"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* OR divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-400">OR</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 min-h-[48px] border-2 border-gray-200 rounded-xl hover:border-[#B76E79] hover:bg-pink-50 transition-all font-medium text-gray-700 disabled:opacity-60 text-base"
          >
            <FcGoogle size={22} />
            Continue with Google
          </button>

          <p className="text-xs text-center text-gray-400 mt-6">
            Only authorized staff can access this dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
