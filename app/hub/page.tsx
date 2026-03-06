'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, Shirt, DollarSign, Lock, ArrowRight, Video, Target, Users } from 'lucide-react';
import { isFreePlan, isPaidPlan } from '@/lib/plan-utils';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface HubCardProps {
    title: string;
    description: string;
    icon: any;
    href: string;
    isActive: boolean;
    color: string;
    features: string[];
    cta: string;
}

function HubCard({ title, description, icon: Icon, href, isActive, color, features, cta }: HubCardProps) {
    const router = useRouter();

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn(
                "relative rounded-3xl p-8 border-2 flex flex-col h-full transition-all duration-300 overflow-hidden group",
                isActive
                    ? "bg-white border-white/20 shadow-xl"
                    : "bg-gray-50/50 border-gray-200 opacity-90 grayscale-[0.5] hover:grayscale-0"
            )}
        >
            {/* Background Glow */}
            <div className={cn(
                "absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[100px] opacity-20",
                color
            )} />

            {/* Header */}
            <div className="relative z-10 flex items-start justify-between mb-6">
                <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm",
                    isActive ? "bg-white" : "bg-gray-200"
                )}>
                    <Icon className={cn("w-7 h-7", isActive ? "text-black" : "text-gray-500")} />
                </div>
                {!isActive && (
                    <div className="bg-black/5 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-black/60" />
                        <span className="text-xs font-semibold text-black/60 uppercase tracking-wide">Verrouillé</span>
                    </div>
                )}
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2 relative z-10">{title}</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed relative z-10">{description}</p>

            {/* Features */}
            <div className="space-y-3 mb-8 flex-1 relative z-10">
                {features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-green-500" : "bg-gray-300")} />
                        <span className="text-sm font-medium text-gray-700">{feature}</span>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <Button
                onClick={() => router.push(href)}
                className={cn(
                    "w-full h-12 rounded-xl font-semibold gap-2 relative z-10 transition-all shadow-lg",
                    isActive
                        ? "bg-black text-white hover:bg-black/90 hover:scale-[1.02]"
                        : "bg-white text-black border-2 border-black/10 hover:bg-gray-50"
                )}
            >
                {isActive ? (
                    <>
                        {cta} <ArrowRight className="w-4 h-4" />
                    </>
                ) : (
                    <>
                        Débloquer l'accès <Lock className="w-4 h-4 ml-1" />
                    </>
                )}
            </Button>
        </motion.div>
    );
}

export default function HubPage() {
    const { data: session } = useSession();
    const user = session?.user as any;

    // Par défaut, tout le monde a accès à Brand Studio (Free Plan)
    // L'Academy et Partners nécessitent des conditions (ou pas, selon stratégie)
    // Ici on simule pour l'UI, on connectera à la DB après
    const isBrandActive = true;
    const isAcademyActive = isPaidPlan(user?.plan) || user?.isInfluencer;
    const isPartnersActive = true; // Tout le monde peut devenir affilié

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
            {/* Navbar Minimaliste */}
            <header className="h-16 px-6 flex items-center justify-between bg-white border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <Image src="/icon.webp" width={32} height={32} alt="Logo" className="rounded-lg" />
                    <span className="font-bold text-lg tracking-tight">OUTFITY HUB</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold">{user?.name || 'Créateur'}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-white shadow-md" />
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-12 flex flex-col justify-center">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                        L'Écosystème des Créateurs
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        Un seul compte pour bâtir votre marque, développer votre influence et générer des revenus.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
                    {/* 1. BRAND STUDIO (L'Usine) */}
                    <HubCard
                        title="Brand Studio"
                        description="L'outil de production n°1. Créez vos tech packs, sourcez vos usines et analysez les tendances mondiales."
                        icon={Shirt}
                        href="/dashboard"
                        isActive={isBrandActive}
                        color="bg-blue-500"
                        features={[
                            "Création de Tech Packs Pro",
                            "Sourcing Usines Vérifié",
                            "Radar de Tendances 24/7",
                            "Calculateur de Marge"
                        ]}
                        cta="Ouvrir le Studio"
                    />

                    {/* 2. ACADEMY & GROWTH (L'Influence) */}
                    <HubCard
                        title="Growth Academy"
                        description="Développez votre Personal Branding. Des scripts vidéo générés par IA et une analyse de vos réseaux."
                        icon={Video}
                        href="/academy"
                        isActive={isAcademyActive}
                        color="bg-purple-500"
                        features={[
                            "Générateur de Scripts Viraux",
                            "Analyseur de Compte TikTok",
                            "Coaching Mentor IA",
                            "Calendrier Éditorial Dynamique"
                        ]}
                        cta="Lancer ma Croissance"
                    />

                    {/* 3. PARTNERS (L'Affiliation) */}
                    <HubCard
                        title="Partner Portal"
                        description="Transformez votre audience en revenus. Recommandez OUTFITY et gagnez 30% de commissions à vie."
                        icon={DollarSign}
                        href="/partners"
                        isActive={isPartnersActive}
                        color="bg-green-500"
                        features={[
                            "30% de Commissions Récurrentes",
                            "Bibliothèque de Vidéos à Clipper",
                            "Tracking en Temps Réel",
                            "Paiements Automatiques"
                        ]}
                        cta="Accéder à mes Gains"
                    />
                </div>

                <div className="mt-16 text-center">
                    <p className="text-gray-400 text-sm">
                        Besoin d'aide ? <a href="mailto:support@outfity.fr" className="text-gray-600 underline font-medium">Contacter le support VIP</a>
                    </p>
                </div>
            </main>
        </div>
    );
}
