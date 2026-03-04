'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Mail, Loader2, CheckCircle2, Instagram } from 'lucide-react';
import { AnimatedHeader } from '@/components/homepage/AnimatedHeader';
import Footer from '@/components/homepage/Footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const resourcesList = [
    { id: 'marketing', name: 'Faire ses premiers 1 000€ avec sa marque de vêtement' },
];

export default function UnlockPage() {
    const searchParams = useSearchParams();
    const resourceParam = searchParams.get('resource');

    // Check if the parameter exists and is valid
    const validResource = resourcesList.find(r => r.id === resourceParam);

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validResource) return;

        if (!email || !email.includes('@')) {
            setError('Veuillez entrer un email valide.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/community/request-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    resourceId: validResource.id,
                    resourceName: validResource.name
                })
            });

            if (!res.ok) {
                throw new Error("Impossible d'envoyer le code.");
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans overflow-x-hidden flex flex-col">
            <AnimatedHeader />

            <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-6">
                <Link
                    href="/communaute"
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#86868B] hover:text-[#007AFF] transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Retour au Hub
                </Link>

                <div className="max-w-md w-full bg-white rounded-[32px] border border-black/[0.05] p-8 sm:p-10 shadow-xl relative overflow-hidden">
                    {/* Accent decoration */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 opacity-[0.05] blur-[50px] -translate-y-1/2 translate-x-1/2" />

                    {!validResource ? (
                        // ❌ STATE: NO VALID RESOURCE LINK
                        <div className="relative z-10 text-center space-y-6">
                            <div className="w-16 h-16 bg-[#F5F5F7] rounded-2xl mx-auto flex items-center justify-center text-[#86868B] mb-6 border border-black/5">
                                <Lock className="w-8 h-8" />
                            </div>
                            <div className="space-y-4">
                                <h1 className="text-2xl font-black tracking-tight">ACCÈS RESTREINT</h1>
                                <p className="text-sm text-[#86868B] font-medium leading-relaxed">
                                    Pour obtenir le lien secret de déverrouillage, <strong>abonne-toi</strong> à OUTFITY sur Instagram et envoie <strong>le nom de la ressource en DM.</strong>
                                </p>
                            </div>
                            <a href="https://instagram.com/outfity_fr" target="_blank" rel="noopener noreferrer" className="block w-full">
                                <Button className="w-full h-14 bg-gradient-to-r from-[#d80056] to-[#ff006e] hover:opacity-90 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-pink-500/20 active:scale-95 transition-all mt-4 border-none flex items-center gap-2 justify-center">
                                    <Instagram className="w-4 h-4" /> Go sur Instagram
                                </Button>
                            </a>
                        </div>
                    ) : (
                        // ✅ STATE: VALID LINK
                        <>
                            <div className="relative z-10 text-center space-y-4 mb-8">
                                <div className="w-16 h-16 bg-[#1D1D1F] rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg mb-4">
                                    <Lock className="w-8 h-8" />
                                </div>
                                <h1 className="text-3xl font-black tracking-tight">DÉBLOQUER L'ACCÈS</h1>
                                <p className="text-sm text-[#86868B] font-medium px-4">
                                    Ressource demandée : <strong className="text-[#1D1D1F]">{validResource.name}</strong>
                                </p>
                            </div>

                            {success ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center space-y-6 relative z-10"
                                >
                                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold">Vérifie tes emails</h3>
                                        <p className="text-sm text-[#86868B]">
                                            Ton code a été envoyé à <strong>{email}</strong>.<br />
                                            N'oublie pas de vérifier tes spams.
                                        </p>
                                    </div>
                                    <Link href="/communaute">
                                        <Button className="w-full mt-6 bg-[#1D1D1F] hover:bg-black text-white h-14 rounded-2xl font-bold uppercase tracking-widest text-[11px]">
                                            Aller au Hub Communauté
                                        </Button>
                                    </Link>
                                </motion.div>
                            ) : (
                                <motion.form
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onSubmit={handleSubmit}
                                    className="space-y-6 relative z-10"
                                >
                                    <div className="space-y-2 text-left">
                                        <label className="text-[10px] font-black text-[#86868B] uppercase tracking-widest">Ton Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868B]" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="createur@marque.com"
                                                className="w-full h-14 bg-[#F5F5F7] border border-black/5 rounded-2xl pl-12 pr-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <p className="text-xs text-red-500 font-bold bg-red-50 p-3 rounded-xl text-center">{error}</p>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-14 bg-[#007AFF] hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all mt-4 border-none"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Recevoir mon code privé"}
                                    </Button>

                                    <p className="text-[10px] font-semibold text-[#86868B] text-center px-4 leading-relaxed">
                                        Le code te sera envoyé immédiatement sur cette adresse mail.
                                    </p>
                                </motion.form>
                            )}
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
