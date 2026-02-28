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
            select: {
              id: true,
              email: true,
              password: true,
              name: true,
              plan: true,
              emailVerified: true
            }
          });

          if (!user || !user.password) {
            console.log('[Auth] Utilisateur non trouvé ou sans mot de passe');

            // --- PENDING VERIFICATION CHECK (Optional but good for UX) ---
            const { prisma } = await import('./prisma');
            const pendingToken = await prisma.verificationToken.findFirst({
              where: { identifier: credentials.email as string }
            });

            if (pendingToken) {
              console.log('[Auth] Compte en attente de vérification pour:', credentials.email);
              throw new Error('EMAIL_NOT_VERIFIED');
            }

            return null;
          }

          // --- EMAIL VERIFICATION CHECK ---
          if (!user.emailVerified) {
            console.log('[Auth] Email non vérifié pour:', user.email);
            // On jette une erreur spécifique capturable par le client
            throw new Error('EMAIL_NOT_VERIFIED');
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
    maxAge: 7 * 24 * 60 * 60, // 7 days (Balance between security and UX: Users don't need to sign in every day, but idle sessions clear after a week)
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
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.plan = (user as any).plan;
      }

      // Lors d'un update() côté client (ex: après paiement Stripe),
      // on relit TOUJOURS le plan depuis la DB pour garantir la cohérence
      if (trigger === 'update' && token.id) {
        try {
          const { prisma } = await import('./prisma');
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { plan: true },
          });
          if (dbUser) {
            token.plan = dbUser.plan;
          }
        } catch (error) {
          console.error('[JWT Update] DB read error:', error);
        }
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
