import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user?.email || '';
      return email.toLowerCase().endsWith('@nitc.ac.in');
    },
    async session({ session }) {
      const admins = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      session.isAdmin = admins.includes((session.user?.email || '').toLowerCase());
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
};
