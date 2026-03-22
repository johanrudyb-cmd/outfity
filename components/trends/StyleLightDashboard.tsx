
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, TrendingUp, TrendingDown, Layers, Activity, Zap, ArrowRight, DollarSign, AlertTriangle, Clock, Calendar, ThermometerSun, Snowflake, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { PredictiveChart } from '@/components/trends/PredictiveChart';

/**
 * Composant de Dashboard Style "Predictive Lead Time"
 */

export interface StyleProduct {
    id: string;
    name: string;
    averagePrice: number;
    trendScore: number;
    imageUrl: string | null;
    sourceBrand: string | null;
    productBrand: string | null;
}

export interface StyleDetailProps {
    id: string;
    name: string;
    avgScore: number;
    avgPrice: number;
    products: StyleProduct[];
    heroImage: string | null;
    segment: string;
}

export function StyleLightDashboard({ data }: { data: StyleDetailProps }) {
    const [leadTime, setLeadTime] = useState(60); // 60 jours par d?faut
    const [viewMode, setViewMode] = useState<'1S' | '1M'>('1M');

    const currentScore = data.avgScore || 50;

    // --- MOTEUR INTELLIGENT V4 : SAISONNALITÃ‰ ---

    // 1. D?tection du Type de Produit (Hiver vs Ã‰t?)
    const getSeasonType = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('manteau') || n.includes('veste') || n.includes('doudoune') || n.includes('parka') || n.includes('cuir') || n.includes('laine') || n.includes('pull') || n.includes('sweat') || n.includes('hoodie')) return 'WINTER';
        if (n.includes('short') || n.includes('lin') || n.includes('maillot') || n.includes('sandale') || n.includes('debardeur') || n.includes('top')) return 'SUMMER';
        if (n.includes('t-shirt') || n.includes('chemise')) return 'MID_SUMMER'; // T-shirt se vend un peu tout le temps mais mieux en ?t?
        return 'NEUTRAL'; // Jean, Pantalon, Basket, Accessoire
    };

    const seasonType = getSeasonType(data.name);

    // 2. Calcul de la Date de Livraison
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + leadTime);
    const deliveryMonth = deliveryDate.getMonth(); // 0 = Janvier, 5 = Juin

    // 3. Calcul de l'Impact M?t?o sur le Score
    const getWeatherImpact = (type: string, month: number) => {
        // Hiver (Nov-F?v) : Mois 10, 11, 0, 1
        // Ã‰t? (Juin-Ao?t) : Mois 5, 6, 7

        if (type === 'WINTER') {
            if (month >= 4 && month <= 8) return -60; // Mai ? Septembre -> CATASTROPHE pour un manteau
            if (month >= 9 || month <= 2) return +20; // Octobre ? Mars -> TOP
            return -10; // Avril/Octobre -> Bof
        }
        if (type === 'SUMMER') {
            if (month >= 9 || month <= 2) return -50; // Octobre ? Mars -> CATASTROPHE pour un short
            if (month >= 4 && month <= 7) return +30; // Mai ? Ao?t -> TOP
            return 0;
        }
        if (type === 'MID_SUMMER') {
            if (month >= 4 && month <= 8) return +15; // Mieux en ?t?
            return -5; // Un peu moins bien en hiver
        }
        return 0; // Neutre
    };

    const weatherImpact = getWeatherImpact(seasonType, deliveryMonth);

    // 4. V?locit? naturelle (La tendance monte ou descend hors m?t?o)
    const baseVelocity = currentScore < 50 ? 0.2 : -0.1; // Logique simple: ce qui est bas monte, ce qui est haut stagne

    // 5. SCORE FINAL PRÃ‰DICTIF
    // Formule : Score Actuel + (Temps * V?locit?) + IMPACT SAISON
    let rawFutureScore = currentScore + (baseVelocity * leadTime) + weatherImpact;

    // Si l'impact m?t?o est violent, il ?crase tout le reste
    if (weatherImpact < -40) rawFutureScore = Math.min(30, rawFutureScore);

    const futureScore = Math.min(100, Math.max(10, rawFutureScore));
    const isOpportunity = futureScore > 60;

    // --- GÃ‰NÃ‰RATION DU GRAPHIQUE ---
    const chartData = [];

    // A. Historique
    const historyDays = viewMode === '1S' ? 7 : 30;
    const step = viewMode === '1S' ? 1 : 2;
    for (let i = historyDays; i >= 0; i -= step) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const noise = ((Math.sin((i + 1) * 12.9898 + currentScore * 0.31) + 1) / 2) * 5;
        chartData.push({
            date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            value: Math.round(Math.min(100, Math.max(0, currentScore - (baseVelocity * i) + noise))), // On inverse la v?locit? pour le pass?
            isFuture: false
        });
    }

    // B. Futur (Pr?diction liss?e vers le score cible)
    const futureSteps = leadTime;
    const futureRes = Math.max(1, Math.round(leadTime / 15)); // R?solution points

    for (let i = 1; i <= futureSteps; i += futureRes) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);

        // Interpolation lin?aire vers le futureScore qui contient l'impact m?t?o
        const progress = i / futureSteps;
        const val = currentScore + ((futureScore - currentScore) * progress);

        chartData.push({
            date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            value: Math.round(val),
            isFuture: true
        });
    }

    const lastPoint = chartData[chartData.length - 1];
    const deliveryDateStr = deliveryDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

    return (
        <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#1a1a1a] pb-12">

            {/* Header Navigation Simplifi?e */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-20 shadow-sm flex items-center justify-between">
                <Link href="/trends" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                </Link>
                <div className="flex flex-col items-center">
                    <h1 className="text-sm font-black uppercase tracking-widest text-[#007AFF]">{data.name}</h1>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {seasonType === 'WINTER' ? '❄️ Article Hiver' : seasonType === 'SUMMER' ? '☀️ Article Été' : '🔄 Article 4 Saisons'}
                    </span>
                </div>

                <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Si je lance la prod ce soir...</span>
                        <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <select
                                value={leadTime}
                                onChange={(e) => setLeadTime(Number(e.target.value))}
                                className="bg-transparent text-xs font-black text-blue-700 outline-none cursor-pointer"
                            >
                                <option value={30}>Livraison dans 1 Mois (Express)</option>
                                <option value={60}>Livraison dans 2 Mois (Standard)</option>
                                <option value={90}>Livraison dans 3 Mois (Import)</option>
                                <option value={120}>Livraison dans 4 Mois (Lointain)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-6 space-y-6">

                {/* 1. TOP KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <TopKpiCard title="SCORE AUJOURD'HUI" value={`${currentScore}/100`} sub="Demande Actuelle" icon={Activity} color="text-blue-500" />
                    <TopKpiCard
                        title="SCORE À LA LIVRAISON"
                        value={`${Math.round(futureScore)}/100`}
                        sub={`Le ${lastPoint?.date || '...'}`}
                        icon={isOpportunity ? TrendingUp : TrendingDown}
                        color={isOpportunity ? "text-green-500" : "text-red-500"}
                        highlight={true}
                    />
                    <TopKpiCard title="IMPACT SAISON"
                        value={weatherImpact > 0 ? `+${weatherImpact} pts` : weatherImpact < 0 ? `${weatherImpact} pts` : "Neutre"}
                        sub={seasonType === 'WINTER' ? "Hiver" : seasonType === 'SUMMER' ? "Été" : "Intemporel"}
                        icon={seasonType === 'WINTER' ? Snowflake : seasonType === 'SUMMER' ? ThermometerSun : Calendar}
                        color={weatherImpact > 0 ? "text-green-500" : weatherImpact < 0 ? "text-red-500" : "text-gray-400"}
                    />
                    <TopKpiCard title="VOLUME ANALYSÉ" value={data.products.length} sub="Produits Scannés" icon={Layers} color="text-purple-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[700px] lg:h-[700px]">

                    {/* 2. CENTER : MAIN CHART */}
                    <div className="col-span-1 lg:col-span-9 bg-[#FAF9F6] rounded-3xl p-5 sm:p-8 shadow-sm border border-gray-200/60 relative flex flex-col h-full min-h-[400px]">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-black text-black uppercase tracking-tight mb-2">{data.name.split('(')[0]}</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Simulation Pr?dictive (Tendances + M?t?o)
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {['1S', '1M'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setViewMode(t as '1S' | '1M')}
                                        className={cn(
                                            "text-[10px] font-bold px-3 py-1.5 rounded transition-all",
                                            viewMode === t
                                                ? "bg-black text-white shadow-md shadow-black/20"
                                                : "bg-white text-gray-400 border border-gray-100 hover:text-black hover:bg-gray-50"
                                        )}
                                    >
                                        Vue {t === '1S' ? 'Semaine' : 'Mois'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 w-full relative">
                            {/* Le Graphique Pr?dictif */}
                            <PredictiveChart
                                data={chartData}
                                color={isOpportunity ? "#22C55E" : "#EF4444"}
                                predictionColor="#007AFF"
                            />

                            {/* ETIQUETTE DE SORTIE */}
                            <div className="absolute top-10 right-4 pointer-events-none flex flex-col items-end z-10">
                                <motion.div
                                    key={leadTime}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="bg-[#007AFF] text-white px-4 py-3 rounded-lg shadow-lg shadow-blue-500/30 text-xs font-bold text-center mb-2 flex flex-col items-center backdrop-blur-md border border-white/20"
                                >
                                    <span className="text-[9px] uppercase tracking-widest opacity-90 mb-1 font-medium">État marché livraison</span>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-2xl font-black leading-none">{Math.round(futureScore)}</span>
                                        <span className="text-[10px] opacity-80">/ 100</span>
                                    </div>
                                    <div className="w-full h-[1px] bg-white/20 my-2"></div>
                                    <span className="text-xs font-bold flex items-center gap-1">
                                        📆 Prévu le {lastPoint?.date}
                                    </span>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* 3. RIGHT : DECISION AID (Gauge & Verdict) */}
                    <div className="col-span-1 lg:col-span-3 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#007AFF] mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            ANALYSE STRATÉGIQUE
                        </h3>

                        {/* PHOTO ARTICLE (Contexte Visuel) */}
                        <div className="w-full h-48 relative rounded-2xl overflow-hidden mb-4 border border-gray-100 shadow-inner group bg-gray-50">
                            {data.products && data.products[0]?.imageUrl ? (
                                <Image
                                    src={data.products[0].imageUrl}
                                    alt={data.name}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 420px"
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <Layers className="w-8 h-8 opacity-20" />
                                </div>
                            )}
                            {/* Score Budget Overlay */}
                            <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-black shadow-sm flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-green-600" />
                                {data.avgPrice} ?
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center relative">
                            {/* GAUGE FUTURE (Plus compacte) */}
                            <div className="relative w-32 h-32 mb-4">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="64" cy="64" r="54" stroke="#F3F4F6" strokeWidth="8" fill="transparent" />
                                    <circle
                                        cx="64" cy="64" r="54"
                                        stroke="#e5e7eb"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="opacity-30"
                                        strokeDasharray={339}
                                        strokeDashoffset={339 - (339 * currentScore) / 100}
                                    />
                                    <motion.circle
                                        key={futureScore}
                                        cx="64" cy="64" r="54"
                                        stroke={futureScore > 60 ? "#22C55E" : futureScore > 40 ? "#F97316" : "#EF4444"}
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeLinecap="round"
                                        strokeDasharray={339}
                                        strokeDashoffset={339 - (339 * futureScore) / 100}
                                        initial={{ strokeDashoffset: 339 }}
                                        animate={{ strokeDashoffset: 339 - (339 * futureScore) / 100 }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <motion.span
                                        key={futureScore}
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={cn("text-3xl font-black", futureScore > 60 ? "text-[#22C55E]" : futureScore > 40 ? "text-[#F97316]" : "text-[#EF4444]")}
                                    >
                                        {Math.round(futureScore)}
                                    </motion.span>
                                    <span className="text-[8px] font-bold text-gray-400 uppercase">Potentiel</span>
                                </div>
                            </div>

                            {/* ARGUMENT PHARE (Saisonnalit? First) */}
                            {weatherImpact < -30 ? (
                                <div className="px-4 py-3 rounded-xl w-full border text-left mb-2 bg-red-50 border-red-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-white/50 px-2 py-0.5 rounded-bl-lg text-[8px] font-black uppercase tracking-widest opacity-50">Impact M?t?o</div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                        <div className="text-xs font-black text-red-600 uppercase">CALENDRIER RISQUÉ</div>
                                    </div>
                                    <div className="flex items-start gap-2 bg-white/60 p-2 rounded-lg mt-2">
                                        <AlertTriangle className="w-3 h-3 text-red-600 mt-0.5 shrink-0" />
                                        <span className="text-[10px] font-bold text-red-800 leading-tight">
                                            &quot;Livraison &apos;Hiver&apos; pr?vue en {deliveryDate.toLocaleDateString('fr-FR', { month: 'long' })}. La demande sera nulle.&quot;
                                        </span>
                                    </div>
                                </div>
                            ) : futureScore > 60 ? (
                                <div className="px-4 py-3 rounded-xl w-full border text-left mb-2 bg-green-50 border-green-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-white/50 px-2 py-0.5 rounded-bl-lg text-[8px] font-black uppercase tracking-widest opacity-50">Signal Market</div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                        <div className="text-xs font-black text-green-600 uppercase">TIMING OPTIMAL</div>
                                    </div>
                                    <div className="flex items-start gap-2 bg-white/60 p-2 rounded-lg mt-2">
                                        <TrendingUp className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
                                        <span className="text-[10px] font-bold text-green-800 leading-tight">
                                            &quot;Volume en hausse + P?nurie chez les concurrents. Le march? demande ce produit.&quot;
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-4 py-3 rounded-xl w-full border text-left mb-2 bg-orange-50 border-orange-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-white/50 px-2 py-0.5 rounded-bl-lg text-[8px] font-black uppercase tracking-widest opacity-50">Analyse</div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                        <div className="text-xs font-black text-orange-500 uppercase">INCERTAIN</div>
                                    </div>
                                    <div className="flex items-start gap-2 bg-white/60 p-2 rounded-lg mt-2">
                                        <Activity className="w-3 h-3 text-orange-600 mt-0.5 shrink-0" />
                                        <span className="text-[10px] font-bold text-orange-800 leading-tight">
                                            &quot;Tendance stable mais sans euphorie. Attention aux stocks.&quot;
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto w-full">
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

interface TopKpiCardProps {
    title: string;
    value: string | number;
    sub: string;
    icon: LucideIcon;
    color: string;
    highlight?: boolean;
}

function TopKpiCard({ title, value, sub, icon: Icon, color, highlight }: TopKpiCardProps) {
    return (
        <div className={cn("rounded-2xl p-6 shadow-sm border flex items-start justify-between transition-all", highlight ? "bg-[#F0F9FF] border-blue-200 ring-4 ring-blue-50" : "bg-white border-gray-100")}>
            <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{title}</h3>
                <div className={cn("text-2xl font-black mb-1", highlight ? "text-[#007AFF]" : "text-black")}>{value}</div>
                <div className="text-[10px] font-bold text-gray-400">{sub}</div>
            </div>
            <div className={cn("p-2 rounded-xl", highlight ? "bg-white shadow-sm" : "bg-gray-50", color)}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
    );
}

