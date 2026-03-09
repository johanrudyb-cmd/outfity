'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface PhaseCompletionCelebrationProps {
    phaseName: string;
    phaseId: number;
    nextPhaseName?: string;
    nextPhaseHref?: string;
    onContinue: () => void;
}

// Mini canvas confetti
function Confetti({ active }: { active: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!active) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: {
            x: number; y: number; vx: number; vy: number;
            color: string; size: number; rotation: number; rotationSpeed: number; opacity: number;
        }[] = [];

        const colors = ['#007AFF', '#34C759', '#FF9F0A', '#FF2D55', '#AF52DE', '#5AC8FA', '#FFD60A'];

        for (let i = 0; i < 120; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: -20 - Math.random() * 200,
                vx: (Math.random() - 0.5) * 4,
                vy: 2 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 6 + Math.random() * 8,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 8,
                opacity: 1,
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.08;
                p.rotation += p.rotationSpeed;
                if (p.y > canvas.height * 0.7) p.opacity -= 0.02;
                if (p.opacity <= 0) return;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                ctx.restore();
            });
            rafRef.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [active]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[200] pointer-events-none"
            style={{ display: active ? 'block' : 'none' }}
        />
    );
}

const PHASE_AGENT: Record<number, { name: string; img: string; color: string; msg: string }> = {
    0: { name: 'Virgil', img: '/images/agents/virgil_final.webp', color: '#007AFF', msg: "L'identité de ta marque est posée. Le voyage commence." },
    1: { name: 'Virgil', img: '/images/agents/virgil_final.webp', color: '#007AFF', msg: "Ton manifeste stratégique est prêt. Tu sais maintenant où tu vas." },
    2: { name: 'Pharrell', img: '/images/agents/pharrell_final.webp', color: '#a032ff', msg: "Tes visuels sont là. Le monde va voir ce que tu caches depuis trop longtemps." },
    3: { name: 'Pharrell', img: '/images/agents/pharrell_final.webp', color: '#a032ff', msg: "Le Scanner valide ton potentiel viral. Tu as quelque chose de fort entre les mains." },
    4: { name: 'Joy', img: '/images/agents/joy_final.webp', color: '#ff327e', msg: "Tes scripts sont prêts. L'algoritme va t'adorer." },
    5: { name: 'Johan', img: '/images/agents/johan_final.webp', color: '#007AFF', msg: "Ta Waitlist est lancée. Les premiers fans arrivent." },
    6: { name: 'Pharrell', img: '/images/agents/pharrell_final.webp', color: '#a032ff', msg: "Ton Tech Pack est complet. Les usines peuvent maintenant produire ta vision." },
    7: { name: 'Ada', img: '/images/agents/ada_final.webp', color: '#F43F5E', msg: "Tu as contacté les usines. La production se rapproche." },
    8: { name: 'Johan', img: '/images/agents/johan_final.webp', color: '#5E8E3E', msg: "Ta boutique est lancée. Bienvenue dans le monde des créateurs." },
};

export function PhaseCompletionCelebration({
    phaseName,
    phaseId,
    nextPhaseName,
    nextPhaseHref,
    onContinue,
}: PhaseCompletionCelebrationProps) {
    const [visible, setVisible] = useState(false);
    const [confettiActive, setConfettiActive] = useState(false);

    useEffect(() => {
        // Stagger: confetti first, then card
        const t1 = setTimeout(() => setConfettiActive(true), 50);
        const t2 = setTimeout(() => setVisible(true), 200);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    const handleContinue = () => {
        setVisible(false);
        setConfettiActive(false);
        setTimeout(onContinue, 350);
    };

    const agent = PHASE_AGENT[phaseId] ?? PHASE_AGENT[0];

    return (
        <>
            <Confetti active={confettiActive} />

            {/* Backdrop */}
            <div
                className={cn(
                    'fixed inset-0 z-[190] bg-black/60 backdrop-blur-md transition-all duration-500',
                    visible ? 'opacity-100' : 'opacity-0'
                )}
                onClick={handleContinue}
            />

            {/* Card */}
            <div
                className={cn(
                    'fixed inset-0 z-[195] flex items-center justify-center p-4 pointer-events-none',
                )}
            >
                <div
                    className={cn(
                        'pointer-events-auto relative bg-white rounded-[40px] shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                        visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-12'
                    )}
                >
                    {/* Glow behind card */}
                    <div
                        className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-[60px] opacity-40 pointer-events-none"
                        style={{ backgroundColor: agent.color }}
                    />

                    {/* Check badge */}
                    <div className="relative mb-4">
                        <div
                            className="w-20 h-20 rounded-[28px] flex items-center justify-center shadow-xl relative overflow-hidden"
                            style={{ backgroundColor: agent.color }}
                        >
                            <CheckCircle2 className="w-10 h-10 text-white drop-shadow" />
                            <div className="absolute inset-0 bg-white/10 rounded-[28px]" />
                        </div>
                        {/* Agent avatar overlay */}
                        <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={agent.img} alt={agent.name} className="w-full h-full object-cover" />
                        </div>
                    </div>

                    {/* Phase tag */}
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full border mb-3"
                        style={{ color: agent.color, borderColor: `${agent.color}30`, backgroundColor: `${agent.color}10` }}>
                        Phase validée ✓
                    </span>

                    {/* Title */}
                    <h2 className="text-2xl font-black text-[#1D1D1F] tracking-tight mb-2 leading-tight">
                        {phaseName}
                    </h2>

                    {/* Agent quote */}
                    <p className="text-sm text-[#86868B] leading-relaxed mb-6 max-w-[260px]">
                        &ldquo;{agent.msg}&rdquo;
                        <span className="block mt-1 text-[11px] font-bold" style={{ color: agent.color }}>
                            — {agent.name}
                        </span>
                    </p>

                    {/* Sparkle divider */}
                    <div className="flex items-center gap-3 w-full mb-6">
                        <div className="flex-1 h-px bg-black/5" />
                        <Sparkles className="w-3 h-3 text-[#C7C7CC]" />
                        <div className="flex-1 h-px bg-black/5" />
                    </div>

                    {/* CTA */}
                    <div className="w-full space-y-3">
                        {nextPhaseName && nextPhaseHref ? (
                            <Link
                                href={nextPhaseHref}
                                onClick={handleContinue}
                                className="flex items-center justify-center gap-2 w-full h-13 px-6 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg active:scale-[0.97] transition-all"
                                style={{ backgroundColor: agent.color }}
                            >
                                Étape suivante : {nextPhaseName}
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <button
                                onClick={handleContinue}
                                className="flex items-center justify-center gap-2 w-full h-13 px-6 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg active:scale-[0.97] transition-all"
                                style={{ backgroundColor: agent.color }}
                            >
                                🚀 Voir mon tableau de bord
                            </button>
                        )}
                        <button
                            onClick={handleContinue}
                            className="w-full text-[12px] font-bold text-[#86868B] hover:text-[#1D1D1F] transition-colors py-2"
                        >
                            Continuer plus tard
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
