
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Layers, Activity, BarChart2, Zap, RefreshCw, Info, ArrowRight, DollarSign, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { PredictiveChart } from '@/components/trends/PredictiveChart';

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

export function StyleTradingDashboard({ data }: { data: StyleDetailProps }) {
    const [selectedAsset, setSelectedAsset] = useState<StyleProduct | null>(data.products.length > 0 ? data.products[0] : null);
    const [timeframe, setTimeframe] = useState('1S');
    const [activeKPIDetail, setActiveKPIDetail] = useState<string | null>(null);

    // Mock Chart Data for Demo (adapted to selected Asset Score)
    const baseScore = selectedAsset?.trendScore || 50;
    const mockChartData = [
        { date: 'J-6', value: baseScore - 5 }, { date: 'J-5', value: baseScore - 2 }, { date: 'J-4', value: baseScore + 2 },
        { date: 'J-3', value: baseScore - 1 }, { date: 'J-2', value: baseScore + 5 }, { date: 'J-1', value: baseScore + 4 },
        { date: 'Auj', value: baseScore }
    ];

    if (!selectedAsset) return <div className="p-10 text-white">No data for this style.</div>;

    const currentScore = selectedAsset.trendScore || 50;
    const isBullish = currentScore > 60;

    return (
        <div className="w-full bg-[#0a0a0a] text-white min-h-[calc(100vh-64px)] font-sans overflow-hidden flex flex-col">
            {/* Header / Ticker */}
            <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-6">
                    <Link href="/trends" className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
                        <ArrowLeft className="w-3 h-3" />
                        Retour Catalogue
                    </Link>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        <span className="text-xs font-black uppercase tracking-widest text-green-500">Live Market Data</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-white/50 uppercase tracking-widest">{data.name}</span>
                    <div className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-white/70 border border-white/10">
                        VOL: HIGH
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">

                {/* 1. Left Panel: Market Watch (Products) */}
                <div className="w-80 border-r border-white/10 flex flex-col bg-black/20 backdrop-blur-sm hidden lg:flex h-full">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <Layers className="w-3 h-3" />
                            Produits du Dossier
                        </h3>
                        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60">{data.products.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {data.products.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => setSelectedAsset(product)}
                                className={cn(
                                    "w-full p-3 rounded-lg flex items-center gap-3 transition-all group relative overflow-hidden text-left",
                                    selectedAsset.id === product.id
                                        ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30"
                                        : "hover:bg-white/5 border border-transparent"
                                )}
                            >
                                {selectedAsset.id === product.id && (
                                    <motion.div layoutId="active-bg" className="absolute inset-0 bg-blue-500/5 -z-10" />
                                )}

                                <div className="w-10 h-10 rounded bg-white/5 overflow-hidden flex-shrink-0 relative">
                                    {product.imageUrl && <img src={product.imageUrl} className="w-full h-full object-cover" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-[10px] font-bold text-gray-400 truncate uppercase max-w-[80px]">
                                            {product.sourceBrand || 'N/A'}
                                        </span>
                                        <span className={cn("text-[10px] font-mono", (product.trendScore || 50) > 60 ? "text-green-400" : "text-gray-500")}>
                                            {product.trendScore}%
                                        </span>
                                    </div>
                                    <p className={cn("text-xs font-medium truncate", selectedAsset.id === product.id ? "text-white" : "text-gray-300")}>
                                        {product.name}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Main Center: Chart & Analysis */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a] border-r border-white/10">
                    {/* Toolbar */}
                    <div className="h-12 border-b border-white/10 flex items-center justify-between px-6 bg-black/20 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            {['1H', '1D', '1S', '1M', '1A'].map((tf) => (
                                <button
                                    key={tf}
                                    onClick={() => setTimeframe(tf)}
                                    className={cn(
                                        "px-3 py-1 rounded text-[10px] font-bold transition-all",
                                        timeframe === tf ? "bg-white text-black" : "text-gray-500 hover:text-white"
                                    )}
                                >
                                    {tf}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-4 hidden md:flex">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                Consumer Interest
                            </div>
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="flex-1 relative bg-gradient-to-b from-blue-900/5 to-transparent">
                        <div className="absolute inset-0 p-6 flex flex-col">
                            {/* Overlay Stats */}
                            <div className="mb-8 pointer-events-none">
                                <motion.div
                                    key={selectedAsset.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <h2 className="text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-3 truncate">
                                        {selectedAsset.name}
                                    </h2>
                                    <div className="flex items-end gap-4">
                                        <div className="text-5xl font-mono text-white tracking-tighter">
                                            {currentScore}<span className="text-2xl text-gray-500">.00</span>
                                        </div>
                                        <div className={cn("text-sm font-bold mb-2 flex items-center gap-1", isBullish ? "text-green-400" : "text-red-400")}>
                                            {isBullish ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                            {isBullish ? '+12.5%' : '-2.3%'} (24h)
                                        </div>
                                        <span className={cn("text-xs px-2 py-0.5 rounded border font-mono tracking-widest mb-2 ml-4", isBullish ? "border-green-500/30 text-green-400 bg-green-500/10" : "border-red-500/30 text-red-400 bg-red-500/10")}>
                                            {isBullish ? 'STRONG BUY' : 'HOLD'}
                                        </span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* The Real Chart Component */}
                            <div className="flex-1 w-full min-h-[300px]">
                                <PredictiveChart data={mockChartData} color={isBullish ? '#22c55e' : '#ef4444'} />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Tickers */}
                    <div className="h-40 border-t border-white/10 bg-black/40 grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/10 flex-shrink-0">
                        <KPICard label="Prix Actuel" value={`${selectedAsset.averagePrice} €`} sub="+0.5% vs Market" icon={Activity} active={activeKPIDetail === 'price'} onClick={() => setActiveKPIDetail('price')} />
                        <KPICard label="Vol. Recherche" value="High" sub="2.4k req/j" icon={BarChart2} active={activeKPIDetail === 'vol'} onClick={() => setActiveKPIDetail('vol')} />
                        <KPICard label="Saturabilité" value="24%" sub="Low Risk" icon={Zap} active={activeKPIDetail === 'sat'} onClick={() => setActiveKPIDetail('sat')} />
                        <KPICard label="Production" value="Ready" sub="3 Suppliers" icon={RefreshCw} active={activeKPIDetail === 'prod'} onClick={() => setActiveKPIDetail('prod')} />
                    </div>
                </div>

                {/* 3. Right Panel: Diagnostic */}
                <div className="w-80 bg-black/20 backdrop-blur-md p-6 flex-col hidden xl:flex h-full">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                        <Info className="w-3 h-3" />
                        Diagnostic IA
                    </h3>

                    <div className="space-y-6 flex-1 flex flex-col">
                        {/* Score Gauge Mini */}
                        <div className="relative h-40 w-40 mx-auto">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
                                <motion.circle
                                    cx="80" cy="80" r="70"
                                    stroke="currentColor" strokeWidth="10" fill="transparent"
                                    className={isBullish ? "text-green-500" : "text-yellow-500"}
                                    strokeDasharray={440}
                                    strokeDashoffset={440 - (440 * currentScore) / 100}
                                    initial={{ strokeDashoffset: 440 }}
                                    animate={{ strokeDashoffset: 440 - (440 * currentScore) / 100 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-white">{currentScore}</span>
                                <span className="text-[10px] text-gray-400 uppercase">Score Trend</span>
                            </div>
                        </div>

                        {/* Analysis Text */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                                <Zap className="w-3 h-3 text-yellow-500" />
                                Signal Détecté
                            </h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                {isBullish
                                    ? "Forte traction détectée. Potentiel 'Sold Out' élevé sous 14 jours si la production n'est pas lancée."
                                    : "Stabilité observée. Produit fond de rayon potentiel, risque faible mais marge standard."
                                }
                            </p>
                        </div>

                        <div className="mt-auto pt-6 border-t border-white/10 space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Marge Brute Est.</span>
                                <span className="text-green-400 font-mono">{(selectedAsset.averagePrice * 0.65).toFixed(2)} €</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

            </div >
        </div >
    );
}

function KPICard({ label, value, sub, icon: Icon, active, onClick }: any) {
    return (
        <button onClick={onClick} className={cn("h-full flex flex-col items-center justify-center p-4 hover:bg-white/5 transition-colors relative outline-none", active && "bg-white/5")}>
            {active && <motion.div layoutId="active-kpi" className="absolute top-0 left-0 w-full h-0.5 bg-blue-500" />}
            <Icon className={cn("w-5 h-5 mb-3", active ? "text-blue-500" : "text-gray-600")} />
            <span className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">{label}</span>
            <span className="text-xl font-mono text-white mb-1">{value}</span>
            <span className="text-[10px] text-green-500 font-mono">{sub}</span>
        </button>
    );
}
