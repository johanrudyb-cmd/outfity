"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, DollarSign, Video, Users, Sparkles, TrendingUp, ShieldCheck, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function PartnerJoinPage() {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-[#007AFF] selection:text-white overflow-x-hidden">

            {/* Header - Glassmorphic */}
            <header className="fixed top-0 w-full z-50 bg-black/60 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="group flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/5 transition-colors">
                            <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                            <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">Retour</span>
                        </Link>
                        <div className="h-4 w-px bg-white/10 mx-2 hidden sm:block"></div>
                        <div className="flex items-center gap-2">
                            <Image src="/icon.webp" width={32} height={32} alt="Logo" className="rounded-lg opacity-90" />
                            <span className="font-semibold text-lg tracking-tight text-white/90 hidden sm:block">Partners</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/auth/signin?callbackUrl=/partners">
                            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium rounded-full px-4 hidden sm:flex">
                                Connexion
                            </Button>
                        </Link>
                        <Link href="/auth/signup?callbackUrl=/partners">
                            <Button className="bg-[#007AFF] hover:bg-[#0062CC] text-white rounded-full px-5 text-sm font-semibold shadow-[0_0_20px_rgba(0,122,255,0.3)] transition-all">
                                Rejoindre
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section - Immersive */}
            <section className="relative pt-48 pb-32 px-6 overflow-hidden min-h-[95vh] flex flex-col justify-center">

                {/* 
                   Dynamic Animated Background
                   Added multiple motion.divs for floating orbs and particles
                */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Main Blue Glow */}
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.2, 0.3, 0.2]
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#007AFF] blur-[200px] rounded-full opacity-20 mix-blend-screen"
                    />

                    {/* Secondary Floating Orb 1 */}
                    <motion.div
                        animate={{
                            x: [0, 100, 0],
                            y: [0, -50, 0],
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[150px] rounded-full mix-blend-screen"
                    />

                    {/* Secondary Floating Orb 2 */}
                    <motion.div
                        animate={{
                            x: [0, -70, 0],
                            y: [0, 50, 0],
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 blur-[150px] rounded-full mix-blend-screen"
                    />
                </div>

                <div className="max-w-5xl mx-auto text-center relative z-10 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, type: "spring" }}
                    >
                        <Badge variant="outline" className="border-[#007AFF]/30 bg-[#007AFF]/10 text-[#007AFF] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest rounded-full backdrop-blur-md mb-6 inline-flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007AFF] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007AFF]"></span>
                            </span>
                            Programme Ambassadeur Ouvert
                        </Badge>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                    >
                        <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter text-white mb-6 leading-[1.05]">
                            Monétisez votre <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#007AFF] via-[#4D9EFF] to-[#007AFF] bg-300% animate-gradient">Influence.</span>
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed tracking-wide"
                    >
                        Transformez votre audience en revenus récurrents. Recommandez l&apos;outil de création de marque n°1 et touchez <span className="text-white font-medium">30% à vie</span>.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4"
                    >
                        <Link href="/auth/signup?callbackUrl=/partners">
                            <Button size="lg" className="bg-white text-black hover:bg-gray-100 font-semibold h-14 px-10 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl">
                                Devenir Ambassadeur
                            </Button>
                        </Link>
                        <Link href="#how-it-works" className="text-[#007AFF] hover:text-[#4D9EFF] font-medium flex items-center gap-2 h-14 px-6 rounded-full hover:bg-[#007AFF]/10 transition-all border border-transparent hover:border-[#007AFF]/20">
                            Découvrir le système <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>

                {/* 
                    Floating UI Elements (Decorative) 
                    Re-implemented with Framer Motion for better animations
                */}
                <motion.div
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[20%] left-[8%] hidden lg:block"
                >
                    <div className="bg-[#1C1C1E]/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl skew-y-3 skew-x-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500"><DollarSign size={20} /></div>
                            <div>
                                <div className="text-xs text-gray-400">Commission reçue</div>
                                <div className="text-white font-bold">+ 29.70 €</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    animate={{ y: [0, 20, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-[20%] right-[8%] hidden lg:block"
                >
                    <div className="bg-[#1C1C1E]/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl -skew-y-3 -skew-x-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500"><Users size={20} /></div>
                            <div>
                                <div className="text-xs text-gray-400">Nouvel abonné</div>
                                <div className="text-white font-bold">Plan Créateur</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Extra Floating Element: Growth Graph */}
                <motion.div
                    animate={{ y: [0, -10, 0], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-[30%] right-[15%] hidden lg:block -z-10"
                >
                    <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#007AFF]/20 to-purple-500/20 blur-[40px]" />
                </motion.div>

            </section>

            {/* Key Metrics - Bento Grid Style */}
            <section className="bg-[#050507] py-24 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#0f0f12] rounded-3xl p-8 border border-white/5 hover:border-[#007AFF]/20 transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#007AFF]/5 rounded-full blur-2xl group-hover:bg-[#007AFF]/10 transition-all" />
                            <div className="relative z-10">
                                <TrendingUp className="w-8 h-8 text-[#007AFF] mb-4 opacity-80" />
                                <div className="text-5xl font-semibold text-white tracking-tight mb-2">30%</div>
                                <p className="text-gray-400 font-medium">De commission récurrente sur chaque abonnement, à vie.</p>
                            </div>
                        </div>
                        <div className="bg-[#0f0f12] rounded-3xl p-8 border border-white/5 hover:border-[#007AFF]/20 transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#007AFF]/5 rounded-full blur-2xl group-hover:bg-[#007AFF]/10 transition-all" />
                            <div className="relative z-10">
                                <Globe className="w-8 h-8 text-[#007AFF] mb-4 opacity-80" />
                                <div className="text-5xl font-semibold text-white tracking-tight mb-2">30j</div>
                                <p className="text-gray-400 font-medium">Durée de vie du cookie. Vous êtes payé même s&apos;ils achètent plus tard.</p>
                            </div>
                        </div>
                        <div className="bg-[#0f0f12] rounded-3xl p-8 border border-white/5 hover:border-[#007AFF]/20 transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#007AFF]/5 rounded-full blur-2xl group-hover:bg-[#007AFF]/10 transition-all" />
                            <div className="relative z-10">
                                <ShieldCheck className="w-8 h-8 text-[#007AFF] mb-4 opacity-80" />
                                <div className="text-5xl font-semibold text-white tracking-tight mb-2">100%</div>
                                <p className="text-gray-400 font-medium">Fiable. Paiements automatiques chaque mois dès 50€.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* The System - Apple Style Steps */}
            <section id="how-it-works" className="py-32 px-6 bg-black relative">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
                            Un système conçu pour <br />votre réussite.
                        </h2>
                        <p className="text-gray-400 text-lg font-light max-w-2xl mx-auto">Nous avons simplifié le processus pour que vous puissiez vous concentrer sur ce que vous faites de mieux : créer du contenu.</p>
                    </div>

                    <div className="space-y-24">
                        {/* Step 1 */}
                        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20">
                            <div className="flex-1 space-y-6 text-left order-2 md:order-1">
                                <div className="w-12 h-12 rounded-2xl bg-[#007AFF] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#007AFF]/30">1</div>
                                <h3 className="text-3xl font-semibold text-white">Accédez au Content Cloud.</h3>
                                <p className="text-gray-400 text-lg leading-relaxed">
                                    Plus besoin de tourner. Connectez-vous à votre espace partenaire et téléchargez des centaines de vidéos virales, clips, et templates prêts à l&apos;emploi.
                                </p>
                            </div>
                            <div className="flex-1 order-1 md:order-2 bg-[#0f0f12] p-8 rounded-[40px] border border-white/10 aspect-video flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#007AFF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <Video className="w-20 h-20 text-[#007AFF] opacity-50 relative z-10" />
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20">
                            <div className="flex-1 bg-[#0f0f12] p-8 rounded-[40px] border border-white/10 aspect-video flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#007AFF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <Users className="w-20 h-20 text-[#007AFF] opacity-50 relative z-10" />
                            </div>
                            <div className="flex-1 space-y-6 text-left">
                                <div className="w-12 h-12 rounded-2xl bg-[#007AFF] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#007AFF]/30">2</div>
                                <h3 className="text-3xl font-semibold text-white">Partagez votre lien unique.</h3>
                                <p className="text-gray-400 text-lg leading-relaxed">
                                    Utilisez votre lien de tracking personnalisé. Notre technologie attribue instantanément chaque visiteur à votre compte, même s&apos;il s&apos;inscrit 30 jours plus tard.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20">
                            <div className="flex-1 space-y-6 text-left order-2 md:order-1">
                                <div className="w-12 h-12 rounded-2xl bg-[#007AFF] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#007AFF]/30">3</div>
                                <h3 className="text-3xl font-semibold text-white">Encaissez chaque mois.</h3>
                                <p className="text-gray-400 text-lg leading-relaxed">
                                    Suivez vos gains en temps réel sur votre dashboard. Dès que vous atteignez le seuil, vos commissions sont virées automatiquement. C&apos;est du revenu passif, pour de vrai.
                                </p>
                            </div>
                            <div className="flex-1 order-1 md:order-2 bg-[#0f0f12] p-8 rounded-[40px] border border-white/10 aspect-video flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#007AFF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <DollarSign className="w-20 h-20 text-[#007AFF] opacity-50 relative z-10" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Simulator - Pro Aesthetic */}
            <section className="py-32 px-6 bg-[#050507] relative overflow-hidden">
                <div className="absolute inset-0 bg-[#007AFF]/5 blur-[100px] pointer-events-none" />

                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="text-center mb-16 space-y-2">
                        <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tight">Potentiel de revenus</h2>
                        <p className="text-xl text-gray-500 font-light">Commissions basées sur l&apos;abonnement Créateur (990€/an)</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="p-10 bg-[#0A0A0A] border border-white/5 rounded-3xl flex flex-col items-center text-center hover:border-white/10 transition-colors group">
                            <div className="text-gray-400 mb-6 font-semibold text-xs uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full">Débutant</div>
                            <div className="text-4xl font-bold text-white mb-2 group-hover:text-[#007AFF] transition-colors">297 €</div>
                            <div className="text-sm text-gray-500 mb-8 font-medium">/ mois</div>
                            <div className="w-full h-px bg-white/5 mb-8"></div>
                            <p className="text-gray-400 text-sm">Avec seulement <strong className="text-white">10 abonnés</strong> actifs.</p>
                        </div>

                        {/* Card 2 - Featured */}
                        <div className="p-10 bg-[#111111] border border-[#007AFF]/40 rounded-3xl flex flex-col items-center text-center transform md:-translate-y-6 shadow-2xl shadow-[#007AFF]/10 relative overflow-hidden">
                            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-[#007AFF] to-transparent"></div>
                            <div className="text-[#007AFF] mb-6 font-semibold text-xs uppercase tracking-widest px-3 py-1 bg-[#007AFF]/10 rounded-full">Pro</div>
                            <div className="text-5xl font-bold text-white mb-2">1 485 €</div>
                            <div className="text-sm text-gray-500 mb-8 font-medium">/ mois</div>
                            <div className="w-full h-px bg-white/5 mb-8"></div>
                            <p className="text-gray-300 text-sm">Avec <strong className="text-white">50 abonnés</strong> actifs.</p>
                        </div>

                        {/* Card 3 */}
                        <div className="p-10 bg-[#0A0A0A] border border-white/5 rounded-3xl flex flex-col items-center text-center hover:border-white/10 transition-colors group">
                            <div className="text-gray-400 mb-6 font-semibold text-xs uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full">Influenceur</div>
                            <div className="text-4xl font-bold text-white mb-2 group-hover:text-[#007AFF] transition-colors">5 940 €</div>
                            <div className="text-sm text-gray-500 mb-8 font-medium">/ mois</div>
                            <div className="w-full h-px bg-white/5 mb-8"></div>
                            <p className="text-gray-400 text-sm">Avec <strong className="text-white">200 abonnés</strong> actifs.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer CTA - Modern */}
            <section className="py-32 px-6 text-center border-t border-white/5 bg-black relative">
                <div className="max-w-4xl mx-auto space-y-10 relative z-10">
                    <h2 className="text-5xl md:text-7xl font-semibold text-white tracking-tighter leading-tight">
                        Prêt à rejoindre l&apos;élite ?
                    </h2>
                    <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">
                        L&apos;inscription prend 30 secondes. L&apos;approbation est immédiate.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                        <Link href="/auth/signup?callbackUrl=/partners">
                            <Button size="lg" className="bg-[#007AFF] text-white hover:bg-[#0062CC] font-semibold h-16 px-12 text-lg rounded-full shadow-[0_0_50px_rgba(0,122,255,0.4)] hover:shadow-[0_0_80px_rgba(0,122,255,0.6)] transition-all duration-300 transform hover:-translate-y-1">
                                Créer mon compte partenaire
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 bg-black">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2 opacity-60">
                        <Image src="/icon.webp" width={24} height={24} alt="Logo" className="rounded-md grayscale" />
                        <span>© 2026 OUTFITY Partners.</span>
                    </div>
                    <div className="flex gap-8">
                        <Link href="/" className="hover:text-white transition-colors">Retour au site</Link>
                        <Link href="/legal/terms" className="hover:text-white transition-colors">CGV Affiliation</Link>
                        <Link href="mailto:partners@outfity.fr" className="hover:text-white transition-colors">Support</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

