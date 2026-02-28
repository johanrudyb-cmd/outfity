"use client";

import { motion } from "framer-motion";
import { Rocket, Users, ArrowRight, Sparkles, ChevronRight, LayoutDashboard, Share2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GatewayScreenProps {
    userName: string;
    brandName?: string | null;
    isAdmin?: boolean;
}

export function GatewayScreen({ userName, brandName, isAdmin }: GatewayScreenProps) {
    const firstName = userName.split(' ')[0];

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#c7c7cc_1px,transparent_1px)] [background-size:32px_32px] opacity-20 pointer-events-none" />
            <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px]" />
            <div className="absolute -bottom-[10%] -left-[10%] w-[500px] h-[500px] bg-violet-400/10 rounded-full blur-[120px]" />

            <div className="max-w-7xl w-full relative z-10">
                <div className="text-center mb-12 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl sm:text-6xl font-black text-[#1D1D1F] tracking-tight leading-none">
                            Ravi de vous revoir, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 font-black">{firstName}</span>.
                        </h1>
                        <p className="text-[#86868B] text-xl font-medium mt-6">Sélectionnez votre environnement de travail</p>
                    </motion.div>
                </div>

                <div className={cn(
                    "grid gap-8 h-full",
                    isAdmin ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
                )}>

                    {/* OPTION 1: OUTFITY APP */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        whileHover={{ y: -10 }}
                    >
                        <Link href="/dashboard?mode=app" className="block h-full group">
                            <Card className="h-full border-none shadow-2xl rounded-[32px] sm:rounded-[40px] p-8 sm:p-10 bg-white hover:bg-black transition-all duration-500 overflow-hidden relative">
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 group-hover:bg-white/10 rounded-full transition-colors" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-16 h-16 bg-[#007AFF] rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-[#007AFF]/20 group-hover:bg-white">
                                        <LayoutDashboard className="w-8 h-8 text-white group-hover:text-black transition-colors" />
                                    </div>

                                    <h2 className="text-3xl font-bold mb-4 group-hover:text-white transition-colors tracking-tight">OUTFITY App.</h2>
                                    <p className="text-[#86868B] text-lg font-medium leading-relaxed mb-10 group-hover:text-white/60 transition-colors">
                                        Espace de création {brandName ? `pour ${brandName}` : ''}, gestion de collection et suivi de lancement.
                                    </p>

                                    <div className="mt-auto flex items-center gap-3 text-[#007AFF] group-hover:text-white font-bold transition-all group-hover:translate-x-2">
                                        Ouvrir l'application <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </motion.div>

                    {/* OPTION 2: PARTNERS */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        whileHover={{ y: -10 }}
                    >
                        <Link href="/partners" className="block h-full group">
                            <Card className="h-full border-none shadow-2xl rounded-[32px] sm:rounded-[40px] p-8 sm:p-10 bg-white hover:bg-[#007AFF] transition-all duration-500 overflow-hidden relative">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#007AFF]/5 group-hover:bg-white/10 rounded-full transition-colors" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-black/20 group-hover:bg-white">
                                        <Share2 className="w-8 h-8 text-white group-hover:text-black transition-colors" />
                                    </div>

                                    <h2 className="text-3xl font-bold mb-4 group-hover:text-white transition-colors tracking-tight">Programme Partenaire.</h2>
                                    <p className="text-[#86868B] text-lg font-medium leading-relaxed mb-10 group-hover:text-white/60 transition-colors">
                                        Statistiques d'affiliation, liens de parrainage et gestion de vos commissions.
                                    </p>

                                    <div className="mt-auto flex items-center gap-3 text-black group-hover:text-white font-bold transition-all group-hover:translate-x-2">
                                        Espace Partenaire <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </motion.div>

                    {/* OPTION 3: ADMIN (Only if isAdmin) */}
                    {isAdmin && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            whileHover={{ y: -10 }}
                        >
                            <Link href="/admin" className="block h-full group">
                                <Card className="h-full border-none shadow-2xl rounded-[32px] sm:rounded-[40px] p-8 sm:p-10 bg-white hover:bg-violet-600 transition-all duration-500 overflow-hidden relative border-t-4 border-violet-500">
                                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-500/5 group-hover:bg-white/10 rounded-full transition-colors" />

                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-violet-600/20 group-hover:bg-white">
                                            <ShieldCheck className="w-8 h-8 text-white group-hover:text-violet-600 transition-colors" />
                                        </div>

                                        <h2 className="text-3xl font-bold mb-4 group-hover:text-white transition-colors tracking-tight">Administration.</h2>
                                        <p className="text-[#86868B] text-lg font-medium leading-relaxed mb-10 group-hover:text-white/60 transition-colors">
                                            Pilotage global de la plateforme, gestion des utilisateurs, validateurs et métriques business.
                                        </p>

                                        <div className="mt-auto flex items-center gap-3 text-violet-600 group-hover:text-white font-bold transition-all group-hover:translate-x-2">
                                            Console Admin <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        </motion.div>
                    )}

                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-12 text-center"
                >
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#C7C7CC]">
                        SÉCURISÉ PAR OUTFITY IDENTITY CLOUD
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
