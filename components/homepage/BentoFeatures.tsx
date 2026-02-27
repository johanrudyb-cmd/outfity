'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Globe, Palette, FileText, TrendingUp, Zap, ShieldCheck } from 'lucide-react';

export function BentoFeatures() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setIsVisible(true);
                });
            },
            { threshold: 0.1 }
        );
        const element = document.getElementById('bento-features');
        if (element) observer.observe(element);
        return () => { if (element) observer.unobserve(element); };
    }, []);

    return (
        <section id="bento-features" className="py-24 sm:py-32 bg-[#F5F5F7] relative">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">

                <div className="text-center mb-16 lg:mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={isVisible ? { opacity: 1, scale: 1 } : {}}
                        className="space-y-4"
                    >
                        <h2 className="text-5xl lg:text-7xl font-black tracking-tighter text-black uppercase leading-none">
                            L'Infrastructure <br /> <span className="text-gray-300">Complète.</span>
                        </h2>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* LARGE CARD: SOURCING (Col 1-8) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isVisible ? { opacity: 1, y: 0 } : {}}
                        className="md:col-span-8 bg-white p-12 rounded-[40px] border border-black/[0.03] shadow-sm relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Globe className="w-64 h-64 text-black" />
                        </div>

                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="space-y-6">
                                <div className="w-14 h-14 bg-[#007AFF]/10 rounded-2xl flex items-center justify-center">
                                    <ShieldCheck className="w-8 h-8 text-[#007AFF]" />
                                </div>
                                <h3 className="text-4xl font-black uppercase text-black">Sourcing Direct.</h3>
                                <p className="text-gray-400 font-medium text-lg leading-relaxed max-w-xl">
                                    Accédez à notre base de données d'usines auditées. Filtrez par spécialité (Denim, Jersey, Outerwear) et envoyez vos Tech Packs en un clic.
                                </p>
                            </div>

                            <div className="mt-12 flex flex-wrap gap-4">
                                {['Portugal', 'Turquie', 'Italie', 'Vietnam'].map(country => (
                                    <span key={country} className="px-4 py-2 bg-[#F5F5F7] rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        {country}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* SIDE CARD: STRATEGY (Col 9-12) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={isVisible ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.2 }}
                        className="md:col-span-4 bg-black p-10 rounded-[40px] text-white flex flex-col justify-between group shadow-xl"
                    >
                        <div className="space-y-6">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-[#007AFF]" />
                            </div>
                            <h3 className="text-3xl font-black uppercase leading-tight">Brand <br /> Strategy.</h3>
                            <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Répliquez les plus grands.</p>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/10">
                            <p className="text-sm text-gray-400 font-medium">
                                Analysez les marges, le positionnement et les lancements des leaders du marché.
                            </p>
                        </div>
                    </motion.div>

                    {/* BOTTOM LEFT: CREATIVE (Col 1-4) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={isVisible ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.3 }}
                        className="md:col-span-4 bg-[#007AFF] p-10 rounded-[40px] text-white flex flex-col justify-between group h-[300px]"
                    >
                        <div className="space-y-4">
                            <Palette className="w-10 h-10 text-white" />
                            <h3 className="text-2xl font-black uppercase">Studio Créatif.</h3>
                        </div>
                        <p className="text-white/80 text-sm font-medium">
                            Génération de logos, moodboards et charte graphique instantanée.
                        </p>
                    </motion.div>

                    {/* BOTTOM RIGHT: TECH PACKS (Col 5-12) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isVisible ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.4 }}
                        className="md:col-span-8 bg-white p-10 rounded-[40px] border border-black/[0.03] shadow-sm relative overflow-hidden group h-[300px]"
                    >
                        <div className="flex flex-col md:flex-row gap-12 h-full">
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <Zap className="w-10 h-10 text-[#FF2D55]" />
                                    <h3 className="text-2xl font-black uppercase">Infrastructure Tech.</h3>
                                </div>
                                <p className="text-gray-400 text-sm font-medium">
                                    Générez des fiches techniques professionnelles (Tech Packs) prêtes pour la production.
                                </p>
                            </div>
                            <div className="hidden md:flex flex-1 items-center justify-center">
                                <div className="w-full h-[150px] bg-[#F5F5F7] rounded-2xl border border-dashed border-gray-300 flex items-center justify-center">
                                    <FileText className="w-12 h-12 text-gray-300" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>

                <div className="mt-20 text-center">
                    <Link
                        href="#pricing-section"
                        className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-all"
                    >
                        Voir toutes les fonctionnalités (12+)
                    </Link>
                </div>

            </div>
        </section>
    );
}
