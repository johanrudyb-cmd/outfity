'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { X, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const before = [
    { text: '6 mois à chercher une usine sans savoir par où commencer' },
    { text: 'Tu commandes 500 pièces sans savoir si ça va se vendre' },
    { text: 'Tu lances dans le vide, sans audience, sans waitlist' },
    { text: '3 000€ de stock invendu qui dort dans ton garage' },
    { text: 'Tu copies une tendance déjà dépassée au moment de ton drop' },
];

const after = [
    { text: 'Usine vérifiée identifiée en 48h, MOQ dès 50 pièces' },
    { text: 'Tu sais exactement quoi produire avant que ça cartonne' },
    { text: '+300 personnes en waitlist avant même de produire' },
    { text: 'Première vente à J+30. Zéro stock mort, zéro prise de risque' },
    { text: 'Tu es 90 jours en avance sur le marché grâce au Radar TikTok' },
];

export default function BeforeAfter() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-60px' });

    return (
        <section className="bg-[#F5F5F7] py-20 sm:py-28 relative overflow-hidden border-t border-black/5">
            {/* Grid subtil */}
            <div
                className="absolute inset-0 opacity-[0.025] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div
                    className="mb-12 sm:mb-16"
                    initial={{ opacity: 0, y: 24 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-px w-10 bg-[#007AFF]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#007AFF]">La réalité</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-[#1D1D1F] uppercase tracking-tight leading-[0.92]">
                        Ce que ça change,{' '}
                        <span className="text-[#007AFF]">concrètement.</span>
                    </h2>
                    <p className="mt-4 text-sm sm:text-base text-[#86868B] max-w-lg">
                        La différence entre ceux qui lancent leur marque et ceux qui en rêvent encore dans 2 ans.
                    </p>
                </motion.div>

                {/* Before / After grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">

                    {/* AVANT */}
                    <motion.div
                        initial={{ opacity: 0, x: -24 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.55, delay: 0.15 }}
                        className="rounded-3xl bg-white border border-black/[0.07] overflow-hidden"
                    >
                        {/* Header card */}
                        <div className="px-7 sm:px-8 pt-7 sm:pt-8 pb-6 border-b border-black/5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                                    <X className="w-4 h-4 text-red-500" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-400">Sans OUTFITY</p>
                                    <p className="text-lg font-black text-[#1D1D1F] leading-tight">La voie du tâtonnement</p>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="px-7 sm:px-8 py-6 space-y-4">
                            {before.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
                                    className="flex items-start gap-3"
                                >
                                    <div className="w-5 h-5 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0 mt-0.5">
                                        <X className="w-3 h-3 text-red-400" strokeWidth={2.5} />
                                    </div>
                                    <p className="text-sm text-[#86868B] font-medium leading-snug">{item.text}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-7 sm:px-8 pb-7 sm:pb-8 pt-2">
                            <div className="rounded-2xl bg-[#F5F5F7] px-5 py-4">
                                <p className="text-xs font-black text-[#1D1D1F] uppercase tracking-wide mb-1">Résultat typique</p>
                                <p className="text-sm text-[#86868B] font-medium">6 à 18 mois, 1 500 à 3 000€ de stock dormant, abandon dans 70% des cas</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* APRÈS */}
                    <motion.div
                        initial={{ opacity: 0, x: 24 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.55, delay: 0.15 }}
                        className="rounded-3xl bg-[#1D1D1F] border border-white/5 overflow-hidden relative"
                    >
                        {/* Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#007AFF]/20 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#30D158]/10 blur-[60px] rounded-full pointer-events-none" />

                        {/* Header card */}
                        <div className="px-7 sm:px-8 pt-7 sm:pt-8 pb-6 border-b border-white/[0.06] relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-[#30D158]/15 border border-[#30D158]/20 flex items-center justify-center shrink-0">
                                    <Check className="w-4 h-4 text-[#30D158]" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#30D158]">Avec OUTFITY</p>
                                    <p className="text-lg font-black text-white leading-tight">La voie directe</p>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="px-7 sm:px-8 py-6 space-y-4 relative z-10">
                            {after.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
                                    className="flex items-start gap-3"
                                >
                                    <div className="w-5 h-5 rounded-full bg-[#30D158]/15 border border-[#30D158]/25 flex items-center justify-center shrink-0 mt-0.5">
                                        <Check className="w-3 h-3 text-[#30D158]" strokeWidth={2.5} />
                                    </div>
                                    <p className="text-sm text-white/70 font-medium leading-snug">{item.text}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer CTA */}
                        <div className="px-7 sm:px-8 pb-7 sm:pb-8 pt-2 relative z-10">
                            <div className="rounded-2xl bg-white/[0.06] border border-white/[0.08] px-5 py-4 mb-5">
                                <p className="text-xs font-black text-white uppercase tracking-wide mb-1">Résultat typique</p>
                                <p className="text-sm text-white/50 font-medium">30 jours, première vente réelle, risque limité au minimum</p>
                            </div>
                            <Link
                                href="/auth/signup"
                                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#007AFF] text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-white hover:text-[#1D1D1F] transition-all duration-300 group"
                            >
                                Commencer maintenant, c'est gratuit
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Stat row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.55, delay: 0.5 }}
                    className="mt-8 grid grid-cols-3 gap-4 sm:gap-6"
                >
                    {[
                        { value: '30j', label: 'De l\'idée au premier drop' },
                        { value: '50', label: 'Pièces minimum commandes' },
                        { value: '+300', label: 'Leads waitlist avant lancement' },
                    ].map(({ value, label }) => (
                        <div key={label} className="text-center p-4 sm:p-6 rounded-2xl bg-white border border-black/[0.06]">
                            <p className="text-2xl sm:text-3xl font-black text-[#007AFF] mb-1">{value}</p>
                            <p className="text-[11px] sm:text-xs text-[#86868B] font-medium leading-tight">{label}</p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
