'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, TrendingUp, BarChart3, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { isFreePlan } from '@/lib/plan-utils';

const PredictionCurve = ({ color }: { color: string }) => (
    <svg className="w-full h-12" viewBox="0 0 100 40" preserveAspectRatio="none">
        <motion.path
            d="M0,35 Q25,30 40,20 T70,10 T100,5"
            fill="none"
            stroke={color}
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        <motion.path
            d="M0,35 Q25,30 40,20 T70,10 T100,5 V40 H0 Z"
            fill={`url(#gradient-${color.replace('#', '')})`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.1 }}
            transition={{ duration: 1 }}
        />
        <defs>
            <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} />
                <stop offset="100%" stopColor="transparent" />
            </linearGradient>
        </defs>
    </svg>
);

export default function TrendsByMarket() {
    const { data: session } = useSession();
    const isFree = isFreePlan((session?.user as any)?.plan);
    const [countdown, setCountdown] = useState("14:22:05");

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            let target = new Date();
            target.setHours(8, 0, 0, 0);

            if (now > target) {
                target.setDate(target.getDate() + 1);
            }

            const diff = target.getTime() - now.getTime();
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff / (1000 * 60)) % 60);
            const s = Math.floor((diff / 1000) % 60);

            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };

        setCountdown(calculateTimeLeft());
        const timer = setInterval(() => setCountdown(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, []);

    const predictionCards = [
        { title: 'Denim & Streetwear', growth: '+24%', precision: 92, color: '#007AFF', delay: 0 },
        { title: 'Outerwear Tech', growth: '+18%', precision: 88, color: '#FF3B30', delay: 0.1 },
        { title: 'Accessoires Luxe', growth: '+32%', precision: 95, color: '#A032FF', delay: 0.2 },
        { title: 'Knitwear Design', growth: '+12%', precision: 84, color: '#FF9500', delay: 0.3 }
    ];

    return (
        <section id="trends-by-market" className="py-24 sm:py-32 bg-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
                <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 sm:gap-12 mb-12 sm:mb-20">
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-3 mb-4 sm:mb-6"
                        >
                            <div className="h-[1px] w-8 sm:w-12 bg-[#007AFF]" />
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-[#007AFF]">Radar de Tendances // Analyse TikTok</span>
                        </motion.div>
                        <h2 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-black uppercase leading-[0.9] sm:leading-[0.85]">
                            Analyse des <br className="hidden sm:block" />
                            <span className="text-[#007AFF]">Tendances TikTok.</span>
                        </h2>
                    </div>

                    <div className="w-full lg:w-auto flex flex-col items-start lg:items-end gap-2 sm:gap-3 p-6 bg-[#F5F5F7] rounded-[24px] sm:rounded-[32px] border border-black/5">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-black">Mise à jour dans :</span>
                        </div>
                        <div className="text-3xl sm:text-4xl font-mono font-black tracking-tighter text-black flex items-center">
                            <span className="text-[#007AFF] mr-1">-</span>{countdown}
                        </div>
                        <p className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-widest text-left lg:text-right max-w-[180px] sm:max-w-[200px]">
                            Notre IA transforme les données virales en courbes de prédiction sur 90 jours.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {predictionCards.map((card, idx) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: card.delay }}
                            className={cn(
                                "group bg-[#F5F5F7] p-8 rounded-[40px] border border-black/[0.03] hover:bg-black transition-all duration-700 relative overflow-hidden",
                                idx >= 2 ? "hidden md:block" : "block"
                            )}
                        >
                            <div className="transition-all duration-500">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="p-3 rounded-2xl bg-white/50 group-hover:bg-white/10 transition-colors">
                                        <span className="text-[10px] font-black text-black group-hover:text-white uppercase tracking-widest">Tendance</span>
                                        <div className="text-xl font-black text-[#007AFF]">{card.growth}</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-black/30 group-hover:text-white/30 uppercase tracking-widest">Précision</span>
                                        <div className="text-sm font-black text-black group-hover:text-white">{card.precision}%</div>
                                    </div>
                                </div>

                                <div className="mb-10">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-black group-hover:text-white leading-none mb-2">{card.title}</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Projection 90j</span>
                                    </div>
                                    <PredictionCurve color={card.color} />
                                </div>
                            </div>

                            {/* Overlay removed to show fictitious data even for free users */}

                            <Link href="/launch-map" className="block w-full mt-10 relative z-30">
                                <button className="w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 hover:bg-gray-100">
                                    {isFree ? 'Tester la Stratégie' : 'Consulter les prédictions'}
                                </button>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-10 sm:mt-20 flex flex-col items-center gap-6">
                    <div className="max-w-xl text-center">
                        <p className="text-[9px] sm:text-xs lg:text-sm text-gray-500/80 font-medium leading-relaxed italic px-4">
                            "Nous ne nous contentons pas de copier la mode actuelle. Notre infrastructure traite des gigaoctets de données de vente, d'intentions de recherche et de clusters comportementaux pour prédire ce que vos clients voudront acheter dans 3 mois."
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
