'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, TrendingUp, Tag, Layers, Sparkles, Shirt, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const CATEGORY_IMAGES: Record<string, Record<string, string>> = {
  homme: {
    "t-shirts": "https://d3u0tzju9qaucj.cloudfront.net/e2403014-df89-46b9-ad7a-dab42cadbcbe/95c18205-935b-4139-a3f4-2ed7b8a53e4d.png",
    "sweats": "https://d3u0tzju9qaucj.cloudfront.net/e2403014-df89-46b9-ad7a-dab42cadbcbe/c4b723c8-de94-43bd-89b2-fe21f592d636.png",
    "vestes": "https://d3u0tzju9qaucj.cloudfront.net/e2403014-df89-46b9-ad7a-dab42cadbcbe/6428a082-c729-48fe-b525-7bd667c46b59.png",
    "pantalons": "https://d3u0tzju9qaucj.cloudfront.net/e2403014-df89-46b9-ad7a-dab42cadbcbe/13695bb5-a3f2-4593-a664-4ed5ff4e7387.png",
    "jeans": "https://d3u0tzju9qaucj.cloudfront.net/e2403014-df89-46b9-ad7a-dab42cadbcbe/f6ede387-9faf-4f8f-a151-4ec9e4892617.png"
  },
  femme: {
    "t-shirts": "https://d3u0tzju9qaucj.cloudfront.net/e2403014-df89-46b9-ad7a-dab42cadbcbe/d62090e7-8ee2-411f-b0b7-d4ab1467156d.png",
    "sweats": "https://d3u0tzju9qaucj.cloudfront.net/e2403014-df89-46b9-ad7a-dab42cadbcbe/8b393865-f928-4e40-ad7b-b0a6cae924e1.png",
    "vestes": "https://d3u0tzju9qaucj.cloudfront.net/e2403014-df89-46b9-ad7a-dab42cadbcbe/33b9ac58-b800-4172-b955-ce8bea09880a.png",
    "pantalons": "https://d3u0tzju9qaucj.cloudfront.net/e2403014-df89-46b9-ad7a-dab42cadbcbe/017bca67-2ec5-48aa-8b19-dba5d81ca9a6.png",
    "jeans": "https://d3u0tzju9qaucj.cloudfront.net/e2403014-df89-46b9-ad7a-dab42cadbcbe/d73da759-5240-4515-9091-20eab55469bd.png",
    "robes": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop"
  }
};

const MAIN_CATEGORIES: any[] = [
  {
    id: 't-shirts',
    dbId: 'TSHIRT',
    label: 'T-Shirts & Hauts',
    icon: Shirt,
    desc: { homme: 'Oversize, Boxy, Graphique & Polos', femme: 'Tops, Bodys & Basiques' }
  },
  {
    id: 'sweats',
    dbId: 'SWEAT',
    label: 'Sweats & Pulls',
    icon: Tag,
    desc: { homme: 'Hoodies, Pulls en Maille & Cardigans', femme: 'Mailles, Cardigans & Hoodies' }
  },
  {
    id: 'robes',
    dbId: 'DRESS',
    label: 'Robes',
    icon: Sparkles,
    desc: { homme: '', femme: 'Mini, Midi, Maxi & Soirée' },
    onlyFemme: true
  },
  {
    id: 'vestes',
    dbId: 'JACKEX',
    label: 'Vestes & Manteaux',
    icon: Layers,
    desc: { homme: 'Bombers, Cuir, Racing & Varsity', femme: 'Blazers, Trenchs & Cuir' }
  },
  {
    id: 'pantalons',
    dbId: 'PANT',
    label: { homme: 'Pantalons', femme: 'Pantalons & Jupes' },
    icon: Tag,
    desc: { homme: 'Cargo, Large & Jogging', femme: 'Jupes, Cargos & Ensembles' }
  },
  {
    id: 'jeans',
    dbId: 'JEAN',
    label: 'Jeans',
    icon: Layers,
    desc: { homme: 'Baggy & Droit', femme: 'Wide Leg, Mom & Baggy' }
  },
];

export function TendancesContent({ initialData }: { initialData?: any }) {
  const [segment, setSegment] = useState<string>('homme');
  const [previews, setPreviews] = useState<any>(null);
  const [realStats, setRealStats] = useState<Record<string, { score: number, diff: number, pct: string, newItems: number }>>({});
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoadingStats(true);
      try {
        // Les 2 fetches partent en parallèle (gagne 300-800ms)
        const [previewsRes, trendsRes] = await Promise.all([
          fetch('/style-previews.json'),
          fetch(`/api/trends/hybrid-radar?segment=${segment}&limit=120`),
        ]);

        if (previewsRes.ok) {
          const data = await previewsRes.json();
          setPreviews(data);
        }

        if (trendsRes.ok) {
          const { trends } = await trendsRes.json();
          const statsMap: Record<string, { score: number, diff: number, pct: string, newItems: number }> = {};
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

          MAIN_CATEGORIES.forEach(cat => {
            const catProducts = trends.filter((p: any) => p.category === cat.dbId);
            if (catProducts.length > 0) {
              const avgScore = catProducts.reduce((acc: number, p: any) => acc + (p.trendScore || 50), 0) / catProducts.length;
              const volumeBonus = Math.min(15, Math.floor(catProducts.length / 5));
              const finalScore = Math.round(avgScore + volumeBonus);
              const newItems = catProducts.filter((p: any) => new Date(p.createdAt) > twentyFourHoursAgo).length;
              const diff = newItems > 0 ? Math.max(1, Math.min(10, Math.floor(newItems / 2))) : -0.2;
              const pct = ((diff / (finalScore || 1)) * 100).toFixed(1);
              statsMap[cat.dbId] = { score: finalScore, diff, pct, newItems };
            } else {
              statsMap[cat.dbId] = { score: 50, diff: 0, pct: '0.0', newItems: 0 };
            }
          });
          setRealStats(statsMap as any);
        }
      } catch (e) {
        console.error('Failed to load trends data:', e);
      } finally {
        setLoadingStats(false);
      }
    };
    loadAll();
  }, [segment]);

  return (
    <div className="min-h-screen pb-32 font-sans transition-colors duration-1000 bg-[#F5F5F7]">
      {/* 1. Static Header */}
      <div className="backdrop-blur-xl border-b pt-16 pb-14 transition-all duration-1000 bg-white border-black/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 lg:gap-10">
            <div>
              <p className="font-black uppercase tracking-[0.4em] text-[11px] mb-4 transition-colors duration-500 text-[#007AFF]">Analyse Tendance</p>
              <h1 className="text-6xl md:text-7xl font-black text-black uppercase tracking-tighter leading-[0.9]">
                QUEL STYLE EST <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#007AFF] to-[#00C6FF]">VIRAL</span> ?
              </h1>
            </div>
            <div className="flex p-1.5 rounded-2xl w-fit transition-colors duration-700 bg-[#F5F5F7]">
              {['homme', 'femme'].map(s => (
                <button
                  key={s}
                  onClick={() => setSegment(s)}
                  className={cn(
                    "px-6 lg:px-10 py-3 lg:py-4 text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-500",
                    segment === s
                      ? "bg-[#007AFF] text-white shadow-[0_10px_30px_-10px_rgba(0,122,255,0.5)] scale-105"
                      : "text-gray-400 hover:text-black"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Menu de Catégories (Grid) */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {MAIN_CATEGORIES.filter(c => !c.onlyFemme || segment === 'femme').map((cat, idx) => {
            const categoryImage = CATEGORY_IMAGES[segment]?.[cat.id] || '';
            const label = typeof cat.label === 'string' ? cat.label : cat.label[segment];
            const desc = typeof cat.desc === 'string' ? cat.desc : cat.desc[segment];

            return (
              <Link key={cat.id} href={`/trends/category/${cat.id}?segment=${segment}`}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative h-[400px] rounded-[50px] overflow-hidden bg-white shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-700 cursor-pointer"
                >
                  <div className={cn(
                    "absolute inset-0 transition-all duration-700 overflow-hidden",
                    "grayscale-[0.2] group-hover:grayscale-0"
                  )}>
                    {/* Live Indicator Overlay */}
                    <div className="absolute top-8 left-8 z-10 flex flex-col gap-2">
                      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 w-fit">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse shadow-[0_0_8px_rgba(52,199,89,0.8)]" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Tendance en Direct</span>
                      </div>
                    </div>

                    <img
                      src={categoryImage}
                      className={cn(
                        "w-full h-full transition-transform duration-1000",
                        "object-cover group-hover:scale-110"
                      )}
                      alt={label}
                    />
                    {/* Overlay Graduel */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-b",
                      "from-black/10 via-black/20 to-black/80"
                    )} />
                  </div>

                  {/* Content Overlay */}
                  <div className="absolute inset-0 p-6 lg:p-10 flex flex-col justify-end">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={cn(
                        "w-14 h-14 rounded-2xl backdrop-blur-md flex items-center justify-center mb-6 transition-all duration-500",
                        "bg-[#007AFF]/20 border border-white/20 group-hover:bg-[#007AFF] group-hover:rotate-6 shadow-xl"
                      )}
                    >
                      <cat.icon className={cn("w-6 h-6", "text-white")} />
                    </motion.div>

                    <h2 className={cn(
                      "text-3xl lg:text-4xl font-black uppercase tracking-tighter leading-none mb-3",
                      "text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:translate-x-2"
                    )}>
                      {label}
                    </h2>

                    <p className={cn(
                      "font-bold text-[10px] uppercase tracking-[0.2em] transition-colors",
                      "text-white/90 drop-shadow-md group-hover:text-white"
                    )}>
                      {desc}
                    </p>

                    {/* Action Button Invisible by default */}
                    <div className="mt-8 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                      <div className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all bg-[#007AFF] text-white flex items-center gap-2">
                        Diagnostic Tendance <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}
