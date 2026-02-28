'use client';

import { motion } from 'framer-motion';
import { Sparkles, Instagram, Send, Users, Zap, Globe, FileText } from 'lucide-react';
import { AnimatedHeader } from '@/components/homepage/AnimatedHeader';
import Footer from '@/components/homepage/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function CommunityPage() {
    return (
        <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-[#007AFF] selection:text-white overflow-x-hidden flex flex-col">
            <AnimatedHeader />

            <main className="flex-1 flex flex-col items-center justify-center relative py-20 px-6">
                {/* Background Decorations */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[500px] bg-[#007AFF] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-4xl w-full relative z-10 text-center space-y-12">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-6"
                    >
                        <Badge variant="outline" className="bg-white border-[#E5E5E7] text-[#007AFF] px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] shadow-sm animate-pulse">
                            Bientôt Disponible
                        </Badge>

                        <h1 className="text-5xl sm:text-7xl lg:text-9xl font-black tracking-tight text-[#1D1D1F] leading-[0.85]">
                            RESSOURCES <br />
                            <span className="text-[#007AFF]">GRATUITES.</span>
                        </h1>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="max-w-2xl mx-auto"
                    >
                        <p className="text-xl sm:text-2xl text-[#86868B] font-medium leading-relaxed">
                            On prépare une bibliothèque complète pour t'aider à <span className="text-[#1D1D1F] font-bold">lancer ta marque de vêtements</span> sans dépenser d'argent dans des formations inutiles.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8"
                    >
                        {[
                            { icon: FileText, text: "Fiches Techniques (Tech Packs)" },
                            { icon: Globe, text: "Listes pour trouver des usines" },
                            { icon: Zap, text: "Conseils pour bien vendre" }
                        ].map((item, i) => (
                            <div key={i} className="bg-white/50 backdrop-blur-md border border-white/80 rounded-[28px] p-6 flex flex-col items-center gap-3 transition-all hover:bg-white hover:shadow-apple-sm group">
                                <item.icon className="w-6 h-6 text-[#007AFF] transition-transform group-hover:scale-110" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#1D1D1F] text-center leading-tight">{item.text}</span>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="pt-8"
                    >
                        <p className="text-sm font-bold text-[#86868B] uppercase tracking-widest mb-8">Rejoignez l'attente sur nos réseaux</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href="https://instagram.com/outfity_fr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white border border-[#E5E5E7] text-[#1D1D1F] px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#F5F5F7] transition-all active:scale-95 shadow-sm"
                            >
                                <Instagram className="w-4 h-4 text-[#d80056]" /> Instagram
                            </a>
                            <a
                                href="https://tiktok.com/@outfity_fr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#1D1D1F] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all active:scale-95 shadow-apple-lg"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                                TikTok
                            </a>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
