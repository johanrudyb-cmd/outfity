
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Vérification de votre compte...');

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    useEffect(() => {
        if (!token || !email) {
            setStatus('error');
            setMessage('Lien de vérification invalide ou corrompu.');
            return;
        }

        const verify = async () => {
            try {
                const response = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, email }),
                });

                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                    setMessage('Votre email a été vérifié avec succès ! Redirection vers le choix de votre plan...');
                    // Redirection automatique vers le choix du plan après 2 secondes
                    setTimeout(() => router.push('/auth/choose-plan?verified=true'), 2000);
                } else {
                    setStatus('error');
                    setMessage(data.error || 'La vérification a échoué.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('Une erreur réseau est survenue.');
            }
        };

        verify();
    }, [token, email, router]);

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6 sm:p-8">
            <div className="w-full max-w-[420px] space-y-8 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Image
                        src="/icon.png"
                        alt="OUTFITY"
                        width={80}
                        height={80}
                        className="mx-auto rounded-2xl shadow-xl mb-8"
                    />
                </motion.div>

                <Card className="border-0 shadow-2xl rounded-[32px] overflow-hidden bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-8 sm:p-10">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="space-y-6"
                        >
                            {status === 'loading' && (
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="w-12 h-12 text-[#007AFF] animate-spin" />
                                    <h2 className="text-2xl font-black text-[#1D1D1F] italic uppercase">Vérification...</h2>
                                    <p className="text-[#86868B] font-medium">{message}</p>
                                </div>
                            )}

                            {status === 'success' && (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-2">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-2xl font-black text-[#1D1D1F] italic uppercase">Email Confirmé</h2>
                                    <p className="text-[#86868B] font-medium">{message}</p>
                                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mt-4">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 3 }}
                                            className="h-full bg-[#007AFF]"
                                        />
                                    </div>
                                    <Link href="/auth/signin" className="block w-full mt-4">
                                        <button className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-zinc-800 transition-all">
                                            Se connecter maintenant
                                        </button>
                                    </Link>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-2">
                                        <XCircle className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-2xl font-black text-[#1D1D1F] italic uppercase">Erreur</h2>
                                    <p className="text-[#86868B] font-medium">{message}</p>
                                    <Link href="/auth/signup" className="block w-full mt-4">
                                        <button className="w-full py-4 bg-white border border-gray-200 text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-50 transition-all">
                                            Réessayer l'inscription
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    </CardContent>
                </Card>

                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C7C7CC]">
                    Sécurité renforcée par OUTFITY CLOUD
                </p>
            </div>

            {/* Decorations */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#007AFF]/[0.03] rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
