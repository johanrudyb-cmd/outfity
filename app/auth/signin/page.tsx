'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/auth/callback';
  const isPartnerFlow = callbackUrl.includes('/partners');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes('EMAIL_NOT_VERIFIED')) {
          setError('Votre adresse email n\'est pas encore confirmée. Veuillez vérifier votre boîte de réception.');
        } else {
          setError('Email ou mot de passe incorrect');
        }
        setLoading(false);
        return;
      }

      // Connexion réussie -> Rechargement complet pour garantir la session côté serveur
      window.location.href = callbackUrl;
    } catch (err: any) {
      console.error('Erreur lors de la connexion:', err);
      setError('Une erreur est survenue. Vérifiez votre connexion.');
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-[100dvh] flex flex-col justify-center items-center px-6 sm:px-8 py-12 safe-area-padding overflow-y-auto transition-colors duration-500 ${isPartnerFlow ? 'bg-black text-white selection:bg-[#007AFF] selection:text-white' : 'bg-gray-50 text-gray-900'}`}>

      {/* Dynamic Background for Partner Flow */}
      {isPartnerFlow && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#007AFF] blur-[200px] rounded-full opacity-20 mix-blend-screen" />
        </div>
      )}

      <div className="w-full px-4 sm:px-0 max-w-[420px] space-y-8 relative z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Link href="/" className="inline-block mb-8 hover:opacity-80 transition-opacity">
            <Image
              src="/icon.png"
              alt="OUTFITY Logo"
              width={80}
              height={80}
              className={`w-20 h-20 mx-auto rounded-2xl shadow-xl ${isPartnerFlow ? 'opacity-90 grayscale-[0.2]' : ''}`}
            />
          </Link>
          <h1 className={`text-3xl font-bold tracking-tight mb-2 ${isPartnerFlow ? 'text-white' : 'text-gray-900'}`}>
            {isPartnerFlow ? 'Espace Partenaire' : 'Bon retour parmi nous'}
          </h1>
          <p className={`${isPartnerFlow ? 'text-gray-400' : 'text-gray-600'}`}>
            {isPartnerFlow ? 'Connectez-vous pour accéder à votre dashboard affilié.' : 'Entrez vos identifiants pour accéder à votre compte.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full"
        >
          <Card className={`border-0 shadow-2xl overflow-hidden backdrop-blur-xl w-full ${isPartnerFlow ? 'bg-white/5 border border-white/10 ring-1 ring-white/5' : 'bg-white'}`}>
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl font-medium flex items-center gap-2"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                    {error}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className={`text-sm font-medium ${isPartnerFlow ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className={`h-12 px-4 rounded-xl ${isPartnerFlow
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#007AFF] focus:ring-[#007AFF]/20'
                      : 'bg-gray-50 border-gray-200 focus:border-blue-500'}`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className={`text-sm font-medium ${isPartnerFlow ? 'text-gray-300' : 'text-gray-700'}`}>Mot de passe</label>
                    <Link
                      href="/auth/forgot-password"
                      className={`text-sm font-medium hover:underline ${isPartnerFlow ? 'text-[#007AFF] hover:text-[#4D9EFF]' : 'text-blue-600 hover:text-blue-700'}`}
                    >
                      Oublié ?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className={`h-12 px-4 rounded-xl ${isPartnerFlow
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#007AFF] focus:ring-[#007AFF]/20'
                      : 'bg-gray-50 border-gray-200 focus:border-blue-500'}`}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className={`w-full h-12 rounded-xl text-base font-semibold shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${isPartnerFlow
                    ? 'bg-[#007AFF] hover:bg-[#0062CC] text-white shadow-[#007AFF]/25'
                    : 'bg-black hover:bg-gray-900 text-white'
                    }`}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className={`text-sm ${isPartnerFlow ? 'text-gray-400' : 'text-gray-500'}`}>
                  Pas encore de compte ?{' '}
                  <Link
                    href={`/auth/signup${isPartnerFlow ? '?callbackUrl=/partners' : ''}`}
                    className={`font-semibold hover:underline ${isPartnerFlow ? 'text-[#007AFF]' : 'text-blue-600'}`}
                  >
                    Créer un compte
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <p className={`text-center text-xs ${isPartnerFlow ? 'text-gray-600' : 'text-gray-400'}`}>
          &copy; {new Date().getFullYear()} OUTFITY. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-white">Chargement...</div>}>
      <SignInContent />
    </Suspense>
  );
}
