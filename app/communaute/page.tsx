'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles,
    Instagram,
    FileText,
    Calculator,
    Globe,
    BookOpen,
    ArrowRight,
    Download,
    CheckCircle2,
    Boxes,
    Lock,
    Unlock
} from 'lucide-react';
import { AnimatedHeader } from '@/components/homepage/AnimatedHeader';
import Footer from '@/components/homepage/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const resources = [
    {
        id: "marketing",
        title: "Faire ses premiers 1 000€ avec sa marque de vêtement",
        description: "Les meilleures stratégies de positionnement, TikTok organique et conversions pour ta marque.",
        icon: Globe,
        category: "FORMATION PRIVÉE",
        link: "/communaute/marketing",
        color: "bg-[#d80056]",
        isDownload: false,
        isTool: false,
        locked: true,
    }
];

export default function CommunityPage() {
    const [unlockedItems, setUnlockedItems] = useState<string[]>([]);
    const [activeCodeResource, setActiveCodeResource] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem('unlocked_resources_v2');
        if (stored) {
            setUnlockedItems(JSON.parse(stored));
        }
    }, []);

    const handleVerifyCode = async (resourceId: string) => {
        if (!code) {
            setError("Le code est vide.");
            return;
        }
        setVerifying(true);
        setError("");

        try {
            const res = await fetch('/api/community/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, resourceId })
            });

            const data = await res.json();

            if (res.ok && data.valid) {
                // Unlock success
                const newUnlocked = [...unlockedItems, resourceId];
                setUnlockedItems(newUnlocked);
                localStorage.setItem('unlocked_resources_v2', JSON.stringify(newUnlocked));
                setActiveCodeResource(null);
                setCode("");
            } else {
                setError(data.error || "Code invalide.");
            }
        } catch {
            setError("Erreur système.");
        } finally {
            setVerifying(false);
        }
    };

    const handleActionClick = (resource: any) => {
        // If it's unlocked or not locked, just go to link or download
        if (!resource.locked || unlockedItems.includes(resource.id)) {
            if (resource.isDownload) {
                // Créer un lien dynamique pour forcer le téléchargement
                const a = document.createElement('a');
                a.href = resource.link;
                a.download = resource.link.split('/').pop() || 'download';
                a.click();
            } else {
                window.location.href = resource.link;
            }
            return;
        }

        // Otherwise, show code input
        setActiveCodeResource(resource.id);
        setCode("");
        setError("");
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-[#007AFF] selection:text-white overflow-x-hidden flex flex-col">
            <AnimatedHeader />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-blue-50/50 to-transparent rounded-full blur-[120px] -z-10" />

                    <div className="max-w-6xl mx-auto text-center space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <Badge variant="outline" className="bg-white/80 backdrop-blur-md border-[#E5E5E7] text-[#007AFF] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm mb-6">
                                Ressources Gratuites & Communauté
                            </Badge>
                            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] text-[#1D1D1F]">
                                LANCE TA MARQUE <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">COMME UN PRO.</span>
                            </h1>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="max-w-2xl mx-auto text-xl text-[#86868B] font-medium leading-relaxed"
                        >
                            Certaines de nos meilleures ressources sont <span className="text-[#1D1D1F] font-bold">100% gratuites mais exclusives.</span><br className="hidden sm:block" />
                            Récupère ton code d'accès sur nos réseaux pour les déverrouiller.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <Link href="/communaute/unlock">
                                <Button className="bg-[#1D1D1F] hover:bg-black text-white px-8 py-6 rounded-2xl font-black uppercase tracking-widest text-[11px] h-auto shadow-xl shadow-black/10">
                                    Comment obtenir un code ?
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </section>

                {/* Resources Grid */}
                <section className="max-w-7xl mx-auto px-6 pb-32">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {resources.map((resource, i) => {
                            const isUnlocked = !resource.locked || unlockedItems.includes(resource.id);
                            const isActiveInput = activeCodeResource === resource.id;

                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    whileHover={{ y: -8 }}
                                    className="group relative bg-white border border-[#E5E5E7] rounded-[32px] p-8 flex flex-col h-full transition-all hover:shadow-2xl hover:shadow-blue-500/10 overflow-hidden"
                                >
                                    <div className={`absolute top-0 right-0 w-32 h-32 ${resource.color} opacity-[0.03] blur-3xl transform translate-x-16 -translate-y-16 group-hover:opacity-[0.08] transition-opacity`} />

                                    <div className="flex items-start justify-between mb-8 relative z-10">
                                        <div className={`w-14 h-14 ${resource.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20`}>
                                            <resource.icon className="w-7 h-7" />
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge variant="outline" className="border-[#F5F5F7] bg-[#F5F5F7] text-[#86868B] font-black text-[9px] tracking-widest px-3 py-1">
                                                {resource.category}
                                            </Badge>
                                            {resource.locked && (
                                                <div className={`p-1.5 rounded-full ${isUnlocked ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-400'}`}>
                                                    {isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className={`text-2xl font-bold mb-3 transition-colors ${isUnlocked ? 'group-hover:text-[#007AFF]' : ''}`}>
                                        {resource.title}
                                    </h3>
                                    <p className="text-[#86868B] font-medium leading-relaxed flex-1">
                                        {resource.description}
                                    </p>

                                    <div className="mt-8 relative z-10">
                                        {isActiveInput ? (
                                            <div className="bg-[#F5F5F7] p-4 rounded-2xl space-y-3">
                                                <label className="text-[10px] font-black text-[#86868B] uppercase tracking-widest">Entre ton code personnel</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Ex: 123456"
                                                        value={code}
                                                        onChange={(e) => setCode(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode(resource.id)}
                                                        className="w-full text-center h-12 bg-white border border-black/10 rounded-xl font-black text-lg tracking-widest outline-none focus:border-[#007AFF]"
                                                    />
                                                </div>
                                                {error && <p className="text-[10px] font-bold text-red-500 text-center">{error}</p>}
                                                <div className="flex gap-2">
                                                    <Button variant="outline" onClick={() => setActiveCodeResource(null)} className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest text-[#86868B]">Annuler</Button>
                                                    <Button disabled={verifying} onClick={() => handleVerifyCode(resource.id)} className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest bg-[#1D1D1F] text-white">
                                                        {verifying ? 'Vérif...' : 'Valider'}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleActionClick(resource)}
                                                className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-all ${isUnlocked ? 'text-[#1D1D1F] group-hover:text-[#007AFF]' : 'text-[#86868B] group-hover:text-[#1D1D1F]'}`}
                                            >
                                                <span>
                                                    {isUnlocked ? (resource.isTool ? "Utiliser l'outil" : "Consulter") : "Débloquer la ressource"}
                                                </span>
                                                {isUnlocked ? (resource.isTool ? <ArrowRight className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />) : <Lock className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* CTA Section - The Bridge */}
                <section className="max-w-7xl mx-auto px-6 pb-32">
                    <div className="relative bg-[#1D1D1F] rounded-[48px] p-8 sm:p-16 overflow-hidden">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 opacity-20 blur-[120px] -translate-y-1/2 translate-x-1/4" />

                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                            <div className="max-w-xl space-y-6 text-center lg:text-left">
                                <h2 className="text-4xl sm:text-5xl font-black text-white leading-[1.1]">
                                    PRÊT À PASSER <br />
                                    <span className="text-blue-500 underline decoration-white/20 underline-offset-8 transition-all hover:text-white">AU NIVEAU SUPÉRIEUR ?</span>
                                </h2>
                                <p className="text-lg text-white/60 font-medium">
                                    Les ressources gratuites sont le début. <br className="hidden sm:block" />
                                    L'IA d'OUTFITY est là pour t'accompagner. Lance et structure ta marque dès aujourd'hui.
                                </p>
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                                    <div className="flex items-center gap-2 text-white/80 text-sm font-bold">
                                        <CheckCircle2 className="w-4 h-4 text-blue-500" /> Essai gratuit de 3 jours
                                    </div>
                                    <div className="flex items-center gap-2 text-white/80 text-sm font-bold">
                                        <CheckCircle2 className="w-4 h-4 text-blue-500" /> Sans engagement
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 w-full sm:w-auto">
                                <Link href="/auth/choose-plan">
                                    <Button className="w-full bg-[#007AFF] hover:bg-blue-600 text-white px-10 py-8 rounded-3xl font-black uppercase tracking-widest text-xs h-auto shadow-2xl shadow-blue-500/20 active:scale-95 transition-all">
                                        LANCER MA MARQUE GRATUITEMENT
                                    </Button>
                                </Link>
                                <div className="flex items-center justify-center gap-6 mt-4">
                                    <a href="https://instagram.com/outfity_fr" target="_blank" className="text-white/40 hover:text-white transition-colors">
                                        <Instagram className="w-6 h-6" />
                                    </a>
                                    <a href="https://tiktok.com/@outfity_fr" target="_blank" className="text-white/40 hover:text-white transition-colors">
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
