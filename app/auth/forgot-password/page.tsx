'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Added useRouter import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Turnstile from 'react-turnstile';
import Image from 'next/image';

export default function ForgotPasswordPage() {
    const router = useRouter(); // Added useRouter initialization
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (process.env.NODE_ENV !== 'development' && !turnstileToken) {
            setError('Veuillez valider le captcha.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    turnstileToken
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Une erreur est survenue');
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-[#F5F5F7] flex flex-col justify-center items-center px-6 sm:px-8 py-12 safe-area-padding overflow-y-auto">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-200 blur-[150px] rounded-full opacity-30" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-200 blur-[150px] rounded-full opacity-30" />
            </div>

            <div className="w-full px-4 sm:px-0 max-w-[420px] space-y-8 relative z-10 mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <Link href="/auth/signin" className="inline-block mb-8 hover:opacity-80 transition-opacity">
                        <Image
                            src="/icon.webp"
                            alt="OUTFITY"
                            width={80}
                            height={80}
                            className="mx-auto rounded-2xl shadow-xl"
                        />
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 text-gray-900">
                        Oubli ?
                    </h1>
                    <p className="text-gray-600">
                        Pas de panique, on s'occupe de tout.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full"
                >
                    <Card className="border-0 shadow-2xl overflow-hidden backdrop-blur-xl w-full bg-white">
                        <CardContent className="p-6 sm:p-8">
                            {success ? (
                                <div className="space-y-6 text-center py-4">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-4">
                                        <Sparkles className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 uppercase italic">Lien envoyé</h2>
                                    <p className="text-sm text-gray-600 font-medium">
                                        Si un compte existe pour <strong>{email}</strong>, un lien a été envoyé. Vérifiez vos spams !
                                    </p>
                                    <Link href="/auth/signin" className="block w-full">
                                        <Button className="w-full h-12 rounded-xl bg-black hover:bg-zinc-800 text-white font-black uppercase tracking-widest text-xs">
                                            Retourner à la connexion
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {error && (
                                        <div className="p-4 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl font-medium">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Votre adresse email</label>
                                        <Input
                                            type="email"
                                            placeholder="votre@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoComplete="email"
                                            className="h-12 px-4 rounded-xl bg-gray-50 border-gray-200 focus:border-blue-500"
                                        />
                                    </div>

                                    {/* Turnstile Captcha */}
                                    <div className="flex justify-center">
                                        <Turnstile
                                            sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                                            onVerify={(token) => setTurnstileToken(token)}
                                            theme="light"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-12 rounded-xl bg-black hover:bg-zinc-800 text-white font-black uppercase tracking-widest text-xs shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Envoyer le lien"}
                                    </Button>

                                    <div className="text-center pt-2">
                                        <Link href="/auth/signin" className="text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors">
                                            Retour à la connexion
                                        </Link>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
