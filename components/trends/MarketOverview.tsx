'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { MarketChart } from '@/components/trends/MarketChart';
import { SectionHeader } from '@/components/ui/section-header';
import { LoadingState } from '@/components/ui/loading-state';

const fetcher = (url: string) => fetch(url).then(res => res.json());

type MarketMover = {
    category: string;
    growthPercent: number;
    avgTrendScore: number;
    signal: 'BUY' | 'HOLD' | 'SELL' | 'EMERGING';
    articleCount: number;
};

export default function MarketOverview() {
    const [segment, setSegment] = useState<'homme' | 'femme'>('femme');

    // État pour le Graphique Boursier
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isChartOpen, setIsChartOpen] = useState(false);

    const { data: resData, error, isLoading } = useSWR(`/api/market-index?segment=${segment}&marketZone=EU`, fetcher);

    const data = resData ? {
        winners: resData.winners || [],
        losers: resData.losers || []
    } : null;

    const loading = isLoading;

    const openChart = (category: string) => {
        setSelectedCategory(category);
        setIsChartOpen(true);
    };

    if (loading) return (
        <LoadingState
            title="Analyse du marché en cours..."
            className="h-48 bg-white/50 rounded-2xl"
        />
    );

    if (!data || (data.winners.length === 0 && data.losers.length === 0)) {
        return null;
    }

    return (
        <section className="mb-12">
            <SectionHeader
                title="Analyse du Marché - Bourse"
                description="Cliquez sur une catégorie pour voir sa courbe boursière"
                className="mb-6"
                action={
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setSegment('femme')}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${segment === 'femme' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Femme
                        </button>
                        <button
                            onClick={() => setSegment('homme')}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${segment === 'homme' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Homme
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* WINNERS */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-[#4ADE80]">
                        <TrendingUp className="w-5 h-5" />
                        <h3 className="font-bold text-sm uppercase tracking-wider text-gray-900">Hausse (Buy)</h3>
                    </div>
                    <div className="space-y-3">
                        {data.winners.map((item: MarketMover, i: number) => (
                            <MoverCard
                                key={i}
                                item={item}
                                type="winner"
                                onClick={() => openChart(item.category)}
                            />
                        ))}
                        {data.winners.length === 0 && <span className="text-xs text-gray-400">Aucun signal de hausse fort détecté.</span>}
                    </div>
                </div>

                {/* LOSERS */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-[#F87171]">
                        <TrendingDown className="w-5 h-5" />
                        <h3 className="font-bold text-sm uppercase tracking-wider text-gray-900">Baisse / Vente (Sell)</h3>
                    </div>
                    <div className="space-y-3">
                        {data.losers.map((item: MarketMover, i: number) => (
                            <MoverCard
                                key={i}
                                item={item}
                                type="loser"
                                onClick={() => openChart(item.category)}
                            />
                        ))}
                        {data.losers.length === 0 && <span className="text-xs text-gray-400">Le marché est stable.</span>}
                    </div>
                </div>
            </div>

            {/* MODAL GRAPHIQUE */}
            <MarketChart
                isOpen={isChartOpen}
                onClose={() => setIsChartOpen(false)}
                category={selectedCategory || ''}
                segment={segment}
            />
        </section>
    );
}

function MoverCard({ item, type, onClick }: { item: MarketMover, type: 'winner' | 'loser', onClick: () => void }) {
    return (
        <motion.div
            layout
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`cursor-pointer flex items-center justify-between p-3 rounded-xl border transition-all ${type === 'winner' ? 'bg-green-50/50 border-green-100 hover:border-green-300' : 'bg-red-50/50 border-red-100 hover:border-red-300'
                }`}
        >
            <div className="flex flex-col">
                <span className="font-bold text-gray-900 text-sm">{item.category}</span>
                <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
                    Index {Math.round(item.avgTrendScore)} · Vol {item.articleCount}
                    {item.signal === 'BUY' && <span className="text-[#4ADE80] font-bold">BUY</span>}
                    {item.signal === 'SELL' && <span className="text-[#F87171] font-bold">SELL</span>}
                </span>
            </div>
            <div className={`text-sm font-bold flex items-center gap-1 ${type === 'winner' ? 'text-[#4ADE80]' : 'text-[#F87171]'
                }`}>
                {item.growthPercent > 0 ? '+' : ''}{item.growthPercent.toFixed(1)}%
            </div>
        </motion.div>
    );
}
