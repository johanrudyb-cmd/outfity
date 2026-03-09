'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BarChart3, Palette, Factory, ShoppingCart, Share2, Check } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const AGENTS = [
    {
        name: 'Virgil',
        role: 'Stratégie & Vision',
        description: 'Virgil lit le marché pour toi. Il analyse les marques qui cartonnent et te dit exactement sur quoi miser cette saison, avant que tout le monde le voit.',
        image: '/images/agents/virgil_final.webp',
        color: '#007AFF',
        icon: BarChart3,
        stats: ['Positionnement', 'ANALYSE MARCHÉ', 'BENCHMARKING']
    },
    {
        name: 'Pharrell',
        role: 'Design & Accompagnement',
        description: 'Ton mentor créatif perso. Il te guide pour construire ton univers visuel et créer des pieces qui ont une vraie identité, pas juste un logo sur un tee-shirt.',
        image: '/images/agents/pharrell_final.webp',
        color: '#A032FF',
        icon: Palette,
        stats: ['CONSEIL STYLE', 'MOCKUPS', 'DIRECTION ARTISTIQUE']
    },
    {
        name: 'Ada',
        role: 'Sourcing & Collection',
        description: 'Ada trouve ton usine, négocie ton MOQ et sécurise ta logistique. Elle te évite les arnaques et les fournisseurs qui livrent du mauvais stock 6 mois en retard.',
        image: '/images/agents/ada_final.webp',
        color: '#FF2A5F',
        icon: Factory,
        stats: ['SOURCING USINES', 'NÉGOCIATION', 'LOGISTIQUE']
    },
    {
        name: 'Johan',
        role: 'E-shop & Ventes',
        description: 'Johan monte ta boutique Shopify de A a Z et la configure pour qu\'elle convertisse. Tu te connectes et tu vends, sans toucher une ligne de code.',
        image: '/images/agents/johan_final.webp',
        color: '#FFAA00',
        icon: ShoppingCart,
        stats: ['SHOPIFY EXPERT', 'UX/UI DESIGN', 'CONVERSION RATE']
    },
    {
        name: 'Joy',
        role: 'Social Media & DA',
        description: 'Joy crée tes scripts TikTok, remplit ta waitlist et gère ton image de marque. Elle transforme ton profil en machine a leads avant même que tu aies reçu ton stock.',
        image: '/images/agents/joy_final.webp',
        color: '#AF52DE',
        icon: Share2,
        stats: ['VIRALITÉ TIKTOK', 'COPYWRITING', 'UGC STRATEGY']
    }
];

export default function AgentsPresentation() {
    const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

    return (
        <section id="features" className="py-24 sm:py-32 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                <div className="mb-12 sm:mb-16 lg:mb-24">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-3 mb-4 sm:mb-6"
                    >
                        <div className="h-[1px] w-8 sm:w-12 bg-[#007AFF]" />
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-[#007AFF]">Ton Équipe IA // Experts</span>
                    </motion.div>
                    <h2 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-black uppercase leading-[0.9] sm:leading-[0.85]">
                        Votre Équipe de <br /> <span className="text-[#007AFF]">Spécialistes.</span>
                    </h2>
                </div>

                {/* Vertical Panels Container (Desktop) */}
                <div className="hidden lg:flex h-[600px] gap-4">
                    {AGENTS.map((agent) => (
                        <motion.div
                            key={agent.name}
                            onHoverStart={() => setHoveredAgent(agent.name)}
                            onHoverEnd={() => setHoveredAgent(null)}
                            animate={{
                                width: hoveredAgent === agent.name ? '45%' : hoveredAgent === null ? '20%' : '13.75%'
                            }}
                            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                            className="relative group h-full rounded-[40px] overflow-hidden bg-[#F5F5F7] border border-black/[0.03] cursor-pointer"
                        >
                            {/* Image Background */}
                            <motion.div
                                className="absolute inset-0 z-0"
                                animate={{ scale: hoveredAgent === agent.name ? 1.05 : 1 }}
                            >
                                <Image
                                    src={agent.image}
                                    alt={agent.name}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 45vw"
                                    className="object-cover transition-all duration-700"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.div>

                            {/* Panel Content */}
                            <div className="absolute inset-0 z-10 p-8 flex flex-col justify-between">
                                {/* Top: Vertical Name or Icon */}
                                <div className="flex justify-between items-start">
                                    <motion.div
                                        initial={{ opacity: 0, rotate: -90 }}
                                        animate={{
                                            rotate: hoveredAgent === agent.name ? 0 : -90,
                                            opacity: hoveredAgent === agent.name ? 1 : 0
                                        }}
                                        className="origin-top-left"
                                    >
                                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter whitespace-nowrap">
                                            {agent.name}
                                        </h3>
                                    </motion.div>
                                    <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center border border-black/5">
                                        <agent.icon className="w-5 h-5 text-black" />
                                    </div>
                                </div>

                                {/* Bottom: Expanded Info */}
                                <AnimatePresence>
                                    {hoveredAgent === agent.name && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="space-y-4 max-w-sm"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white/20 backdrop-blur-sm rounded border border-white/10 text-white">
                                                        {agent.role}
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-green-500/20 backdrop-blur-sm rounded border border-green-500/20 text-green-400 flex items-center gap-1.5">
                                                        <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                                                        Dispo 24/7
                                                    </span>
                                                </div>
                                                <p className="text-white text-sm font-medium leading-relaxed">
                                                    {agent.description}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {agent.stats.map(s => (
                                                    <span key={s} className="text-[8px] font-black text-white/70 uppercase tracking-widest">
                                                        #{s}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Border Glow */}
                            <div className="absolute inset-0 border-2 opacity-0 group-hover:opacity-100 transition-opacity border-black/10 rounded-[40px] pointer-events-none"
                                style={{ borderColor: agent.color }} />
                        </motion.div>
                    ))}
                </div>

                {/* Mobile & Tablet: Refined Cards */}
                <div className="lg:hidden space-y-4">
                    {/* First 4 agents in 2-column grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {AGENTS.slice(0, 4).map((agent) => (
                            <div key={agent.name} className="bg-[#F5F5F7] rounded-[32px] overflow-hidden border border-black/[0.03] group active:scale-[0.98] transition-all">
                                <div className="flex flex-col h-full">
                                    <div className="relative h-72 sm:h-80 overflow-hidden">
                                        <Image
                                            src={agent.image}
                                            alt={agent.name}
                                            fill
                                            sizes="(max-width: 640px) 100vw, 50vw"
                                            className="object-cover object-top transition-all duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        <div className="absolute bottom-4 left-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">Disponible</span>
                                            </div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{agent.name}</h3>
                                        </div>
                                        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                                            <agent.icon className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col justify-between flex-1">
                                        <div className="mb-4">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-[#007AFF] mb-2">{agent.role}</div>
                                            <p className="text-gray-500 text-xs font-medium leading-relaxed">
                                                {agent.description}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {agent.stats.slice(0, 2).map(s => (
                                                <span key={s} className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                                    #{s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Joy - same card as others, full width */}
                    {(() => {
                        const joy = AGENTS[4];
                        return (
                            <div className="bg-[#F5F5F7] rounded-[32px] overflow-hidden border border-black/[0.03] active:scale-[0.98] transition-all">
                                <div className="flex flex-col">
                                    <div className="relative h-72 sm:h-80 overflow-hidden">
                                        <Image
                                            src={joy.image}
                                            alt={joy.name}
                                            fill
                                            sizes="100vw"
                                            className="object-cover object-top"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        <div className="absolute bottom-4 left-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">Disponible</span>
                                            </div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{joy.name}</h3>
                                        </div>
                                        <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                                            <joy.icon className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col justify-between">
                                        <div className="mb-4">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-[#AF52DE] mb-2">{joy.role}</div>
                                            <p className="text-gray-500 text-xs font-medium leading-relaxed">
                                                {joy.description}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {joy.stats.slice(0, 2).map(s => (
                                                <span key={s} className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                                    #{s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </section>
    );
}




