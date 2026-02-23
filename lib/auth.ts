import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Import dynamique pour éviter les problèmes Edge Runtime
          const { prisma } = await import('./prisma');
          const bcrypt = await import('bcryptjs');

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user || !user.password) {
            console.log('[Auth] Utilisateur non trouvé ou sans mot de passe');
            return null;
          }

          // Utiliser bcrypt.compare directement (pas .default)
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          console.log('[Auth] Validation mot de passe:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('[Auth] Mot de passe invalide');
            return null;
          }

          console.log('[Auth] Connexion réussie pour:', user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            plan: user.plan,
          };
        } catch (error) {
          console.error('Erreur dans authorize:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = (user as any).plan;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).plan = token.plan;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
