"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Lock, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

function InvitationContent() {
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
                const res = await fetch(`/api/auth/affiliate/verify?token=${token}`);
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Token invalide');
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
            const res = await fetch('/api/auth/affiliate/activate', {
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
                <p className="text-[#86868B] font-medium tracking-tight">Vérification de votre invitation...</p>
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
                        Retour à l'accueil
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
            <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[40px] shadow-2xl overflow-hidden border border-black/5">

                {/* Visual Section */}
                <div className="p-10 lg:p-14 flex flex-col justify-center bg-black text-white relative overflow-hidden">
                    {/* Decorative radial blur */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#007AFF] blur-[80px] rounded-full opacity-25" />

                    <div className="relative z-10">
                        <Sparkles className="w-12 h-12 text-[#007AFF] mb-8" />
                        <h1 className="text-4xl font-bold tracking-tight mb-6 leading-[1.15]">
                            Bienvenue, <br />
                            <span className="text-[#007AFF]">{partnerName}</span>.
                        </h1>
                        <p className="text-white/60 text-lg leading-relaxed mb-10">
                            Vous avez été invité à rejoindre le programme partenaire exclusif d'OUTFITY.
                        </p>

                        <ul className="space-y-6">
                            {[
                                "Gagnez jusqu'à 30% de commission",
                                "Dashboard de suivi en temps réel",
                                "Paiements automatiques mensuels",
                                "Accès anticipé aux collections"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-4 text-[15px] font-medium text-white/90">
                                    <div className="w-6 h-6 rounded-full bg-[#007AFF]/20 flex items-center justify-center shrink-0">
                                        <CheckCircle className="w-4 h-4 text-[#007AFF]" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Form Section */}
                <div className="p-10 lg:p-14 flex flex-col justify-center">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-[#1D1D1F] tracking-tight">Activez votre compte</h2>
                        <p className="text-[#6E6E73] mt-3 leading-relaxed">
                            Définissez votre mot de passe pour accéder à votre espace partenaire.
                        </p>
                    </div>

                    <form onSubmit={handleActivate} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[12px] font-black uppercase tracking-widest text-[#86868B] px-1">Email (Partenaire)</label>
                            <Input
                                value={partnerEmail}
                                disabled
                                className="h-14 bg-[#F5F5F7] border-[#E5E5EA] text-[#1D1D1F] font-medium rounded-2xl opacity-80"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-black uppercase tracking-widest text-[#86868B] px-1">Mot de passe</label>
                            <Input
                                type="password"
                                placeholder="8 caractères minimum"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-14 bg-white border-[#E5E5EA] focus:border-[#007AFF] focus:ring-[#007AFF]/10 rounded-2xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-black uppercase tracking-widest text-[#86868B] px-1">Confirmer mot de passe</label>
                            <Input
                                type="password"
                                placeholder="Répétez votre mot de passe"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="h-14 bg-white border-[#E5E5EA] focus:border-[#007AFF] focus:ring-[#007AFF]/10 rounded-2xl"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#007AFF] text-white hover:bg-[#0062CC] h-14 rounded-2xl text-lg font-bold shadow-xl shadow-[#007AFF]/20 transition-all active:scale-95 border-0"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                            ) : (
                                <>
                                    Activer mon accès
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-black/5 text-center">
                        <button
                            type="button"
                            onClick={() => router.push(`/auth/signin?callbackUrl=/dashboard`)}
                            className="text-sm text-[#007AFF] font-bold hover:underline"
                        >
                            Vous possédez déjà un compte ? Connectez-vous
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AffiliateInvitePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#007AFF] animate-spin" />
            </div>
        }>
            <InvitationContent />
        </Suspense>
    );
}
