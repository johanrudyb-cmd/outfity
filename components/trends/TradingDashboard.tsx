'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { MarketChart } from './MarketChart';

const fetcher = (url: string) => fetch(url).then(res => res.json());
import { TrendingUp, TrendingDown, BarChart2, Zap, Activity, Info, AlertCircle, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

interface Catalyst {
    name: string;
    impact: string;
    source: string;
}

interface Supplier {
    name: string;
    country: string;
}

interface TradingSignal {
    id: string;
    name: string;
    segment: string;
    change: number;
    potential: number;
    saturation: number;
    opportunityReason?: string;
    saturationReason?: string;
    retailPriceEst: string;
    markup: string;
    conversionRate: string;
    demandGrowth: string;
    marketRegion: string;
    weatherSignal: string;
    predictedScore60d: number;
    productionSafety: string;
    upcomingCatalysts: Catalyst[];
    matchedSupplier: Supplier;
    suggestedPrice: number;
    aiConfidence: number;
    lastScan: string;
    theme: string;
    signal: string;
    advice: string;
    risk: string;
}

export function TradingDashboard() {
    const { data, isLoading: swrLoading, mutate } = useSWR<{ products: TradingSignal[] }>('/api/trends/trading-signals', fetcher);

    const products = data?.products || [];
    const [manualAsset, setManualAsset] = useState<TradingSignal | null>(null);
    const selectedAsset = manualAsset || products[0] || null;

    const [timeframe, setTimeframe] = useState('1S');
    const [showScoreDetail, setShowScoreDetail] = useState(false);
    const [activeKPIDetail, setActiveKPIDetail] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const loading = swrLoading && !data;

    const triggerSync = async () => {
        setIsSyncing(true);
        try {
            await fetch('/api/trends/brain-cycle?turbo=true', {
                method: 'POST',
                headers: {
                    'x-n8n-secret': 'bmad_n8n_secret_2024_ultra_secure'
                }
            });
            await mutate(); // Refresh signals
            setManualAsset(null);
        } catch (err) {
            console.error("Sync failed", err);
        } finally {
            setIsSyncing(false);
        }
    };

    if (loading) return <LoadingState title="Calcul des signaux live..." description="Moteur de signaux en cours de synchronisation" className="h-[600px] bg-white rounded-[40px] border border-gray-100" />;

    if (!selectedAsset && !isSyncing) return (
        <EmptyState
            icon={AlertTriangle}
            title="Aucun signal détecté pour le moment"
            description="Lancer le premier scan pour peupler votre veille de marché."
            className="flex flex-col items-center justify-center h-[600px] bg-gray-50 rounded-[40px] border border-dashed border-gray-200"
            action={
                <button
                    onClick={triggerSync}
                    className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                >
                    <RefreshCw className="w-5 h-5" />
                    Lancer l'analyse des tendances
                </button>
            }
        />
    );

    if (isSyncing && products.length === 0) return (
        <LoadingState
            title="Moteur Vision en éveil..."
            description="Scan des retailers (Zara/Asos) + Analyse News & Social en cours"
            icon={
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <Zap className="w-6 h-6 text-yellow-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
            }
            className="flex items-center justify-center h-[600px] bg-white rounded-[40px] border border-gray-100"
        />
    );

    if (!selectedAsset) return null;

    return (
        <div className="flex flex-col gap-6 h-[900px] mb-12 font-sans relative">

            {/* OVERLAY DETAIL KPI */}
            <AnimatePresence>
                {activeKPIDetail && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        className="absolute inset-0 z-[100] bg-white/60 flex items-center justify-center p-12"
                        onClick={() => setActiveKPIDetail(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white border border-gray-100 shadow-2xl rounded-[40px] p-10 max-w-2xl w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{activeKPIDetail}</h3>
                                    <h2 className="text-xl font-bold tracking-tight text-white mb-1">Analyse des tendances</h2>
                                </div>
                                <button onClick={() => setActiveKPIDetail(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <AlertCircle className="w-6 h-6 text-gray-400 rotate-45" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <div className="text-[10px] font-black text-[#007AFF] uppercase tracking-widest mb-1">Pourquoi ?</div>
                                        <p className="text-sm font-semibold text-gray-700 leading-relaxed">
                                            {activeKPIDetail === 'Opportunité' ? selectedAsset.opportunityReason :
                                                activeKPIDetail === 'Alerte Saturation' ? selectedAsset.saturationReason :
                                                    "Émergent → Croissance → Pic → Déclin. Scores calculés à partir des données de scan (vitesse, diversité marques/pays, émergence, stabilité des prix). Ce n’est pas un rapport texte IA ; pour ça, utilisez « Synthèse Tendance » ou « Analyser » sur le classement."}
                                        </p>
                                    </div>
                                    <div className="pt-6 border-t border-gray-100">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">KPIs Stratégiques</div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-500">Retail Price Est.</span>
                                                <span className="text-sm font-black text-gray-900">{selectedAsset.retailPriceEst}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-500">Markup Cible</span>
                                                <span className="text-sm font-black text-green-600">{selectedAsset.markup}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-500">Conversion Est.</span>
                                                <span className="text-sm font-black text-blue-500">{selectedAsset.conversionRate}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[#F5F5F7] rounded-3xl p-6 flex flex-col justify-center items-center text-center">
                                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                                        {activeKPIDetail === 'Opportunité' ? <Zap className="w-10 h-10 text-yellow-500" /> :
                                            activeKPIDetail === 'Alerte Saturation' ? <AlertCircle className="w-10 h-10 text-red-500" /> :
                                                <Activity className="w-10 h-10 text-blue-500" />}
                                    </div>
                                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Niveau d'Urgence</div>
                                    <div className="text-2xl font-black text-gray-900">{selectedAsset.potential > 80 ? 'CRITIQUE' : 'NORMAL'}</div>
                                    <p className="text-[10px] text-gray-500 mt-2 font-medium">Basé sur l'accélération de la demande {selectedAsset.demandGrowth}</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 1. TOP BAR */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <KPICard
                    title="Volume Marché"
                    value="Intense"
                    subtitle="Flux douaniers stables"
                    icon={<Activity className="w-5 h-5 text-blue-500" />}
                    onClick={() => setActiveKPIDetail('Volume Marché')}
                />
                <KPICard
                    title="Top Tendance"
                    value={selectedAsset.segment}
                    subtitle="Segments dominants"
                    icon={<TrendingUp className="w-5 h-5 text-green-500" />}
                />
                <KPICard
                    title="Opportunité"
                    value={selectedAsset.potential > 80 ? 'MAJEURE' : 'MODÉRÉE'}
                    subtitle="Potentiel de marge"
                    icon={<Zap className="w-5 h-5 text-yellow-500" />}
                    onClick={() => setActiveKPIDetail('Opportunité')}
                />
                <KPICard
                    title="Alerte Saturation"
                    value={selectedAsset.saturation + "%"}
                    subtitle="Indice d'encombrement"
                    icon={<AlertCircle className="w-5 h-5 text-red-500" />}
                    onClick={() => setActiveKPIDetail('Alerte Saturation')}
                />
            </div>

            {/* 2. MAIN WORKSPACE */}
            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">

                {/* COLONNE GAUCHE : LISTE DES PRODUITS (25%) */}
                <div className="col-span-12 lg:col-span-3 bg-[#F5F5F7] rounded-3xl border border-white/50 p-4 flex flex-col overflow-hidden shadow-sm backdrop-blur-sm">
                    <div className="px-2 py-3 mb-2 flex items-center justify-between">
                        <div>
                            <h3 className="font-extrabold text-sm text-gray-900 tracking-tight text-nowrap">ANALYSES LIVE</h3>
                            <p className="text-[10px] text-gray-500 font-medium whitespace-nowrap">Temps réel • Live Scan</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={triggerSync}
                                disabled={isSyncing}
                                className={cn(
                                    "p-2 rounded-xl transition-all",
                                    isSyncing ? "bg-blue-100 text-blue-500 animate-spin" : "bg-white hover:bg-gray-100 text-gray-400 hover:text-blue-500 shadow-sm border border-gray-100"
                                )}
                                title="Actualiser l'analyse"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-none">
                        {products.map((item: TradingSignal) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setManualAsset(item);
                                    setShowScoreDetail(false);
                                }}
                                className={cn(
                                    "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 group relative overflow-hidden text-left border",
                                    selectedAsset.id === item.id
                                        ? "bg-white border-black/5 shadow-md scale-[1.02]"
                                        : "bg-white/40 border-transparent hover:bg-white hover:border-black/5 hover:shadow-sm"
                                )}
                            >
                                {selectedAsset.id === item.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#007AFF]" />
                                )}
                                <div className="min-w-0 pr-2">
                                    <div className="font-bold text-sm text-gray-900 truncate">{item.name}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 uppercase tracking-wide">{item.segment}</span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className={cn(
                                        "text-xs font-black font-mono tracking-tight",
                                        item.change >= 0 ? "text-green-600" : "text-red-500"
                                    )}>
                                        {item.change >= 0 ? '+' : ''}{item.change}%
                                    </span>
                                    <div className="text-[9px] font-medium text-gray-400 mt-0.5">24h</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* COLONNE CENTRALE : GRAPHIQUE (50%) */}
                <div className="col-span-12 lg:col-span-6 bg-white rounded-3xl border border-gray-100 flex flex-col shadow-xl shadow-black/5 relative overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md z-10 sticky top-0">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedAsset.name}</h2>
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border",
                                    selectedAsset.change >= 0
                                        ? "bg-green-50 text-green-700 border-green-100"
                                        : "bg-red-50 text-red-700 border-red-100"
                                )}>
                                    {selectedAsset.change >= 0 ? 'Bullish' : 'Bearish'}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
                                INDICE D'INTÉRÊT CONSOMMATEUR
                                <Info className="w-3 h-3 text-gray-300" />
                            </p>
                        </div>
                        <div className="flex p-1 bg-gray-100 rounded-lg">
                            {['1S', '1M', '3M', '1A'].map((tf) => (
                                <button
                                    key={tf}
                                    onClick={() => setTimeframe(tf)}
                                    className={cn(
                                        "px-3 py-1 rounded-md text-xs font-bold transition-all",
                                        timeframe === tf ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    {tf}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="flex-1 relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
                        <div className="absolute inset-0 pb-6 pt-2">
                            <MarketChart
                                category={selectedAsset.name}
                                segment={selectedAsset.segment === 'Homme' ? 'homme' : 'femme'}
                                variant="embedded"
                                isOpen={true}
                            />
                        </div>
                    </div>
                </div>

                {/* COLONNE DROITE : DIAGNOSTIC (25%) */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-full">

                    <div className="flex-1 bg-white rounded-3xl border border-gray-100 p-6 shadow-lg shadow-blue-500/5 overflow-hidden flex flex-col relative group">
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl -z-10" />

                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-[#007AFF]" />
                                <div className="text-[10px] font-black uppercase tracking-widest text-[#007AFF] mb-1">Analyse Tendance</div>
                            </div>
                            {showScoreDetail && (
                                <button onClick={() => setShowScoreDetail(false)} className="text-[10px] font-black text-[#007AFF] hover:underline uppercase">Fermer</button>
                            )}
                        </div>

                        {/* SCORE CIRCULAIRE (Cliquable) */}
                        <AnimatePresence mode="wait">
                            {!showScoreDetail ? (
                                <motion.div
                                    key="score"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    onClick={() => setShowScoreDetail(true)}
                                    className="flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                                >
                                    <div className="relative w-40 h-40 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="80" cy="80" r="72" stroke="#f3f4f6" strokeWidth="10" fill="none" />
                                            <circle
                                                cx="80" cy="80" r="72" stroke={selectedAsset.potential > 70 ? "#10b981" : "#f59e0b"} strokeWidth="10" fill="none"
                                                strokeDasharray="452"
                                                strokeDashoffset={452 - (452 * selectedAsset.potential) / 100}
                                                className="transition-all duration-1000 ease-out"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute text-center">
                                            <div className="text-5xl font-black text-gray-900 tracking-tighter">{selectedAsset.potential}</div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Note de Succès</div>
                                        </div>
                                    </div>
                                    <div className="w-full mt-8 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black text-gray-400 uppercase">Lieu</span>
                                            <span className="text-xs font-black text-gray-900">{selectedAsset.marketRegion}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-gray-400 uppercase">Météo prèvue</span>
                                            <span className="text-[10px] font-black text-blue-600 uppercase italic whitespace-nowrap">{selectedAsset.weatherSignal}</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-blue-500 font-bold mt-4 uppercase tracking-[0.2em] animate-pulse">Cliquer pour le Verdict Analyse →</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="detail"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex-1 flex flex-col space-y-4 overflow-y-auto pr-2 scrollbar-none"
                                >
                                    <div className="bg-[#F5F5F7] p-4 rounded-2xl border border-blue-100/50 mb-2">
                                        <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Activity className="w-3 h-3" />
                                            Verdict de Vente (+60j)
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-2xl font-black text-gray-900">{selectedAsset.predictedScore60d} pts</div>
                                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Prévision dans 2 mois</div>
                                            </div>
                                            <div className="text-right">
                                                <div className={cn(
                                                    "text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
                                                    selectedAsset.productionSafety === 'SÛR' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                )}>
                                                    {selectedAsset.productionSafety}
                                                </div>
                                                <div className="text-[8px] font-bold text-gray-400 uppercase mt-1 tracking-tighter">Sécurité</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {/* GEO-WEATHER INTEL */}
                                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Activity className="w-3 h-3 text-blue-600" />
                                                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Veille Météo & Géo</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[8px] font-bold text-blue-900/60 uppercase">Région</span>
                                                    <span className="text-[10px] font-black text-blue-900 uppercase">{selectedAsset.marketRegion}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[8px] font-bold text-blue-900/60 uppercase">Signal Météo</span>
                                                    <span className="text-[10px] font-black text-blue-900 uppercase">{selectedAsset.weatherSignal}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-[#1D1D1F] p-4 rounded-3xl border border-white/5 relative overflow-hidden">
                                            {/* AI Scanning Pulse */}
                                            <div className="absolute top-4 right-4 flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41] animate-pulse" />
                                                <span className="text-[7px] font-black text-[#00FF41] uppercase tracking-widest">Live Scan</span>
                                            </div>

                                            <div className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Zap className="w-3 h-3 text-yellow-400" />
                                                Verdict Analyse
                                            </div>

                                            <div className="space-y-3">
                                                {selectedAsset.upcomingCatalysts?.map((catalyst: Catalyst) => (
                                                    <div key={catalyst.name} className="flex items-center justify-between group/cat">
                                                        <div className="min-w-0 pr-2">
                                                            <div className="text-[10px] font-black text-white uppercase tracking-tight flex items-center gap-2 truncate">
                                                                {catalyst.name}
                                                                <span className={cn(
                                                                    "text-[7px] px-1 rounded-sm shrink-0",
                                                                    catalyst.impact === 'Critical' ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
                                                                )}>
                                                                    {catalyst.impact}
                                                                </span>
                                                            </div>
                                                            <div className="text-[8px] font-bold text-white/30 uppercase mt-0.5">Source: {catalyst.source}</div>
                                                        </div>
                                                        <ArrowRight className="w-3 h-3 text-white/10 group-hover/cat:text-white/40 transition-colors shrink-0" />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* PRODUCTION INTEL */}
                                            <div className="mt-6 pt-4 border-t border-white/10">
                                                <div className="text-[9px] font-black text-[#00FF41] uppercase tracking-widest mb-3">Veille Production</div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                                        <div className="min-w-0">
                                                            <div className="text-[8px] font-bold text-white/40 uppercase mb-1">Fournisseur recommandé</div>
                                                            <div className="text-[10px] font-black text-white truncate">{selectedAsset.matchedSupplier?.name || "Scan fournisseurs..."}</div>
                                                        </div>
                                                        <div className="text-right shrink-0 ml-2">
                                                            <div className="text-[8px] font-bold text-white/40 uppercase mb-1">Pays</div>
                                                            <div className="text-[9px] font-black text-white uppercase">{selectedAsset.matchedSupplier?.country || "N/A"}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                                                        <div>
                                                            <div className="text-[8px] font-bold text-blue-400 uppercase mb-1">Prix de vente conseillé</div>
                                                            <div className="text-lg font-black text-blue-400">{Math.round(selectedAsset.suggestedPrice)}€</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-[8px] font-bold text-blue-400 uppercase mb-1">Marge Est.</div>
                                                            <div className="text-xs font-black text-[#00FF41]">{selectedAsset.markup}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                                <div>
                                                    <div className="text-[8px] font-bold text-white/30 uppercase mb-0.5">Fiabilité</div>
                                                    <div className="text-xs font-black text-[#00FF41]">{selectedAsset.aiConfidence}%</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[8px] font-bold text-white/30 uppercase mb-0.5">Last Scan</div>
                                                    <div className="text-[9px] font-black text-white uppercase">{selectedAsset.lastScan}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* RECOMMENDATION */}
                        {!showScoreDetail && (
                            <div className="mt-auto pt-8">
                                <div className="text-center mb-6">
                                    <div className={cn(
                                        "inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest border mb-4 shadow-sm",
                                        selectedAsset.theme === 'success' ? "bg-green-50 text-green-700 border-green-200" :
                                            selectedAsset.theme === 'danger' ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-50 text-gray-700 border-gray-200"
                                    )}>
                                        {selectedAsset.theme === 'success' && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                                        {selectedAsset.signal}
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800 leading-relaxed px-2">
                                        "{selectedAsset.advice}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#F5F5F7] p-4 rounded-[20px] text-center border border-black/[0.03]">
                                        <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Risque</div>
                                        <div className={cn("text-xs font-black", selectedAsset.risk === 'Élevé' || selectedAsset.risk === 'Critique' ? 'text-red-500' : 'text-green-600')}>{selectedAsset.risk}</div>
                                    </div>
                                    <div className="bg-[#F5F5F7] p-4 rounded-[20px] text-center border border-black/[0.03]">
                                        <div className="text-[10px] font-black text-gray-400 uppercase mb-1">Volatilité</div>
                                        <div className="text-xs font-black text-gray-900">Moyenne</div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}

function KPICard({ title, value, subtitle, icon, onClick }: { title: string, value: string, subtitle: string, icon: React.ReactNode, onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-white p-5 rounded-3xl border border-gray-100 shadow-lg shadow-black/5 transition-all flex flex-col justify-between h-28 relative overflow-hidden group",
                onClick ? "cursor-pointer hover:scale-[1.03] hover:shadow-xl active:scale-95" : ""
            )}
        >
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-gray-50 to-transparent rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform" />
            <div className="flex items-start justify-between relative z-10">
                <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-widest">{title}</span>
                <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-colors">
                    {icon}
                </div>
            </div>
            <div className="relative z-10">
                <div className="text-2xl font-black text-[#1D1D1F] tracking-tighter truncate">{value}</div>
                <div className="text-[10px] font-semibold text-gray-500 mt-1 flex items-center gap-1">
                    {subtitle}
                </div>
            </div>
            {onClick && <ArrowRight className="absolute bottom-4 right-4 w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
    );
}
