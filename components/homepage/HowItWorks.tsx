'use client';

import { useRef } from 'react';
import { Search, Palette, Rocket, ArrowRight } from 'lucide-react';
import { motion, useInView } from 'framer-motion';

const steps = [
    {
        number: '01',
        icon: Search,
        tag: 'Résultat · Semaine 1',
        title: 'Tu sais quoi produire avant tes concurrents',
        description:
            'Virgil lit le marché TikTok 90 jours à l\'avance. Tu identifies la tendance à exploiter avant qu\'elle cartonne, avant que tout le monde le fasse.',
        color: '#007AFF',
        bg: 'from-[#007AFF]/8 to-transparent',
        metrics: ['90J AVANT LE MARCHÉ', '92% DE PRÉCISION', 'ZÉRO INTUITION'],
    },
    {
        number: '02',
        icon: Palette,
        tag: 'Résultat · Semaine 2–3',
        title: '50 pièces fabriquées, sans jamais quitter ta chambre',
        description:
            "Pharrell t'accompagne dans tes designs, Ada te guide pour trouver ton usine et négocier ton MOQ. Tu crées ton tech pack professionnel prêt à envoyer au fournisseur.",
        color: '#5856D6',
        bg: 'from-[#5856D6]/8 to-transparent',
        metrics: ['MOQ DÈS 50 PIÈCES', 'TECH PACK PDF', 'USINE VÉRIFIÉE'],
    },
    {
        number: '03',
        icon: Rocket,
        tag: 'Résultat · Semaine 4',
        title: 'Tu vends avant même d\'avoir tout ton stock',
        description:
            'Joy remplit ta waitlist avec du contenu viral, Johan configure ta boutique Shopify. Tu lances avec une audience prête à acheter, pas dans le vide.',
        color: '#30D158',
        bg: 'from-[#30D158]/8 to-transparent',
        metrics: ['+300 LEADS WAITLIST', 'BOUTIQUE EN LIGNE', 'PREMIÈRE VENTE J+30'],
    },
];

export default function HowItWorks() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <section className="bg-white py-20 sm:py-28 relative overflow-hidden border-t border-black/5">
            {/* Background grid */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                }}
            />

            <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <motion.div
                    className="mb-14 sm:mb-20"
                    initial={{ opacity: 0, y: 24 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-px w-10 bg-[#007AFF]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#007AFF]">Comment ça marche</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black text-[#1D1D1F] uppercase tracking-tight leading-[0.92]">
                        Le chemin le plus court{' '}
                        <span className="text-[#007AFF]">vers ton premier drop.</span>
                    </h2>
                    <p className="mt-4 text-sm sm:text-base text-[#86868B] max-w-lg mt-3">
                        Pas de tâtonnement, pas de 6 mois perdus. Chaque étape te rapproche d'une vente réelle, guidée par un agent IA expert.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
                    {steps.map((step, i) => {
                        const Icon = step.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 32 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.55, delay: 0.1 + i * 0.12 }}
                                className={`relative group rounded-3xl p-7 sm:p-8 bg-gradient-to-br ${step.bg} bg-[#FAFAFA] border border-black/[0.06] hover:border-black/10 hover:shadow-xl hover:shadow-black/5 transition-all duration-400 overflow-hidden cursor-default`}
                            >
                                {/* Glow */}
                                <div
                                    className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                    style={{ boxShadow: `inset 0 0 30px 0 ${step.color}0A` }}
                                />

                                {/* Top row: number + icon */}
                                <div className="flex items-start justify-between mb-8">
                                    <span
                                        className="text-7xl font-black leading-none select-none"
                                        style={{ color: step.color, opacity: 0.12 }}
                                    >
                                        {step.number}
                                    </span>
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                                        style={{ backgroundColor: `${step.color}15` }}
                                    >
                                        <Icon className="w-5 h-5" style={{ color: step.color }} />
                                    </div>
                                </div>

                                {/* Tag */}
                                <div className="mb-3">
                                    <span
                                        className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border"
                                        style={{ color: step.color, borderColor: `${step.color}30`, backgroundColor: `${step.color}0A` }}
                                    >
                                        {step.tag}
                                    </span>
                                </div>

                                {/* Title + Description */}
                                <h3 className="text-xl sm:text-2xl font-black text-[#1D1D1F] mb-3 leading-tight">{step.title}</h3>
                                <p className="text-sm text-[#86868B] leading-relaxed mb-7">{step.description}</p>

                                {/* Metrics row */}
                                <div className="flex flex-wrap gap-2 pt-5 border-t border-black/5">
                                    {step.metrics.map((m) => (
                                        <span key={m} className="text-[9px] font-black text-[#1D1D1F]/40 uppercase tracking-widest">
                                            {m}
                                        </span>
                                    ))}
                                </div>

                                {/* Bottom accent bar */}
                                <div
                                    className="absolute bottom-0 left-7 right-7 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                                    style={{ backgroundColor: step.color }}
                                />
                            </motion.div>
                        );
                    })}
                </div>

                {/* Connecting arrows on desktop */}
                <div className="hidden lg:flex items-center justify-center gap-0 mt-[-180px] mb-[120px] pointer-events-none">
                    {[0, 1].map((i) => (
                        <div key={i} className="flex-1 flex justify-end pr-4 opacity-20" style={{ marginLeft: `calc(${i === 0 ? '33.33%' : '33.33%'})` }}>
                            <ArrowRight className="w-5 h-5 text-black" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
