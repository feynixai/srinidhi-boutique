'use client';
import { signIn, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';

export default function AdminLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) router.replace('/admin');
  }, [session, router]);

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#8B1A4A] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl font-serif">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Srinidhi Boutique</h1>
          <p className="text-gray-500 text-sm mt-1">Admin Dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">Sign in to continue</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">
              {error === 'AccessDenied'
                ? 'Access denied — your email is not authorized. Contact the store owner.'
                : 'Sign-in failed. Please try again.'}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-200 rounded-xl hover:border-[#B76E79] hover:bg-pink-50 transition-all font-medium text-gray-700 disabled:opacity-60"
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
