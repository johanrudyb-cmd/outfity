"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Lock, Sparkles, Loader2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { toast } from 'sonner';

function ActivationContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
    const [partnerEmail, setPartnerEmail] = useState('');
    const [partnerName, setPartnerName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await fetch(`/api/auth/partners/verify?token=${token}`);
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Invitation invalide');
                }
                const data = await res.json();
                setPartnerName(data.name);
                setPartnerEmail(data.email);
                setStatus('valid');
            } catch (err: any) {
                console.error('[Verify] Error:', err);
                setStatus('invalid');
            }
        };

        verifyToken();
    }, [token]);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas.");
            return;
        }
        if (password.length < 8) {
            toast.error("Le mot de passe doit contenir au moins 8 caractères.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/partners/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Une erreur est survenue lors de l'activation.");
            }

            toast.success("Votre compte partenaire est activé !");
            // Redirection vers le login avec l'email pré-rempli
            router.push(`/auth/signin?email=${encodeURIComponent(partnerEmail)}&activated=1&callbackUrl=/dashboard`);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="w-10 h-10 text-[#007AFF] animate-spin mb-4" />
                <p className="text-[#86868B] font-medium tracking-tight">Vérification de votre invitation privilégiée...</p>
            </div>
        );
    }

    if (status === 'invalid') {
        return (
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
                <Card className="max-w-md w-full border-none shadow-2xl rounded-[32px] p-10 text-center bg-white">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-red-500 opacity-80" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#1D1D1F]">Invitation Invalide</h1>
                    <p className="text-[#868673] mt-3 mb-10 leading-relaxed text-sm">
                        Ce lien d'invitation est expiré, déjà utilisé ou n'existe pas. Veuillez contacter votre administrateur pour une nouvelle invitation.
                    </p>
                    <Button
                        onClick={() => router.push('/')}
                        className="w-full bg-black hover:bg-black/90 text-white h-12 rounded-2xl font-bold border-0"
                    >
                        Retour à OUTFITY
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
            <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[40px] shadow-2xl overflow-hidden border border-black/5">

                {/* Section Visuelle - Style Apple/Bento */}
                <div className="p-12 lg:p-14 flex flex-col justify-center bg-[#000] text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#0047FF]/10 via-transparent to-transparent opacity-50" />

                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-[#007AFF] rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-[#007AFF]/40">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>

                        <h1 className="text-4xl font-bold tracking-tight mb-6 leading-[1.1]">
                            Bienvenue, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">{partnerName}</span>.
                        </h1>

                        <p className="text-[#86868B] text-lg leading-relaxed mb-10 font-medium">
                            Vous rejoignez le cercle très privé des Partenaires Strategiques OUTFITY.
                        </p>

                        <div className="space-y-6">
                            {[
                                { icon: Zap, label: "Commissions premium dès le 1er jour" },
                                { icon: ShieldCheck, label: "Interface de suivi dédiée 24/7" },
                                { icon: CheckCircle, label: "Paiements automatiques sécurisés" }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                        <item.icon className="w-4 h-4 text-[#007AFF]" />
                                    </div>
                                    <p className="text-[15px] font-medium text-white/90 pt-1.5">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Section Formulaire */}
                <div className="p-10 lg:p-14 flex flex-col justify-center bg-white">
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Configurez votre accès</h2>
                        <p className="text-[#6E6E73] mt-2 font-medium">Définissez vos identifiants pour accéder à votre interface partenaire.</p>
                    </div>

                    <form onSubmit={handleActivate} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-[0.1em] text-[#86868B] px-1">Identifiant Email</label>
                            <div className="relative group">
                                <Input
                                    value={partnerEmail}
                                    disabled
                                    className="h-14 bg-[#F5F5F7] border-[#E5E5EA] text-[#1D1D1F] font-bold rounded-2xl opacity-100 cursor-not-allowed pr-10"
                                />
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-[0.1em] text-[#86868B] px-1">Choisir votre mot de passe</label>
                            <Input
                                type="password"
                                placeholder="8 caractères minimum"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-14 bg-white border-[#E5E5EA] focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 rounded-2xl transition-all duration-300 placeholder:text-[#86868B]/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-[0.1em] text-[#86868B] px-1">Confirmer</label>
                            <Input
                                type="password"
                                placeholder="Répétez le mot de passe"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="h-14 bg-white border-[#E5E5EA] focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 rounded-2xl transition-all duration-300 placeholder:text-[#86868B]/50"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#007AFF] text-white hover:bg-[#0062CC] h-14 rounded-2xl text-lg font-bold shadow-2xl shadow-[#007AFF]/30 transition-all active:scale-[0.98] border-0 mt-4 group"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                            ) : (
                                <span className="flex items-center justify-center">
                                    Activer mon Partenariat
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-sm font-medium text-[#86868B]">
                            Sécurisé par OUTFITY Authenticator
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PartnerActivatePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#007AFF] animate-spin" />
            </div>
        }>
            <ActivationContent />
        </Suspense>
    );
}
