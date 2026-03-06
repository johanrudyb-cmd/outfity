'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import confetti from 'canvas-confetti';
import Image from 'next/image';

export interface AgentProps {
    id: string;
    name: string;
    role: string;
    image: string;
    stats: { label: string; value: number }[];
    color: string;
}

export function AgentRevealCard({ agent, delay = 0, onReveal }: { agent: AgentProps, delay?: number, onReveal?: () => void }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);

    // Mouse position variables
    const x = useMotionValue(0.5);
    const y = useMotionValue(0.5);

    // Spring physics for smooth movement
    const smoothX = useSpring(x, { damping: 20, stiffness: 150 });
    const smoothY = useSpring(y, { damping: 20, stiffness: 150 });

    // Calculate rotation based on mouse position
    const rotateX = useTransform(smoothY, [0, 1], [15, -15]);
    const rotateY = useTransform(smoothX, [0, 1], [-15, 15]);

    // Calculate glare position based on mouse
    const glareX = useTransform(smoothX, [0, 1], [100, -100]);
    const glareY = useTransform(smoothY, [0, 1], [100, -100]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsRevealed(true);
            // Small extra delay to ensure the card has started flipping before firing confetti
            setTimeout(triggerFireworks, 400);
            if (onReveal) onReveal();
        }, delay * 1000 + 400);
        return () => clearTimeout(timer);
    }, [delay, onReveal]);

    const triggerFireworks = () => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();

        // Calculate the center of the card relative to the viewport
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
            particleCount: 50,
            spread: 60,
            origin: { x, y },
            colors: [agent.color, '#ffffff', '#ffd700'],
            disableForReducedMotion: true,
            zIndex: 100,
        });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current || !isRevealed) return;
        const rect = cardRef.current.getBoundingClientRect();

        // Calculate relative position (0 to 1)
        const relX = (e.clientX - rect.left) / rect.width;
        const relY = (e.clientY - rect.top) / rect.height;

        x.set(relX);
        y.set(relY);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        x.set(0.5);
        y.set(0.5);
    };

    const handleMouseEnter = () => {
        if (isRevealed) {
            setIsHovered(true);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay * 0.2 }}
            className="perspective-[1200px] w-[220px] sm:w-[240px] relative group flex flex-col items-center"
            style={{ zIndex: isHovered ? 50 : 10 }}
        >
            <motion.div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="w-full h-[310px] sm:h-[340px] relative transition-shadow duration-500"
                style={{
                    rotateX: isHovered && isRevealed ? rotateX : 0,
                    rotateY: isHovered && isRevealed ? rotateY : (isRevealed ? 180 : 0),
                    transformStyle: 'preserve-3d',
                    perspective: 1200,
                }}
                transition={{ duration: 0.8, type: "spring", stiffness: 50, damping: 20 }}
            >
                {/* Back of the card (Before Reveal) */}
                <div
                    className="absolute inset-0 backface-hidden w-full h-full rounded-2xl bg-gradient-to-br from-slate-900 to-black border-2 border-slate-700 shadow-xl overflow-hidden flex flex-col items-center justify-center p-6"
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(0deg)',
                        transformStyle: 'preserve-3d'
                    }}
                >
                    <div className="w-16 h-16 rounded-full border border-slate-600 flex items-center justify-center mb-4">
                        <span className="text-3xl text-slate-500 font-serif">O</span>
                    </div>
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mb-4" />
                    <p className="text-slate-400 font-semibold tracking-widest text-xs uppercase text-center">IA Agent<br />Locked</p>

                    {/* Glowing pulse effect on the back */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,1)_0%,_transparent_60%)] animate-pulse" />
                </div>

                {/* Front of the card (After Reveal) */}
                <div
                    className="absolute inset-0 backface-hidden w-full h-full rounded-2xl shadow-2xl overflow-hidden border border-white/20"
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        backgroundColor: '#111',
                        transformStyle: 'preserve-3d'
                    }}
                >
                    {/* Background Color Glow */}
                    <div className="absolute inset-0 opacity-40 mix-blend-screen" style={{ backgroundColor: agent.color }} />

                    {/* Image */}
                    <div className="absolute inset-x-2 top-2 bottom-32 rounded-xl overflow-hidden bg-black/50 border border-white/10">
                        <Image
                            src={agent.image}
                            alt={agent.name}
                            fill
                            priority
                            className="object-cover object-top opacity-90 brightness-110 contrast-110"
                            sizes="(max-width: 768px) 240px, 240px"
                        />
                        {/* Inner shadow for depth */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
                    </div>

                    {/* Name & Role Section */}
                    <div className="absolute inset-x-0 bottom-0 h-32 p-4 flex flex-col justify-end bg-gradient-to-t from-black via-black/90 to-transparent">
                        <div className="flex items-end justify-between mb-2" style={{ transform: 'translateZ(30px)' }}>
                            <div className="overflow-hidden mr-2">
                                <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none mb-0.5">{agent.name}</h3>
                                <p className="text-[9px] font-bold uppercase tracking-widest truncate" style={{ color: agent.color }}>
                                    {agent.role}
                                </p>
                            </div>
                            <div className="text-xl font-black italic text-white/20 shrink-0 leading-none pb-0.5">
                                {Math.round(agent.stats.reduce((acc, s) => acc + s.value, 0) / agent.stats.length)}
                            </div>
                        </div>

                        {/* Mini Stats Grid */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-1" style={{ transform: 'translateZ(20px)' }}>
                            {agent.stats.map((stat, i) => (
                                <div key={i} className="flex items-center justify-between text-white/90 overflow-hidden">
                                    <span className="text-[9px] font-semibold uppercase tracking-tight truncate flex-1 pr-1 opacity-80">{stat.label}</span>
                                    <span className="text-[11px] font-bold font-mono text-white shrink-0">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Glare effect on hover */}
                    <motion.div
                        className="pointer-events-none absolute -inset-[100%] z-20"
                        style={{
                            background: `radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 40%)`,
                            x: glareX,
                            y: glareY,
                            opacity: isHovered ? 1 : 0,
                            mixBlendMode: 'overlay',
                        }}
                    />

                    {/* Shiny Foil effect */}
                    <div className="pointer-events-none absolute inset-0 z-10 mix-blend-color-dodge opacity-30"
                        style={{
                            backgroundImage: `linear-gradient(125deg, transparent 20%, white 40%, transparent 60%)`,
                            backgroundSize: '200% 200%',
                            animation: isRevealed ? 'shine 4s infinite linear' : 'none',
                        }}
                    />
                </div>
            </motion.div>

            {/* Glowing Name and Role below the card */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={isRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.5, delay: delay * 0.2 + 0.8 }}
                className="mt-6 text-center"
            >
                <div
                    className="text-lg sm:text-xl font-black uppercase tracking-widest bg-clip-text text-transparent drop-shadow-lg"
                    style={{ backgroundImage: `linear-gradient(to right, #666, ${agent.color}, #666)` }}
                >
                    {agent.name}
                </div>
                <div
                    className="mt-1 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wider"
                    style={{ color: agent.color }}
                >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: agent.color }} />
                    {agent.role}
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: agent.color }} />
                </div>
            </motion.div>
        </motion.div>
    );
}

export const AGENTS_TEAM: AgentProps[] = [
    {
        id: 'virgil',
        name: 'Virgil',
        role: 'Stratégie',
        image: '/images/agents/virgil_final.webp',
        color: '#007AFF', // OUTFITY Blue
        stats: [
            { label: 'Vision', value: 96 },
            { label: 'Branding', value: 94 },
            { label: 'Expertise', value: 92 },
            { label: 'Conseil', value: 94 }
        ]
    },
    {
        id: 'pharrell',
        name: 'Pharrell',
        role: 'Design & Accompagnement',
        image: '/images/agents/pharrell_final.webp',
        color: '#a032ff',
        stats: [
            { label: 'Créativité', value: 92 },
            { label: 'Style', value: 90 },
            { label: 'Accompagnement', value: 94 },
            { label: 'Conseil', value: 88 }
        ]
    },
    {
        id: 'ada',
        name: 'Ada',
        role: 'Sourcing & Collection',
        image: '/images/agents/ada_final.webp',
        color: '#ff2a5f',
        stats: [
            { label: 'Analytique', value: 95 },
            { label: 'Usines', value: 94 },
            { label: 'Sourcing', value: 92 },
            { label: 'Qualité', value: 91 }
        ]
    },
    {
        id: 'johan',
        name: 'Johan',
        role: 'E-shop & Ventes',
        image: '/images/agents/johan_final.webp',
        color: '#ffaa00',
        stats: [
            { label: 'Shopify', value: 86 },
            { label: 'Conversion', value: 84 },
            { label: 'Web Design', value: 82 },
            { label: 'Support', value: 86 }
        ]
    },
    {
        id: 'joy',
        name: 'Joy',
        role: 'Social Media & DA',
        image: '/images/agents/joy_final.webp',
        color: '#AF52DE',
        stats: [
            { label: 'Créativité', value: 95 },
            { label: 'Viralité', value: 92 },
            { label: 'Engagement', value: 94 },
            { label: 'Copywriting', value: 88 }
        ]
    }
];
