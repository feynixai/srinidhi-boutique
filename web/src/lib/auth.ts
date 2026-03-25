import { getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account }: { user: { email?: string | null; name?: string | null; image?: string | null }; account: { provider: string; providerAccountId: string } | null }) {
      if (account?.provider === 'google' && user.email) {
        try {
          await fetch(`${API_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              googleId: account.providerAccountId,
              email: user.email,
              name: user.name,
              avatar: user.image,
            }),
          });
        } catch {
          // Non-fatal
        }
      }
      return true;
    },
    async session({ session, token }: { session: Record<string, unknown>; token: { sub?: string } }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.sub;
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET || 'srinidhi-secret-change-in-prod',
};

export async function getSession() {
  return getServerSession(authOptions as Parameters<typeof getServerSession>[0]);
}
