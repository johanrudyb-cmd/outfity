'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Sparkles, Shirt, TrendingUp, DollarSign, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{ error: string, url: string } | null>(null);

  // Password strength logic
  const passwordCriteria = [
    { label: '10+ caractères', fulfilled: password.length >= 10 },
    { label: 'Majuscules & Minuscules', fulfilled: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: 'Chiffre & Symbole', fulfilled: /[0-9]/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
  const isPasswordStrong = passwordCriteria.every(c => c.fulfilled);

  // Détection du mode Partenaire / Affilié
  const affiliateToken = searchParams.get('affiliate_token');
  const callbackUrl = searchParams.get('callbackUrl') || (affiliateToken ? '/partners' : '/auth/choose-plan');
  const isPartnerFlow = callbackUrl.includes('/partners') || !!affiliateToken;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!isPasswordStrong) {
      setError('Votre mot de passe n\'est pas assez robuste.');
      return;
    }


    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          affiliateToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue');
        setLoading(false);
        return;
      }

      // Succès - On affiche le message de vérification par email
      setLoading(false);
      if (data.debugError) {
        setDebugInfo({ error: data.debugError, url: data.verificationUrl });
      }
      setSuccess(true);

    } catch (err) {
      setError('Une erreur est survenue');
      setLoading(false);
    }
  };


  if (success) {
    return (
      <div className={`min-h-[100dvh] flex flex-col justify-center items-center px-6 sm:px-8 py-12 safe-area-padding overflow-y-auto bg-[#F5F5F7]`}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-[420px] text-center space-y-8"
        >
          <Image
            src="/icon.png"
            alt="OUTFITY"
            width={80}
            height={80}
            className="mx-auto rounded-2xl shadow-xl"
          />
          <Card className="border-0 shadow-2xl rounded-[32px] bg-white p-8 sm:p-10">
            <div className={`w-20 h-20 ${debugInfo ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-[#007AFF]'} rounded-full flex items-center justify-center mx-auto mb-6`}>
              {debugInfo ? <X className="w-10 h-10" /> : <Sparkles className="w-10 h-10" />}
            </div>
            <h2 className="text-2xl font-black text-gray-900 italic uppercase mb-2">
              {debugInfo ? '⚠️ Email non envoyé' : 'Presque prêt !'}
            </h2>
            <p className="text-gray-500 font-medium mb-8">
              {debugInfo
                ? `L'API Resend a retourné une erreur (${debugInfo.error}). Copie le lien ci-dessous pour valider ton compte manuellement.`
                : `Un email de confirmation a été envoyé à ${email}. Clique sur le lien pour activer ton compte.`
              }
            </p>

            {debugInfo && (
              <div className="mb-8 p-4 bg-gray-50 rounded-2xl break-all text-[10px] font-mono border border-gray-100 italic transition-all active:scale-[0.98] cursor-pointer" onClick={() => { navigator.clipboard.writeText(debugInfo.url); alert('Lien copié !'); }}>
                {debugInfo.url}
              </div>
            )}

            <Link href="/auth/signin" className="block w-full">
              <button className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-zinc-800 transition-all shadow-lg active:scale-95">
                Retour à la connexion
              </button>
            </Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-[100dvh] flex flex-col justify-center items-center px-6 sm:px-8 py-12 safe-area-padding overflow-y-auto transition-colors duration-500 overflow-x-hidden ${isPartnerFlow ? 'bg-black text-white selection:bg-[#007AFF] selection:text-white' : 'bg-gray-50 text-gray-900'}`}>

      {/* Background Elements */}
      {isPartnerFlow ? (
        // PARTNER MODE BACKGROUND
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#007AFF] blur-[200px] rounded-full opacity-20 mix-blend-screen animate-pulse-slow" />

          {/* Floating Elements (Partner) */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] right-[15%] hidden lg:flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10"
          >
            <div className="w-10 h-10 rounded-full bg-[#007AFF]/20 flex items-center justify-center text-[#007AFF]"><DollarSign className="w-5 h-5" /></div>
            <div>
              <div className="text-xs text-gray-400">Commission</div>
              <div className="font-bold text-white">+ 29.70 €</div>
            </div>
          </motion.div>
        </div>
      ) : (
        // STANDARD MODE BACKGROUND
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-200 blur-[150px] rounded-full opacity-30" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-200 blur-[150px] rounded-full opacity-30" />

          {/* Floating Elements (Creator) */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[10%] hidden lg:flex items-center gap-3 bg-white/80 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-purple-100"
          >
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><Shirt className="w-5 h-5" /></div>
            <div>
              <div className="text-xs text-gray-500">Nouvelle Collection</div>
              <div className="font-bold text-gray-900">Tech Pack prêt</div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[20%] right-[10%] hidden lg:flex items-center gap-3 bg-white/80 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-blue-100"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><TrendingUp className="w-5 h-5" /></div>
            <div>
              <div className="text-xs text-gray-500">Radar Alert</div>
              <div className="font-bold text-gray-900">+450% Tendance</div>
            </div>
          </motion.div>
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
            {isPartnerFlow ? 'Devenez Partenaire' : 'Lancez votre Marque'}
          </h1>
          <p className={`${isPartnerFlow ? 'text-gray-400' : 'text-gray-600'}`}>
            {isPartnerFlow
              ? 'Rejoignez le programme et commencez à encaisser.'
              : 'Créez votre compte pour accéder au Brand Studio.'}
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
              <form onSubmit={handleSubmit} className="space-y-5">
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
                  <label className={`text-sm font-medium ${isPartnerFlow ? 'text-gray-300' : 'text-gray-700'}`}>Nom complet</label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    className={`h-12 px-4 rounded-xl ${isPartnerFlow
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#007AFF] focus:ring-[#007AFF]/20'
                      : 'bg-gray-50 border-gray-200 focus:border-blue-500'}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-sm font-medium ${isPartnerFlow ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                  <Input
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
                  <label className={`text-sm font-medium ${isPartnerFlow ? 'text-gray-300' : 'text-gray-700'}`}>Mot de passe</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className={`h-12 px-4 rounded-xl ${isPartnerFlow
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#007AFF] focus:ring-[#007AFF]/20'
                      : 'bg-gray-50 border-gray-200 focus:border-blue-500'}`}
                  />
                </div>

                <div className="space-y-3">
                  <label className={`text-sm font-medium ${isPartnerFlow ? 'text-gray-300' : 'text-gray-700'}`}>Confirmer le mot de passe</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className={`h-12 px-4 rounded-xl ${isPartnerFlow
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#007AFF] focus:ring-[#007AFF]/20'
                      : 'bg-gray-50 border-gray-200 focus:border-blue-500'}`}
                  />

                  {/* Password Strength FeedBack */}
                  {password.length > 0 && (
                    <div className="p-4 bg-black/5 rounded-2xl space-y-2 border border-black/[0.03]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Sécurité du compte</p>
                      {passwordCriteria.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] font-bold">
                          {c.fulfilled ? (
                            <Check className="w-3 h-3 text-green-500" strokeWidth={3} />
                          ) : (
                            <X className="w-3 h-3 text-gray-300" strokeWidth={3} />
                          )}
                          <span className={c.fulfilled ? 'text-[#1D1D1F]' : 'text-gray-400'}>{c.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>


                <Button
                  type="submit"
                  disabled={loading}
                  className={`w-full h-12 rounded-xl text-base font-semibold shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-2 ${isPartnerFlow
                    ? 'bg-[#007AFF] hover:bg-[#0062CC] text-white shadow-[#007AFF]/25'
                    : 'bg-black hover:bg-gray-900 text-white'
                    }`}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    isPartnerFlow ? "Rejoindre le programme" : "Créer mon compte"
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className={`text-sm ${isPartnerFlow ? 'text-gray-400' : 'text-gray-500'}`}>
                  Déjà un compte ?{' '}
                  <Link
                    href={`/auth/signin${isPartnerFlow ? '?callbackUrl=/partners' : ''}`}
                    className={`font-semibold hover:underline ${isPartnerFlow ? 'text-[#007AFF]' : 'text-blue-600'}`}
                  >
                    Se connecter
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <p className={`text-center text-xs ${isPartnerFlow ? 'text-gray-600' : 'text-gray-400'}`}>
          En vous inscrivant, vous acceptez nos <Link href="/legal/terms" className="underline">Conditions Générales</Link>.
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-white">Chargement...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
