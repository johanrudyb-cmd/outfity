'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Check, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const passwordCriteria = [
        { label: '10+ caractères', fulfilled: password.length >= 10 },
        { label: 'Majuscules & Minuscules', fulfilled: /[A-Z]/.test(password) && /[a-z]/.test(password) },
        { label: 'Chiffre & Symbole', fulfilled: /[0-9]/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];
    const isPasswordStrong = passwordCriteria.every(c => c.fulfilled);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isPasswordStrong) {
            setError('Votre mot de passe n\'est pas assez robuste.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Une erreur est survenue');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/auth/signin');
            }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!token || !email) {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
                <Card className="max-w-md w-full text-center p-12 border-0 shadow-2xl rounded-[32px]">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                        <X className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 italic uppercase mb-2">Lien invalide</h2>
                    <p className="text-gray-500 font-medium mb-8">Ce lien de réinitialisation est incomplet ou expiré.</p>
                    <Button onClick={() => router.push('/auth/forgot-password')} className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs">
                        Demander un nouveau lien
                    </Button>
                </Card>
            </div>
        );
    }

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
                            src="/icon.png"
                            alt="OUTFITY"
                            width={80}
                            height={80}
                            className="mx-auto rounded-2xl shadow-xl"
                        />
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight mb-2 text-gray-900 uppercase italic">
                        Renouveau
                    </h1>
                    <p className="text-gray-600 font-medium">
                        Choisissez votre nouvelle clé d'accès.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full"
                >
                    <Card className="border-0 shadow-2xl overflow-hidden backdrop-blur-xl w-full bg-white rounded-[32px]">
                        <CardContent className="p-8">
                            {success ? (
                                <div className="space-y-6 text-center py-4">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-4">
                                        <Sparkles className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900 uppercase italic">C'est fait !</h2>
                                    <p className="text-sm text-gray-600 font-medium font-medium">
                                        Mot de passe mis à jour. Redirection en cours...
                                    </p>
                                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mt-4">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 3 }}
                                            className="h-full bg-black"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {error && (
                                        <div className="p-4 text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl font-medium">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 uppercase tracking-widest text-[10px]">Nouveau mot de passe</label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            autoComplete="new-password"
                                            className="h-12 px-4 rounded-xl bg-gray-50 border-gray-200 focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-gray-700 uppercase tracking-widest text-[10px]">Confirmer le mot de passe</label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            autoComplete="new-password"
                                            className="h-12 px-4 rounded-xl bg-gray-50 border-gray-200 focus:border-blue-500"
                                        />

                                        {/* Password Strength FeedBack */}
                                        {password.length > 0 && (
                                            <div className="p-4 bg-gray-50 rounded-2xl space-y-2 border border-gray-100">
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
                                        className="w-full h-14 rounded-2xl bg-black hover:bg-zinc-800 text-white font-black uppercase tracking-widest text-xs shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Valider le changement"}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
